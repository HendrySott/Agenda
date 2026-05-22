# Weekly Class Schedule Dashboard

A full-stack web application for managing weekly class/appointment schedules for small businesses. Originally based on a [Figma Community design](https://www.figma.com/design/nIyi8jXsRzLbEwallUlAKG/Weekly-Class-Schedule-Dashboard--Community-).

## Features

- **Dashboard** — Weekly and monthly views of scheduled appointments with drag-and-drop support
- **Employee Management** — Add, edit, delete employees with custom schedules, working days, and color coding
- **Client Management** — Add, edit, delete clients and assign them to employees
- **Appointments** — Create, reschedule, and remove appointments with employee/client assignment, notes, and Zoom links
- **Authentication** — Register/login with JWT-based auth
- **Business Config** — Configure business info, notification email, and email templates
- **Calendar Sync** — Google and Outlook calendar integration with OAuth and event sync
- **Email Templates** — Customizable email notifications triggered by appointment timing

## Tech Stack

| Layer    | Technology                                                                 |
| -------- | -------------------------------------------------------------------------- |
| Frontend | React 18, TypeScript, Vite, React Router, Tailwind CSS v4, MUI, Radix UI   |
| Backend  | Express 5, better-sqlite3, JWT, bcryptjs                                   |
| UI       | shadcn/ui components, Lucide icons, Recharts, react-dnd, date-fns          |

## Getting Started

```bash
npm install
npm run dev          # start Vite dev server (frontend on :5173)
npm run server      # start Express API server (backend on :3001)
npm run dev:all     # start both concurrently
npm run build       # build for production
```

The Express server also serves the built frontend from `dist/` when available.

### Environment variables

Create a `.env` file in the project root with the OAuth credentials you want to use:

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/google/callback
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
OUTLOOK_REDIRECT_URI=http://localhost:3001/api/calendar/outlook/callback
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-jwt-secret
```

The server loads environment variables automatically using `dotenv`.

## Project Structure

```
src/
  app/
    App.tsx              — Root app with routing and state management
    pages/               — Dashboard, Employees, Clients, Config, Auth pages
    components/          — CalendarGrid, modals, Header, Sidebar, shadcn/ui primitives
    services/api.ts      — API client
    context/AuthContext   — Auth state provider
    types/index.ts       — TypeScript interfaces
server/
  index.js               — Express entry point
  db.js                  — SQLite schema and connection
  routes/                — Auth and CRUD API routes
  middleware/auth.js     — JWT middleware
```

## License

MIT
