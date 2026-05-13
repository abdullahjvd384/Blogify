import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { forgotPasswordFormSchema } from '@/features/auth/schemas';
import { useForgotPassword } from '@/features/auth/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { AuthShell } from '@/components/auth/AuthShell';
import { readApiError } from '@/lib/apiError';

export default function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const [sentTo, setSentTo] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values) {
    try {
      await forgot.mutateAsync(values.email);
      setSentTo(values.email);
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  if (sentTo) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle={`If an account exists for ${sentTo}, we've sent a password reset link. It's valid for one hour.`}
        footer={
          <>
            Wrong email?{' '}
            <button
              type="button"
              onClick={() => setSentTo('')}
              className="font-semibold text-brand-600 hover:underline dark:text-brand-300"
            >
              Try again
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 size={24} />
          </span>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Click the link in the email to set a new password. The link expires in 1 hour.
          </p>
          <Link to="/login" className="mt-2">
            <Button variant="secondary">Back to sign in</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter the email you signed up with and we'll send you a reset link."
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
            Back to sign in
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

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={forgot.isPending}
          rightIcon={<ArrowRight />}
        >
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}
