# FoodOrder v2 – Restaurant Ordering System

A modern, production-ready restaurant ordering app built with React, TypeScript, Firebase Firestore, and Tailwind CSS.

## Features
- Customer menu browsing and table-based ordering (with FCFA currency)
- Real-time order dashboard for restaurant staff
- Restaurant dashboard with menu, category, and table management
- Sidebar navigation and responsive layouts
- Cameroon phone number support with country code dropdown
- Toast notifications for user feedback
- Consistent design system using Tailwind CSS with a custom primary color
- Firestore as the backend for menu, categories, tables, and orders

## Getting Started

### 1. Clone the Repository
```sh
git clone https://github.com/CamaireTech-Production/Restaurant-Ordering-System.git
cd "Restaurant App/restaurant app v2"
```

### 2. Install Dependencies
```sh
npm install
```

### 3. Set Up Firebase Credentials
Create a `.env` file in the project root with your Firebase config:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

> **Note:** Never commit your real credentials to a public repository.

### 4. (Optional) Initialize Firestore Collections
If you have a seeding script, run it to upload sample menu items and categories:

```sh
npx tsx src/scripts/initFirestore.ts
```

### 5. Start the Development Server
```sh
npm run dev
```

The app will be available at `http://localhost:5173` (or as shown in your terminal).

## Firestore Security Rules (Development Only)
For local development, you can use permissive rules. In the Firebase Console, set your Firestore rules to:

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /{doc=**} {
      allow read, write: if true;
    }
  }
}
```

> **Warning:** These rules allow full read/write access to your database. **Do not use in production!**

## Deployment
- Push your code to GitHub.
- You can deploy to Vercel, Netlify, or Firebase Hosting. Make sure to set the same environment variables in your deployment platform.

## License
MIT

# Subcategory Support for Menu Categories

## Overview
- Categories now support subcategories via a `parentCategoryId` field.
- Categories with no `parentCategoryId` are main categories; those with a value are subcategories.
- The UI (admin, restaurant, demo) allows creating, editing, and viewing categories in a tree/expandable list.
- Dishes can be assigned to either main or subcategories.

## Migration Notes
- Existing categories will have `parentCategoryId: undefined` (main category).
- No migration is needed unless you want to organize existing categories into a hierarchy.
- All category CRUD and dish assignment logic is backward compatible.

## Activity Logging
- All subcategory-related actions (create, edit, delete, restore, assign to dish, change parent) are logged in the activity log for regular, demo, and admin actions.
- Log entries include the `parentCategoryId` and relevant details.

## Feature Flag
- Subcategory support is always enabled; there is no feature flag for this feature.

## UI Usage
- In the admin and restaurant panels, you can select a parent category when creating or editing a category.
- The category table displays categories in a tree, with subcategories indented under their parent.
- You cannot set a category as its own parent or create circular references.
