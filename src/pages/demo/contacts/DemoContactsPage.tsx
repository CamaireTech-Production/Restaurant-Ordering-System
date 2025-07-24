import React, { useEffect, useState, useMemo } from 'react';
import { useDemoAuth } from '../../../contexts/DemoAuthContext';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { db } from '../../../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { Contact, Order } from '../../../types';
import { t } from '../../../utils/i18n';
import { useLanguage } from '../../../contexts/LanguageContext';
import ContactListContent from '../../../shared/ContactListContent';

const DemoContactsPage: React.FC = () => {
  const { demoAccount } = useDemoAuth();
  const { language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!demoAccount?.id) return;
    setLoading(true);
    const ordersCol = collection(db, 'demoAccounts', demoAccount.id, 'orders');
    const unsub = onSnapshot(ordersCol, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, [demoAccount]);

  // Aggregate contacts
  const contacts: Contact[] = useMemo(() => {
    const map = new Map<string, Contact & { names: string[] }>();
    for (const order of orders) {
      const phone = order.customerPhone?.trim();
      if (!phone) continue;
      const name = order.customerName?.trim() || '';
      const location = order.customerLocation?.trim() || '';
      const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      if (!map.has(phone)) {
        map.set(phone, { phone, name, location, count: 1, lastOrderDate: date, names: name ? [name] : [] });
      } else {
        const entry = map.get(phone)!;
        entry.count++;
        entry.names.push(name);
        if (date > entry.lastOrderDate) {
          entry.lastOrderDate = date;
          if (name) entry.name = name;
          if (location) entry.location = location;
        }
      }
    }
    return Array.from(map.values()).map(c => ({
      phone: c.phone,
      name: c.names.reverse().find(n => n) || '',
      location: c.location,
      count: c.count,
      lastOrderDate: c.lastOrderDate,
    }));
  }, [orders]);

  return (
    <DashboardLayout title={t('contacts', language)}>
      <ContactListContent contacts={contacts} loading={loading} />
    </DashboardLayout>
  );
};

export default DemoContactsPage; 