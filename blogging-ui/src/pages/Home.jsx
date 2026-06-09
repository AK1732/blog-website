import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getBlogs } from '../services/blogService';
import { getCategories } from '../services/categoryService';
import '../styles/homepage.css';

const fallbackCategories = [
  { id: 'strategy', name: 'Strategy' },
  { id: 'product', name: 'Product' },
  { id: 'design', name: 'Design' },
  { id: 'engineering', name: 'Engineering' },
  { id: 'growth', name: 'Growth' },
  { id: 'operations', name: 'Operations' },
];

const fallbackBlogs = [
  {
    id: 'launch-editorial-os',
    title: 'Building an editorial operating system for ambitious teams',
    content:
      'A practical guide to planning, drafting, reviewing, and publishing with a workflow that keeps writers, editors, and operators moving in the same direction.',
    image: '',
    category_id: 'strategy',
    category_name: 'Strategy',
    author_name: 'BluePurple Studio',
    created_at: '2026-06-02T10:00:00.000Z',
  },
  {
    id: 'content-dashboard',
    title: 'What high-performing publishing dashboards get right',
    content:
      'The best dashboards make bottlenecks visible without turning content work into spreadsheet work. Here are the signals worth tracking.',
    image: '',
    category_id: 'product',
    category_name: 'Product',
    author_name: 'Maya Chen',
    created_at: '2026-05-29T10:00:00.000Z',
  },
  {
    id: 'reader-first-layouts',
    title: 'Designing reader-first layouts with rhythm and restraint',
    content:
      'Readable typography, compact metadata, and strong cards can make a blog feel premium before a visitor reads the first paragraph.',
    image: '',
    category_id: 'design',
    category_name: 'Design',
    author_name: 'Noah Vale',
    created_at: '2026-05-22T10:00:00.000Z',
  },
  {
    id: 'api-backed-publishing',
    title: 'Shipping API-backed publishing tools without losing speed',
    content:
      'Raw SQL and focused endpoints can be more than enough for a serious publishing product when the domain model is crisp.',
    image: '',
    category_id: 'engineering',
    category_name: 'Engineering',
    author_name: 'Iris Morgan',
    created_at: '2026-05-18T10:00:00.000Z',
  },
  {
    id: 'newsletter-loops',
    title: 'Turning newsletter subscribers into a durable growth loop',
    content:
      'A modern publication grows through repeatable habits: strong hooks, clean archives, audience segmentation, and consistent delivery.',
    image: '',
    category_id: 'growth',
    category_name: 'Growth',
    author_name: 'BluePurple Studio',
    created_at: '2026-05-12T10:00:00.000Z',
  },
  {
    id: 'moderation-systems',
    title: 'Comment moderation patterns that keep communities healthy',
    content:
      'Approval queues, clear states, and fast actions let small teams keep conversations useful without adding operational drag.',
    image: '',
    category_id: 'operations',
    category_name: 'Operations',
    author_name: 'Maya Chen',
    created_at: '2026-05-04T10:00:00.000Z',
  },
];

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function SectionHeader({ eyebrow, title, copy, action }) {
  return (
    <div className="bp-section-header">
      <div>
        <p className="bp-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {copy && <p>{copy}</p>}
      </div>
      {action}
    </div>
  );
}

function ArticleCard({ blog, featured = false }) {
  return (
    <Link to={`/blogs/${blog.id}`} className={`bp-card bp-article-card ${featured ? 'bp-article-card-featured' : ''}`}>
      <div className="bp-card-media">
        {blog.image ? (
          <img src={blog.image} alt="" />
        ) : (
          <div className="bp-generated-cover" aria-hidden="true">
            <span />
            <span />
            <strong>{(blog.category_name || 'BP').slice(0, 2).toUpperCase()}</strong>
          </div>
        )}
        <span>{blog.category_name || 'Editorial'}</span>
      </div>
      <div className="bp-card-body">
        <div className="bp-meta">
          <span>{formatDate(blog.created_at)}</span>
          <span>{blog.author_name || 'BluePurple Team'}</span>
        </div>
        <h3>{blog.title}</h3>
        <p>{blog.content}</p>
        <div className="bp-read-more">
          Read article
          <span aria-hidden="true">{'->'}</span>
        </div>
      </div>
    </Link>
  );
}

function CategoryPill({ category, active, onClick }) {
  return (
    <button className={`bp-category-pill ${active ? 'is-active' : ''}`} type="button" onClick={onClick}>
      {category.name}
    </button>
  );
}

