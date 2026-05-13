import { useState } from 'react';
import { Link, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, ArrowRight, AlertTriangle } from 'lucide-react';
import { resetPasswordFormSchema } from '@/features/auth/schemas';
import { useResetPassword } from '@/features/auth/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { AuthShell } from '@/components/auth/AuthShell';
import { readApiError } from '@/lib/apiError';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const reset = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: '', confirm: '' },
  });

  if (!token) {
    return (
      <AuthShell
        title="Invalid reset link"
        subtitle="This URL doesn't include a reset token. Open the link from your email."
      >
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <AlertTriangle size={24} />
          </span>
          <Link to="/forgot-password" className="mt-2">
            <Button>Start over</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  async function onSubmit(values) {
    try {
      await reset.mutateAsync({ token, password: values.password });
      toast.success('Password updated — sign in with your new password.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Pick something at least 8 characters. We'll sign you out of other sessions for safety."
      footer={
        <>
          Changed your mind?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="New password" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              leftIcon={<Lock />}
              className="pr-10"
              error={!!errors.password}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 z-10 inline-flex w-10 items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}>
          <Input
            id="confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            leftIcon={<Lock />}
            error={!!errors.confirm}
            {...register('confirm')}
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={reset.isPending}
          rightIcon={<ArrowRight />}
        >
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
