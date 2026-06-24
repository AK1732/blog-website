# Full-Stack Blog Platform

A role-based publishing platform built with React, Express, PostgreSQL, MongoDB, Redis, JWT, bcryptjs, and Docker. PostgreSQL is the source of truth for users, blogs, categories, tags, comments, analytics counters, and public content. MongoDB is used for draft posts, editor autosave history, and activity logs. Redis is used as an optional cache layer.

## Features

- JWT authentication with bcryptjs password hashing
- Email verification and forgot/reset password token flows
- Admin and writer dashboards with protected routes
- Blog draft, review, approval, rejection, publish, unpublish, and featured workflows
- MongoDB draft posts and editor autosave history
- Activity logging for login, logout, registration, posts, drafts, and profile updates
- Rich text editor with bold, italic, headings, lists, links, code blocks, and images
- Cover image URL/upload support stored in PostgreSQL
- Writer profile management with bio and profile image
- Categories and tags, including tag filters and multi-tag blog assignment
- Search by title, content, author, and category
- Pagination for blog lists
- View-count tracking and most-viewed analytics
- Redis caching for blog lists, single posts, categories, tags, featured posts, trending posts, and analytics
- Responsive UI, loading states, error states, success messages, 404 page, and role-based access control

## Tech Stack

- Frontend: React, Vite, React Router, Axios
- Backend: Express.js, JWT, bcryptjs
- SQL database: PostgreSQL via `pg`
- Document database: MongoDB native driver
- Cache: Redis via `redis`
- Runtime: Docker Compose

## Environment Variables

Use `.env.example` as the template.

```text
PORT=5000
HOST=0.0.0.0
FRONTEND_PORT=5173
CORS_ORIGIN=http://localhost:5173
APP_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=blogging_website

MONGODB_URI=mongodb://localhost:27017
MONGODB_LOG_DB_NAME=blogging_logs
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000

REDIS_URL=redis://localhost:6379
REDIS_CONNECT_TIMEOUT_MS=1000

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d

VITE_API_URL=http://localhost:5000/api
```

## Local Development

Backend:

```bash
cd server
npm install
npm run dev
```

Frontend:

```bash
cd blogging-ui
npm install
npm run dev
```

App: `http://localhost:5173`

API: `http://localhost:5000`

## Docker Setup

Run the whole application:

```bash
docker compose up --build
```

Services:

- `frontend`: React app
- `backend`: Express API
- `postgres`: PostgreSQL database
- `mongodb`: drafts, autosave history, activity logs
- `redis`: cache

## PostgreSQL Usage

PostgreSQL stores core application data:

- users
- blogs
- categories
- tags
- blog_tags
- comments
- featured flags
- view counts
- verification and reset tokens

Schema files:

- `server/database/schema.sql`
- `server/db/schema.sql`
- `server/db/migrations/001_blog_platform_features.sql`

## MongoDB Usage

MongoDB stores non-primary app data:

- `draft_posts`
- `editor_autosave_history`
- `activity_logs`
- `login_logs`
- `blog_logs`

The app continues running if MongoDB logging is unavailable, except Mongo draft endpoints require MongoDB configuration.

## Redis Usage

Redis caches read-heavy endpoints. PostgreSQL remains the source of truth.

Cached data:

- blog list: 5 minutes
- single post: 10 minutes
- categories: 30 minutes
- tags: 30 minutes
- featured posts: 5 minutes
- trending posts: 5 minutes
- analytics: 5 minutes

The API logs `Cache Hit` and `Cache Miss`. If Redis is unavailable, requests continue using PostgreSQL.

## API Documentation

Auth:

- `POST /api/auth/register`
- `GET /api/auth/verify-email/:token`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Blogs:

- `GET /api/blogs?page=1&limit=12&q=&categoryId=&authorId=&tagId=`
- `GET /api/blogs/:id`
- `GET /api/blogs/featured`
- `GET /api/blogs/trending`
- `POST /api/blogs`
- `PUT /api/blogs/:id`
- `DELETE /api/blogs/:id`
- `PATCH /api/blogs/:id/submit`
- `PATCH /api/blogs/:id/publish`
- `PATCH /api/blogs/:id/unpublish`
- `PATCH /api/blogs/:id/approve`
- `PATCH /api/blogs/:id/reject`
- `PATCH /api/blogs/:id/featured`

Drafts:

- `GET /api/drafts`
- `POST /api/drafts`
- `GET /api/drafts/:id`
- `PUT /api/drafts/:id`
- `DELETE /api/drafts/:id`
- `POST /api/drafts/:id/publish`
- `POST /api/drafts/:id/autosave`
- `GET /api/drafts/:id/autosave`

Categories:

- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

Tags:

- `GET /api/tags`
- `POST /api/tags`

Comments:

- `POST /api/comments`
- `GET /api/comments/blog/:blogId`
- `GET /api/comments`
- `PATCH /api/comments/:id/approve`
- `PATCH /api/comments/:id/reject`
- `DELETE /api/comments/:id`

Users:

- `GET /api/users/profile`
- `PUT /api/users/profile`
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

Analytics:

- `GET /api/dashboard/stats`
- `GET /api/writer/dashboard/stats`

## Screenshots

Add screenshots here:

- Home page
- Articles page
- Blog detail page
- Admin dashboard
- Writer dashboard
- Blog editor
