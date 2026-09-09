import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { getItemSpecifications } from '../../services/itemService';
import { Edit } from 'lucide-react';

const ItemDetailModal = ({ item, isOpen, onClose, onEdit, canEdit }) => {
  const [specifications, setSpecifications] = useState([]);
  const [loadingSpecs, setLoadingSpecs] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;

    setLoadingSpecs(true);
    getItemSpecifications(item._id)
      .then((res) => {
        if (res.success && Array.isArray(res.specifications)) {
          setSpecifications(res.specifications);
        }
      })
      .catch((err) => {
        console.error("Failed to load Item Specifications:", err);
      })
      .finally(() => {
        setLoadingSpecs(false);
      });
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Item Details — ${item.itemCode}`}
      maxWidth="680px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {canEdit && (
            <Button
              variant="primary"
              icon={Edit}
              onClick={() => {
                onClose();
                onEdit(item);
              }}
            >
              Edit Item
            </Button>
          )}
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Core Header Card */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            backgroundColor: 'var(--neutral-50)',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid var(--neutral-200)'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
              Item Code
            </div>
            <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-700)', marginTop: '2px' }}>
              {item.itemCode}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
              Item Name
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-900)', marginTop: '2px' }}>
              {item.itemName}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
              Account Status
            </div>
            <StatusBadge status={item.status} />
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
              Item Group
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-800)', marginTop: '2px' }}>
              {item.itemGroup?.groupName || '—'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
              Item Category
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-800)', marginTop: '2px' }}>
              {item.itemCategory?.categoryName || '—'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
              Item Type
            </div>
            <div style={{ fontSize: '13px', textTransform: 'capitalize', color: 'var(--neutral-800)', marginTop: '2px' }}>
              {item.itemType || 'Standard'}
            </div>
          </div>
        </div>

        {/* Units & Conversions */}
        <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '12px', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-800)', marginBottom: '8px' }}>
            Units of Measure & Conversions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <span className="text-muted" style={{ fontSize: '11px' }}>Inventory UOM:</span>
              <div style={{ fontWeight: 600 }}>{item.inventoryUom?.uomCode} — {item.inventoryUom?.uomName}</div>
            </div>
            <div>
              <span className="text-muted" style={{ fontSize: '11px' }}>Purchase UOM:</span>
              <div style={{ fontWeight: 600 }}>{item.purchaseUom?.uomCode || item.inventoryUom?.uomCode} (1 = {item.itemPerPurchaseUnit || 1} Inv Units)</div>
            </div>
            <div>
              <span className="text-muted" style={{ fontSize: '11px' }}>Sales UOM:</span>
              <div style={{ fontWeight: 600 }}>{item.salesUom?.uomCode || item.inventoryUom?.uomCode} (1 = {item.itemPerSalesUnit || 1} Inv Units)</div>
            </div>
          </div>
        </div>

        {/* Inventory & Control Parameters */}
        <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '12px', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-800)', marginBottom: '8px' }}>
            Inventory Controls & Storage
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', fontSize: '12.5px' }}>
            <div>
              <span className="text-muted" style={{ fontSize: '11px' }}>HSN Code:</span>
              <div className="font-mono">{item.hsnCode || '—'}</div>
            </div>
            <div>
              <span className="text-muted" style={{ fontSize: '11px' }}>Default Storage Bin:</span>
              <div style={{ fontWeight: 600 }}>{item.defaultBin?.binCode ? `${item.defaultBin.binCode} (${item.defaultBin.binName})` : 'Unassigned'}</div>
            </div>
            <div>
              <span className="text-muted" style={{ fontSize: '11px' }}>Reorder Level / Qty:</span>
              <div>{item.reorderLevel ?? 0} / {item.reorderQty ?? 0}</div>
            </div>
            <div>
              <span className="text-muted" style={{ fontSize: '11px' }}>Min / Max Stock:</span>
              <div>{item.minInventory ?? 0} / {item.maxInventory ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Item Specifications List */}
        <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '12px', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-800)', marginBottom: '8px' }}>
            Assigned Item Specifications ({specifications.length})
          </div>

          {loadingSpecs ? (
            <div style={{ fontSize: '12px', color: 'var(--neutral-500)', padding: '8px' }}>
              Loading specifications...
            </div>
          ) : specifications.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--neutral-400)', padding: '8px' }}>
              No custom specifications assigned for this item.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--neutral-200)', textAlign: 'left', color: 'var(--neutral-600)' }}>
                    <th style={{ padding: '6px 8px' }}>Code</th>
                    <th style={{ padding: '6px 8px' }}>Specification Name</th>
                    <th style={{ padding: '6px 8px' }}>Value</th>
                    <th style={{ padding: '6px 8px' }}>Flags</th>
                    <th style={{ padding: '6px 8px' }}>Print Order</th>
                  </tr>
                </thead>
                <tbody>
                  {specifications.map((s) => (
                    <tr key={s._id} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                      <td style={{ padding: '6px 8px' }} className="font-mono">{s.specification?.specificationCode}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{s.specification?.specificationName}</td>
                      <td style={{ padding: '6px 8px', color: 'var(--primary-800)', fontWeight: 600 }}>{String(s.value)}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--neutral-600)' }}>
                          {s.isApply ? '[Apply] ' : ''}{s.isFix ? '[Fix]' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '6px 8px' }}>{s.printSerial ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', color: 'var(--neutral-500)' }}>
          <div>
            <strong>Created:</strong> {formatDate(item.createdAt)}
          </div>
          <div>
            <strong>Last Updated:</strong> {formatDate(item.updatedAt)}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ItemDetailModal;
