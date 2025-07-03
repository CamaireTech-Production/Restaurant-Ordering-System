import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface ActivityLog {
  userId?: string;
  userEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string | null;
  details?: any;
  timestamp?: any;
}

export async function logActivity({ userId, userEmail, action, entityType, entityId, details }: ActivityLog) {
  const db = getFirestore();
  const log: any = {
    userId,
    userEmail,
    action,
    entityType,
    details: details || null,
    timestamp: serverTimestamp(),
  };
  if (entityId !== undefined) log.entityId = entityId;
  await addDoc(collection(db, 'activityLogs'), log);
} 