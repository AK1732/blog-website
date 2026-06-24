export function getBlogPublicIdentifier(blog) {
  return blog?.uuid || blog?.slug || blog?.id;
}

export function getBlogPublicPath(blog) {
  return `/blog/${getBlogPublicIdentifier(blog)}`;
}
