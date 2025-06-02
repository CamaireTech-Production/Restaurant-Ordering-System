import Modal from '../../components/ui/Modal';
import { Dish as MenuItem } from '../../types/index';

interface DishDetailModalProps {
  isOpen: boolean;
  dish: MenuItem | null;
  onClose: () => void;
}

export default function DishDetailModal({ isOpen, dish, onClose }: DishDetailModalProps) {
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
      <p className="text-gray-700 mb-4">{dish.description || 'No description available.'}</p>
      <div className="flex justify-between items-center">
        <span className="font-medium text-lg">{dish.price.toLocaleString()} FCFA</span>
      </div>
    </Modal>
  );
}
