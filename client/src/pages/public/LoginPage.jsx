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
    </AuthShell>
  );
}
