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
      size="2xl"
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
      <div className="flex flex-col gap-3.5">
        {/* Navigation Tabs Header */}
        <div className="border-b border-slate-200 mb-1">
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`px-3 py-2 text-xs font-medium border-b-2 inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'general'
                  ? 'border-primary-600 text-primary-700 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package size={14} /> General
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('specifications')}
              className={`px-3 py-2 text-xs font-medium border-b-2 inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'specifications'
                  ? 'border-primary-600 text-primary-700 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders size={14} /> Specifications ({specifications.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('uom')}
              className={`px-3 py-2 text-xs font-medium border-b-2 inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'uom'
                  ? 'border-primary-600 text-primary-700 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale size={14} /> UOM & Units
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-2 text-xs font-medium border-b-2 inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'inventory'
                  ? 'border-primary-600 text-primary-700 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={14} /> Inventory Controls
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('accounting_history')}
              className={`px-3 py-2 text-xs font-medium border-b-2 inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'accounting_history'
                  ? 'border-primary-600 text-primary-700 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <History size={14} /> Accounting & History
            </button>
          </div>
        </div>

        {/* TAB 1: GENERAL */}
        {activeTab === 'general' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-md border border-slate-200">
              <div>
                <div className="text-[11px] text-slate-500 uppercase font-semibold">
                  Item Code
                </div>
                <div className="font-mono text-sm font-bold text-primary-700 mt-0.5">
                  {item.itemCode}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 uppercase font-semibold">
                  Item Name
                </div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5">
                  {item.itemName}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 uppercase font-semibold mb-1">
                  Account Status
                </div>
                <StatusBadge status={item.status} />
              </div>

              <div>
                <div className="text-[11px] text-slate-500 uppercase font-semibold">
                  Item Group
                </div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5">
                  {item.itemGroup?.groupName ? `${item.itemGroup.groupName} (${item.itemGroup.groupCode})` : '—'}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 uppercase font-semibold">
                  Item Category
                </div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5">
                  {item.itemCategory?.categoryName ? `${item.itemCategory.categoryName} (${item.itemCategory.categoryCode})` : '—'}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 uppercase font-semibold">
                  Item Type
                </div>
                <div className="text-xs capitalize text-slate-800 mt-0.5">
                  {item.itemType || 'Standard'}
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-md p-3 bg-white">
              <div className="text-[11px] text-slate-500 uppercase font-semibold mb-1">
                Item Description & Scope
              </div>
              <div className={`text-xs ${item.description ? 'text-slate-800' : 'text-slate-400'}`}>
                {item.description || 'No detailed description specified.'}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SPECIFICATIONS */}
        {activeTab === 'specifications' && (
          <div className="border border-slate-200 rounded-md p-3 bg-white">
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs font-semibold text-primary-800 flex items-center gap-1.5">
                <Sliders size={14} /> Category Technical Specifications ({specifications.length})
              </div>
              <span className="text-[11.5px] text-slate-500">
                Category: {item.itemCategory?.categoryName || 'General'}
              </span>
            </div>

            {loadingSpecs ? (
              <div className="text-xs text-slate-500 p-2">
                Loading category specifications...
              </div>
            ) : specifications.length === 0 ? (
              <div className="text-xs text-slate-400 p-3 text-center bg-slate-50 rounded">
                No specification parameters configured for this item.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                  <thead className="bg-slate-50 font-semibold text-slate-700">
                    <tr>
                      <th className="px-3 py-2 w-12">Order</th>
                      <th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2">Specification Name</th>
                      <th className="px-3 py-2">Configured Value</th>
                      <th className="px-3 py-2">Unit</th>
                      <th className="px-3 py-2">Flags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {specifications.map((s, idx) => {
                      const spec = s.specification;
                      const uomCode = spec?.unit?.uomCode || spec?.unit?.uomName || '';
                      const displayVal = typeof s.value === 'boolean' ? (s.value ? 'Yes / True' : 'No / False') : String(s.value);
                      return (
                        <tr key={s._id || idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-semibold text-slate-600">{s.printSerial ?? (idx + 1)}</td>
                          <td className="px-3 py-2 font-mono font-semibold text-primary-700">
                            {spec?.specificationCode || 'N/A'}
                          </td>
                          <td className="px-3 py-2 font-semibold text-slate-900">
                            {spec?.specificationName || 'Specification'}
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-bold text-primary-800 text-xs">
                              {displayVal}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {uomCode ? (
                              <span className="text-[11.5px] font-semibold text-slate-700 px-1.5 py-0.5 bg-slate-100 rounded">
                                {uomCode}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              {s.isApply && <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary-100 text-primary-800">Apply</span>}
                              {s.isFix && <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-100 text-emerald-800">Fix</span>}
                              {!s.isApply && !s.isFix && <span className="text-slate-400 text-xs">—</span>}
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
          <div className="border border-slate-200 rounded-md p-3.5 bg-white">
            <div className="text-xs font-semibold text-primary-800 mb-2.5">
              Units of Measure & Conversion Factors
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[11px] uppercase font-semibold text-slate-500">Primary Inventory UOM</span>
                <div className="font-bold text-sm text-primary-800 mt-0.5">
                  {item.inventoryUom?.uomCode} — {item.inventoryUom?.uomName}
                </div>
                <div className="text-[11.5px] text-slate-500 mt-0.5">
                  Dimension: {item.inventoryUom?.dimension || 'COUNT'}
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[11px] uppercase font-semibold text-slate-500">Purchase UOM</span>
                <div className="font-bold text-sm text-slate-900 mt-0.5">
                  {item.purchaseUom?.uomCode || item.inventoryUom?.uomCode}
                </div>
                <div className="text-[11.5px] text-slate-600 mt-0.5">
                  Conversion: 1 Purchase Unit = <strong className="font-semibold text-slate-900">{item.itemPerPurchaseUnit || 1}</strong> Inv Units
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[11px] uppercase font-semibold text-slate-500">Sales UOM</span>
                <div className="font-bold text-sm text-slate-900 mt-0.5">
                  {item.salesUom?.uomCode || item.inventoryUom?.uomCode}
                </div>
                <div className="text-[11.5px] text-slate-600 mt-0.5">
                  Conversion: 1 Sales Unit = <strong className="font-semibold text-slate-900">{item.itemPerSalesUnit || 1}</strong> Inv Units
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INVENTORY CONTROLS */}
        {activeTab === 'inventory' && (
          <div className="border border-slate-200 rounded-md p-3.5 bg-white">
            <div className="text-xs font-semibold text-primary-800 mb-2.5">
              Inventory Control Thresholds & Storage Bin
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 text-[11px]">Reorder Level:</span>
                <div className="font-bold text-sm text-slate-900">{item.reorderLevel ?? 0}</div>
              </div>

              <div>
                <span className="text-slate-500 text-[11px]">Reorder Quantity:</span>
                <div className="font-bold text-sm text-slate-900">{item.reorderQty ?? 0}</div>
              </div>

              <div>
                <span className="text-slate-500 text-[11px]">Minimum Stock:</span>
                <div className="font-bold text-sm text-slate-900">{item.minInventory ?? 0}</div>
              </div>

              <div>
                <span className="text-slate-500 text-[11px]">Maximum Stock:</span>
                <div className="font-bold text-sm text-slate-900">{item.maxInventory ?? 0}</div>
              </div>

              <div>
                <span className="text-slate-500 text-[11px]">Lead Time (Days):</span>
                <div className="font-bold text-sm text-slate-900">{item.leadTimeDays ?? 0} days</div>
              </div>

              <div className="col-span-2 sm:col-span-3">
                <span className="text-slate-500 text-[11px]">Default Storage Location / Bin:</span>
                <div className={`font-semibold ${item.defaultBin ? 'text-primary-800' : 'text-slate-500'}`}>
                  {item.defaultBin?.binCode ? `${item.defaultBin.binCode} — ${item.defaultBin.binName}` : 'Unassigned / Default Warehouse'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ACCOUNTING & HISTORY */}
        {activeTab === 'accounting_history' && (
          <div className="flex flex-col gap-3">
            <div className="border border-slate-200 rounded-md p-3.5 bg-white">
              <div className="text-xs font-semibold text-primary-800 mb-2">
                Accounting & Tax Identification
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px]">HSN / SAC Code:</span>
                  <div className="font-mono font-bold text-sm text-primary-700">
                    {item.hsnCode || 'Unassigned'}
                  </div>
                </div>
                <div className="sm:col-span-2 text-xs text-slate-600 self-center">
                  Harmonized System Nomenclature (HSN) code for GST/customs classification.
                </div>
              </div>
            </div>

            {/* Audit Timestamps */}
            <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50">
              <div className="text-xs font-semibold text-slate-800 mb-2">
                System Audit Log
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                <div>
                  <strong>Created At:</strong> {formatDate(item.createdAt)}
                </div>
                <div>
                  <strong>Last Modified At:</strong> {formatDate(item.updatedAt)}
                </div>
              </div>
            </div>

            {/* Backend Capabilities Note */}
            <div className="text-xs text-slate-500 italic px-2 py-1">
              Note: Dedicated Purchase/Sales GL accounts and Item attachments are managed via transaction vouchers in NETFIL ERP.
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ItemDetailModal;

