import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Package, Filter, Wind, Layers } from 'lucide-react';

const ITEM_TYPES = [
  {
    id: 'RAW_ITEM',
    title: 'Raw Item',
    description: 'General raw material or standard inventory part',
    icon: Package,
  },
  {
    id: 'FILTER',
    title: 'Filter',
    description: 'Air filter element with standard filter grade',
    icon: Filter,
  },
  {
    id: 'COIL',
    title: 'Coil',
    description: 'Heat exchanger coil product',
    icon: Layers,
  },
  {
    id: 'AHU',
    title: 'AHU',
    description: 'Air Handling Unit equipment',
    icon: Wind,
  },
];

const ItemTypeSelectionModal = ({ isOpen, onClose, onSelectType }) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Item"
      maxWidth="500px"
      footer={
        <div className="flex justify-end w-full">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="py-2 space-y-4">
        <p className="text-sm font-medium text-slate-700 text-center">
          What do you want to add?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ITEM_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onSelectType(type.id)}
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 transition-colors text-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="w-10 h-10 rounded-md bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center mb-2.5 transition-colors">
                  <Icon size={20} className="text-slate-600 group-hover:text-blue-700 transition-colors" />
                </div>
                <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {type.title}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {type.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default ItemTypeSelectionModal;
