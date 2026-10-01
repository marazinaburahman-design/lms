# LMS Backend Fixes

This package is the corrected version of the supplied Node.js + Express + Mongoose LMS backend.

## Fixed

- Public registration no longer accepts a role from the client.
- Public registration creates a `student` User and a linked Student record.
- Registration requires name, email, phone and password.
- Failed Student creation rolls back the newly created User.
- Student profile access is restricted to the logged-in student's own record.
- Student enrollments are restricted to the logged-in student's own enrollments.
- Student attendance and grades are automatically scoped to the logged-in student.
- Student invoices are automatically scoped to the logged-in student.
- Invoice detail, preview and PDF access enforce student ownership.
- Invoice PDFs are no longer publicly exposed through `/invoices/*` static files.
- Notification list/read/read-all operations are scoped to the current user/student.
- Student invoice approval/rejection notifications are linked to the student's User when available.
- Socket.IO now authenticates JWTs and derives the user/role rooms server-side.
- Invoice notification schema now includes Telegram fields used by the controller.
- Admin user password changes go through the User `save` hook so bcrypt hashing still runs.
- User update fields are allow-listed.
- Invoice update fields are allow-listed so workflow/status fields cannot be overwritten by clients.
- Invoice paid amount cannot exceed the calculated invoice total.
- Missing CRUD records return 404 instead of successful null responses.
- Development class-session routes now require authentication and role authorization.
- Generic CRUD creation automatically fills `createdBy`, `markedBy`, and `gradedBy` when those schema fields exist.
- Student-specific dashboard summary is returned for student accounts.

## Matching frontend changes

The matching frontend package uses:

- `POST /api/auth/register` with `name`, `email`, `phone`, `password`.
- JWT authentication for Socket.IO.
- `GET /api/invoices/:id/pdf` for protected invoice PDF access.
- Student read-only invoice access.

## Verification performed

- All JavaScript files under `src/` and `scripts/` pass `node --check`.
- The Express application loads successfully with `require('./src/app')`.

A live end-to-end test still requires a running MongoDB instance and any external email/SMS/Telegram credentials you intend to enable. Those services are external dependencies and cannot be fully verified in this build environment.
