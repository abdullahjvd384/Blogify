import { Link } from 'react-router-dom';
import { DocPage } from '@/components/layout/DocPage';

export default function AboutPage() {
  return (
    <DocPage
      eyebrow="About"
      title="Writing that respects your attention"
      intro="DevCrunch is a home for thoughtful writing — a calm place to read, and a fair place to publish."
    >
      <h2>Why we built DevCrunch</h2>
      <p>
        Most of the internet is built to capture your attention and sell it. Feeds
        are tuned for outrage, articles are stretched to fit more ads, and good
        writing gets buried under noise. We wanted the opposite: a quiet, readable
        space where the writing comes first.
      </p>
      <p>
        DevCrunch is a publishing platform for writers from any field — engineers,
        essayists, founders, researchers, storytellers. Anyone can read. Anyone can
        write. And the people who write the things you love can actually earn from it.
      </p>

      <h2>How it works</h2>
      <h3>For readers</h3>
      <p>
        Reading is free. You can browse and read articles without an account. Create
        a free account to follow writers, save articles, respond, and build a feed
        that&apos;s yours — no engagement-bait algorithm deciding what you see.
        Members get unlimited access to member-only stories and directly support the
        writers they read.
      </p>
      <h3>For writers</h3>
      <p>
        Publishing is straightforward: write in a clean editor, submit, and your work
        goes live after a quick moderation check. Every submission is screened so the
        feed stays free of spam and abuse — not opinions. Writers earn a share of
        membership revenue based on how much members genuinely read their work.
      </p>

      <h2>What we believe</h2>
      <p>
        <strong>Quality over volume.</strong> A good feed is one you can finish, not
        one that never ends.
      </p>
      <p>
        <strong>Writers should be paid.</strong> Attention has value. When readers
        pay for membership, that money should flow to the people who earned it.
      </p>
      <p>
        <strong>No dark patterns.</strong> No infinite scroll traps, no fake
        urgency, no selling your data. Just words worth reading.
      </p>

      <h2>Get started</h2>
      <p>
        Start reading on the{' '}
        <Link to="/articles">articles feed</Link>, or{' '}
        <Link to="/signup">create a free account</Link> to start writing. Questions?
        Visit our <Link to="/help">help center</Link>.
      </p>
    </DocPage>
  );
}
