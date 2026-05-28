import { profilePath } from '@/lib/profile';

/** Maps a notification to display text + a destination link. */
export function notificationMeta(n) {
  const actor = n.actor?.name || 'Someone';
  const title = n.article?.title || 'your article';
  const articleLink = n.article?.slug ? `/articles/${n.article.slug}` : '/';
  switch (n.type) {
    case 'follow':
      return { text: `${actor} started following you`, to: n.actor ? profilePath(n.actor) : '/' };
    case 'comment':
      return { text: `${actor} responded to “${title}”`, to: articleLink };
    case 'reply':
      return { text: `${actor} replied to your response`, to: articleLink };
    case 'upvote':
      return { text: `${actor} upvoted “${title}”`, to: articleLink };
    default:
      return { text: `${actor} interacted with your content`, to: articleLink };
  }
}

export function timeAgo(date) {
  if (!date) return '';
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
