import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Select, Textarea, FormField } from '../../components/ui/FormField';
import { useGetProductsQuery } from '../../features/products/productsApi';
import { useCopyMasterBOMMutation } from '../../features/boms/bomsApi';
import { Copy, Layers, AlertCircle } from 'lucide-react';

const MasterBOMCopyModal = ({ isOpen, bom, onClose, onSuccess }) => {
  const [targetParentItem, setTargetParentItem] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const { data: itemData, isLoading: loadingItems } = useGetProductsQuery(
    { all: true },
    { skip: !isOpen }
  );

  const [copyMasterBOM, { isLoading: submitting }] = useCopyMasterBOMMutation();

  const items = (itemData?.items || itemData?.products || []).filter(i => i.status === 'active');

  useEffect(() => {
    if (!isOpen) return;
    setError('');

    if (bom) {
      const parentId = typeof bom.parentItem === 'object' ? bom.parentItem?._id : bom.parentItem;
      setTargetParentItem(parentId || '');
      setDescription(bom.description ? `Revision of ${bom.bomCode}: ${bom.description}` : `Revision of ${bom.bomCode}`);
    }
  }, [isOpen, bom]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bom) return;

    setError('');
    try {
      const payload = {
        targetParentItem: targetParentItem || undefined,
        description: description.trim()
      };

      const res = await copyMasterBOM({ id: bom._id, data: payload }).unwrap();
      if (res.success || res.bom) {
        onSuccess(res.bom || res);
      } else {
        setError(res.message || 'Failed to copy Master BOM');
      }
    } catch (err) {
      console.error('Copy BOM error:', err);
      setError(err.data?.message || err.message || 'Server error copying Master BOM');
    }
  };

  const isSameParent = bom && targetParentItem === (typeof bom.parentItem === 'object' ? bom.parentItem?._id : bom.parentItem);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={bom ? `Copy / Revise Master BOM — ${bom.bomCode}` : 'Copy Master BOM'}
      size="md"
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div style={{ padding: '12px', background: 'var(--info-50)', border: '1px solid var(--info-100)', borderRadius: '6px', fontSize: '12.5px', color: 'var(--info-700)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={18} style={{ flexShrink: 0 }} />
            <span>
              {isSameParent
                ? `This will create a new draft revision (Version ${ (bom?.version || 1) + 1 }) for the same parent item with all component items pre-filled.`
                : `This will duplicate the component structure of ${bom?.bomCode} into a new draft BOM for the selected target parent item.`}
            </span>
          </div>

          <FormField label="Target Parent Item" required helpText="Select same item for revision or another item to duplicate structure">
            <Select
              value={targetParentItem}
              onChange={(e) => setTargetParentItem(e.target.value)}
              disabled={loadingItems || submitting}
              required
            >
              <option value="">-- Select Parent Item --</option>
              {items.map(it => (
                <option key={it._id} value={it._id}>
                  {it.itemCode} — {it.itemName}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="New BOM Description">
            <Textarea
              rows={3}
              placeholder="Enter description for this new draft version..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--neutral-200)' }}>
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting || !targetParentItem}>
              <Copy size={14} style={{ marginRight: '6px' }} />
              {submitting ? 'Duplicating BOM...' : 'Create Draft Version'}
            </Button>
          </div>

        </div>
      </form>
    </Modal>
  );
};

export default MasterBOMCopyModal;
