import { Link } from 'react-router-dom';
import { DocPage } from '@/components/layout/DocPage';

const faqs = [
  {
    q: 'Do I need an account to read?',
    a: (
      <>
        No. You can browse and read public articles without signing up. A free
        account lets you follow writers, save articles, respond, and get a feed
        that&apos;s yours.
      </>
    ),
  },
  {
    q: 'What does membership include?',
    a: (
      <>
        Membership gives you unlimited access to member-only stories and directly
        supports the writers you read. Free readers get a limited number of
        member-only stories each month. See the{' '}
        <Link to="/pricing">pricing page</Link> for details.
      </>
    ),
  },
  {
    q: 'How do I start writing?',
    a: (
      <>
        Create an account, then open your <Link to="/writer">writer studio</Link> to
        start a draft. When you submit, it goes live after a quick moderation check.
        Read the <Link to="/guidelines">editorial guidelines</Link> first.
      </>
    ),
  },
  {
    q: 'How do writers get paid?',
    a: (
      <>
        Writers earn a share of membership revenue based on genuine member reading
        time on their stories. You can track this in your earnings dashboard and
        withdraw once you reach the minimum threshold.
      </>
    ),
  },
  {
    q: 'My article was flagged — what now?',
    a: (
      <>
        Automated moderation occasionally flags content by mistake. You can revise
        and resubmit, and a human can review the decision. Moderation targets spam and
        abuse, not opinions.
      </>
    ),
  },
  {
    q: 'How do I reset my password?',
    a: (
      <>
        Use the <Link to="/forgot-password">forgot password</Link> link on the sign-in
        page and follow the emailed instructions.
      </>
    ),
  },
];

export default function HelpPage() {
  return (
    <DocPage
      eyebrow="Help center"
      title="How can we help?"
      intro="Answers to the most common questions about reading, writing, and membership on DevCrunch."
    >
      {faqs.map((item) => (
        <div key={item.q}>
          <h2>{item.q}</h2>
          <p>{item.a}</p>
        </div>
      ))}

      <h2>Still stuck?</h2>
      <p>
        Email us at <a href="mailto:support@devcrunch.tech">support@devcrunch.tech</a> and
        we&apos;ll get back to you. For platform rules, see the{' '}
        <Link to="/guidelines">editorial guidelines</Link>,{' '}
        <Link to="/terms">terms</Link>, and{' '}
        <Link to="/privacy">privacy policy</Link>.
      </p>
    </DocPage>
  );
}
