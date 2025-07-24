import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, Timestamp, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Order } from '../types';

const ordersCollection = collection(db, 'orders');

export const createOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & { customerName?: string, customerPhone?: string, customerLocation?: string, deliveryFee?: number, mtnFee?: number, orangeFee?: number }) => {
  try {
    const timestamp = Timestamp.now();
    const docRef = await addDoc(ordersCollection, {
      ...order,
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
      ...(order.customerName ? { customerName: order.customerName } : {}),
      ...(order.customerPhone ? { customerPhone: order.customerPhone } : {}),
      ...(order.customerLocation ? { customerLocation: order.customerLocation } : {}),
      ...(order.deliveryFee !== undefined ? { deliveryFee: order.deliveryFee } : {}),
      ...(order.mtnFee !== undefined ? { mtnFee: order.mtnFee } : {}),
      ...(order.orangeFee !== undefined ? { orangeFee: order.orangeFee } : {}),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, { status });
};

export const getOrder = async (orderId: string): Promise<Order | null> => {
  try {
    const orderSnap = await getDocs(query(collection(db, 'orders'), where('id', '==', orderId)));
    if (!orderSnap.empty) {
      const data = orderSnap.docs[0].data();
      return { id: orderSnap.docs[0].id, ...data } as Order;
    }
    return null;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

export const subscribeToTableOrders = (tableNumber: number, callback: (orders: Order[]) => void) => {
  const q = query(
    ordersCollection,
    where('tableNumber', '==', tableNumber),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
    callback(orders);
  });
};

export const subscribeToAllOrders = (callback: (orders: Order[]) => void) => {
  const q = query(
    ordersCollection,
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
    callback(orders);
  });
};

export const getFilteredOrders = async (
  tableNumber?: number,
  status?: Order['status'],
  startDate?: Date,
  endDate?: Date
): Promise<Order[]> => {
  let q = query(ordersCollection, orderBy('createdAt', 'desc'));
  if (tableNumber) {
    q = query(q, where('tableNumber', '==', tableNumber));
  }
  if (status) {
    q = query(q, where('status', '==', status));
  }
  if (startDate) {
    q = query(q, where('createdAt', '>=', Timestamp.fromDate(startDate)));
  }
  if (endDate) {
    q = query(q, where('createdAt', '<=', Timestamp.fromDate(endDate)));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Order));
};

export async function updateOrderCustomerStatus(orderId: string, customerViewStatus: string) {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, { customerViewStatus });
}
