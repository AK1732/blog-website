import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Sidebar from '../../components/dashboard/Sidebar';
import Topbar from '../../components/dashboard/Topbar';
import WriterSidebar from '../../components/dashboard/WriterSidebar';
import { useToast } from '../../components/useToast';
import { createBlog, getBlog, submitBlog, updateBlog } from '../../services/blogService';
import { getCurrentUser, logout } from '../../services/authService';
import { autosaveDraft } from '../../services/draftService';
import { getCategories } from '../../services/categoryService';
import { getTags } from '../../services/tagService';
import { getApiErrorMessage, getApiFieldError } from '../../utils/apiError';
import '../../styles/admin.css';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function RichTextEditor({ value, onChange, onBlur }) {
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value || '';
    }
  }, [value]);

  function run(command, input = null) {
    document.execCommand(command, false, input);
    const editor = editorRef.current;
    if (editor) onChange(editor.innerHTML);
  }

  function addLink() {
    const url = window.prompt('Enter link URL');
    if (url) run('createLink', url);
  }

  function addImage() {
    const url = window.prompt('Enter image URL');
    if (url) run('insertImage', url);
  }

  return (
    <div className="admin-rich-editor">
      <div className="admin-editor-toolbar">
        <button type="button" onClick={() => run('bold')}>B</button>
        <button type="button" onClick={() => run('italic')}>I</button>
        <button type="button" onClick={() => run('formatBlock', 'H2')}>H2</button>
        <button type="button" onClick={() => run('formatBlock', 'H3')}>H3</button>
        <button type="button" onClick={() => run('insertUnorderedList')}>List</button>
        <button type="button" onClick={() => run('insertOrderedList')}>1.</button>
        <button type="button" onClick={addLink}>Link</button>
        <button type="button" onClick={() => run('formatBlock', 'PRE')}>Code</button>
        <button type="button" onClick={addImage}>Image</button>
      </div>
      <div
        ref={editorRef}
        className="admin-rich-input"
        contentEditable
        data-rich-editor="blog-content"
        role="textbox"
        tabIndex={0}
        aria-multiline="true"
        suppressContentEditableWarning
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        onBlur={onBlur}
      />
    </div>
  );
}

