import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Utensils, LayoutDashboard } from 'lucide-react';
import { useTable } from '../../contexts/TableContext';

const Header: React.FC = () => {
  const location = useLocation();
  const { tableNumber } = useTable();
  const isClient = location.pathname === '/';
  const isReceptionist = location.pathname === '/receptionist';

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Utensils className="h-8 w-8 text-amber-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">FoodOrder</span>
            {tableNumber > 0 && isClient && (
              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
                Table #{tableNumber}
              </span>
            )}
          </div>
          
          {isReceptionist && (
            <nav className="flex space-x-4">
              <Link
                to="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                Menu
              </Link>
              
              <Link
                to="/receptionist"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isReceptionist
                    ? 'text-amber-700 bg-amber-100'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center space-x-1">
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </span>
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;