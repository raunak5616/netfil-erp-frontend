import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import { getItemSpecifications } from '../../services/itemService';
import { Edit, Sliders, Layers, Package, Scale, ShieldCheck, FileText, History } from 'lucide-react';

const ItemDetailModal = ({ item, isOpen, onClose, onEdit, canEdit }) => {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'specifications' | 'uom' | 'inventory' | 'accounting_history'
  const [specifications, setSpecifications] = useState([]);
  const [loadingSpecs, setLoadingSpecs] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;

    setActiveTab('general');
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
      maxWidth="760px"
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Navigation Tabs Header */}
        <div style={{ borderBottom: '1px solid var(--neutral-200)', marginBottom: '4px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              style={{
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'general' ? '2px solid var(--primary-600)' : '2px solid transparent',
                color: activeTab === 'general' ? 'var(--primary-700)' : 'var(--neutral-600)',
                fontWeight: activeTab === 'general' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Package size={14} /> General
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('specifications')}
              style={{
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'specifications' ? '2px solid var(--primary-600)' : '2px solid transparent',
                color: activeTab === 'specifications' ? 'var(--primary-700)' : 'var(--neutral-600)',
                fontWeight: activeTab === 'specifications' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Sliders size={14} /> Specifications ({specifications.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('uom')}
              style={{
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'uom' ? '2px solid var(--primary-600)' : '2px solid transparent',
                color: activeTab === 'uom' ? 'var(--primary-700)' : 'var(--neutral-600)',
                fontWeight: activeTab === 'uom' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Scale size={14} /> UOM & Units
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              style={{
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'inventory' ? '2px solid var(--primary-600)' : '2px solid transparent',
                color: activeTab === 'inventory' ? 'var(--primary-700)' : 'var(--neutral-600)',
                fontWeight: activeTab === 'inventory' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Layers size={14} /> Inventory Controls
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('accounting_history')}
              style={{
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'accounting_history' ? '2px solid var(--primary-600)' : '2px solid transparent',
                color: activeTab === 'accounting_history' ? 'var(--primary-700)' : 'var(--neutral-600)',
                fontWeight: activeTab === 'accounting_history' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <History size={14} /> Accounting & History
            </button>
          </div>
        </div>

        {/* TAB 1: GENERAL */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
                backgroundColor: 'var(--neutral-50)',
                padding: '14px',
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
                  {item.itemGroup?.groupName ? `${item.itemGroup.groupName} (${item.itemGroup.groupCode})` : '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Item Category
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-800)', marginTop: '2px' }}>
                  {item.itemCategory?.categoryName ? `${item.itemCategory.categoryName} (${item.itemCategory.categoryCode})` : '—'}
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

            <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '12px', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                Item Description & Scope
              </div>
              <div style={{ fontSize: '13px', color: item.description ? 'var(--neutral-800)' : 'var(--neutral-400)' }}>
                {item.description || 'No detailed description specified.'}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SPECIFICATIONS */}
        {activeTab === 'specifications' && (
          <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '12px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-800)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={14} /> Category Technical Specifications ({specifications.length})
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--neutral-500)' }}>
                Category: {item.itemCategory?.categoryName || 'General'}
              </span>
            </div>

            {loadingSpecs ? (
              <div style={{ fontSize: '12px', color: 'var(--neutral-500)', padding: '8px' }}>
                Loading category specifications...
              </div>
            ) : specifications.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--neutral-400)', padding: '12px', textAlign: 'center', backgroundColor: 'var(--neutral-50)', borderRadius: '4px' }}>
                No specification parameters configured for this item.
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>Order</th>
                      <th>Code</th>
                      <th>Specification Name</th>
                      <th>Configured Value</th>
                      <th>Unit</th>
                      <th>Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specifications.map((s, idx) => {
                      const spec = s.specification;
                      const uomCode = spec?.unit?.uomCode || spec?.unit?.uomName || '';
                      const displayVal = typeof s.value === 'boolean' ? (s.value ? 'Yes / True' : 'No / False') : String(s.value);
                      return (
                        <tr key={s._id || idx}>
                          <td style={{ fontWeight: 600, color: 'var(--neutral-600)' }}>{s.printSerial ?? (idx + 1)}</td>
                          <td className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
                            {spec?.specificationCode || 'N/A'}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                            {spec?.specificationName || 'Specification'}
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: 'var(--primary-800)', fontSize: '13px' }}>
                              {displayVal}
                            </span>
                          </td>
                          <td>
                            {uomCode ? (
                              <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--neutral-700)', padding: '1px 6px', background: 'var(--neutral-100)', borderRadius: '3px' }}>
                                {uomCode}
                              </span>
                            ) : '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {s.isApply && <span className="badge badge-primary" style={{ fontSize: '10px' }}>Apply</span>}
                              {s.isFix && <span className="badge badge-approved" style={{ fontSize: '10px' }}>Fix</span>}
                              {!s.isApply && !s.isFix && <span style={{ color: 'var(--neutral-400)', fontSize: '11px' }}>—</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: UOM & UNITS */}
        {activeTab === 'uom' && (
          <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '14px', backgroundColor: '#ffffff' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-800)', marginBottom: '10px' }}>
              Units of Measure & Conversion Factors
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', fontSize: '13px' }}>
              <div style={{ backgroundColor: 'var(--neutral-50)', padding: '10px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
                <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Primary Inventory UOM</span>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-800)', marginTop: '2px' }}>
                  {item.inventoryUom?.uomCode} — {item.inventoryUom?.uomName}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--neutral-500)', marginTop: '2px' }}>
                  Dimension: {item.inventoryUom?.dimension || 'COUNT'}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--neutral-50)', padding: '10px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
                <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Purchase UOM</span>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--neutral-900)', marginTop: '2px' }}>
                  {item.purchaseUom?.uomCode || item.inventoryUom?.uomCode}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--neutral-600)', marginTop: '2px' }}>
                  Conversion: 1 Purchase Unit = <strong>{item.itemPerPurchaseUnit || 1}</strong> Inv Units
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--neutral-50)', padding: '10px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
                <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Sales UOM</span>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--neutral-900)', marginTop: '2px' }}>
                  {item.salesUom?.uomCode || item.inventoryUom?.uomCode}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--neutral-600)', marginTop: '2px' }}>
                  Conversion: 1 Sales Unit = <strong>{item.itemPerSalesUnit || 1}</strong> Inv Units
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INVENTORY CONTROLS */}
        {activeTab === 'inventory' && (
          <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '14px', backgroundColor: '#ffffff' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-800)', marginBottom: '10px' }}>
              Inventory Control Thresholds & Storage Bin
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', fontSize: '12.5px' }}>
              <div>
                <span className="text-muted" style={{ fontSize: '11px' }}>Reorder Level:</span>
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--neutral-900)' }}>{item.reorderLevel ?? 0}</div>
              </div>

              <div>
                <span className="text-muted" style={{ fontSize: '11px' }}>Reorder Quantity:</span>
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--neutral-900)' }}>{item.reorderQty ?? 0}</div>
              </div>

              <div>
                <span className="text-muted" style={{ fontSize: '11px' }}>Minimum Stock:</span>
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--neutral-900)' }}>{item.minInventory ?? 0}</div>
              </div>

              <div>
                <span className="text-muted" style={{ fontSize: '11px' }}>Maximum Stock:</span>
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--neutral-900)' }}>{item.maxInventory ?? 0}</div>
              </div>

              <div>
                <span className="text-muted" style={{ fontSize: '11px' }}>Lead Time (Days):</span>
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--neutral-900)' }}>{item.leadTimeDays ?? 0} days</div>
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <span className="text-muted" style={{ fontSize: '11px' }}>Default Storage Location / Bin:</span>
                <div style={{ fontWeight: 600, color: item.defaultBin ? 'var(--primary-800)' : 'var(--neutral-500)' }}>
                  {item.defaultBin?.binCode ? `${item.defaultBin.binCode} — ${item.defaultBin.binName}` : 'Unassigned / Default Warehouse'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ACCOUNTING & HISTORY */}
        {activeTab === 'accounting_history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '14px', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-800)', marginBottom: '8px' }}>
                Accounting & Tax Identification
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span className="text-muted" style={{ fontSize: '11px' }}>HSN / SAC Code:</span>
                  <div className="font-mono" style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-700)' }}>
                    {item.hsnCode || 'Unassigned'}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--neutral-600)', alignSelf: 'center' }}>
                  Harmonized System Nomenclature (HSN) code for GST/customs classification.
                </div>
              </div>
            </div>

            {/* Audit Timestamps */}
            <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '14px', backgroundColor: 'var(--neutral-50)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--neutral-800)', marginBottom: '8px' }}>
                System Audit Log
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12.5px', color: 'var(--neutral-700)' }}>
                <div>
                  <strong>Created At:</strong> {formatDate(item.createdAt)}
                </div>
                <div>
                  <strong>Last Modified At:</strong> {formatDate(item.updatedAt)}
                </div>
              </div>
            </div>

            {/* Backend Capabilities Note */}
            <div style={{ fontSize: '12px', color: 'var(--neutral-500)', fontStyle: 'italic', padding: '6px 8px' }}>
              Note: Dedicated Purchase/Sales GL accounts and Item attachments are managed via transaction vouchers in NETFIL ERP.
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ItemDetailModal;

