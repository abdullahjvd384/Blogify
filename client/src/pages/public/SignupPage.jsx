import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { signupFormSchema } from '@/features/auth/schemas';
import { useSignup } from '@/features/auth/hooks';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { AuthShell } from '@/components/auth/AuthShell';
import { readApiError } from '@/lib/apiError';
import { cn } from '@/lib/cn';

function scorePassword(pw = '') {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(score, 4);
}

const strengthMap = [
  { label: 'Too weak', color: 'bg-rose-500', text: 'text-rose-600' },
  { label: 'Weak', color: 'bg-rose-400', text: 'text-rose-500' },
  { label: 'Okay', color: 'bg-amber-400', text: 'text-amber-600' },
  { label: 'Good', color: 'bg-emerald-400', text: 'text-emerald-600' },
  { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-700' },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signup = useSignup();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const password = watch('password') || '';
  const score = useMemo(() => scorePassword(password), [password]);
  const strength = strengthMap[score];

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(values) {
    try {
      await signup.mutateAsync(values);
      toast.success('Account created — welcome to Blogify');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free forever for readers. 3 articles a day, no algorithm, no ads."
      footer={
        <>
          Already have one?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Jane Doe"
            leftIcon={<User />}
            error={!!errors.name}
            {...register('name')}
          />
        </Field>

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
          hint={!errors.password ? 'At least 8 characters, mix letters and numbers.' : undefined}
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a strong password"
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

          {password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      i < score ? strength.color : 'bg-slate-200 dark:bg-slate-800',
                    )}
                  />
                ))}
              </div>
              <p className={cn('mt-1.5 text-xs font-medium', strength.text)}>
                {strength.label}
              </p>
            </div>
          )}
        </Field>

        <label className="flex select-none items-start gap-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            defaultChecked
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800"
          />
          I agree to the{' '}
          <Link to="#" className="font-medium text-brand-600 hover:underline dark:text-brand-300">
            Terms
          </Link>{' '}
          and{' '}
          <Link to="#" className="font-medium text-brand-600 hover:underline dark:text-brand-300">
            Privacy Policy
          </Link>
          .
        </label>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={signup.isPending}
          rightIcon={<ArrowRight />}
        >
          Create account
        </Button>
      </form>

      <ul className="mt-6 grid gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
        {[
          'Free for readers — forever',
          'Daily quotas, no doomscrolling',
          'AI moderation built in',
          'Dark mode & keyboard-first',
        ].map((line) => (
          <li key={line} className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500" />
            {line}
          </li>
        ))}
      </ul>
    </AuthShell>
  );
}
