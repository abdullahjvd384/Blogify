import { DocPage } from '@/components/layout/DocPage';

export default function TermsPage() {
  return (
    <DocPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="The rules for using Blogify. By creating an account or using the platform, you agree to these terms."
      updated="June 2026"
    >
      <h2>1. Accepting these terms</h2>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of
        Blogify (the &quot;Service&quot;). By accessing, browsing, or using the
        Service, you agree to be bound by these Terms. If you do not agree, please do
        not use the Service.
      </p>

      <h2>2. Your account</h2>
      <p>
        You can read public articles without an account. To follow writers, respond,
        save articles, publish, or manage a membership, you need to register. You are
        responsible for keeping your login credentials secure and for all activity
        under your account. You must be at least 13 years old (or the age of digital
        consent in your country) to create an account.
      </p>

      <h2>3. Your content</h2>
      <p>
        You retain ownership of everything you write and publish on Blogify. By
        publishing, you grant us a non-exclusive, worldwide, royalty-free license to
        host, store, display, and distribute your content for the purpose of
        operating and promoting the Service. You can unpublish or delete your content
        at any time, and we will stop displaying it (cached or backup copies may
        persist for a limited period).
      </p>
      <p>
        You are solely responsible for the content you publish. You represent that
        you have the rights to it and that it does not infringe on anyone else&apos;s
        rights or violate any law.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to use Blogify to:</p>
      <ul>
        <li>Post unlawful, hateful, harassing, or deliberately deceptive content;</li>
        <li>Infringe intellectual property or privacy rights;</li>
        <li>Spam, scrape, or attempt to game engagement or payout systems;</li>
        <li>Distribute malware or attempt to disrupt or breach the Service;</li>
        <li>Impersonate others or misrepresent your affiliation.</li>
      </ul>
      <p>
        Submissions are screened by automated moderation and may be reviewed by our
        team. We may remove content or suspend accounts that violate these Terms.
      </p>

      <h2>5. Membership and payments</h2>
      <p>
        Membership is an optional paid subscription that unlocks unlimited access to
        member-only stories and supports writers. Prices are shown on the{' '}
        <a href="/pricing">pricing page</a>. Subscriptions renew for the period you
        select until cancelled. Payments are processed by our third-party payment
        provider; we do not store full payment credentials.
      </p>

      <h2>6. Writer earnings</h2>
      <p>
        Writers may earn a share of membership revenue based on genuine member reading
        activity, subject to our payout rules and fraud checks. Earnings, minimum
        withdrawal thresholds, and payout timing are described in your writer
        dashboard and may be updated over time.
      </p>

      <h2>7. Termination</h2>
      <p>
        You may stop using the Service and delete your account at any time. We may
        suspend or terminate access if you violate these Terms or for the security or
        integrity of the Service.
      </p>

      <h2>8. Disclaimers and liability</h2>
      <p>
        The Service is provided &quot;as is&quot; without warranties of any kind. To
        the maximum extent permitted by law, Blogify is not liable for indirect,
        incidental, or consequential damages arising from your use of the Service.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update these Terms from time to time. If we make material changes,
        we&apos;ll notify you through the Service. Continued use after changes take
        effect means you accept the updated Terms.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about these Terms? Email us at{' '}
        <a href="mailto:support@blogify.app">support@blogify.app</a>.
      </p>
    </DocPage>
  );
}
