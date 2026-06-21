import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

/**
 * Email capture for the DevCrunch newsletter. POSTs to /newsletter/subscribe.
 * `source` tags where the signup happened (footer, article, etc.).
 */
export function NewsletterSignup({ source = 'site', className, compact = false }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setLoading(true);
    try {
      await api.post('/newsletter/subscribe', { email: value, source });
      setDone(true);
      toast.success('Subscribed — welcome to DevCrunch!');
    } catch {
      toast.error('Could not subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className={cn('inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400', className)}>
        <CheckCircle2 size={16} /> You&apos;re on the list. Watch your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className={cn('flex w-full max-w-md flex-col gap-2 sm:flex-row', className)}>
      <div className="relative flex-1">
        <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
      <Button type="submit" size={compact ? 'md' : 'lg'} isLoading={loading} rightIcon={<ArrowRight />}>
        Subscribe
      </Button>
    </form>
  );
}
