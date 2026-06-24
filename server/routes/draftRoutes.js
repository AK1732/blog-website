import { Router } from 'express';

import {
  autosaveDraft,
  deleteDraft,
  getAutosaveHistory,
  getDraftById,
  getDrafts,
  publishDraft,
  saveDraft,
  updateDraft,
} from '../controllers/draftController.js';
import { authenticateUser, requireWriter } from '../middleware/auth.js';

const router = Router();

router.get('/drafts', authenticateUser, requireWriter, getDrafts);
router.post('/drafts', authenticateUser, requireWriter, saveDraft);
router.get('/drafts/:id', authenticateUser, requireWriter, getDraftById);
router.put('/drafts/:id', authenticateUser, requireWriter, updateDraft);
router.delete('/drafts/:id', authenticateUser, requireWriter, deleteDraft);
router.post('/drafts/:id/publish', authenticateUser, requireWriter, publishDraft);
router.post('/drafts/:id/autosave', authenticateUser, requireWriter, autosaveDraft);
router.get('/drafts/:id/autosave', authenticateUser, requireWriter, getAutosaveHistory);

export default router;
