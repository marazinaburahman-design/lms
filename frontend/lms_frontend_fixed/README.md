# LMS React Frontend

React + Vite + Tailwind CSS + Framer Motion frontend for the LMS backend in the sibling `backend` folder.

## Run

```bash
npm install
npm run dev
```

Create `.env` from `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Important workflow

- Create a Course first.
- Create a Teacher if needed.
- Create a Batch with a date range and schedule such as `Mon, Wed, Fri - 7:05 AM`.
- The backend automatically creates Class Sessions from the Batch.
- Open **Class Sessions** in the sidebar to see generated sessions and Zoom links.
- If Zoom credentials are configured on the backend, the backend creates the Zoom meeting automatically.
- If Telegram is configured, the scheduler sends the class link to the course/batch Telegram group at the configured lead time.
- Enrolling a student triggers the existing Telegram course-group membership flow.

The Batch form intentionally does not ask the user to manually enter generated Zoom or Telegram IDs. Those values belong to the backend automation.
