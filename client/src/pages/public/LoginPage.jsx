import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { loginFormSchema } from '@/features/auth/schemas';
import { useLogin } from '@/features/auth/hooks';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { AuthShell } from '@/components/auth/AuthShell';
import { readApiError } from '@/lib/apiError';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  if (user) return <Navigate to="/" replace />;

  const from = location.state?.from || '/';

  async function onSubmit(values) {
    try {
      await login.mutateAsync(values);
      toast.success('Welcome back');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue reading and writing on Blogify."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            leftIcon={<Mail />}
            error={!!errors.email}
            {...register('email')}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          action={
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
            >
              Forgot password?
            </Link>
          }
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              leftIcon={<Lock />}
              className="pr-10"
              error={!!errors.password}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 z-10 inline-flex w-10 items-center justify-center text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        <label className="flex select-none items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800"
          />
          Keep me signed in
        </label>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={login.isPending}
          rightIcon={<ArrowRight />}
        >
          Sign in
        </Button>
      </form>

      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs uppercase tracking-wider text-slate-400 dark:bg-slate-950 dark:text-slate-500">
            or
          </span>
        </div>
      </div>

      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        type="button"
        onClick={() => toast.info('Single sign-on is coming soon.')}
        leftIcon={
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
            <path
              fill="#4285F4"
              d="M21.6 12.227c0-.708-.064-1.39-.182-2.045H12v3.868h5.382a4.604 4.604 0 01-1.996 3.022v2.512h3.232c1.892-1.742 2.982-4.307 2.982-7.357z"
            />
            <path
              fill="#34A853"
              d="M12 22c2.7 0 4.964-.895 6.618-2.416l-3.232-2.512c-.895.6-2.04.954-3.386.954-2.604 0-4.81-1.76-5.595-4.123H3.073v2.59A9.996 9.996 0 0012 22z"
            />
            <path
              fill="#FBBC05"
              d="M6.405 13.903A6.005 6.005 0 016.09 12c0-.66.114-1.302.314-1.903V7.507H3.073A9.996 9.996 0 002 12c0 1.614.386 3.14 1.073 4.493l3.332-2.59z"
            />
            <path
              fill="#EA4335"
              d="M12 6.477c1.468 0 2.786.504 3.823 1.495l2.868-2.868C16.96 3.595 14.7 2.5 12 2.5A9.996 9.996 0 003.073 7.507l3.332 2.59C7.19 7.736 9.396 5.977 12 5.977V6.477z"
            />
          </svg>
        }
      >
        Continue with Google
      </Button>
    </AuthShell>
  );
}
