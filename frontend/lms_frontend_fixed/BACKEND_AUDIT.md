# Backend fixes applied

This frontend is matched to the corrected backend.

- Public registration creates a student only and requires phone.
- Student accounts are linked to a Student record automatically.
- Student profile, enrollment, attendance, grade and invoice reads are scoped to the logged-in student.
- Notifications are scoped to the current user/student.
- Invoice PDFs are protected at `GET /api/invoices/:id/pdf`.
- Socket.IO authenticates the JWT and derives user/role rooms server-side.
- Invoice notification Telegram fields exist in the Invoice schema.
- Admin password updates use the User save hook so passwords are hashed.
- Invoice updates use an allow-list of editable fields.
- Class-session routes require authentication and role checks in development.
- Missing-record responses are normalized for common CRUD operations.

The backend source was statically checked with Node's syntax checker and the Express app loads successfully. A live database/integration test still requires the user's MongoDB and external service credentials.
