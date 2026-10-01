# Class Session Automation

The batch and class-session workflows are now connected.

## Flow

1. Admin/staff creates a Batch.
2. The backend parses the Batch schedule, dates, topic and teacher.
3. ClassSession documents are created automatically.
4. If Zoom Server-to-Server OAuth credentials are configured, a Zoom meeting is created for each session.
5. The Zoom URL/meeting ID/passcode are stored on the ClassSession.
6. The Class Sessions page in the React frontend reads `/api/class-sessions`.
7. The scheduler checks every minute in `Asia/Colombo`.
8. `ZOOM_LEAD_MINUTES` controls how many minutes before class the Telegram message is sent.
9. The scheduler sends the Zoom link to the batch Telegram group when available, otherwise the course Telegram group.
10. When a student is enrolled, the existing course Telegram group automation creates/uses the course group and adds the student or creates a one-time invite link.

## Schedule examples

```text
Mon, Wed, Fri - 7:05 AM
Monday, Wednesday - 18:30
Tue, Thu - 5 PM
```

For a one-day batch, the start date is treated as the class date even if the weekday text does not match the calendar weekday. This makes quick Postman/frontend testing predictable.

## Zoom setup

Create a Zoom Server-to-Server OAuth app and put these values in `.env`:

```env
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_DEFAULT_DURATION_MINUTES=60
ZOOM_LEAD_MINUTES=15
```

Without Zoom credentials, batches and class sessions still save successfully, but no Zoom URL is generated.

## Telegram setup

The existing Telegram settings remain required for automatic group creation/student invites and scheduled class-link messages.

```env
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=
TELEGRAM_SESSION=
TELEGRAM_API_ID=
TELEGRAM_API_HASH=
TELEGRAM_BOT_USERNAME=
```

Never commit real Telegram or Zoom credentials to Git.
