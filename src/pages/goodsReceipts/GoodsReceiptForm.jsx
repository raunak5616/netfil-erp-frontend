import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getGoodsReceiptById,
  createGoodsReceipt,
  updateGoodsReceipt,
  getGoodsReceipts
} from '../../services/goodsReceiptService';
import { getPurchaseOrders, getPurchaseOrderById } from '../../services/purchaseOrderService';
import { getPlants } from '../../services/plantService';
import { getStores } from '../../services/storeService';
import { getStorageLocations } from '../../services/storageLocationService';
import { getBins } from '../../services/binService';
import { getUOMs } from '../../services/uomService';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Package,
  Building2,
  Calendar,
  FileText,
  Truck,
  UserCheck,
  CheckCircle,
  MapPin
} from 'lucide-react';

const GoodsReceiptForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dropdown Master Collections
  const [releasedPos, setReleasedPos] = useState([]);
  const [plantsList, setPlantsList] = useState([]);
  const [storesList, setStoresList] = useState([]);
  const [uomsList, setUomsList] = useState([]);

  // Selected PO Details
  const [selectedPO, setSelectedPO] = useState(null);

  // Form Header State
  const [purchaseOrder, setPurchaseOrder] = useState('');
  const [supplierChallanNo, setSupplierChallanNo] = useState('');
  const [supplierChallanDate, setSupplierChallanDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [gateEntryNo, setGateEntryNo] = useState('');
  const [gateEntryDate, setGateEntryDate] = useState('');
  const [lrNo, setLrNo] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [headerPlant, setHeaderPlant] = useState('');
  const [headerStore, setHeaderStore] = useState('');
  const [remarks, setRemarks] = useState('');
  const [grnStatus, setGrnStatus] = useState('DRAFT');

  // Form Line Items State
  // Each line item contains: poItem, item, itemCode, itemName, specification, poQuantity, previouslyReceived, remainingQuantity, receivedQuantity, uom, uomCode, plant, store, storageLocation, bin, availableLocations, availableBins, remarks
  const [lineItems, setLineItems] = useState([]);

  // Load Master Options (Released POs, Plants, Stores, UOMs)
  const loadMasterData = async () => {
    try {
      const [poRes, plantRes, storeRes, uomRes] = await Promise.all([
        getPurchaseOrders({ status: 'RELEASED', limit: 100 }).catch(() => ({ success: false, purchaseOrders: [] })),
        getPlants().catch(() => ({ success: false, plants: [] })),
        getStores().catch(() => ({ success: false, stores: [] })),
        getUOMs().catch(() => ({ success: false, uoms: [] }))
      ]);

      if (poRes.success && Array.isArray(poRes.purchaseOrders)) {
        setReleasedPos(poRes.purchaseOrders);
      }
      if (plantRes.success && Array.isArray(plantRes.plants)) {
        setPlantsList(plantRes.plants.filter((p) => p.status === 'active'));
      } else if (Array.isArray(plantRes)) {
        setPlantsList(plantRes.filter((p) => p.status === 'active'));
      }

      if (storeRes.success && Array.isArray(storeRes.stores)) {
        setStoresList(storeRes.stores.filter((s) => s.status === 'active'));
      } else if (Array.isArray(storeRes)) {
        setStoresList(storeRes.filter((s) => s.status === 'active'));
      }

      if (uomRes.success && Array.isArray(uomRes.uoms)) {
        setUomsList(uomRes.uoms.filter((u) => u.status === 'active'));
      }
    } catch (err) {
      console.error('Failed to load GRN master data:', err);
      setError('Failed to load required master data.');
    }
  };

  // Load Existing GRN for Edit
  const loadExistingGRN = async () => {
    if (!id) return;
    setInitialLoading(true);
    setError('');
    try {
      const res = await getGoodsReceiptById(id);
      if (res.success && res.goodsReceipt) {
        const grn = res.goodsReceipt;
        setGrnStatus(grn.status);

        if (grn.status !== 'DRAFT') {
          setError(`Goods Receipt "${grn.grnNumber}" is in status '${grn.status}' and cannot be edited. Only DRAFT records can be updated.`);
        }

        const poId = typeof grn.purchaseOrder === 'object' ? grn.purchaseOrder._id : grn.purchaseOrder;
        setPurchaseOrder(poId || '');
        if (typeof grn.purchaseOrder === 'object') setSelectedPO(grn.purchaseOrder);

        setSupplierChallanNo(grn.supplierChallanNo || '');
        setSupplierChallanDate(grn.supplierChallanDate ? new Date(grn.supplierChallanDate).toISOString().split('T')[0] : '');
        setGateEntryNo(grn.gateEntryNo || '');
        setGateEntryDate(grn.gateEntryDate ? new Date(grn.gateEntryDate).toISOString().split('T')[0] : '');
        setLrNo(grn.lrNo || '');
        setTransporterName(grn.transporterName || '');
        setVehicleNo(grn.vehicleNo || '');
        const plantId = typeof grn.plant === 'object' ? grn.plant._id : grn.plant;
        const storeId = typeof grn.store === 'object' ? grn.store._id : grn.store;
        setHeaderPlant(plantId || '');
        setHeaderStore(storeId || '');
        setRemarks(grn.remarks || '');

        // Fetch PO details & previously posted GRNs to compute accurate remaining quantities
        let poItemsMap = new Map();
        let prevReceivedMap = new Map();

        if (poId) {
          const [poDetailRes, prevGrnRes] = await Promise.all([
            getPurchaseOrderById(poId).catch(() => null),
            getGoodsReceipts({ purchaseOrder: poId, status: 'POSTED', limit: 100 }).catch(() => null)
          ]);

          if (poDetailRes && poDetailRes.success && poDetailRes.purchaseOrder) {
            setSelectedPO(poDetailRes.purchaseOrder);
            poDetailRes.purchaseOrder.items.forEach((pi) => poItemsMap.set(pi._id.toString(), pi));
          }

          if (prevGrnRes && prevGrnRes.success && Array.isArray(prevGrnRes.goodsReceipts)) {
            prevGrnRes.goodsReceipts.forEach((g) => {
              if (g._id.toString() !== grn._id.toString()) { // Exclude current GRN if edited
                g.items.forEach((item) => {
                  const key = item.poItem ? item.poItem.toString() : item.item?._id?.toString() || item.item?.toString();
                  if (key) prevReceivedMap.set(key, (prevReceivedMap.get(key) || 0) + (Number(item.receivedQuantity) || 0));
                });
              }
            });
          }
        }

        // Build item rows for edit mode
        if (Array.isArray(grn.items) && grn.items.length > 0) {
          const builtItems = await Promise.all(
            grn.items.map(async (i) => {
              const poItemRef = i.poItem ? i.poItem.toString() : null;
              const itemRef = typeof i.item === 'object' ? i.item._id : i.item;
              const poItemDoc = poItemRef ? poItemsMap.get(poItemRef) : null;
              const poQty = poItemDoc ? poItemDoc.quantity : (i.poQuantity || 0);

              const key = poItemRef || itemRef?.toString();
              const prevRec = key ? (prevReceivedMap.get(key) || 0) : 0;
              const remaining = Math.max(0, poQty - prevRec);

              const iPlant = typeof i.plant === 'object' ? i.plant._id : (i.plant || plantId);
              const iStore = typeof i.store === 'object' ? i.store._id : (i.store || storeId);
              const iLoc = typeof i.storageLocation === 'object' ? i.storageLocation._id : i.storageLocation;
              const iBin = typeof i.bin === 'object' ? i.bin._id : i.bin;

              // Fetch locations for store
              let locs = [];
              if (iStore) {
                const locRes = await getStorageLocations({ store: iStore }).catch(() => ({ storageLocations: [] }));
                locs = locRes.storageLocations || locRes || [];
              }

              // Fetch bins for location
              let bins = [];
              if (iLoc) {
                const binRes = await getBins({ storageLocation: iLoc }).catch(() => ({ bins: [] }));
                bins = binRes.bins || binRes || [];
              }

              return {
                poItem: poItemRef,
                item: itemRef,
                itemCode: i.itemCodeSnapshot || i.item?.itemCode || '',
                itemName: i.itemNameSnapshot || i.item?.itemName || '',
                specification: i.specification || poItemDoc?.specification || '',
                poQuantity: poQty,
                previouslyReceived: prevRec,
                remainingQuantity: remaining,
                receivedQuantity: i.receivedQuantity || 1,
                uom: typeof i.uom === 'object' ? i.uom._id : i.uom,
                uomCode: i.uomCodeSnapshot || i.uom?.uomCode || '',
                plant: iPlant,
                store: iStore,
                storageLocation: iLoc || '',
                bin: iBin || '',
                availableLocations: locs,
                availableBins: bins,
                remarks: i.remarks || ''
              };
            })
          );
          setLineItems(builtItems);
        }
      } else {
        setError('Goods Receipt record not found.');
      }
    } catch (err) {
      console.error('Failed to fetch Goods Receipt:', err);
      setError(err.response?.data?.message || 'Error loading Goods Receipt details');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadMasterData();
      if (isEditMode) {
        await loadExistingGRN();
      }
    };
    init();
  }, [id]);

  // Filter stores by selected plant
  const filteredStoresForPlant = useMemo(() => {
    if (!headerPlant) return storesList;
    return storesList.filter((s) => {
      const pId = typeof s.plant === 'object' ? s.plant?._id : s.plant;
      return !pId || pId === headerPlant;
    });
  }, [storesList, headerPlant]);

  // Handle PO Selection Change (Create Mode)
  const handlePOChange = async (poId) => {
    setPurchaseOrder(poId);
    if (!poId) {
      setSelectedPO(null);
      setLineItems([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [poDetailRes, prevGrnRes] = await Promise.all([
        getPurchaseOrderById(poId),
        getGoodsReceipts({ purchaseOrder: poId, status: 'POSTED', limit: 100 }).catch(() => ({ goodsReceipts: [] }))
      ]);

      if (poDetailRes.success && poDetailRes.purchaseOrder) {
        const po = poDetailRes.purchaseOrder;
        setSelectedPO(po);

        // Map previously received quantities per PO line item
        const prevReceivedMap = new Map();
        if (prevGrnRes.success && Array.isArray(prevGrnRes.goodsReceipts)) {
          prevGrnRes.goodsReceipts.forEach((g) => {
            g.items.forEach((item) => {
              const key = item.poItem ? item.poItem.toString() : item.item?._id?.toString() || item.item?.toString();
              if (key) {
                prevReceivedMap.set(key, (prevReceivedMap.get(key) || 0) + (Number(item.receivedQuantity) || 0));
              }
            });
          });
        }

        // Set default plant & store from PO department / default if available
        const defaultPlantId = headerPlant || (plantsList.length > 0 ? plantsList[0]._id : '');
        const defaultStoreId = headerStore || (storesList.length > 0 ? storesList[0]._id : '');

        if (!headerPlant && defaultPlantId) setHeaderPlant(defaultPlantId);
        if (!headerStore && defaultStoreId) setHeaderStore(defaultStoreId);

        // Fetch initial storage locations for default store
        let locs = [];
        if (defaultStoreId) {
          const locRes = await getStorageLocations({ store: defaultStoreId }).catch(() => ({ storageLocations: [] }));
          locs = locRes.storageLocations || locRes || [];
        }

        // Populate line items from PO items
        if (Array.isArray(po.items) && po.items.length > 0) {
          const itemsWithAllocations = await Promise.all(
            po.items.map(async (pi) => {
              const key = pi._id.toString();
              const prevRec = prevReceivedMap.get(key) || 0;
              const remaining = Math.max(0, (Number(pi.quantity) || 0) - prevRec);

              return {
                poItem: pi._id,
                item: pi.item?._id || pi.item,
                itemCode: pi.itemCodeSnapshot || pi.item?.itemCode || '',
                itemName: pi.itemNameSnapshot || pi.item?.itemName || '',
                specification: pi.specification || '',
                poQuantity: Number(pi.quantity) || 0,
                previouslyReceived: prevRec,
                remainingQuantity: remaining,
                receivedQuantity: remaining > 0 ? remaining : 0, // default to remaining
                uom: pi.uom?._id || pi.uom,
                uomCode: pi.uomCodeSnapshot || pi.uom?.uomCode || '',
                plant: defaultPlantId,
                store: defaultStoreId,
                storageLocation: locs.length > 0 ? locs[0]._id : '',
                bin: '',
                availableLocations: locs,
                availableBins: [],
                remarks: ''
              };
            })
          );

          setLineItems(itemsWithAllocations);
        }
      } else {
        setError('Failed to fetch Purchase Order details.');
      }
    } catch (err) {
      console.error('PO selection error:', err);
      setError(err.response?.data?.message || 'Error loading Purchase Order');
    } finally {
      setLoading(false);
    }
  };

  // Location Hierarchy Handlers
  const handleLineStoreChange = async (index, storeId) => {
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      store: storeId,
      storageLocation: '',
      bin: '',
      availableLocations: [],
      availableBins: []
    };
    setLineItems(updated);

    if (storeId) {
      try {
        const locRes = await getStorageLocations({ store: storeId });
        const locs = locRes.storageLocations || locRes || [];
        const latest = [...lineItems];
        latest[index].availableLocations = locs;
        if (locs.length > 0) {
          latest[index].storageLocation = locs[0]._id;
          // Auto load bins for first location
          handleLineLocationChange(index, locs[0]._id, latest);
        } else {
          setLineItems(latest);
        }
      } catch (err) {
        console.error('Failed to fetch locations for store:', err);
      }
    }
  };

  const handleLineLocationChange = async (index, locId, currentItemsState) => {
    const listToUpdate = currentItemsState ? [...currentItemsState] : [...lineItems];
    listToUpdate[index] = {
      ...listToUpdate[index],
      storageLocation: locId,
      bin: '',
      availableBins: []
    };
    setLineItems(listToUpdate);

    if (locId) {
      try {
        const binRes = await getBins({ storageLocation: locId });
        const bins = binRes.bins || binRes || [];
        const latest = currentItemsState ? [...currentItemsState] : [...lineItems];
        latest[index].availableBins = bins;
        if (bins.length > 0) latest[index].bin = bins[0]._id;
        setLineItems([...latest]);
      } catch (err) {
        console.error('Failed to fetch bins for location:', err);
      }
    }
  };

  const handleLineFieldChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setLineItems(updated);
  };

  // Receipt Quantity Summary calculation
  const summaryTotals = useMemo(() => {
    let totalPOQty = 0;
    let totalPrevReceived = 0;
    let totalRemaining = 0;
    let currentGRNQty = 0;

    lineItems.forEach((line) => {
      totalPOQty += Number(line.poQuantity) || 0;
      totalPrevReceived += Number(line.previouslyReceived) || 0;
      totalRemaining += Number(line.remainingQuantity) || 0;
      currentGRNQty += Number(line.receivedQuantity) || 0;
    });

    return {
      totalPOQty,
      totalPrevReceived,
      totalRemaining,
      currentGRNQty
    };
  }, [lineItems]);

  // Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Frontend Validations
    if (!purchaseOrder) {
      setError('Purchase Order selection is required.');
      return;
    }
    if (!supplierChallanNo || !supplierChallanNo.trim()) {
      setError('Supplier Challan Number is required.');
      return;
    }
    if (!supplierChallanDate) {
      setError('Supplier Challan Date is required.');
      return;
    }
    if (!headerPlant) {
      setError('Plant location selection is required.');
      return;
    }
    if (!headerStore) {
      setError('Store location selection is required.');
      return;
    }
    if (!lineItems || lineItems.length === 0) {
      setError('At least one line item is required.');
      return;
    }

    // Duplicate item check
    const itemIdsSeen = new Set();

    // Validate each line item
    for (let idx = 0; idx < lineItems.length; idx++) {
      const line = lineItems[idx];
      const lineNo = idx + 1;

      if (!line.item) {
        setError(`Line Item #${lineNo}: Item reference is missing.`);
        return;
      }

      const itemIdStr = line.item.toString();
      if (itemIdsSeen.has(itemIdStr)) {
        setError(`Line Item #${lineNo}: Duplicate item "${line.itemName || line.itemCode}" found. Duplicate items are not allowed in GRN.`);
        return;
      }
      itemIdsSeen.add(itemIdStr);

      const recQty = Number(line.receivedQuantity);
      if (Number.isNaN(recQty) || recQty <= 0) {
        setError(`Line Item #${lineNo} (${line.itemName}): Received quantity must be greater than 0.`);
        return;
      }

      if (!isEditMode && recQty > line.remainingQuantity) {
        setError(`Line Item #${lineNo} (${line.itemName}): Received quantity (${recQty}) cannot exceed remaining PO quantity (${line.remainingQuantity}).`);
        return;
      }

      if (!line.plant || !line.store || !line.storageLocation || !line.bin) {
        setError(`Line Item #${lineNo} (${line.itemName}): Complete destination hierarchy (Plant -> Store -> Storage Location -> Bin) is required.`);
        return;
      }
    }

    const payload = {
      purchaseOrder,
      supplierChallanNo: supplierChallanNo.trim(),
      supplierChallanDate,
      gateEntryNo: gateEntryNo.trim(),
      gateEntryDate: gateEntryDate || null,
      lrNo: lrNo.trim(),
      transporterName: transporterName.trim(),
      vehicleNo: vehicleNo.trim(),
      plant: headerPlant,
      store: headerStore,
      remarks,
      items: lineItems.map((li) => ({
        poItem: li.poItem || null,
        item: li.item,
        receivedQuantity: Number(li.receivedQuantity),
        acceptedQuantity: Number(li.receivedQuantity),
        rejectedQuantity: 0,
        uom: li.uom,
        plant: li.plant || headerPlant,
        store: li.store || headerStore,
        storageLocation: li.storageLocation,
        bin: li.bin,
        remarks: li.remarks || ''
      }))
    };

    setLoading(true);
    try {
      let res;
      if (isEditMode) {
        res = await updateGoodsReceipt(id, payload);
      } else {
        res = await createGoodsReceipt(payload);
      }

      if (res.success && res.goodsReceipt) {
        setSuccess(res.message || 'Goods Receipt saved successfully.');
        setTimeout(() => {
          navigate(`/goods-receipts/${res.goodsReceipt._id}`);
        }, 800);
      } else {
        setError(res.message || 'Failed to save Goods Receipt.');
      }
    } catch (err) {
      console.error('Save Goods Receipt Error:', err);
      setError(err.response?.data?.message || 'Error saving Goods Receipt. Please check form inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-xs font-semibold">Loading Goods Receipt details...</span>
      </div>
    );
  }

  const isFormDisabled = isEditMode && grnStatus !== 'DRAFT';

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditMode ? 'Edit Goods Receipt (GRN)' : 'Create Goods Receipt (GRN)'}
        subtitle={isEditMode ? 'Update DRAFT goods receipt details, delivery challan information, and bin assignments.' : 'Receive inward materials against a RELEASED Purchase Order and assign warehouse bins.'}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/goods-receipts')}
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Back to Goods Receipts
          </Button>
        }
      />

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* PURCHASE ORDER & SUPPLIER REFERENCE CARD */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <UserCheck size={16} className="text-blue-600" />
            Purchase Order Reference
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* PO Dropdown */}
            <FormField label="Target Purchase Order (RELEASED)" required className="lg:col-span-2">
              <Select
                value={purchaseOrder}
                onChange={(e) => handlePOChange(e.target.value)}
                disabled={isFormDisabled || isEditMode}
                required
              >
                <option value="">-- Select Released PO --</option>
                {releasedPos.map((po) => (
                  <option key={po._id} value={po._id}>
                    {po.poNumber} — {po.supplierNameSnapshot || po.supplier?.companyName} ({new Date(po.poDate).toLocaleDateString('en-GB')})
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Supplier Name (Readonly) */}
            <FormField label="Supplier (Party)">
              <Input
                type="text"
                value={selectedPO ? (selectedPO.supplierNameSnapshot || selectedPO.supplier?.companyName || '') : ''}
                readOnly
                disabled
                placeholder="Auto populated from PO"
                className="bg-slate-100 font-semibold text-slate-800"
              />
            </FormField>

            {/* Expected Delivery Date (Readonly) */}
            <FormField label="PO Expected Delivery Date">
              <Input
                type="text"
                value={selectedPO && selectedPO.expectedDeliveryDate ? new Date(selectedPO.expectedDeliveryDate).toLocaleDateString('en-GB') : ''}
                readOnly
                disabled
                placeholder="Auto populated from PO"
                className="bg-slate-100 font-mono text-slate-700"
              />
            </FormField>

          </div>
        </div>

        {/* SUPPLIER CHALLAN & GATE ENTRY DETAILS CARD */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <Truck size={16} className="text-blue-600" />
            Supplier Delivery Challan & Logistics Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Supplier Challan No */}
            <FormField label="Supplier Challan No." required>
              <Input
                type="text"
                placeholder="e.g. CH-2026/8892"
                value={supplierChallanNo}
                onChange={(e) => setSupplierChallanNo(e.target.value)}
                disabled={isFormDisabled}
                required
              />
            </FormField>

            {/* Supplier Challan Date */}
            <FormField label="Supplier Challan Date" required>
              <Input
                type="date"
                value={supplierChallanDate}
                onChange={(e) => setSupplierChallanDate(e.target.value)}
                disabled={isFormDisabled}
                required
              />
            </FormField>

            {/* Gate Entry No */}
            <FormField label="Gate Entry No.">
              <Input
                type="text"
                placeholder="e.g. GE-9012"
                value={gateEntryNo}
                onChange={(e) => setGateEntryNo(e.target.value)}
                disabled={isFormDisabled}
              />
            </FormField>

            {/* Gate Entry Date */}
            <FormField label="Gate Entry Date">
              <Input
                type="date"
                value={gateEntryDate}
                onChange={(e) => setGateEntryDate(e.target.value)}
                disabled={isFormDisabled}
              />
            </FormField>

            {/* LR Number */}
            <FormField label="L.R. / Lorry Receipt No.">
              <Input
                type="text"
                placeholder="e.g. LR-77112"
                value={lrNo}
                onChange={(e) => setLrNo(e.target.value)}
                disabled={isFormDisabled}
              />
            </FormField>

            {/* Transporter Name */}
            <FormField label="Transporter Name">
              <Input
                type="text"
                placeholder="e.g. Blue Dart Logistics"
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                disabled={isFormDisabled}
              />
            </FormField>

            {/* Vehicle Number */}
            <FormField label="Vehicle Number">
              <Input
                type="text"
                placeholder="e.g. MH-12-AB-1234"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                disabled={isFormDisabled}
              />
            </FormField>

            {/* Header Remarks */}
            <FormField label="GRN Inward Remarks">
              <Input
                type="text"
                placeholder="Condition on receipt..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={isFormDisabled}
              />
            </FormField>

          </div>
        </div>

        {/* DEFAULT DESTINATION LOCATION CARD */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" />
            Default Warehouse Inward Location
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Header Plant */}
            <FormField label="Default Plant" required>
              <Select
                value={headerPlant}
                onChange={(e) => setHeaderPlant(e.target.value)}
                disabled={isFormDisabled}
                required
              >
                <option value="">-- Select Plant --</option>
                {plantsList.map((pl) => (
                  <option key={pl._id} value={pl._id}>
                    {pl.plantName} ({pl.plantCode})
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Header Store */}
            <FormField label="Default Store" required>
              <Select
                value={headerStore}
                onChange={(e) => setHeaderStore(e.target.value)}
                disabled={isFormDisabled}
                required
              >
                <option value="">-- Select Store --</option>
                {filteredStoresForPlant.map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.storeName} ({st.storeCode})
                  </option>
                ))}
              </Select>
            </FormField>

          </div>
        </div>

        {/* GRN LINE ITEMS & BIN ALLOCATION TABLE */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Package size={16} className="text-blue-600" />
              Inward Line Items & Storage Bin Allocations ({lineItems.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="px-3 py-2 w-10 text-center">#</th>
                  <th className="px-3 py-2 min-w-[160px]">Item Description</th>
                  <th className="px-3 py-2 w-20 text-right">PO Qty</th>
                  <th className="px-3 py-2 w-24 text-right">Prev Rec</th>
                  <th className="px-3 py-2 w-24 text-right">Remaining</th>
                  <th className="px-3 py-2 w-24 text-right">Received Qty <span className="text-red-500">*</span></th>
                  <th className="px-3 py-2 w-20">UOM</th>
                  <th className="px-3 py-2 min-w-[130px]">Store <span className="text-red-500">*</span></th>
                  <th className="px-3 py-2 min-w-[140px]">Storage Location <span className="text-red-500">*</span></th>
                  <th className="px-3 py-2 min-w-[120px]">Bin <span className="text-red-500">*</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-slate-400 italic">
                      Please select a RELEASED Purchase Order above to populate line items.
                    </td>
                  </tr>
                ) : (
                  lineItems.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                      
                      {/* Item Info */}
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-900">{line.itemName}</div>
                        <div className="font-mono text-[11px] text-slate-500">{line.itemCode}</div>
                      </td>

                      {/* PO Qty */}
                      <td className="px-3 py-2 text-right font-mono font-medium text-slate-700">
                        {line.poQuantity}
                      </td>

                      {/* Previously Received */}
                      <td className="px-3 py-2 text-right font-mono text-amber-700">
                        {line.previouslyReceived}
                      </td>

                      {/* Remaining */}
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">
                        {line.remainingQuantity}
                      </td>

                      {/* Received Quantity Input */}
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          step="any"
                          min="0.0001"
                          max={line.remainingQuantity}
                          value={line.receivedQuantity}
                          onChange={(e) => handleLineFieldChange(idx, 'receivedQuantity', e.target.value)}
                          disabled={isFormDisabled}
                          required
                          className="text-right font-bold text-blue-700"
                        />
                      </td>

                      {/* UOM */}
                      <td className="px-3 py-2 font-semibold text-slate-700">
                        {line.uomCode || '—'}
                      </td>

                      {/* Store Select */}
                      <td className="px-3 py-2">
                        <Select
                          value={line.store}
                          onChange={(e) => handleLineStoreChange(idx, e.target.value)}
                          disabled={isFormDisabled}
                          required
                          className="text-xs"
                        >
                          <option value="">-- Select Store --</option>
                          {storesList.map((st) => (
                            <option key={st._id} value={st._id}>
                              {st.storeName}
                            </option>
                          ))}
                        </Select>
                      </td>

                      {/* Storage Location Select */}
                      <td className="px-3 py-2">
                        <Select
                          value={line.storageLocation}
                          onChange={(e) => handleLineLocationChange(idx, e.target.value)}
                          disabled={isFormDisabled}
                          required
                          className="text-xs"
                        >
                          <option value="">-- Select Loc --</option>
                          {(line.availableLocations || []).map((loc) => (
                            <option key={loc._id} value={loc._id}>
                              {loc.locationName} ({loc.locationCode})
                            </option>
                          ))}
                        </Select>
                      </td>

                      {/* Bin Select */}
                      <td className="px-3 py-2">
                        <Select
                          value={line.bin}
                          onChange={(e) => handleLineFieldChange(idx, 'bin', e.target.value)}
                          disabled={isFormDisabled}
                          required
                          className="text-xs"
                        >
                          <option value="">-- Select Bin --</option>
                          {(line.availableBins || []).map((b) => (
                            <option key={b._id} value={b._id}>
                              {b.binCode}
                            </option>
                          ))}
                        </Select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECEIPT QUANTITY SUMMARY CARD */}
        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md space-y-3 font-mono">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-400" /> Receipt Quantity Fulfillment Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-300 pt-1">
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <span className="text-slate-400 text-[11px] block">Total PO Quantity:</span>
              <span className="text-base font-bold text-white">{summaryTotals.totalPOQty.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <span className="text-amber-400 text-[11px] block">Previously Received:</span>
              <span className="text-base font-bold text-amber-300">{summaryTotals.totalPrevReceived.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <span className="text-sky-400 text-[11px] block">Remaining Balance:</span>
              <span className="text-base font-bold text-sky-300">{summaryTotals.totalRemaining.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-3 bg-emerald-950/60 rounded-lg border border-emerald-700/50">
              <span className="text-emerald-400 text-[11px] block">This GRN Received:</span>
              <span className="text-lg font-bold text-emerald-300">{summaryTotals.currentGRNQty.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic pt-1">
            * Note: Material stock levels are posted to warehouse inventory only when this GRN is explicitly POSTED.
          </p>
        </div>

        {/* SUBMIT BUTTONS BAR */}
        <div className="flex items-center justify-end gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/goods-receipts')}
            disabled={loading}
          >
            Cancel
          </Button>

          {!isFormDisabled && (
            <Button
              type="submit"
              variant="primary"
              disabled={loading || lineItems.length === 0}
            >
              <Save size={14} className="mr-1.5" />
              {loading ? 'Saving...' : isEditMode ? 'Update Goods Receipt' : 'Save as Draft GRN'}
            </Button>
          )}
        </div>

      </form>
    </div>
  );
};

export default GoodsReceiptForm;