export default function Home() {
  const [blogs, setBlogs] = useState(fallbackBlogs);
  const [categories, setCategories] = useState(fallbackCategories);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isFallback, setIsFallback] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [blogRows, categoryRows] = await Promise.all([
          getBlogs({ status: 'published', limit: 9 }),
          getCategories(),
        ]);

        if (blogRows.length) {
          setBlogs(blogRows);
          setIsFallback(false);
        }
        if (categoryRows.length) setCategories(categoryRows);
      } catch {
        setIsFallback(true);
      }
    }

    load();
  }, []);

  const visibleBlogs = useMemo(
    () =>
      blogs.filter((blog) => {
        const searchable = [blog.title, blog.content, blog.category_name, blog.author_name].join(' ').toLowerCase();
        const matchesQuery = searchable.includes(query.toLowerCase());
        const matchesCategory = !categoryId || String(blog.category_id) === String(categoryId);
        return matchesQuery && matchesCategory;
      }),
    [blogs, categoryId, query],
  );

  const featured = visibleBlogs.slice(0, 2);
  const latest = visibleBlogs.slice(2, 8);

  function handleNewsletterSubmit(event) {
    event.preventDefault();
    setNewsletterEmail('');
  }

  return (
    <div className="bp-home">
      <section className="bp-hero">
        <div className="bp-hero-copy">
          <div className="bp-hero-badge">
            <span />
            Publishing workspace for modern teams
          </div>
          <h1>Turn ideas into polished articles, faster.</h1>
          <p>
            BluePurple Blog combines a premium reading experience with an admin workflow for publishing,
            categorizing, and moderating content at startup speed.
          </p>
          <div className="bp-hero-actions">
            <Link className="bp-button bp-button-primary" to="/blogs">
              Explore articles
            </Link>
            <Link className="bp-button bp-button-secondary" to="/dashboard">
              Open dashboard
            </Link>
          </div>
        </div>

        <div className="bp-hero-panel" aria-label="Publishing overview">
          <div className="bp-panel-topline">
            <span>Editorial OS</span>
            <span>{isFallback ? 'Demo content' : 'Live content'}</span>
          </div>
          <div className="bp-panel-feature">
            <p>Featured</p>
            <h2>{featured[0]?.title || fallbackBlogs[0].title}</h2>
          </div>
          <div className="bp-panel-grid">
            <div>
              <strong>{blogs.length}</strong>
              <span>Articles</span>
            </div>
            <div>
              <strong>{categories.length}</strong>
              <span>Categories</span>
            </div>
            <div>
              <strong>JWT</strong>
              <span>Admin auth</span>
            </div>
          </div>
        </div>
      </section>

      <main className="bp-main">
        <section className="bp-toolbar" aria-label="Search and filters">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search articles, authors, or topics"
          />
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </section>

        <section className="bp-section">
          <SectionHeader
            eyebrow="Featured Articles"
            title="Handpicked writing with signal."
            copy="High-clarity reads for teams building products, audiences, and editorial systems."
            action={<Link to="/blogs">View library</Link>}
          />
          <div className="bp-featured-grid">
            {featured.map((blog) => (
              <ArticleCard key={blog.id} blog={blog} featured />
            ))}
          </div>
        </section>

        <section className="bp-section">
          <SectionHeader
            eyebrow="Categories"
            title="Browse by operating mode."
            copy="Jump into focused collections across strategy, product, design, engineering, and growth."
          />
          <div className="bp-category-list">
            <CategoryPill category={{ id: '', name: 'All' }} active={!categoryId} onClick={() => setCategoryId('')} />
            {categories.map((category) => (
              <CategoryPill
                key={category.id}
                category={category}
                active={String(category.id) === String(categoryId)}
                onClick={() => setCategoryId(category.id)}
              />
            ))}
          </div>
        </section>

        <section className="bp-section">
          <SectionHeader
            eyebrow="Latest Articles"
            title="Fresh notes from the publishing desk."
            copy="Compact, readable cards designed for scanning without flattening the story."
          />
          <div className="bp-latest-grid">
            {latest.map((blog) => (
              <ArticleCard key={blog.id} blog={blog} />
            ))}
          </div>
          {!visibleBlogs.length && (
            <div className="bp-empty-state">
              No articles match this search yet. Try a different topic or clear the category filter.
            </div>
          )}
        </section>

        <section className="bp-newsletter">
          <div>
            <p className="bp-eyebrow">Newsletter</p>
            <h2>Get the best publishing ideas in your inbox.</h2>
            <p>
              A concise weekly note on editorial systems, SaaS content strategy, product storytelling,
              and practical writing workflows.
            </p>
          </div>
          <form onSubmit={handleNewsletterSubmit}>
            <input
              value={newsletterEmail}
              onChange={(event) => setNewsletterEmail(event.target.value)}
              type="email"
              required
              placeholder="you@company.com"
            />
            <button type="submit">Subscribe</button>
          </form>
        </section>
      </main>
    </div>
  );
}
