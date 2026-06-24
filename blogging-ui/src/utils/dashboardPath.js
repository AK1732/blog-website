export function getDashboardPath(role) {
  return role === 'writer' ? '/writer' : '/dashboard';
}

export function getCreatePostPath(role) {
  return role === 'writer' ? '/writer/blogs/add' : '/dashboard/blogs/add';
}
