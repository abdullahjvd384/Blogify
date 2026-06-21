import { DocPage } from '@/components/layout/DocPage';

export default function PrivacyPage() {
  return (
    <DocPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="What we collect, why we collect it, and the control you have over your data."
      updated="June 2026"
    >
      <h2>Our approach</h2>
      <p>
        We collect the minimum we need to run DevCrunch well. We don&apos;t sell your
        personal data, and we don&apos;t run third-party advertising trackers on the
        Service.
      </p>

      <h2>Information we collect</h2>
      <h3>You give us</h3>
      <ul>
        <li>
          <strong>Account details</strong> — your name, email, password (stored
          hashed), and optional profile information such as a bio and avatar.
        </li>
        <li>
          <strong>Content</strong> — articles, responses, and other things you
          publish or save.
        </li>
        <li>
          <strong>Payment information</strong> — if you subscribe, billing details
          are handled by our payment provider; we store only the records needed to
          manage your subscription.
        </li>
      </ul>
      <h3>We collect automatically</h3>
      <ul>
        <li>
          <strong>Reading activity</strong> — which articles are read and for how
          long, used to power your feed, writer statistics, and fair payouts.
        </li>
        <li>
          <strong>Technical data</strong> — basic device and log information needed
          for security and to keep the Service running.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To provide, personalize, and improve the Service;</li>
        <li>To calculate writer earnings and prevent fraud and abuse;</li>
        <li>To communicate with you about your account and important updates;</li>
        <li>To keep the platform secure and comply with legal obligations.</li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use essential cookies to keep you signed in and to remember preferences
        such as your light/dark theme. These are required for the Service to work and
        are not used for advertising.
      </p>

      <h2>Service providers</h2>
      <p>
        We rely on trusted third parties to operate DevCrunch — for example, cloud
        database and media hosting, email delivery, and payment processing. They
        process data only on our behalf and under appropriate safeguards.
      </p>

      <h2>Data retention</h2>
      <p>
        We keep your data while your account is active. When you delete content or
        your account, we remove it from the live Service; limited copies may remain in
        backups or where retention is legally required.
      </p>

      <h2>Your rights</h2>
      <p>
        You can access and update most of your information from your{' '}
        <a href="/account/settings">account settings</a>. You may request a copy of
        your data or its deletion by contacting us. We&apos;ll respond within a
        reasonable timeframe.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Email{' '}
        <a href="mailto:support@devcrunch.tech">support@devcrunch.tech</a>.
      </p>
    </DocPage>
  );
}
