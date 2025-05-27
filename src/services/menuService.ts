import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { MenuItem, Category } from '../types';

const menuItemsCollection = collection(db, 'menuItems');
const categoriesCollection = collection(db, 'categories');

// Menu Items CRUD
export const getMenuItems = async (): Promise<MenuItem[]> => {
  const snapshot = await getDocs(query(menuItemsCollection, orderBy('name')));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as MenuItem));
};

export const createMenuItem = async (item: Omit<MenuItem, 'id'>) => {
  return await addDoc(menuItemsCollection, item);
};

export const updateMenuItem = async (id: string, item: Partial<MenuItem>) => {
  const docRef = doc(db, 'menuItems', id);
  await updateDoc(docRef, item);
};

export const deleteMenuItem = async (id: string) => {
  const docRef = doc(db, 'menuItems', id);
  await deleteDoc(docRef);
};

// Categories CRUD
export const getCategories = async (): Promise<Category[]> => {
  const snapshot = await getDocs(query(categoriesCollection, orderBy('name')));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Category));
};

export const createCategory = async (category: Omit<Category, 'id'>) => {
  return await addDoc(categoriesCollection, category);
};

export const updateCategory = async (id: string, category: Partial<Category>) => {
  const docRef = doc(db, 'categories', id);
  await updateDoc(docRef, category);
};

export const deleteCategory = async (id: string) => {
  const docRef = doc(db, 'categories', id);
  await deleteDoc(docRef);
};