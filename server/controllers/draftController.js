import { ObjectId } from 'mongodb';

import { query, withTransaction } from '../config/database.js';
import { getMongoLogDb, isMongoLoggingConfigured } from '../config/mongo.js';
import { invalidateBlogCache } from '../middleware/cache.js';
import { loggerService } from '../services/loggerService.js';
import { databaseConnectionError, draftNotFoundError, permissionError, validationError } from '../utils/appError.js';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 220) || 'draft';
}

function ensureMongoConfigured() {
  if (!isMongoLoggingConfigured()) {
    throw databaseConnectionError('MongoDB is not configured for drafts');
  }
  return true;
}

function cleanOptionalId(value, field) {
  if (value === undefined || value === null || value === '') return null;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw validationError(`${field} must be a positive integer`, field);
  return id;
}

function cleanTagIds(value) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw validationError('tag_ids must be an array', 'tag_ids');
  const ids = value.map((id) => cleanOptionalId(id, 'tag_ids'));
  if (ids.some((id) => id === null)) throw validationError('tag_ids must contain positive integers', 'tag_ids');
  return [...new Set(ids)];
}

function cleanDraftInput(body = {}, { partial = false } = {}) {
  const input = {};
  if (!partial || body.title !== undefined) {
    const title = String(body.title ?? '').trim();
    if (title.length > 255) throw validationError('title must be 255 characters or fewer', 'title');
    input.title = title || 'Untitled draft';
  }
  if (!partial || body.content !== undefined) input.content = String(body.content ?? '');
  if (!partial || body.image !== undefined) input.image = String(body.image ?? '');
  if (!partial || body.category_id !== undefined) input.category_id = cleanOptionalId(body.category_id, 'category_id');
  if (!partial || body.tag_ids !== undefined) input.tag_ids = cleanTagIds(body.tag_ids) || [];
  return input;
}

async function validateRelations(categoryId, tagIds = [], client = { query }) {
  if (categoryId) {
    const category = await client.query('SELECT id FROM categories WHERE id = $1', [categoryId]);
    if (!category.rowCount) throw validationError('Please select a valid blog category', 'category_id');
  }
  if (tagIds.length) {
    const tags = await client.query('SELECT id FROM tags WHERE id = ANY($1::int[])', [tagIds]);
    if (tags.rowCount !== tagIds.length) throw validationError('One or more tag_ids are invalid', 'tag_ids');
  }
}

function assertDraftOwner(req, draft, action) {
  if (req.user.role !== 'admin' && Number(draft.authorId) !== Number(req.user.id)) {
    throw permissionError(`You can only ${action} your own drafts`);
  }
}

function serializeDraft(draft) {
  return draft ? { ...draft, id: String(draft._id), _id: undefined } : null;
}

async function draftsCollection() {
  const db = await getMongoLogDb();
  return db.collection('draft_posts');
}

async function autosaveCollection() {
  const db = await getMongoLogDb();
  return db.collection('editor_autosave_history');
}

function getDraftObjectId(id) {
  if (!ObjectId.isValid(id)) {
    throw draftNotFoundError();
  }
  return new ObjectId(id);
}

export async function getDrafts(req, res) {
  ensureMongoConfigured();
  const filter = req.user.role === 'admin' ? {} : { authorId: req.user.id };
  const rows = await (await draftsCollection()).find(filter).sort({ updatedAt: -1 }).toArray();
  return res.json({ drafts: rows.map(serializeDraft) });
}

export async function getDraftById(req, res) {
  ensureMongoConfigured();
  const draft = await (await draftsCollection()).findOne({ _id: getDraftObjectId(req.params.id) });
  if (!draft) throw draftNotFoundError();
  assertDraftOwner(req, draft, 'access');
  return res.json({ draft: serializeDraft(draft) });
}

