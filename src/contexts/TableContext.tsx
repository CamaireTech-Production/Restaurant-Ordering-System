import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface TableContextType {
  tableNumber: number;
  setTableNumber: (number: number) => void;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const useTable = () => {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context;
};

interface TableProviderProps {
  children: ReactNode;
}

export const TableProvider: React.FC<TableProviderProps> = ({ children }) => {
  const [tableNumber, setTableNumber] = useState<number>(() => {
    // Try to get table number from localStorage
    const savedTable = localStorage.getItem('tableNumber');
    return savedTable ? parseInt(savedTable, 10) : 0;
  });

  // Save table number to localStorage when it changes
  useEffect(() => {
    if (tableNumber > 0) {
      localStorage.setItem('tableNumber', tableNumber.toString());
    }
  }, [tableNumber]);

  return (
    <TableContext.Provider
      value={{
        tableNumber,
        setTableNumber
      }}
    >
      {children}
    </TableContext.Provider>
  );
};