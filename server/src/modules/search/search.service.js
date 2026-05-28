import { Article } from '../../models/Article.js';
import { User } from '../../models/User.js';
import { attachAuthors } from '../articles/articles.service.js';

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Global search across published articles, people, and tags. Uses case-insensitive
 * partial matching so a search box feels responsive on short queries.
 */
export async function search(q, limit = 8) {
  const term = String(q || '').trim();
  if (!term) return { articles: [], people: [], tags: [] };
  const rx = new RegExp(escapeRegex(term), 'i');

  const [articleDocs, people, tags] = await Promise.all([
    Article.find({
      status: 'published',
      deleted_at: null,
      $or: [{ title: rx }, { excerpt: rx }, { tags: rx }],
    })
      .sort({ _id: -1 })
      .limit(limit)
      .lean(),
    User.find(
      { status: 'active', deleted_at: null, $or: [{ name: rx }, { username: rx }] },
      { name: 1, username: 1, avatar_url: 1, bio: 1 },
    )
      .limit(limit)
      .lean(),
    Article.distinct('tags', { status: 'published', tags: rx }),
  ]);

  const articles = await attachAuthors(articleDocs);
  return {
    articles,
    people: people.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      username: u.username || null,
      avatarUrl: u.avatar_url || null,
      bio: u.bio || '',
    })),
    tags: tags.slice(0, 12),
  };
}
