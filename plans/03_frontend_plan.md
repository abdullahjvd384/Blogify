# 03 — Frontend Plan

## 1. Stack

- **Build**: Vite 5
- **Framework**: React 18
- **Routing**: React Router v6 (data routers)
- **Server state**: TanStack Query v5
- **Client state**: Zustand (small, ergonomic) — only for cross-cutting UI state
- **Styling**: Tailwind CSS + shadcn/ui (copy-in components, not a heavy library)
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios with interceptors
- **Editor**: TipTap (writer editor)
- **Icons**: lucide-react
- **Charts (admin)**: Recharts
- **Testing**: Vitest + React Testing Library + Playwright (E2E)

## 2. Project Structure

```
client/
├── src/
│   ├── app/
│   │   ├── router.jsx           # route tree
│   │   ├── providers.jsx        # QueryClient, AuthProvider, Toaster
│   │   └── main.jsx             # entry
│   ├── pages/
│   │   ├── public/
│   │   │   ├── HomePage.jsx
│   │   │   ├── ArticlePage.jsx
│   │   │   ├── PricingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── SignupPage.jsx
│   │   ├── reader/
│   │   │   ├── FeedPage.jsx
│   │   │   └── ReaderPage.jsx
│   │   ├── writer/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── EditorPage.jsx
│   │   │   ├── DraftsPage.jsx
│   │   │   └── EarningsPage.jsx
│   │   ├── admin/
│   │   │   ├── OverviewPage.jsx
│   │   │   ├── UsersPage.jsx
│   │   │   ├── ArticlesPage.jsx
│   │   │   ├── ModerationPage.jsx
│   │   │   └── PaymentsPage.jsx
│   │   └── account/
│   │       ├── SettingsPage.jsx
│   │       └── SubscriptionPage.jsx
│   ├── features/                # vertical slices
│   │   ├── auth/
│   │   │   ├── api.js
│   │   │   ├── hooks.js         # useLogin, useSignup, useMe
│   │   │   └── components/
│   │   ├── articles/
│   │   ├── reads/               # heartbeat client
│   │   ├── moderation/
│   │   ├── payments/
│   │   └── admin/
│   ├── components/
│   │   ├── ui/                  # shadcn primitives
│   │   ├── layout/              # Header, Footer, Sidebar
│   │   ├── PaywallModal.jsx
│   │   ├── ArticleCard.jsx
│   │   ├── EmptyState.jsx
│   │   └── ErrorBoundary.jsx
│   ├── lib/
│   │   ├── api.js               # axios instance + interceptors
│   │   ├── queryClient.js
│   │   ├── auth.js              # token refresh logic
│   │   ├── format.js            # date, money, duration
│   │   └── analytics.js
│   ├── stores/
│   │   ├── authStore.js         # current user, role
│   │   └── uiStore.js           # sidebar, theme
│   ├── styles/
│   │   └── index.css            # tailwind layers
│   └── env.js                   # validated import.meta.env
├── public/
├── tests/
│   ├── unit/
│   └── e2e/
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## 3. Component Architecture

- **Pages** = route components, lean. Compose from feature components.
- **Features** = vertical slices (api + hooks + components for one domain).
- **Components/ui** = unstyled-ish primitives (Button, Input, Dialog, Card).
- **Components/** (root) = cross-cutting reusable widgets.
- **Layouts** = `<PublicLayout>`, `<AppLayout>` (sidebar nav), `<AdminLayout>`.

Component rules:
- Container/presentational split via custom hooks (data fetched in hook, UI dumb).
- Suspense boundaries around route-level data, not deeply nested.
- One component per file; co-locate small subcomponents only.

## 4. State Management

| State Type | Tool |
|---|---|
| Server data (articles, user, payments) | TanStack Query |
| Auth user (after login) | Zustand authStore, hydrated by `useMe()` |
| UI: modals, sidebar | Zustand uiStore |
| Form state | React Hook Form |
| URL state (filters, page) | searchParams |

**No Redux.** Keep it small.

Cache keys:
```
['articles', { filters }]   // feed
['article', slug]
['me']
['subscription', 'me']
['admin', 'moderation', 'queue', { filters }]
```

## 5. Routing

```
/                                public  HomePage
/articles                        public  FeedPage
/articles/:slug                  public  ArticlePage (paywall-aware)
/login                           public
/signup                          public
/pricing                         public

