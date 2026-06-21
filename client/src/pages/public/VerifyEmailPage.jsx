import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, MailCheck, Loader2 } from 'lucide-react';
import { useVerifyEmail } from '@/features/auth/hooks';
import { Button } from '@/components/ui/Button';
import { AuthShell } from '@/components/auth/AuthShell';
import { readApiError } from '@/lib/apiError';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const verify = useVerifyEmail();
  const [state, setState] = useState(token ? 'pending' : 'missing');
  const [error, setError] = useState('');
  const fired = useRef(false);

  useEffect(() => {
    if (!token || fired.current) return;
    fired.current = true;
    verify
      .mutateAsync(token)
      .then(() => setState('ok'))
      .catch((err) => {
        setError(readApiError(err));
        setState('error');
      });
  }, [token, verify]);

  if (state === 'missing') {
    return (
      <AuthShell title="No token provided" subtitle="Open the link from your verification email.">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <AlertTriangle size={24} />
          </span>
          <Link to="/">
            <Button variant="secondary">Back to home</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (state === 'pending') {
    return (
      <AuthShell title="Verifying your email…" subtitle="One moment.">
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <Loader2 size={28} className="animate-spin text-brand-600" />
        </div>
      </AuthShell>
    );
  }

  if (state === 'ok') {
    return (
      <AuthShell
        title="Email verified"
        subtitle="Thanks — your account is fully set up. You can keep using DevCrunch as usual."
      >
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 size={24} />
          </span>
          <Link to="/articles">
            <Button>Start reading</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Verification failed"
      subtitle={error || 'This link is invalid or has expired.'}
      footer={
        <>
          Need a new link? Sign in and use{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
            "Resend verification"
          </Link>{' '}
          from your account menu.
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          <MailCheck size={24} />
        </span>
      </div>
    </AuthShell>
  );
}
