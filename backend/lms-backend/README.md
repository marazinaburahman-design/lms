# LMS Backend - Node.js + Express + MongoDB

A testable backend for an LMS with student management, courses, batches, enrollments, invoices, invoice approval, real-time approval notifications, invoice PDF generation, SMTP email, SMS provider integration, attendance, assignments, grades, uploads, dashboard and admin integration settings.

## 1. Requirements
- Node.js 20+
- MongoDB 6+
- Postman (recommended for testing)

## 2. Install
```bash
npm install
copy .env.example .env
```
On PowerShell/Linux/macOS, copy the env file with `cp .env.example .env`.

Edit `.env` and set at minimum:
```env
MONGO_URI=mongodb://127.0.0.1:27017/lms_db
JWT_SECRET=replace-with-a-long-random-secret
```

## 3. Run
```bash
npm run dev
```
Health check:
`GET http://localhost:5000/api/health`

## 4. Seed demo data
With MongoDB running:
```bash
npm run seed
```
Demo users:
- Admin: `admin@lms.local` / `Admin@123`
- Staff: `staff@lms.local` / `Staff@123`
- Teacher: `teacher@lms.local` / `Teacher@123`
- Student: `student@lms.local` / `Student@123`

Change these passwords before real use.

## 5. Main invoice workflow
1. Login as admin or staff: `POST /api/auth/login`.
2. Create an invoice: `POST /api/invoices`.
3. The invoice is saved as `pending_approval`.
4. The backend creates an `invoice_approval` notification and emits `notification:new` through Socket.IO to admin/staff rooms.
5. Admin/staff gets pending invoices with `GET /api/invoices?status=pending_approval`.
6. Review with `GET /api/invoices/:id` and preview with `GET /api/invoices/:id/preview`.
7. Reject with `POST /api/invoices/:id/reject` OR approve with `POST /api/invoices/:id/approve`.
8. Approval requires `email:true` and/or `sms:true`.
9. The backend generates a PDF invoice, sends the selected notifications, records delivery status/errors, and creates an `invoice_approved` notification.

### Approve example
```json
{
  "email": true,
  "sms": true
}
```

### Reject example
```json
{
  "reason": "Payment receipt needs verification"
}
```

## 6. Email
Set these in `.env`:
```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=academy@example.com
EMAIL_FROM_NAME=My LMS
```
Use `POST /api/settings/test/email` as admin with `{ "to": "your-test-address@example.com" }`.

The backend uses Nodemailer SMTP. Use an app password where your mail provider requires one. Never commit real SMTP credentials.

## 7. SMS
The SMS adapter is separated in `src/services/smsService.js` so provider-specific payload changes stay in one place. Configure:
```env
SMS_ENABLED=true
SMS_PROVIDER_URL=https://your-provider-endpoint
SMS_API_KEY=...
SMS_USER_ID=...
SMS_SENDER_ID=...
SMS_DEFAULT_COUNTRY_CODE=94
```
Use `POST /api/settings/test/sms` with `{ "to": "0771234567" }`.

The sample SMSLenz configuration follows the fields visible in the provided reference screenshots. Because provider APIs can require an exact account-specific payload/auth scheme, verify the SMSLenz account documentation and adjust only `src/services/smsService.js` if their current endpoint contract differs.

## 8. Authentication
Send:
`Authorization: Bearer <token>`

Roles: `admin`, `staff`, `teacher`, `student`.

## 9. API groups
- `/api/auth`
- `/api/users`
- `/api/students`
- `/api/teachers`
- `/api/courses`
- `/api/batches`
- `/api/enrollments`
- `/api/invoices`
- `/api/notifications`
- `/api/settings`
- `/api/dashboard`
- `/api/attendance`
- `/api/assignments`
- `/api/grades`
- `/api/uploads`

## 10. Socket.IO
Frontend can connect to the same server and emit:
```js
socket.emit('joinRole', 'admin');
socket.emit('joinRole', 'staff');
```
Listen for:
```js
socket.on('notification:new', notification => { /* show approval badge */ });
```

## 11. Security notes
- Secrets are environment variables.
- Passwords are hashed with bcrypt.
- JWT is required for protected routes.
- Role authorization is enforced server-side.
- Helmet, CORS and rate limiting are enabled.
- Uploaded files are size-limited.
- Do not expose `.env` or real provider keys to the frontend.

## 12. Production improvements before deployment
- Use a managed secret store.
- Put HTTPS/reverse proxy in front of the API.
- Add a background job/queue (BullMQ/Redis or a cloud queue) for high-volume SMS/email.
- Add refresh-token rotation if long-lived sessions are needed.
- Add stronger audit logs for every financial action.
- Add automated tests and CI.
- Configure MongoDB backups and indexes for reporting volume.
