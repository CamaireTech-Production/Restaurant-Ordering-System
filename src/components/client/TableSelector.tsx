import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTable } from '../../contexts/TableContext';
import Button from '../ui/Button';

interface TableSelectorProps {
  onSelectTable: () => void;
}

const TableSelector: React.FC<TableSelectorProps> = ({ onSelectTable }) => {
  const { tableNumber, setTableNumber } = useTable();
  const [selectedTable, setSelectedTable] = useState<number>(tableNumber || 1);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTableNumber(selectedTable);
    onSelectTable();
  };
  
  // Generate an array of table numbers (1-12)
  const tables = Array.from({ length: 12 }, (_, i) => i + 1);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-xl"
    >
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Select Your Table</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {tables.map((number) => (
            <motion.button
              key={number}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedTable(number)}
              className={`p-4 text-lg font-semibold rounded-lg transition-colors ${
                selectedTable === number 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {number}
            </motion.button>
          ))}
        </div>
        
        <Button type="submit" fullWidth>
          Confirm Table #{selectedTable}
        </Button>
      </form>
    </motion.div>
  );
};

export default TableSelector;