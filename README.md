# E-Laundry Backend

Node.js + Express backend API for the E-Laundry platform.

## Tech Stack
- Node.js
- Express
- MongoDB (Mongoose)
- Socket.IO

## Run Locally
```bash
npm install
npm run dev
```

The server starts from `api/index.js` and uses the port in `.env` (`PORT`).

## Required Environment Variables
Create a `.env` file inside `backend/` and define:

- `PORT`
- `MONGO_URL`
- `CLOUD_NAME`
- `CLOUD_API`
- `CLOUD_SECRET`
- `SECRET_KEY`
- `GMAIL`
- `APP_PASS` (or `App_Pass`)
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASS`
- `SUPER_ADMIN_SECRET`
- `FRONTEND_URL`
- `SECOND_FRONTEND_URL`
- `THIRD_FRONTEND_URL`
- `SUPER_ADMIN_INSNANE_CODE`
- `SUPER_ADMIN_NAME`
- `SUPER_ADMIN_MOBILE`
- `SUPER_ADMIN_REALNAME`
- `SUPER_ADMIN_OFFICE`
- `SUPER_ADMIN_HOME`
- `SUPER_ADMIN_SONNAME`
- `SUPER_ADMIN_DAUGHTER`
- `SUPER_ADMIN_WIFE_NAME`
- `SUPER_ADMIN_MOBILE_NAME`
- `SUPER_ADMIN_EARNING`
- `SUPER_ADMIN_COLLEGE_NAME`
- `OTP_HASH_SECRET`

For Gmail SMTP:
- Use a Gmail **App Password** (not your normal account password).
- Store it without spaces (example format: `abcdefghijklmnop`).

## Health Check
- `GET /ping`
- `GET /health`

## Main API Route Prefixes
- `/auth`
- `/sup`
- `/item`
- `/shop`
- `/cart`
- `/order`
- `/review`
