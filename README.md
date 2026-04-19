# Employee Dashboard (HTML/CSS/JS + SQLite CRUD)

A modern employee dashboard with a responsive grid and full CRUD support.

## Tech Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js + Express
- Database: SQLite (`employees.db` locally, `/var/data/employees.db` on Render)

## Features

- Grid columns: `Name`, `Phone Number`, `Email`, `Office`, `Position`
- Inline row editing with `Edit`, `Save`, and `Cancel`
- Persist row updates to the database
- Add employee via modal form
- Delete employee records
- Search/filter across all displayed fields
- Seed data on first run

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start server:

```bash
npm start
```

3. Open:

- `http://localhost:3000`

## API Endpoints

- `GET /api/employees` - list employees
- `POST /api/employees` - create employee
- `PUT /api/employees/:id` - update employee
- `DELETE /api/employees/:id` - delete employee

## Deploy to Render

This repo is pre-configured for Render with [`render.yaml`](./render.yaml).

1. Push this project to GitHub.
2. In Render, click `New +` -> `Blueprint`.
3. Connect your GitHub repo and select this project.
4. Render will create:
   - A web service (`employee-dashboard`)
   - A persistent disk mounted at `/var/data`
   - `DATABASE_PATH=/var/data/employees.db`
5. After deploy completes, open the Render public URL.

### Notes

- First startup will auto-seed at least 300 test records.
- Because a Render disk is attached, your SQLite data persists across restarts/redeploys.
