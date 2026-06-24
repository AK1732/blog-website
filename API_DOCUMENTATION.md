# Blog Platform API Documentation

Base URL: `/api`

All errors use the centralized JSON shape:

```json
{
  "success": false,
  "statusCode": 400,
  "errorType": "VALIDATION_ERROR",
  "code": "VALIDATION_ERROR",
  "field": "email",
  "message": "valid email is required",
  "path": "/api/auth/login",
  "method": "POST",
  "timestamp": "2026-06-19T00:00:00.000Z"
}
```

Protected endpoints require `Authorization: Bearer <jwt>`.

## Authentication

### Register
Endpoint: `POST /auth/register`

Request body:

```json
{
  "name": "Writer",
  "email": "writer@example.com",
  "password": "password123"
}
```

Response `201`:

```json
{
  "user": {
    "id": 2,
    "name": "Writer",
    "email": "writer@example.com",
    "role": "writer",
    "email_verified": false
  },
  "message": "Registration successful. Please verify your email before login."
}
```

Errors: `400` validation error, `409` duplicate email, `500` server error, `503` database connection error.

### Login
Endpoint: `POST /auth/login`

Request body:

```json
{
  "email": "writer@example.com",
  "password": "password123"
}
```

Response `200`:

```json
{
  "token": "jwt-token",
  "user": {
    "id": 2,
    "name": "Writer",
    "email": "writer@example.com",
    "role": "writer"
  }
}
```

Errors: `400` validation error, `401` invalid account/password/unverified email.

### Logout
Endpoint: `POST /auth/logout`

Response `200`:

```json
{ "message": "Logged out" }
```

Errors: `401` missing/invalid JWT.

## Posts

Public post identifiers use `uuid`. Numeric `id` remains available internally for admin/editor workflows.

### List Posts
Endpoint: `GET /posts`

Query parameters: `page`, `limit`, `q`, `categoryId`, `tagId`, `authorId`, `status`, `approvalStatus`, `featured`, `mine`.

Response `200`:

```json
{
  "blogs": [
    {
      "id": 1,
      "uuid": "0f4a0b95-8a62-4d5f-956d-95a8197c0614",
      "title": "Post title",
      "slug": "post-title",
      "content": "<p>Body</p>",
      "category_id": 1,
      "category_name": "Engineering",
      "author_id": 2,
      "author_name": "Writer",
      "tags": [],
      "status": "published",
      "approval_status": "approved"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 24,
    "totalPages": 2
  }
}
```

### Homepage Posts
Endpoint: `GET /posts/homepage`

Uses the same query and response shape as `GET /posts`, with a Redis homepage cache key.

### Get Post
Endpoint: `GET /posts/:uuid`

Response `200`:

```json
{ "blog": { "id": 1, "uuid": "0f4a0b95-8a62-4d5f-956d-95a8197c0614", "title": "Post title" } }
```

Errors: `404` with code `POST_NOT_FOUND`.

### Create Post
Endpoint: `POST /posts`

Request body:

```json
{
  "title": "Post title",
  "content": "<p>Body</p>",
  "image": "https://example.com/cover.jpg",
  "category_id": 1,
  "tag_ids": [1, 2],
  "status": "draft"
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Blog saved successfully",
  "blog": { "id": 1, "uuid": "0f4a0b95-8a62-4d5f-956d-95a8197c0614" }
}
```

Errors: `400` validation error, `401` unauthorized, `403` permission error.

### Update Post
Endpoint: `PUT /posts/:uuid`

Request body: same fields as create; all fields are optional.

Response `200`:

```json
{
  "success": true,
  "message": "Blog saved successfully",
  "blog": { "id": 1, "uuid": "0f4a0b95-8a62-4d5f-956d-95a8197c0614" }
}
```

Errors: `403` if user cannot edit the post, `404` with `POST_NOT_FOUND`.

### Delete Post
Endpoint: `DELETE /posts/:uuid`

Response `200`:

```json
{ "message": "Blog deleted" }
```

Errors: `403` if user cannot delete the post, `404` with `POST_NOT_FOUND`.

## Drafts

Drafts are stored in MongoDB.

### List Drafts
Endpoint: `GET /drafts`

Response `200`:

```json
{ "drafts": [{ "id": "mongo-object-id", "title": "Draft title" }] }
```

### Save Draft
Endpoint: `POST /drafts`

Request body:

```json
{
  "title": "Draft title",
  "content": "<p>Body</p>",
  "image": "",
  "category_id": 1,
  "tag_ids": [1]
}
```

Response `201`:

```json
{ "draft": { "id": "mongo-object-id", "title": "Draft title" } }
```

### Update Draft
Endpoint: `PUT /drafts/:id`

Response `200`:

```json
{ "draft": { "id": "mongo-object-id", "title": "Updated title" } }
```

### Delete Draft
Endpoint: `DELETE /drafts/:id`

Response `200`:

```json
{ "message": "Draft deleted" }
```

### Publish Draft
Endpoint: `POST /drafts/:id/publish`

Authorization: writer or admin. Admin drafts become `published/approved`; writer drafts are moved to PostgreSQL as `draft/pending` for the existing review workflow. The SQL post and all tag links are written in one transaction, then the MongoDB draft is removed.

