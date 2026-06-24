import { apiClient } from './client';

export async function fetchCommentsForBlog(blogId) {
  const res = await apiClient.get(`/posts/${blogId}/comments`);
  return res.data; // { comments: [] }
}

export async function addCommentToBlog(blogId, payload) {
  const res = await apiClient.post(`/posts/${blogId}/comments`, payload);
  return res.data; // { comment }
}

export async function fetchAllCommentsAdmin({ status } = {}) {
  const res = await apiClient.get('/comments', { params: { status } });
  return res.data; // { comments: [] }
}

export async function approveOrRejectComment(commentId, action) {
  const endpoint = action === 'reject' ? `/comments/${commentId}/reject` : `/comments/${commentId}/approve`;
  const res = await apiClient.patch(endpoint);
  return res.data; // { comment }
}

export async function deleteCommentAdmin(commentId) {
  const res = await apiClient.delete(`/comments/${commentId}`);
  return res.data; // { message }
}

