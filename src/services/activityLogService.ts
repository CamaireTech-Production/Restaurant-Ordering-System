import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface ActivityLog {
  userId?: string;
  userEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  timestamp?: any;
}

export async function logActivity({ userId, userEmail, action, entityType, entityId, details }: ActivityLog) {
  const db = getFirestore();
  await addDoc(collection(db, 'activityLogs'), {
    userId,
    userEmail,
    action,
    entityType,
    entityId,
    details: details || null,
    timestamp: serverTimestamp(),
  });
} 