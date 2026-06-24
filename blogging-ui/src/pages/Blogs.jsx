import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { getBlogsResponse } from '../services/blogService';
import { getCategories } from '../services/categoryService';
import { getTags } from '../services/tagService';
import { getBlogPublicPath } from '../utils/blogUrls';
import '../styles/homepage.css';

const MotionLink = motion(Link);

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
    author_name: 'InsightHub Studio',
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
    author_name: 'InsightHub Studio',
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
      <strong>{(blog.category_name || 'IH').slice(0, 2).toUpperCase()}</strong>
    </div>
  );
}

function LibraryCard({ blog, index }) {
  return (
    <MotionLink
      to={getBlogPublicPath(blog)}
      className={`bp-library-card ${index === 0 ? 'is-large' : ''}`}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.42, delay: Math.min(index * 0.04, 0.16), ease: 'easeOut' }}
      whileHover={{ y: -8, rotateX: 3, rotateY: index % 2 ? 2.5 : -2.5, scale: 1.012 }}
    >
      <div className="bp-library-media">
        <ArticleVisual blog={blog} />
        <em>{blog.category_name || 'Editorial'}</em>
      </div>
      <div className="bp-library-body">
        <div className="bp-library-meta">
          <span>{formatDate(blog.created_at)}</span>
          <span>{blog.author_name || 'InsightHub Team'}</span>
        </div>
        <h2>{blog.title}</h2>
        <p>{String(blog.content || '').replace(/<[^>]*>/g, '')}</p>
        <div className="bp-library-action">Read article <span>{'->'}</span></div>
      </div>
    </MotionLink>
  );
}

export default function Blogs() {
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagId, setTagId] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [page, setPage] = useState(1);
  const [blogs, setBlogs] = useState(demoBlogs);
  const [categories, setCategories] = useState(demoCategories);
  const [tags, setTags] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [usingDemo, setUsingDemo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const [blogData, categoryRows, tagRows, authorData] = await Promise.all([
          getBlogsResponse({
            status: 'published',
            q: q.trim() || undefined,
            categoryId: categoryId || undefined,
            tagId: tagId || undefined,
            authorId: authorId || undefined,
            page,
            limit: 6,
          }),
          getCategories(),
          getTags().catch(() => []),
          getBlogsResponse({ status: 'published', limit: 100 }),
        ]);
        const blogRows = blogData.blogs || [];

        if (blogRows.length) {
          setBlogs(blogRows);
          setUsingDemo(false);
        } else {
          setBlogs(demoBlogs);
          setUsingDemo(true);
        }
        if (categoryRows.length) setCategories(categoryRows);
        setTags(tagRows);
        setPagination(blogData.pagination || { page: 1, totalPages: 1 });
        const authorRows = authorData.blogs || [];
        const source = authorRows.length ? authorRows : blogRows.length ? blogRows : demoBlogs;
        const nextAuthors = Array.from(
          new Map(
            source
              .filter((blog) => blog.author_id || blog.author_name)
              .map((blog) => [String(blog.author_id || blog.author_name), {
                id: blog.author_id || blog.author_name,
                name: blog.author_name || 'Unknown author',
              }]),
          ).values(),
        );
        setAuthors(nextAuthors);
      } catch {
        setBlogs(demoBlogs);
        setCategories(demoCategories);
        setUsingDemo(true);
        setLoadError('Live articles are unavailable right now, so demo articles are shown.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [authorId, categoryId, page, q, tagId]);

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
        const matchesAuthor = !authorId || String(blog.author_id || blog.author_name) === String(authorId);
        const matchesTag = !tagId || (blog.tags || []).some((tag) => String(tag.id) === String(tagId));
        return matchesSearch && matchesCategory && matchesAuthor && matchesTag;
      }),
    [authorId, blogs, categoryId, q, tagId],
  );

  return (
    <motion.main
      className="bp-library-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <motion.section
        className="bp-library-hero bp-glass-panel"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div>
          <p className="bp-eyebrow">{activeCategory}</p>
          <h1>Articles with product-grade polish.</h1>
          <p>
            Browse strategy, design, engineering, and growth writing in a cleaner editorial library.
            {usingDemo ? ' Demo articles are shown until live published posts are available.' : ''}
          </p>
        </div>
        <Link className="bp-button bp-button-primary" to="/writer/blogs/add">
          Add article
        </Link>
      </motion.section>

      <motion.section
        className="bp-library-controls bp-glass-panel"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, delay: 0.08, ease: 'easeOut' }}
      >
        <input
          value={q}
          onChange={(event) => {
            setPage(1);
            setQ(event.target.value);
          }}
          placeholder="Search title, author, category, or topic"
        />
        <select value={categoryId} onChange={(event) => {
          setPage(1);
          setCategoryId(event.target.value);
        }}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select value={tagId} onChange={(event) => {
          setPage(1);
          setTagId(event.target.value);
        }}>
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
        <select value={authorId} onChange={(event) => setAuthorId(event.target.value)}>
          <option value="">All authors</option>
          {authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.name}
            </option>
          ))}
        </select>
      </motion.section>

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
        {loading && <div className="bp-empty-state">Loading articles...</div>}
        {visibleBlogs.map((blog, index) => (
          <LibraryCard key={blog.id} blog={blog} index={index} />
        ))}
      </section>

      {!visibleBlogs.length && (
        <div className="bp-empty-state">No articles match your filters. Try a different category or search.</div>
      )}
      <section className="bp-pagination">
        <button type="button" disabled={pagination.page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>
          Previous
        </button>
        <span>Page {pagination.page || page} of {pagination.totalPages || 1}</span>
        <button type="button" disabled={(pagination.page || page) >= (pagination.totalPages || 1)} onClick={() => setPage((current) => current + 1)}>
          Next
        </button>
      </section>
      {loadError && <div className="bp-empty-state">{loadError}</div>}
    </motion.main>
  );
}