/account/settings                user
/account/subscription            user

/writer                          writer  DashboardPage
/writer/editor/new               writer  EditorPage
/writer/editor/:id               writer  EditorPage
/writer/drafts                   writer  DraftsPage
/writer/earnings                 writer  EarningsPage

/admin                           admin   OverviewPage
/admin/users                     admin
/admin/articles                  admin
/admin/moderation                admin
/admin/payments                  admin
```

- `<ProtectedRoute role="writer|admin">` wrapper.
- Loaders use `queryClient.ensureQueryData` for prefetching.

## 6. API Integration Strategy

- Single `axios` instance with:
  - `baseURL = /api/v1`
  - `withCredentials: true` (cookies)
  - Response interceptor: on 401 → call `/auth/refresh`, retry original request once. If refresh fails → log out + redirect.
  - Request interceptor: add `X-Request-Id` for traceability.
- Each feature has an `api.js` with thin wrapper functions returning typed payloads.
- Hooks (`useArticleFeed`, `useSubmitArticle`, etc.) wrap React Query.
- Mutations invalidate relevant queries on success.

## 7. Key UX Flows

### 7.1 Paywall (Reader)
- On feed: show all article cards.
- On click: client checks cached `useMe()` quota — if exhausted, show `PaywallModal` *before* navigating.
- Server is still authoritative; if API returns 402, show modal regardless.
- Modal CTAs: "Upgrade" → `/pricing`, "Maybe later" → close.
- Show countdown to reset using user's TZ.

### 7.2 Reader Heartbeat
- On `ArticlePage` mount → `POST /reads/start` → store sessionId.
- `useEffect` interval (15s) sending heartbeat *only* if `document.visibilityState === 'visible'` and last scroll/mouse activity within 30s.
- On unmount or `visibilitychange=hidden` → `POST /reads/end` (use `navigator.sendBeacon` for reliability on tab close).

### 7.3 Writer Editor
- TipTap editor with toolbar (bold, italic, headings, link, code, image-upload).
- Autosave: debounce 2s on content change → PATCH draft.
- Submit button → confirm dialog → POST /submit → toast → navigate to drafts.
- Status badges per article: Draft, Submitted, In Review, Published, Rejected.
- Rejected → show reason + edit button.

### 7.4 Admin Moderation
- Queue table: pending items, sortable, filterable.
- Click row → side panel with article preview + AI verdict + reasons.
- Buttons: Approve / Reject / Override AI / Add Note.
- Bulk actions: select multiple, approve.

## 8. UI/UX Structure

- **Design system tokens** in Tailwind config: brand colors, spacing scale, font scale.
- Light + dark mode (system default) — Tailwind `darkMode: 'class'`.
- Mobile-first responsive: sidebar collapses to bottom nav under `md`.
- Loading states: skeletons for feeds and article body, spinners for mutations.
- Empty states: friendly copy + primary CTA.
- Error states: ErrorBoundary at route level + inline retry on query errors.
- Toasts via shadcn `<Toaster />` for mutation feedback.
- Accessibility: keyboard nav, ARIA labels on icon buttons, focus rings, semantic HTML.

## 9. Performance

- Code-split routes with `React.lazy`.
- Image lazy loading + `loading="lazy"` on article images.
- Memoize expensive lists with `useMemo`; `React.memo` on ArticleCard.
- Avoid re-renders: select only needed slices from Zustand.
- Prefetch next page on feed scroll near bottom.
- Bundle size budget: 200KB gzipped initial JS.

## 10. Environment & Build

- `import.meta.env.VITE_API_BASE_URL` validated at module load.
- `npm run dev` → Vite dev server with proxy to backend.
- `npm run build` → static assets to `dist/`.
- Deployed on Vercel; SPA fallback to `index.html`.
