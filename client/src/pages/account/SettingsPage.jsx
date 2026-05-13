import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  User as UserIcon,
  Mail,
  Lock,
  Globe,
  ShieldCheck,
  Eye,
  EyeOff,
  Save,
  MailCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  useUpdateProfile,
  useChangePassword,
  useResendVerification,
} from '@/features/auth/hooks';
import {
  profileFormSchema,
  changePasswordFormSchema,
} from '@/features/auth/schemas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { readApiError } from '@/lib/apiError';

const COMMON_TIMEZONES = [
  'Asia/Karachi',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Riyadh',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

function Section({ title, description, children, icon: Icon }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
            <Icon size={16} />
          </span>
        )}
        <div className="flex-1">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
          )}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const update = useUpdateProfile();
  const changePw = useChangePassword();
  const resend = useResendVerification();
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const profile = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: '', timezone: 'Asia/Karachi' },
  });

  const pwd = useForm({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  });

  useEffect(() => {
    if (user) {
      profile.reset({ name: user.name || '', timezone: user.timezone || 'Asia/Karachi' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  async function onSaveProfile(values) {
    try {
      await update.mutateAsync(values);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  async function onChangePassword(values) {
    try {
      await changePw.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Password changed — other sessions signed out');
      pwd.reset();
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  async function onResendVerify() {
    try {
      const res = await resend.mutateAsync();
      if (res?.alreadyVerified) toast.info('Your email is already verified.');
      else toast.success('Verification email sent — check your inbox');
    } catch (err) {
      toast.error(readApiError(err));
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <Badge variant="brand" leftIcon={<UserIcon />}>Account</Badge>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
        Settings
      </h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Update your profile, change your password, and manage email verification.
      </p>

      <div className="mt-8 space-y-6">
        {/* Email + verification status */}
        <Section
          icon={Mail}
          title="Email address"
          description="Your email is used for sign-in and notifications. Contact support to change it."
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">{user.email}</div>
              <div className="mt-1 flex items-center gap-2">
                {user.emailVerifiedAt ? (
                  <Badge variant="success" leftIcon={<ShieldCheck />}>Verified</Badge>
                ) : (
                  <Badge variant="warning" leftIcon={<AlertTriangle />}>Not verified</Badge>
                )}
              </div>
            </div>
            {!user.emailVerifiedAt && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<MailCheck />}
                onClick={onResendVerify}
                isLoading={resend.isPending}
              >
                Resend verification
              </Button>
            )}
          </div>
        </Section>

        {/* Profile */}
        <Section
          icon={UserIcon}
          title="Profile"
          description="Your display name and timezone (used to bucket your daily read quota)."
        >
          <form onSubmit={profile.handleSubmit(onSaveProfile)} className="space-y-4" noValidate>
            <Field label="Full name" htmlFor="name" error={profile.formState.errors.name?.message}>
              <Input
                id="name"
                autoComplete="name"
                leftIcon={<UserIcon />}
                error={!!profile.formState.errors.name}
                {...profile.register('name')}
              />
            </Field>
            <Field label="Timezone" htmlFor="timezone" error={profile.formState.errors.timezone?.message}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400">
                  <Globe size={15} />
                </span>
                <select
                  id="timezone"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-700"
                  {...profile.register('timezone')}
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </Field>
            <div className="flex justify-end">
              <Button
                type="submit"
                leftIcon={<Save />}
                isLoading={update.isPending}
                disabled={!profile.formState.isDirty}
              >
                Save changes
              </Button>
            </div>
          </form>
        </Section>

        {/* Change password */}
        <Section
          icon={Lock}
          title="Change password"
          description="After saving, all other devices will be signed out. Your current session stays signed in."
        >
          <form onSubmit={pwd.handleSubmit(onChangePassword)} className="space-y-4" noValidate>
            <Field
              label="Current password"
              htmlFor="currentPassword"
              error={pwd.formState.errors.currentPassword?.message}
            >
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCur ? 'text' : 'password'}
                  autoComplete="current-password"
                  leftIcon={<Lock />}
                  className="pr-10"
                  error={!!pwd.formState.errors.currentPassword}
                  {...pwd.register('currentPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowCur((v) => !v)}
                  className="absolute inset-y-0 right-0 z-10 inline-flex w-10 items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label={showCur ? 'Hide password' : 'Show password'}
                >
                  {showCur ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            <Field
              label="New password"
              htmlFor="newPassword"
              error={pwd.formState.errors.newPassword?.message}
            >
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  leftIcon={<Lock />}
                  className="pr-10"
                  error={!!pwd.formState.errors.newPassword}
                  {...pwd.register('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute inset-y-0 right-0 z-10 inline-flex w-10 items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            <Field
              label="Confirm new password"
              htmlFor="confirm"
              error={pwd.formState.errors.confirm?.message}
            >
              <Input
                id="confirm"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                leftIcon={<Lock />}
                error={!!pwd.formState.errors.confirm}
                {...pwd.register('confirm')}
              />
            </Field>
            <div className="flex justify-end">
              <Button
                type="submit"
                leftIcon={<Save />}
                isLoading={changePw.isPending}
              >
                Update password
              </Button>
            </div>
          </form>
        </Section>
      </div>
    </div>
  );
}