function plainText(value) {
  return String(value || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

const DEFAULT_TAGS = [
  'AI',
  'React',
  'Node.js',
  'PostgreSQL',
  'Web Development',
  'Tutorial',
].map((name) => ({ id: `default-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name, fallback: true }));

function isPositiveIntegerId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0;
}

export default function AddBlogAdmin() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUser = getCurrentUser();
  const isWriter = currentUser?.role === 'writer';
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [form, setForm] = useState({
    title: '',
    content: '',
    image: '',
    category_id: '',
    tag_ids: [],
    status: 'draft',
  });
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [loadErrors, setLoadErrors] = useState({ categories: '', tags: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      let categoryRows = [];
      let tagRows = [];

      try {
        categoryRows = await getCategories();
      } catch (err) {
        const message = getApiErrorMessage(err, 'Could not load categories. Try refreshing the page.');
        setLoadErrors((current) => ({ ...current, categories: message }));
        showToast(message, 'error');
      }

      try {
        tagRows = await getTags();
      } catch (err) {
        const message = getApiErrorMessage(err, 'Could not load tags. Default tag suggestions are shown.');
        setLoadErrors((current) => ({ ...current, tags: message }));
        showToast(message, 'error');
      }

      try {
        setCategories(categoryRows);
        setTags(tagRows.length ? tagRows : DEFAULT_TAGS);
        if (editing) {
          const blog = await getBlog(id);
          setForm({
            title: blog.title || '',
            content: blog.content || '',
            image: blog.image || '',
            category_id: blog.category_id || '',
            tag_ids: (blog.tags || []).map((tag) => tag.id).filter(isPositiveIntegerId),
            status: blog.status || 'draft',
          });
        }
      } catch (err) {
        const message = getApiErrorMessage(err, 'Could not load this blog for editing.');
        setLoadErrors((current) => ({ ...current, blog: message }));
        showToast(message, 'error');
      }
    }

    load();
  }, [editing, id, showToast]);

  useEffect(() => {
    if (!currentUser || (!form.title.trim() && !form.content.trim())) return undefined;
    const timer = setTimeout(() => {
      autosaveDraft(id || 'new', form).catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, [currentUser, form, id]);

  const errors = useMemo(() => {
    const next = {};
    if (!form.title.trim()) next.title = 'Blog title is required';
    if (!plainText(form.content)) next.content = 'Blog content is required';
    return { ...next, ...serverErrors };
  }, [form, serverErrors]);

  function updateField(field, value) {
    setServerErrors((current) => ({ ...current, [field]: '' }));
    setForm((current) => ({ ...current, [field]: value }));
  }

  function categoryIsRequired(action) {
    return action === 'published' || action === 'submit';
  }

  function hasSelectedValidCategory() {
    return isPositiveIntegerId(form.category_id) && categories.some((category) => String(category.id) === String(form.category_id));
  }

  function toggleTag(tagId) {
    setForm((current) => {
      const exists = current.tag_ids.includes(tagId);
      return {
        ...current,
        tag_ids: exists
          ? current.tag_ids.filter((idValue) => idValue !== tagId)
          : [...current.tag_ids, tagId],
      };
    });
  }

  async function handleImageFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Choose an image file.', 'error');
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    updateField('image', dataUrl);
  }

  async function handleSubmit(action) {
    if (!currentUser) {
      showToast('Please login to continue', 'error');
      navigate('/login', { replace: true });
      return;
    }

    const nextTouched = { title: true, content: true, category_id: categoryIsRequired(action) };
    const clientErrors = {};
    if (!form.title.trim()) clientErrors.title = 'Blog title is required';
    if (!plainText(form.content)) clientErrors.content = 'Blog content is required';
    if (categoryIsRequired(action) && !form.category_id) clientErrors.category_id = 'Blog category is required';
    else if (categoryIsRequired(action) && loadErrors.categories) {
      clientErrors.category_id = 'Categories could not be loaded. Refresh the page before submitting.';
    }
    else if (form.category_id && !hasSelectedValidCategory()) {
      clientErrors.category_id = 'Please select a valid blog category';
    }

    setTouched(nextTouched);
    setServerErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSaving(true);
    try {
      const status = isWriter ? 'draft' : action;
      const payload = {
        ...form,
        category_id: form.category_id ? Number(form.category_id) : '',
        tag_ids: form.tag_ids.filter(isPositiveIntegerId).map(Number),
        status,
        approval_status: action === 'submit' ? 'pending' : form.approval_status,
      };
      const blog = editing ? await updateBlog(id, payload) : await createBlog(payload);
      if (action === 'submit') await submitBlog(blog.id);
      showToast(action === 'submit' ? 'Blog submitted for review.' : status === 'published' ? 'Blog published.' : 'Draft saved.');
      navigate(isWriter ? '/writer/blogs' : '/dashboard/blogs');
    } catch (err) {
      const fieldError = getApiFieldError(err);
      const message = getApiErrorMessage(err, 'Could not reach API. Your draft was not saved.');
      if (fieldError?.field) {
        setServerErrors((current) => ({ ...current, [fieldError.field]: fieldError.message }));
        setTouched((current) => ({ ...current, [fieldError.field]: true }));
      }
      if (err?.response?.data?.errorType === 'AUTH_ERROR') {
        await logout();
        navigate('/login', { replace: true });
      }
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-shell">
      {isWriter ? <WriterSidebar /> : <Sidebar />}
      <div className="admin-main">
        <Topbar />
        <main className="admin-content">
          <section className="admin-page-heading">
            <div>
              <p>{isWriter ? 'Writer workflow' : 'Publishing workflow'}</p>
              <h1>{editing ? 'Edit Blog' : 'Add Blog'}</h1>
              <span>{isWriter ? 'Write drafts and submit polished articles for admin review.' : 'Write, categorize, preview, and publish from one focused workspace.'}</span>
            </div>
            <button type="button" onClick={() => handleSubmit('draft')} disabled={saving}>
              Save draft
            </button>
          </section>

          <section className="admin-editor-layout">
            <div className="admin-editor-card">
              <label className="admin-field">
                <span>Blog Title</span>
                <input
                  value={form.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  onBlur={() => setTouched((current) => ({ ...current, title: true }))}
                  placeholder="Building a professional blogging workflow"
                />
                {touched.title && errors.title && <small>{errors.title}</small>}
              </label>

              <div className="admin-field-grid">
                <label className="admin-field">
                  <span>Category</span>
                  <select value={form.category_id} onChange={(event) => updateField('category_id', event.target.value)}>
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {loadErrors.categories && <small>{loadErrors.categories}</small>}
                  {touched.category_id && errors.category_id && <small>{errors.category_id}</small>}
                </label>

                <label className="admin-field">
                  <span>Cover Image</span>
                  <div className="admin-upload-field">
                    <input
                      value={form.image}
                      onChange={(event) => updateField('image', event.target.value)}
                      placeholder="Paste image URL"
                    />
                    <input type="file" accept="image/*" onChange={handleImageFile} />
                  </div>
                </label>
              </div>

              <label className="admin-field">
                <span>Tags</span>
                <div className="admin-tag-picker">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      className={form.tag_ids.includes(tag.id) ? 'is-active' : ''}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </button>
                  ))}
                  {loadErrors.tags && <small>{loadErrors.tags}</small>}
                </div>
              </label>

              <label className="admin-field">
                <span>Blog Content</span>
                <RichTextEditor
                  value={form.content}
                  onChange={(value) => updateField('content', value)}
                  onBlur={() => setTouched((current) => ({ ...current, content: true }))}
                />
                {touched.content && errors.content && <small>{errors.content}</small>}
              </label>
            </div>

            <aside className="admin-publish-card">
              <div className="admin-status-pill">Draft mode</div>
              <h2>{isWriter ? 'Review Settings' : 'Publish Settings'}</h2>
              <p>{isWriter ? 'Submitted posts stay hidden until an admin approves them.' : 'Drafts stay hidden from public pages until you publish them.'}</p>

              <div className="admin-publish-actions">
                {isWriter ? (
                  <button type="button" onClick={() => handleSubmit('submit')} disabled={saving}>
                    {saving ? 'Submitting...' : 'Submit for Review'}
                  </button>
                ) : (
                  <button type="button" onClick={() => handleSubmit('published')} disabled={saving}>
                    {saving ? 'Saving...' : 'Publish Blog'}
                  </button>
                )}
                <button type="button" onClick={() => handleSubmit('draft')} disabled={saving}>
                  Save Draft
                </button>
              </div>

              <div className="admin-preview">
                <span>Live Preview</span>
                <h3>{form.title || 'Untitled blog'}</h3>
                <p>{form.content || 'Start typing to preview your article summary.'}</p>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
