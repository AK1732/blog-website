# Full-Stack Blogging Website

Professional blogging platform with a React/Vite frontend, Express API, JWT admin auth, and PostgreSQL using raw SQL through `pg`.

## Folder Structure

```text
blogging-ui/
  src/
    components/
    pages/
    layouts/
    services/
    assets/
    routes/
server/
  config/
  controllers/
  middleware/
  routes/
  database/
  utils/
  index.js
  .env.example
```

## Backend Setup

```bash
cd server
copy .env.example .env
npm install
```

Create a PostgreSQL database, then run the schema:

```bash
psql -U postgres -d blogging_website -f database/schema.sql
```

Start the API:

```bash
npm run dev
```

The API runs on `http://localhost:5000`.

## Frontend Setup

```bash
cd blogging-ui
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

## Environment Variables

Backend variables live in `server/.env`:

```text
PORT=5000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=blogging_website
```

Frontend can optionally use:

```text
VITE_API_BASE_URL=http://localhost:5000/api
```

## API Endpoints

Auth: `POST /api/auth/register`, `POST /api/auth/login`

Blogs: `GET /api/blogs`, `GET /api/blogs/:id`, `POST /api/blogs`, `PUT /api/blogs/:id`, `DELETE /api/blogs/:id`, `PATCH /api/blogs/:id/publish`

Categories: `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/:id`, `DELETE /api/categories/:id`

Comments: `GET /api/comments`, `GET /api/comments/blog/:blogId`, `POST /api/comments`, `PATCH /api/comments/:id/approve`, `PATCH /api/comments/:id/reject`, `DELETE /api/comments/:id`

Analytics: `GET /api/dashboard/stats`

## Notes

- Uses PostgreSQL only. No MongoDB, Mongoose, or Prisma.
- All database operations use SQL queries through `pg`.
- Admin routes require a JWT token stored in localStorage.