Response `201`:

```json
{ "blogId": 1, "blog": { "id": 1, "status": "draft", "approval_status": "pending" } }
```

Errors: `404` with `DRAFT_NOT_FOUND`, `503` if MongoDB logging/drafts are not configured.

Publishing also returns `400` when title, content, category, or tag IDs are missing or invalid.

## Comments

### List Post Comments
Endpoint: `GET /posts/:uuid/comments`

Response `200`:

```json
{ "comments": [{ "id": 1, "blog_id": 1, "name": "Reader", "comment": "Nice post" }] }
```

### Create Comment
Endpoint: `POST /posts/:uuid/comments`

Request body:

```json
{
  "name": "Reader",
  "email": "reader@example.com",
  "comment": "Nice post"
}
```

Response `201`:

```json
{ "comment": { "id": 1, "status": "pending" } }
```

Errors: `400` validation error, `404` with `POST_NOT_FOUND`.

### Delete Comment
Endpoint: `DELETE /comments/:id`

Authorization: authenticated user. Admin can delete any comment; non-admin users can delete only comments created while authenticated by that user.

Response `200`:

```json
{ "message": "Comment deleted" }
```

Errors: `403` permission error, `404` with `COMMENT_NOT_FOUND`.

## Categories

### List Categories
Endpoint: `GET /categories`

Response `200`:

```json
{ "categories": [{ "id": 1, "name": "Engineering" }] }
```

### Create Category
Endpoint: `POST /categories`

Authorization: admin only. Category listing remains public because the existing public editor and blog filters consume it.

Request body:

```json
{ "name": "Engineering" }
```

Response `201`:

```json
{ "category": { "id": 1, "name": "Engineering" } }
```

### Update Category
Endpoint: `PUT /categories/:id`

Request body:

```json
{ "name": "Product" }
```

Response `200`:

```json
{ "category": { "id": 1, "name": "Product" } }
```

### Delete Category
Endpoint: `DELETE /categories/:id`

Response `200`:

```json
{ "message": "Category deleted" }
```

## Tags

### List Tags
Endpoint: `GET /tags`

Response `200`:

```json
{ "tags": [{ "id": 1, "name": "React", "slug": "react" }] }
```

### Create Tag
Endpoint: `POST /tags`

Authorization: admin only. Blog create/update accepts `tag_ids` as an array of existing positive integer tag IDs. Filter posts with `GET /posts?tagId=1` (the `/blogs?tagId=1` compatibility alias is also available).

Request body:

```json
{ "name": "React" }
```

Response `201`:

```json
{ "tag": { "id": 1, "name": "React", "slug": "react" } }
```

## Workflow Notes

- Register: validates input, hashes password with bcrypt, saves PostgreSQL user, logs MongoDB activity.
- Login: validates credentials, verifies bcrypt hash, returns JWT, logs MongoDB login/activity events.
- Post create/update/delete/publish: validates payload/ownership, writes PostgreSQL, logs MongoDB activity where applicable, invalidates Redis blog/detail/homepage caches.
- Draft save/publish: stores drafts in MongoDB, publishes to PostgreSQL, logs MongoDB activity, invalidates Redis blog caches.
- Comment create/delete: writes PostgreSQL, logs MongoDB activity, invalidates Redis blog/detail/homepage caches.
- Redis cache middleware logs cache hit/miss and bypasses safely when Redis is unavailable.

## Postman Requests

Create a Postman environment with `baseUrl` (for example `http://localhost:5000/api`), `writerToken`, `adminToken`, `draftId`, `postId`, `commentId`, and `categoryId`. Set `Authorization` to `Bearer {{writerToken}}` or `Bearer {{adminToken}}` as noted below.

```http
GET {{baseUrl}}/drafts
Authorization: Bearer {{writerToken}}

POST {{baseUrl}}/drafts
Authorization: Bearer {{writerToken}}
Content-Type: application/json

{"title":"Postman draft","content":"<p>Draft body</p>","category_id":{{categoryId}},"tag_ids":[]}

PUT {{baseUrl}}/drafts/{{draftId}}
Authorization: Bearer {{writerToken}}
Content-Type: application/json

{"title":"Updated Postman draft"}

POST {{baseUrl}}/drafts/{{draftId}}/publish
Authorization: Bearer {{writerToken}}

DELETE {{baseUrl}}/drafts/{{draftId}}
Authorization: Bearer {{writerToken}}
```

```http
GET {{baseUrl}}/posts/{{postId}}/comments

POST {{baseUrl}}/posts/{{postId}}/comments
Content-Type: application/json

{"name":"Reader","email":"reader@example.com","comment":"Useful article"}

DELETE {{baseUrl}}/comments/{{commentId}}
Authorization: Bearer {{writerToken}}
```

```http
GET {{baseUrl}}/categories

POST {{baseUrl}}/categories
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{"name":"Engineering"}

PUT {{baseUrl}}/categories/{{categoryId}}
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{"name":"Product Engineering"}

DELETE {{baseUrl}}/categories/{{categoryId}}
Authorization: Bearer {{adminToken}}
```

```http
GET {{baseUrl}}/tags

POST {{baseUrl}}/tags
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{"name":"React"}

GET {{baseUrl}}/posts?tagId=1
```
