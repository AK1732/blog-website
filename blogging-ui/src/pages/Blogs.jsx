import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getBlogs } from '../services/blogService';
import { getCategories } from '../services/categoryService';
import '../styles/homepage.css';

const demoCategories = [
  { id: 'strategy', name: 'Strategy' },
  { id: 'product', name: 'Product' },
  { id: 'design', name: 'Design' },
  { id: 'engineering', name: 'Engineering' },
  { id: 'growth', name: 'Growth' },
];

const demoBlogs = [
  {
    id: 'editorial-os',
    title: 'Designing an editorial operating system for fast-moving teams',
    content:
      'How to turn loose ideas into a structured publishing workflow with clear ownership, review states, and a better reader experience.',
    category_id: 'strategy',
    category_name: 'Strategy',
    author_name: 'BluePurple Studio',
    created_at: '2026-06-04T10:00:00.000Z',
  },
  {
    id: 'reader-interface',
    title: 'The interface choices that make articles feel premium',
    content:
      'Readable type, layered cards, polished metadata, and restrained motion can make a blog feel like a serious product.',
    category_id: 'design',
    category_name: 'Design',
    author_name: 'Maya Chen',
    created_at: '2026-05-29T10:00:00.000Z',
  },
  {
    id: 'sql-publishing',
    title: 'Why simple SQL-backed publishing still scales beautifully',
    content:
      'A focused PostgreSQL schema and thoughtful API boundaries are enough for most editorial teams to move quickly.',
    category_id: 'engineering',
    category_name: 'Engineering',
    author_name: 'Iris Morgan',
    created_at: '2026-05-22T10:00:00.000Z',
  },
  {
    id: 'content-pipeline',
    title: 'Building a dashboard that exposes content bottlenecks',
    content:
      'The best publishing dashboards highlight draft volume, moderation queues, and category mix without overwhelming the operator.',
    category_id: 'product',
    category_name: 'Product',
    author_name: 'Noah Vale',
    created_at: '2026-05-16T10:00:00.000Z',
  },
  {
    id: 'newsletter-loop',
    title: 'Turning newsletter signups into a useful growth system',
    content:
      'A compact playbook for segmenting readers, designing repeatable sends, and creating a reason to return.',
    category_id: 'growth',
    category_name: 'Growth',
    author_name: 'BluePurple Studio',
    created_at: '2026-05-08T10:00:00.000Z',
  },
];

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ArticleVisual({ blog }) {
  if (blog.image) {
    return <img src={blog.image} alt="" />;
  }

  return (
    <div className="bp-generated-cover" aria-hidden="true">
      <span />
      <span />
      <strong>{(blog.category_name || 'BP').slice(0, 2).toUpperCase()}</strong>
    </div>
  );
}

function LibraryCard({ blog, index }) {
  return (
    <Link to={`/blogs/${blog.id}`} className={`bp-library-card ${index === 0 ? 'is-large' : ''}`}>
      <div className="bp-library-media">
        <ArticleVisual blog={blog} />
        <em>{blog.category_name || 'Editorial'}</em>
      </div>
      <div className="bp-library-body">
        <div className="bp-library-meta">
          <span>{formatDate(blog.created_at)}</span>
          <span>{blog.author_name || 'BluePurple Team'}</span>
        </div>
        <h2>{blog.title}</h2>
        <p>{blog.content}</p>
        <div className="bp-library-action">Read article <span>{'->'}</span></div>
      </div>
    </Link>
  );
}

export default function Blogs() {
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [blogs, setBlogs] = useState(demoBlogs);
  const [categories, setCategories] = useState(demoCategories);
  const [usingDemo, setUsingDemo] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [blogRows, categoryRows] = await Promise.all([
          getBlogs({ status: 'published', q: q.trim() || undefined, categoryId: categoryId || undefined }),
          getCategories(),
        ]);

        if (blogRows.length) {
          setBlogs(blogRows);
          setUsingDemo(false);
        } else {
          setBlogs(demoBlogs);
          setUsingDemo(true);
        }
        if (categoryRows.length) setCategories(categoryRows);
      } catch {
        setBlogs(demoBlogs);
        setCategories(demoCategories);
        setUsingDemo(true);
      }
    }

    load();
  }, [categoryId, q]);

  const activeCategory = useMemo(
    () => categories.find((category) => String(category.id) === String(categoryId))?.name || 'All categories',
    [categories, categoryId],
  );

  const visibleBlogs = useMemo(
    () =>
      blogs.filter((blog) => {
        const matchesSearch = [blog.title, blog.content, blog.category_name, blog.author_name]
          .join(' ')
          .toLowerCase()
          .includes(q.toLowerCase());
        const matchesCategory = !categoryId || String(blog.category_id) === String(categoryId);
        return matchesSearch && matchesCategory;
      }),
    [blogs, categoryId, q],
  );

  return (
    <main className="bp-library-page">
      <section className="bp-library-hero">
        <div>
          <p className="bp-eyebrow">{activeCategory}</p>
          <h1>Articles with product-grade polish.</h1>
          <p>
            Browse strategy, design, engineering, and growth writing in a cleaner editorial library.
            {usingDemo ? ' Demo articles are shown until live published posts are available.' : ''}
          </p>
        </div>
        <Link className="bp-button bp-button-primary" to="/dashboard/blogs/add">
          Add article
        </Link>
      </section>

      <section className="bp-library-controls">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search title, author, category, or topic"
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

      <section className="bp-library-tags">
        <button className={!categoryId ? 'is-active' : ''} type="button" onClick={() => setCategoryId('')}>
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={String(categoryId) === String(category.id) ? 'is-active' : ''}
            type="button"
            onClick={() => setCategoryId(category.id)}
          >
            {category.name}
          </button>
        ))}
      </section>

      <section className="bp-library-grid">
        {visibleBlogs.map((blog, index) => (
          <LibraryCard key={blog.id} blog={blog} index={index} />
        ))}
      </section>

      {!visibleBlogs.length && (
        <div className="bp-empty-state">No articles match your filters. Try a different category or search.</div>
      )}
    </main>
  );
}
