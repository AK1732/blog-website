import { useCallback, useEffect, useState } from 'react';

import Sidebar from '../../components/dashboard/Sidebar';
import Topbar from '../../components/dashboard/Topbar';
import { useToast } from '../../components/useToast';
import {
  approveComment,
  deleteComment,
  getComments,
  rejectComment,
} from '../../services/commentService';
import { getApiErrorMessage } from '../../utils/apiError';
import '../../styles/admin.css';

export default function CommentsAdmin() {
  const { showToast } = useToast();
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async function load() {
    setLoading(true);
    try {
      setComments(await getComments({ status: status || undefined }));
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to load comments'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function mutate(action, id, message) {
    try {
      await action(id);
      showToast(message);
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Comment action failed'), 'error');
    }
  }

  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-main">
        <Topbar />
        <main className="admin-content">
          <section className="admin-page-heading">
            <div>
              <p>Moderation queue</p>
              <h1>Comments</h1>
              <span>Approve, reject, or delete reader comments without visual clutter.</span>
            </div>
          </section>

          <section className="admin-table-card">
            <div className="admin-controls single">
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="">All</option>
              </select>
            </div>

            <div className="admin-post-list">
              {comments.map((comment) => (
                <article key={comment.id}>
                  <div>
                    <h3>{comment.name}</h3>
                    <p>{comment.comment}</p>
                    <p>{comment.blog_title || `Blog ${comment.blog_id}`} / {comment.email}</p>
                  </div>
                  <span>{comment.status}</span>
                  <div className="admin-row-actions">
                    {comment.status !== 'approved' && <button onClick={() => mutate(approveComment, comment.id, 'Comment approved.')}>Approve</button>}
                    {comment.status !== 'rejected' && <button onClick={() => mutate(rejectComment, comment.id, 'Comment rejected.')}>Reject</button>}
                    <button onClick={() => mutate(deleteComment, comment.id, 'Comment deleted.')}>Delete</button>
                  </div>
                </article>
              ))}
              {!comments.length && !loading && <div className="admin-empty">No comments found.</div>}
              {loading && <div className="admin-empty">Loading comments...</div>}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