export async function saveDraft(req, res) {
  ensureMongoConfigured();
  const now = new Date();
  const input = cleanDraftInput(req.body);
  const draft = {
    ...input,
    authorId: req.user.id,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
  const result = await (await draftsCollection()).insertOne(draft);
  await loggerService.logActivity({
    userId: req.user.id,
    action: 'DRAFT_SAVE',
    details: { draftId: String(result.insertedId) },
    ipAddress: req.ip,
  });
  return res.status(201).json({ draft: serializeDraft({ ...draft, _id: result.insertedId }) });
}

export async function updateDraft(req, res) {
  ensureMongoConfigured();
  const collection = await draftsCollection();
  const current = await collection.findOne({ _id: getDraftObjectId(req.params.id) });
  if (!current) throw draftNotFoundError();
  assertDraftOwner(req, current, 'edit');

  const update = {
    ...cleanDraftInput(req.body, { partial: true }),
    updatedAt: new Date(),
  };
  await collection.updateOne({ _id: current._id }, { $set: update });
  const draft = await collection.findOne({ _id: current._id });
  await loggerService.logActivity({
    userId: req.user.id,
    action: 'DRAFT_UPDATE',
    details: { draftId: String(current._id) },
    ipAddress: req.ip,
  });
  return res.json({ draft: serializeDraft(draft) });
}

export async function deleteDraft(req, res) {
  ensureMongoConfigured();
  const collection = await draftsCollection();
  const current = await collection.findOne({ _id: getDraftObjectId(req.params.id) });
  if (!current) throw draftNotFoundError();
  assertDraftOwner(req, current, 'delete');
  await collection.deleteOne({ _id: current._id });
  await loggerService.logActivity({
    userId: req.user.id,
    action: 'DRAFT_DELETE',
    details: { draftId: String(current._id) },
    ipAddress: req.ip,
  });
  return res.json({ message: 'Draft deleted' });
}

export async function autosaveDraft(req, res) {
  ensureMongoConfigured();
  if (req.params.id !== 'session') {
    const draft = await (await draftsCollection()).findOne({ _id: getDraftObjectId(req.params.id) });
    if (!draft) throw draftNotFoundError();
    assertDraftOwner(req, draft, 'edit');
  }
  const input = cleanDraftInput(req.body);
  const version = {
    draftId: req.params.id || null,
    authorId: req.user.id,
    ...input,
    savedAt: new Date(),
  };
  const result = await (await autosaveCollection()).insertOne(version);
  return res.status(201).json({ autosave: { id: String(result.insertedId), ...version } });
}

export async function getAutosaveHistory(req, res) {
  ensureMongoConfigured();
  if (req.params.id !== 'session') {
    const draft = await (await draftsCollection()).findOne({ _id: getDraftObjectId(req.params.id) });
    if (!draft) throw draftNotFoundError();
    assertDraftOwner(req, draft, 'access');
  }
  const filter = { draftId: req.params.id };
  if (req.user.role !== 'admin') filter.authorId = req.user.id;
  const rows = await (await autosaveCollection())
    .find(filter)
    .sort({ savedAt: -1 })
    .limit(20)
    .toArray();
  return res.json({ versions: rows.map((row) => ({ ...row, id: String(row._id), _id: undefined })) });
}

export async function publishDraft(req, res) {
  ensureMongoConfigured();
  const collection = await draftsCollection();
  const draft = await collection.findOne({ _id: getDraftObjectId(req.params.id) });
  if (!draft) throw draftNotFoundError();
  assertDraftOwner(req, draft, 'publish');

  const title = String(draft.title || '').trim();
  const content = String(draft.content || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  if (!title || title === 'Untitled draft') throw validationError('Blog title is required before publishing', 'title');
  if (!content) throw validationError('Blog content is required before publishing', 'content');
  if (!draft.category_id) throw validationError('Blog category is required before publishing', 'category_id');
  const categoryId = cleanOptionalId(draft.category_id, 'category_id');
  const tagIds = cleanTagIds(draft.tag_ids || []);

  const blog = await withTransaction(async (client) => {
    await validateRelations(categoryId, tagIds, client);
    const isAdmin = req.user.role === 'admin';
    const inserted = await client.query(
      `INSERT INTO blogs (title, slug, content, image, category_id, author_id, status, approval_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, uuid, status, approval_status`,
      [title, `${slugify(title)}-${Date.now()}`, draft.content, draft.image || '', categoryId, draft.authorId,
        isAdmin ? 'published' : 'draft', isAdmin ? 'approved' : 'pending']
    );
    if (tagIds.length) {
      await client.query(
        `INSERT INTO blog_tags (blog_id, tag_id)
         SELECT $1, UNNEST($2::int[])`,
        [inserted.rows[0].id, tagIds]
      );
    }
    return inserted.rows[0];
  });

  await collection.deleteOne({ _id: draft._id });
  await invalidateBlogCache();
  await loggerService.logActivity({
    userId: req.user.id,
    action: 'DRAFT_PUBLISHED',
    details: { draftId: String(draft._id), blogId: blog.id, status: blog.status },
    ipAddress: req.ip,
  });
  return res.status(201).json({ blogId: blog.id, blog });
}
