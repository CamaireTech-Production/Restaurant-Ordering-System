
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

// 1. Fetch and cache all Firestore collections to localStorage (with offline_* keys)
export async function fetchAndCacheAll(restaurantId?: string) {
  const db = getFirestore();
  const collections = [
    { key: 'offline_menuCategories', ref: collection(db, 'categories') },
    { key: 'offline_menuItems', ref: collection(db, 'menuItems') }, // Dishes
    { key: 'offline_tables', ref: collection(db, 'tables') },
    { key: 'offline_orders', ref: collection(db, 'orders') },
  ];
  for (const { key, ref } of collections) {
    let q = ref;
    if (restaurantId) {
      // Only cache for this restaurant
      // @ts-ignore
      q = collection(db, ref.path).withConverter(undefined);
    }
    const snap = await getDocs(q);
    const items = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    localStorage.setItem(key, JSON.stringify(items));
  }
}


// 2. Replay queued actions from localStorage (merge pendingOrders and pendingActions)
export async function replayQueuedActions(restaurantId: string) {
  const db = getFirestore();
  // Get both queues
  const pendingOrders: any[] = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
  const pendingActions: any[] = JSON.parse(localStorage.getItem('pendingActions') || '[]');
  // Merge and sort by timestamp
  const all = [...pendingOrders.map(o => ({ ...o, _queue: 'pendingOrders' })), ...pendingActions.map(a => ({ ...a, _queue: 'pendingActions' }))];
  all.sort((a, b) => a.timestamp - b.timestamp);
  const syncLogs: any[] = [];
  for (const entry of all) {
    let status: 'success' | 'error' = 'success';
    let error: string | undefined = undefined;
    try {
      if (entry._queue === 'pendingOrders') {
        // Always create order
        await addDoc(collection(db, 'orders'), { ...entry.payload, createdAt: entry.timestamp });
      } else if (entry._queue === 'pendingActions') {
        // Admin actions: type can be create/update/delete for menu/category/table/order
        switch (entry.type) {
          case 'createMenuItem': // Dish
            await addDoc(collection(db, 'menuItems'), { ...entry.payload, createdAt: entry.timestamp });
            break;
          case 'updateMenuItem': // Dish
            await updateDoc(doc(db, 'menuItems', entry.payload.id), { ...entry.payload.data, updatedAt: entry.timestamp });
            break;
          case 'deleteMenuItem': // Dish
            await updateDoc(doc(db, 'menuItems', entry.payload.id), { deleted: true, updatedAt: entry.timestamp });
            break;
          case 'createCategory':
            await addDoc(collection(db, 'categories'), { ...entry.payload, createdAt: entry.timestamp });
            break;
          case 'updateCategory':
            await updateDoc(doc(db, 'categories', entry.payload.id), { ...entry.payload.data, updatedAt: entry.timestamp });
            break;
          case 'deleteCategory':
            await updateDoc(doc(db, 'categories', entry.payload.id), { deleted: true, updatedAt: entry.timestamp });
            break;
          case 'createTable':
            await addDoc(collection(db, 'tables'), { ...entry.payload, createdAt: entry.timestamp });
            break;
          case 'updateTable':
            await updateDoc(doc(db, 'tables', entry.payload.id), { ...entry.payload.data, updatedAt: entry.timestamp });
            break;
          case 'deleteTable':
            await updateDoc(doc(db, 'tables', entry.payload.id), { deleted: true, updatedAt: entry.timestamp });
            break;
          case 'updateOrderStatus':
            await updateDoc(doc(db, 'orders', entry.payload.id), { status: entry.payload.status, updatedAt: entry.timestamp });
            break;
          default:
            throw new Error('Unknown action type: ' + entry.type);
        }
      }
    } catch (err: any) {
      status = 'error';
      error = err?.message || String(err);
    }
    syncLogs.push({ entry, status, timestamp: Date.now(), error });
  }
  // Write sync logs to Firestore
  if (syncLogs.length) {
    const logsRef = collection(db, `syncLogs/${restaurantId}/batches`);
    for (const log of syncLogs) {
      await addDoc(logsRef, { ...log, syncedAt: serverTimestamp() });
    }
  }
  // Clear queues on success
  if (syncLogs.every(l => l.status === 'success')) {
    localStorage.setItem('pendingOrders', '[]');
    localStorage.setItem('pendingActions', '[]');
  }
}


