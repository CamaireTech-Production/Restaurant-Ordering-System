import React, { useState, useEffect } from 'react';
import { MenuItem as MenuItemType, Category } from '../../types';
import MenuItem from './MenuItem';
import { getCategories } from '../../services/menuService';
import { motion } from 'framer-motion';

interface MenuListProps {
  items: MenuItemType[];
}

const MenuList: React.FC<MenuListProps> = ({ items }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [catError, setCatError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingCategories(true);
    getCategories()
      .then(cats => {
        setCategories(cats);
        setCatError(null);
      })
      .catch(() => {
        setCatError('Failed to load categories.');
        setCategories([]);
      })
      .finally(() => setLoadingCategories(false));
  }, []);

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter(item => item.categoryId === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white pb-4 shadow-sm">
        <div className="overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedCategory('all')}
            >
              All Items
            </button>
            {loadingCategories ? (
              <span className="px-4 py-2 text-sm text-gray-400">Loading...</span>
            ) : catError ? (
              <span className="px-4 py-2 text-sm text-red-500">{catError}</span>
            ) : (
              categories.map(category => (
                <button
                  key={category.id}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.05 }}
      >
        {filteredItems.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MenuItem item={item} />
          </motion.div>
        ))}
      </motion.div>
      
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No items found in this category.</p>
        </div>
      )}
    </div>
  );
};

export default MenuList;