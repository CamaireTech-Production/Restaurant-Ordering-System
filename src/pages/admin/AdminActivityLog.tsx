import React, { useEffect, useState } from 'react';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';
import { getFirestore, collection, collectionGroup, getDocs, orderBy, limit, startAfter, query as firestoreQuery } from 'firebase/firestore';

const PAGE_SIZE = 10;

const columns = {
  sync: [
    { key: 'type', label: 'Action Type' },
    { key: 'status', label: 'Status' },
    { key: 'entity', label: 'Entity' },
    { key: 'error', label: 'Error' },
    { key: 'date', label: 'Date' },
  ],
  activity: [
    { key: 'user', label: 'User' },
    { key: 'action', label: 'Action' },
    { key: 'entityType', label: 'Entity' },
    { key: 'date', label: 'Date' },
  ],
};

const AdminActivityLog: React.FC = () => {
  const db = getFirestore();
  // Sync logs state
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncOrder, setSyncOrder] = useState<'desc' | 'asc'>('desc');
  const [syncLastDoc, setSyncLastDoc] = useState<any>(null);
  const [syncHasMore, setSyncHasMore] = useState(true);
  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityOrder, setActivityOrder] = useState<'desc' | 'asc'>('desc');
  const [activityLastDoc, setActivityLastDoc] = useState<any>(null);
  const [activityHasMore, setActivityHasMore] = useState(true);

  // Fetch sync logs
  const fetchSyncLogs = async (reset = false) => {
    setSyncLoading(true);
    try {
      const q = firestoreQuery(
        collectionGroup(db, 'logs'),
        orderBy('timestamp', syncOrder),
        limit(PAGE_SIZE),
        ...(reset || !syncLastDoc ? [] : [startAfter(syncLastDoc)])
      );
      const snap = await getDocs(q);
      const logs = snap.docs.map(d => d.data());
      setSyncLogs(reset ? logs : prev => [...prev, ...logs]);
      setSyncLastDoc(snap.docs[snap.docs.length - 1]);
      setSyncHasMore(snap.docs.length === PAGE_SIZE);
    } finally {
      setSyncLoading(false);
    }
  };

  // Fetch activity logs
  const fetchActivityLogs = async (reset = false) => {
    setActivityLoading(true);
    try {
      const q = firestoreQuery(
        collection(db, 'activityLogs'),
        orderBy('timestamp', activityOrder),
        limit(PAGE_SIZE),
        ...(reset || !activityLastDoc ? [] : [startAfter(activityLastDoc)])
      );
      const snap = await getDocs(q);
      const logs = snap.docs.map(d => d.data());
      setActivityLogs(reset ? logs : prev => [...prev, ...logs]);
      setActivityLastDoc(snap.docs[snap.docs.length - 1]);
      setActivityHasMore(snap.docs.length === PAGE_SIZE);
    } finally {
      setActivityLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSyncLogs(true);
    fetchActivityLogs(true);
    // eslint-disable-next-line
  }, [syncOrder, activityOrder]);

  // Table render helpers
  const renderSyncRow = (log: any, idx: number) => (
    <tr key={idx} className="border-b last:border-none">
      <td className="py-2">{log.entry?.type || '—'}</td>
      <td className="py-2">{log.status || '—'}</td>
      <td className="py-2">{log.entry?.payload?.name || log.entry?.payload?.id || '—'}</td>
      <td className="py-2">{log.error || '—'}</td>
      <td className="py-2">{new Date(log.timestamp || Date.now()).toLocaleString()}</td>
    </tr>
  );
  const renderActivityRow = (log: any, idx: number) => (
    <tr key={idx} className="border-b last:border-none">
      <td className="py-2">{log.userEmail || log.userId || '—'}</td>
      <td className="py-2">{log.action || '—'}</td>
      <td className="py-2">{log.entityType || '—'}</td>
      <td className="py-2">{new Date(log.timestamp?.toDate ? log.timestamp.toDate() : log.timestamp || Date.now()).toLocaleString()}</td>
    </tr>
  );

  return (
    <AdminDashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Activity Log</h1>
      {/* Sync Logs Table */}
      <div className="bg-white shadow rounded p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sync Logs</h2>
          <div>
            <label className="mr-2 font-medium">Order:</label>
            <select value={syncOrder} onChange={e => { setSyncOrder(e.target.value as any); setSyncLastDoc(null); fetchSyncLogs(true); }} className="border px-2 py-1 rounded">
              <option value="desc">Newest</option>
              <option value="asc">Oldest</option>
            </select>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              {columns.sync.map(col => <th key={col.key} className="py-2 cursor-pointer">{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {syncLogs.map(renderSyncRow)}
          </tbody>
        </table>
        <div className="flex justify-between items-center mt-4">
          <button disabled={syncLoading || !syncHasMore} onClick={() => fetchSyncLogs()} className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50">Load More</button>
        </div>
      </div>
      {/* Activity Logs Table */}
      <div className="bg-white shadow rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Activity Logs</h2>
          <div>
            <label className="mr-2 font-medium">Order:</label>
            <select value={activityOrder} onChange={e => { setActivityOrder(e.target.value as any); setActivityLastDoc(null); fetchActivityLogs(true); }} className="border px-2 py-1 rounded">
              <option value="desc">Newest</option>
              <option value="asc">Oldest</option>
            </select>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              {columns.activity.map(col => <th key={col.key} className="py-2 cursor-pointer">{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {activityLogs.map(renderActivityRow)}
          </tbody>
        </table>
        <div className="flex justify-between items-center mt-4">
          <button disabled={activityLoading || !activityHasMore} onClick={() => fetchActivityLogs()} className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50">Load More</button>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminActivityLog; 