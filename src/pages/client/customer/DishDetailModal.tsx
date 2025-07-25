import Modal from '../../../components/ui/Modal';
import designSystem from '../../../designSystem';
import { Dish as MenuItem } from '../../../types/index';
import { t } from '../../../utils/i18n';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getCurrencySymbol } from '../../../data/currencies';

interface DishDetailModalProps {
  isOpen: boolean;
  dish: MenuItem | null;
  onClose: () => void;
  addToCart?: (dish: MenuItem) => void;
  inCart?: { id: string; quantity: number } | null;
  incrementItem?: (itemId: string) => void;
  decrementItem?: (itemId: string) => void;
  categoryName?: string;
  currencyCode?: string;
}

export default function DishDetailModal({ isOpen, dish, onClose, addToCart, inCart, incrementItem, decrementItem, categoryName, currencyCode }: DishDetailModalProps) {
  const { language } = useLanguage();
  const currencySymbol = getCurrencySymbol(currencyCode || 'XAF') || 'FCFA';
  if (!dish) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dish.title}
      className="max-w-2xl" // Slightly smaller modal
    >
      {dish.image && (
        <div className="w-full h-64 sm:h-80 overflow-hidden rounded-md mb-4">
          <img
            src={dish.image}
            alt={dish.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      {categoryName && (
        <div className="mb-4 flex justify-start">
          <span
            className="inline-block px-3 py-1 rounded-full text-sm font-medium"
            style={{
              background: designSystem.colors.highlightYellow,
              color: designSystem.colors.primary,
              fontFamily: 'Poppins, sans-serif'
            }}
          >
            {categoryName}
          </span>
        </div>
      )}
      <p className="text-gray-700 mb-4">{dish.description || t('no_description_available', language)}</p>
      <div className="flex justify-between items-center mb-4">
        <span className="font-medium text-lg">{dish.price.toLocaleString()} {currencySymbol}</span>
        {addToCart && (
          <div>
            {!inCart ? (
              <button
                onClick={() => addToCart(dish)}
                className="inline-flex justify-center items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {t('order_now', language)}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => decrementItem && decrementItem(inCart.id)} className="text-gray-500 hover:text-gray-700">-</button>
                <span className="mx-1 text-gray-700 font-semibold">{inCart.quantity}</span>
                <button onClick={() => incrementItem && incrementItem(inCart.id)} className="text-gray-500 hover:text-gray-700">+</button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
