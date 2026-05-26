# VS Babu Kolathur MLA Website (TVK)

Portfolio + Kolathur-only grievance portal with a separate secure MLA dashboard.

## Features

- Public profile-style homepage inspired by Tamil Nadu government visual theme.
- Complaint form with required fields:
  - Full name
  - Phone number
  - Area locked to Kolathur
  - Street name
  - Email ID
  - Grievance details
  - ID proof upload (required)
  - Issue photos upload (optional)
- Backend validation for all complaint fields.
- Separate admin login route and dashboard (not shown in public navigation).
- Admin credentials managed in `.env`.
- File access protected behind admin authentication.

## Tech Stack

- Node.js + Express
- EJS templates
- JSON file storage
- Multer for uploads
- Express session auth

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Edit environment values in `.env`:

```env
PORT=3000
SESSION_SECRET=change-this-to-a-strong-random-secret
ADMIN_USERNAME=mlaadmin
ADMIN_PASSWORD=ChangeMe123!
```

3. Start app:

```bash
npm run dev
```

4. Open public site:

- `http://localhost:3000/`

5. Open admin login (direct link only):

- `http://localhost:3000/secure-mla-login`

## Railway Deployment Notes

This app is deployment-friendly for Railway:

- Uses `npm start` command automatically.
- Reads `PORT` from Railway environment.
- Set the following variables in Railway project settings:
  - `SESSION_SECRET`
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD` (or `ADMIN_PASSWORD_HASH`)

### Important storage note

Uploads and complaint database are file-based. On many free/cloud setups, local disk can be ephemeral.

For production persistence on Railway, use one of these:

1. Attach a persistent volume for `src/data` and `src/uploads`
2. Migrate DB and file storage to managed services (PostgreSQL + object storage)

## Security and Content Note

- Admin URL is intentionally separate and not linked in public UI.
- Replace demo biography text and demo image with verified and officially licensed content before public launch.
