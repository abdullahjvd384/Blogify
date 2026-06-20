import { Link } from 'react-router-dom';
import { DocPage } from '@/components/layout/DocPage';

export default function GuidelinesPage() {
  return (
    <DocPage
      eyebrow="For writers"
      title="Editorial Guidelines"
      intro="Blogify is open to writing from every field. These guidelines keep the platform trustworthy without policing your voice."
    >
      <h2>What belongs here</h2>
      <p>
        Original writing you created or have the rights to publish — essays, tutorials,
        analysis, stories, guides, opinions, and more. Write for a curious reader who
        gave you their time; make it worth it.
      </p>

      <h2>What&apos;s not allowed</h2>
      <ul>
        <li>Plagiarism or content you don&apos;t have the rights to publish;</li>
        <li>Hate speech, harassment, or content that targets people for who they are;</li>
        <li>Spam, SEO filler, affiliate dumps, or deceptive clickbait;</li>
        <li>Misleading or dangerous misinformation presented as fact;</li>
        <li>Sexual content involving minors, or any illegal content;</li>
        <li>Attempts to manipulate reads, votes, or writer payouts.</li>
      </ul>

      <h2>How moderation works</h2>
      <p>
        Every submission is checked by automated moderation before it goes live, and
        may be reviewed by our team. The goal is to filter spam and abuse — not
        opinions or unpopular ideas. If something is flagged by mistake, you can
        revise and resubmit, and a human can review the decision.
      </p>

      <h2>Writing that lands</h2>
      <ul>
        <li>
          <strong>Lead with the point.</strong> Tell the reader what they&apos;ll get
          and why it matters.
        </li>
        <li>
          <strong>Use structure.</strong> Headings, short paragraphs, and lists make
          long pieces readable.
        </li>
        <li>
          <strong>Add real value.</strong> Examples, evidence, and lived experience
          beat generic summaries.
        </li>
        <li>
          <strong>Credit sources.</strong> Link to what you reference and quote
          accurately.
        </li>
        <li>
          <strong>Pick honest tags.</strong> Good tags help the right readers find
          you — misleading ones hurt your reach.
        </li>
      </ul>

      <h2>Member-only stories</h2>
      <p>
        You can mark a story as member-only. Members read it in full, and non-members
        get a limited number of member stories each month before being asked to join.
        Member reading time is what drives writer earnings, so member-only is a way to
        invest in your best work.
      </p>

      <h2>Ready to publish?</h2>
      <p>
        Head to your <Link to="/writer">writer studio</Link> to start a draft, or
        read more in the <Link to="/help">help center</Link>.
      </p>
    </DocPage>
  );
}
