import api from './api';

export async function addComment(payload, postIdentifier = payload?.blog_uuid || payload?.uuid) {
  const endpoint = postIdentifier ? `/posts/${postIdentifier}/comments` : '/comments';
  const { data } = await api.post(endpoint, payload);
  return data.comment;
}

export async function getBlogComments(blogId) {
  const { data } = await api.get(`/posts/${blogId}/comments`);
  return data.comments || [];
}

export async function getComments(params = {}) {
  const { data } = await api.get('/comments', { params });
  return data.comments || [];
}

export async function approveComment(id) {
  const { data } = await api.patch(`/comments/${id}/approve`);
  return data.comment;
}

export async function rejectComment(id) {
  const { data } = await api.patch(`/comments/${id}/reject`);
  return data.comment;
}

export async function deleteComment(id) {
  const { data } = await api.delete(`/comments/${id}`);
  return data;
}
