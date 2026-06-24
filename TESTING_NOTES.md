# Blog Platform Verification Notes

These checks were run against the local dev server on `http://127.0.0.1:5000`.

- Publishing blog successfully: `POST /api/blogs` with a valid admin JWT, title, content, author from token, and existing category returned `201` with `Blog published successfully`.
- Missing title error: `POST /api/blogs` with `status: "published"` and an empty title returned `400`, `VALIDATION_ERROR`, `field: "title"`, and `Blog title is required`.
- Missing content error: `POST /api/blogs` with `status: "published"` and empty content returned `400`, `VALIDATION_ERROR`, `field: "content"`, and `Blog content is required`.
- Missing category error: `POST /api/blogs` with `status: "published"` and no category returned `400`, `VALIDATION_ERROR`, `field: "category_id"`, and `Blog category is required`.
- Invalid category error: `POST /api/blogs` with a non-existent category returned `400`, `VALIDATION_ERROR`, `field: "category_id"`, and `Please select a valid blog category`.
- Invalid login token error: `POST /api/blogs` with `Authorization: Bearer invalid-token` returned `401`, `AUTH_ERROR`, and `Invalid session. Please login again`.
- Password saved as bcrypt hash: existing `users.password` values were checked locally; all current rows start with a bcrypt `$2` hash prefix and no plaintext passwords were found.
