# LMS Full Stack - Connected Backend + React Frontend

This package contains the corrected Node.js/Express/Mongoose backend and matching React/Tailwind/Framer Motion frontend.

## Folders

- `backend/` - Node.js + Express + MongoDB API, Telegram automation, Zoom automation, class-session scheduler.
- `frontend/` - React + Tailwind CSS + Framer Motion UI.

## Start backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Linux/macOS:

```bash
cp .env.example .env
```

Set `MONGO_URI` and `JWT_SECRET` at minimum. Configure Zoom and Telegram credentials if you want the automated class-link workflow.

## Start frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend `.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Batch -> Class Session -> Zoom -> Telegram

Creating a Batch now automatically creates its ClassSession records. The Class Sessions page reads those records. Zoom meetings are generated when Zoom Server-to-Server OAuth credentials are configured. The scheduler checks every minute and sends the Zoom link to Telegram at the configured lead time.

See `backend/CLASS_SESSION_AUTOMATION.md` for details.
