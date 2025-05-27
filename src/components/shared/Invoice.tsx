import React from 'react';
import { format } from 'date-fns';
import { Order } from '../../types';

interface InvoiceProps {
  order: Order;
  onPrint?: () => void;
}

const Invoice: React.FC<InvoiceProps> = ({ order, onPrint }) => {
  const formatDate = (date: any) => {
    if (date?.toDate) {
      return format(date.toDate(), 'MMM dd, yyyy HH:mm:ss');
    }
    return '';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Order Receipt</h2>
        <p className="text-gray-600">Order #{order.id.slice(-4)}</p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Table Number:</span>
          <span className="font-medium">#{order.tableNumber}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Date:</span>
          <span className="font-medium">{formatDate(order.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <span className="font-medium capitalize">{order.status}</span>
        </div>
      </div>

      <div className="border-t border-b border-gray-200 py-4 mb-6">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="pb-2">Item</th>
              <th className="pb-2 text-center">Qty</th>
              <th className="pb-2 text-right">Price</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2">{item.name}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">${item.price.toFixed(2)}</td>
                <td className="py-2 text-right">
                  ${(item.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center text-lg font-bold mb-6">
        <span>Total Amount:</span>
        <span>${order.totalAmount.toFixed(2)}</span>
      </div>

      {onPrint && (
        <div className="text-center">
          <button
            onClick={onPrint}
            className="px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            Print Receipt
          </button>
        </div>
      )}
    </div>
  );
};

export default Invoice;