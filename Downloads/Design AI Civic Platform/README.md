# PrajaShakthi Civic Platform

PrajaShakthi is a React, Firebase, and Gemini-powered civic issue reporting platform for Karnataka.

## Included functionality

- Email/password and Google authentication
- Protected citizen and admin routes
- English/Kannada interface
- Photo upload to Firebase Storage
- GPS location and OpenStreetMap reverse geocoding
- Gemini image classification and bilingual complaint generation
- Firestore-backed complaints, status history, voting, notifications, maps, profiles, and leaderboard
- Admin assignment, status changes, official updates, and live operational totals

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and add a valid Gemini API key. Firebase defaults currently point to the existing `prajashakthi-2026` project, but environment variables should be used for deployment.

## Firebase setup

Enable these Firebase services:

1. Authentication: Email/Password and Google providers
2. Cloud Firestore
3. Firebase Storage

Deploy the included rules with the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use prajashakthi-2026
firebase deploy --only firestore:rules,storage
```

The default admin email is `admin@prajashakthi.in`. For production, prefer Firebase custom claims and update the rules accordingly.

## Production build

```bash
npm run build
```
