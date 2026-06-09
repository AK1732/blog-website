import { apiClient } from './client';

export async function fetchCommentsForBlog(blogId) {
  const res = await apiClient.get(`/blogs/${blogId}/comments`);
  return res.data; // { comments: [] }
}

export async function addCommentToBlog(blogId, payload) {
  const res = await apiClient.post(`/blogs/${blogId}/comments`, payload);
  return res.data; // { comment }
}

export async function fetchAllCommentsAdmin({ status } = {}) {
  const res = await apiClient.get('/comments', { params: { status } });
  return res.data; // { comments: [] }
}

export async function approveOrRejectComment(commentId, action) {
  const res = await apiClient.put(`/comments/${commentId}/approve`, { action });
  return res.data; // { comment }
}

export async function deleteCommentAdmin(commentId) {
  const res = await apiClient.delete(`/comments/${commentId}`);
  return res.data; // { message }
}

