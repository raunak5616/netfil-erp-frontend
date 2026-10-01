import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { Package, MapPin, Phone, Mail, User, Info, Edit, Trash2 } from 'lucide-react';
import { deleteStore } from '../../services/storeService';

const StoreDetailModal = ({ store, isOpen, onClose, onEdit, onSuccess, canEdit }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!store) return null;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
      setLoading(true);
      setError('');
      try {
        await deleteStore(store._id);
        onSuccess();
        onClose();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete store');
        setLoading(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Store Details"
      size="md"
      icon={Package}
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
        
        {/* Header section */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{store.storeName}</h3>
            <p className="text-sm font-mono text-primary-600 mt-1 font-medium">{store.storeCode}</p>
          </div>
          <StatusBadge status={store.status} />
        </div>

        {/* Details section */}
        <div className="bg-slate-50 rounded-lg border border-slate-100 p-4 space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Address</p>
              <p className="text-sm text-slate-900 whitespace-pre-line leading-relaxed">{store.address}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Contact Person</p>
                <p className="text-sm text-slate-900">{store.contactPerson || '—'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Contact Number</p>
                <p className="text-sm text-slate-900">{store.contactNumber || '—'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 col-span-2">
              <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Email</p>
                <p className="text-sm text-slate-900">{store.email || '—'}</p>
              </div>
            </div>
          </div>
          
          {store.remarks && (
            <div className="flex items-start gap-3 pt-2 border-t border-slate-200">
              <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Remarks</p>
                <p className="text-sm text-slate-900">{store.remarks}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Timestamps */}
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <p>Created: {new Date(store.createdAt).toLocaleDateString()}</p>
          <p>Last Updated: {new Date(store.updatedAt).toLocaleDateString()}</p>
        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-6">
          <div>
            {canEdit && (
              <Button 
                type="button" 
                variant="danger" 
                onClick={handleDelete} 
                disabled={loading}
                icon={Trash2}
                size="sm"
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Close
            </Button>
            {canEdit && (
              <Button 
                type="button" 
                variant="primary" 
                onClick={() => {
                  onClose();
                  onEdit(store);
                }}
                icon={Edit}
              >
                Edit Store
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default StoreDetailModal;
