// Script to initialize Firestore collections with data from data/menuItems.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { menuItems, categories } from '../data/menuItems';

// Import your firebase config
import { firebaseConfig } from '../firebase/config';

// Initialize Firebase app (avoid re-initialization)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedCategoriesAndGetMap() {
  const categoriesCollection = collection(db, 'categories');
  const nameToId: Record<string, string> = {};

  // Add categories and collect their IDs
  for (const name of categories) {
    const docRef = await addDoc(categoriesCollection, { name });
    nameToId[name] = docRef.id;
    console.log(`Added category: ${name} (id: ${docRef.id})`);
  }
  return nameToId;
}

async function seedMenuItems(nameToId: Record<string, string>) {
  const menuItemsCollection = collection(db, 'menuItems');
  for (const item of menuItems) {
    // Remove id so Firestore can auto-generate
    const { id, ...itemData } = item;
    // Replace categoryId (name) with Firestore category id
    const categoryId = nameToId[item.categoryId];
    if (!categoryId) {
      console.warn(`Category name '${item.categoryId}' not found in Firestore. Skipping menu item '${item.name}'.`);
      continue;
    }
    await addDoc(menuItemsCollection, { ...itemData, categoryId });
    console.log(`Added menu item: ${item.name} (categoryId: ${categoryId})`);
  }
}

async function main() {
  const nameToId = await seedCategoriesAndGetMap();
  await seedMenuItems(nameToId);
  console.log('Firestore initialization complete.');
}

main().catch(console.error);
