// Usage: node scripts/createInitialAdmins.js
// Requires: npm install firebase-admin
// Place your Firebase service account key as serviceAccountKey.json in the project root

const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.resolve(__dirname, '../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

const admins = [
  {
    email: 'superadmin@example.com',
    password: 'superadmin',
    role: 'super_admin',
  },
  {
    email: 'admin@example.com',
    password: 'admin',
    role: 'admin',
  },
];

async function createAdmins() {
  for (const adminUser of admins) {
    try {
      // Create user in Firebase Auth
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(adminUser.email);
        console.log(`User already exists: ${adminUser.email}`);
      } catch (e) {
        userRecord = await auth.createUser({
          email: adminUser.email,
          password: adminUser.password,
          emailVerified: true,
        });
        console.log(`Created user: ${adminUser.email}`);
      }

      // Add to Firestore users collection
      const userDoc = db.collection('users').doc(userRecord.uid);
      await userDoc.set({
        email: adminUser.email,
        role: adminUser.role,
        isDeleted: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      console.log(`Added/updated Firestore user: ${adminUser.email}`);
    } catch (err) {
      console.error(`Error for ${adminUser.email}:`, err.message);
    }
  }
  process.exit(0);
}

createAdmins(); 