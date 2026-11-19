import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  useCreateItemMutation,
  useUpdateItemMutation,
  useGetNextItemCodeQuery,
  useGetItemSpecificationsQuery,
  useAssignItemSpecificationMutation,
  useUpdateItemSpecificationMutation,
  useUploadItemImageMutation,
  useRemoveItemImageMutation,
} from '../../features/products/productsApi';
import {
  useGetItemGroupsQuery,
  useGetItemCategoriesQuery,
  useGetCategorySpecificationsQuery,
  useGetUOMsQuery,
  useGetFilterGradesQuery,
  useGetSpecificationsQuery,
  useLazyLookupFaceVelocityQuery,
} from '../../features/masterData/masterDataApi';
import { useGetBinsQuery } from '../../features/stores/storesApi';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select } from '../../components/ui/FormField';
import DrawingSelector from '../../components/drawing/DrawingSelector';
import {
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  Eye,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Layers,
  Sliders,
  CheckCircle2,
  Package,
  Wrench,
  X,
  Maximize2,
  Info,
  Box,
  Filter,
  Wind,
  Check,
  ArrowLeft,
  ArrowRight,
  Thermometer,
  ShieldCheck,
  FileText,
  Hash,
  AlertTriangle,
  Gauge,
  Lock,
  Unlock,
  RotateCcw,
} from 'lucide-react';

const PRODUCT_TYPE_TO_ITEM_TYPE = {
  RAW_ITEM: 'raw_material',
  FILTER: 'finished_goods',
  COIL: 'finished_goods',
  AHU: 'finished_goods',
};

// Fixed predefined system category codes
const FIXED_CATEGORY_CODES = ['RAW', 'FILTER', 'COIL', 'AHU'];

// 4 Selectable Item Groups for Step 1
const ITEM_GROUP_CARDS = [
  {
    id: 'FILTER',
    name: 'Filter',
    productType: 'FILTER',
    description: 'Air filter elements with standard filter grades and construction options.',
    icon: Filter,
    color: 'blue'
  },
  {
    id: 'COIL',
    name: 'Coil',
    productType: 'COIL',
    description: 'Heating and cooling heat exchanger coils.',
    icon: Layers,
    color: 'cyan'
  },
  {
    id: 'AHU',
    name: 'AHU',
    productType: 'AHU',
    description: 'Air Handling Unit modular ventilation equipment.',
    icon: Wind,
    color: 'indigo'
  },
  {
    id: 'RAW_ITEM',
    name: 'Raw Material',
    productType: 'RAW_ITEM',
    description: 'General raw materials, metal sheets, and inventory parts.',
    icon: Package,
    color: 'amber'
  }
];

// Temperature ranges and reference adhesive and gasket MOC mappings per requirements
// Range string must be stored as the range itself (e.g. 20–70 °C), NOT converted to a number.
const TEMPERATURE_RANGE_OPTIONS = [
  {
    id: '20-70',
    rangeLabel: '20–70 °C',
    adhesiveName: 'PU',
    bondingValue: 'PU',
    gasketMoc: 'EPDM',
    defaultMoc: 'Aluminium',
    minTemp: 20,
    maxTemp: 70
  },
  {
    id: '70-150',
    rangeLabel: '70–150 °C',
    adhesiveName: 'PU',
    bondingValue: 'PU',
    gasketMoc: 'EPDM',
    defaultMoc: 'Aluminium',
    minTemp: 70,
    maxTemp: 150
  },
  {
    id: '150-200',
    rangeLabel: '150–200 °C',
    adhesiveName: 'Epoxy',
    bondingValue: 'Epoxy',
    gasketMoc: 'EPDM',
    defaultMoc: 'Aluminium',
    minTemp: 150,
    maxTemp: 200
  },
  {
    id: '200-250',
    rangeLabel: '200–250 °C',
    adhesiveName: 'Epoxy',
    bondingValue: 'Epoxy',
    gasketMoc: 'EPDM',
    defaultMoc: 'SS304',
    minTemp: 200,
    maxTemp: 250
  },
  {
    id: '250-350',
    rangeLabel: '250–350 °C',
    adhesiveName: 'Silicon based Ceramic',
    bondingValue: 'Silicon based Ceramic',
    gasketMoc: 'Glass Fiber Pad',
    defaultMoc: 'SS304',
    minTemp: 250,
    maxTemp: 350
  }
];

// Standard Gasket MOC options (Only EPDM and Glass Fiber Pad)
const STANDARD_GASKET_MOC_OPTIONS = [
  'EPDM',
  'Glass Fiber Pad'
];

// Standard MOC options (Only Aluminium, SS304, SS316)
const STANDARD_MOC_OPTIONS = [
  'Aluminium',
  'SS304',
  'SS316'
];

const ItemFormModal = ({
  item,
  isOpen,
  onClose,
  onSuccess,
  initialProductType = '',
  initialItemName = '',
}) => {
  const isEditMode = !!item;

  // Exact Four-Step Workflow Sequence:
  // Step 1: Item Group
  // Step 2: Item Details
  // Step 3: Filter Config (or Configuration / Specifications for non-filter)
  // Step 4: Review & Save
  const [currentStep, setCurrentStep] = useState(isEditMode ? 2 : 1);

  const [filterType, setFilterType] = useState(
    (item?.filterType === 'BOX' || item?.filterType === 'FLANGE')
      ? item.filterType
      : (item?.constructionType === 'BOX' || item?.constructionType === 'FLANGE')
        ? item.constructionType
        : ''
  );

  const [selectedItemGroupId, setSelectedItemGroupId] = useState('');
  const [selectedMicron, setSelectedMicron] = useState('');
  const [isGradeMicronLocked, setIsGradeMicronLocked] = useState(false);
  const [selectedTempRangeId, setSelectedTempRangeId] = useState('');
  const [isMocManuallySelected, setIsMocManuallySelected] = useState(false);
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [previewImageModalOpen, setPreviewImageModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    itemCode: 'AUTO',
    itemName: initialItemName || '',
    itemGroup: '',
    itemCategory: '',
    inventoryUom: '',
    purchaseUom: '',
    salesUom: '',
    itemPerPurchaseUnit: 1,
    itemPerSalesUnit: 1,
    hsnCode: '',
    reorderLevel: 0,
    reorderQty: 0,
    minInventory: 0,
    maxInventory: 0,
    leadTimeDays: 0,
    defaultBin: '',
    description: '',
    itemType: PRODUCT_TYPE_TO_ITEM_TYPE[initialProductType] || 'raw_material',
    productType: initialProductType || '',
    filterGrade: '',
    filterGradeVariant: '',
    drawing: '',
    drawingSnapshot: null,
    status: 'active',
    // Technical Filter Fields
    filterType: '',
    imageUrl: '',
    imagePublicId: '',
    constructionType: '',
    moc: '',
    customMoc: '',
    flangeType: '',
    filterLength: '',
    filterWidth: '',
    filterDepth: '',
    faceVelocity: '',
    faceVelocityMaster: '',
    pleatsPerFeet: '',
    filtrationArea: '',
    temperatureRating: '',
    temperatureRange: '',
    gasketMoc: 'EPDM',
    customGasketMoc: '',
    bonding: '',
    noOfFolds: '',
  });

  // Specification state: map of specId -> { value, isApply, isFix, isExisting }
  const [specsData, setSpecsData] = useState({});

  // RTK Query Master Data
  const { data: groupsRes, isLoading: loadingGroups } = useGetItemGroupsQuery(
    { typeFilter: 'MASTER', status: 'active' },
    { skip: !isOpen }
  );
  const { data: catsRes, isLoading: loadingCats } = useGetItemCategoriesQuery({ typeFilter: 'MASTER' }, { skip: !isOpen });
  const { data: uomsRes, isLoading: loadingUoms } = useGetUOMsQuery({}, { skip: !isOpen });
  const { data: binsRes, isLoading: loadingBins } = useGetBinsQuery({}, { skip: !isOpen });
  const { data: fgsRes, isLoading: loadingFgs } = useGetFilterGradesQuery({}, { skip: !isOpen });
  const { data: allSpecsRes } = useGetSpecificationsQuery({}, { skip: !isOpen });

  // Dynamic next Item Code preview based on Filter Type
  const { data: nextCodeRes, isFetching: isFetchingNextCode } = useGetNextItemCodeQuery(
    { filterType: formData.productType === 'FILTER' ? filterType : '' },
    { skip: !isOpen || isEditMode || (formData.productType === 'FILTER' && !filterType) }
  );

  // Face Velocity Master dynamic lookup
  const [triggerLookupFaceVelocity, { isFetching: isFetchingFaceVelocity }] = useLazyLookupFaceVelocityQuery();
  const [matchedFaceVelocityConfig, setMatchedFaceVelocityConfig] = useState(null);
  const [faceVelocityLookupAttempted, setFaceVelocityLookupAttempted] = useState(false);
  const [faceVelocityAmbiguityError, setFaceVelocityAmbiguityError] = useState('');
  const lookupRequestIdRef = useRef(0);

  const displayItemCode = useMemo(() => {
    if (isEditMode) return formData.itemCode || '—';
    if (formData.productType === 'FILTER') {
      if (!filterType) return '';
      if (nextCodeRes?.filterType === filterType && nextCodeRes?.nextItemCode) {
        return nextCodeRes.nextItemCode;
      }
      if (isFetchingNextCode) {
        return filterType === 'BOX' ? 'Generating NFB...' : 'Generating NFF...';
      }
      return filterType === 'BOX'
        ? (nextCodeRes?.nextItemCode || 'NFB-0001')
        : (nextCodeRes?.nextItemCode || 'NFF-0001');
    }
    return nextCodeRes?.nextItemCode || 'AUTO GENERATED';
  }, [isEditMode, formData.itemCode, formData.productType, filterType, nextCodeRes, isFetchingNextCode]);

  useEffect(() => {
    if (!isEditMode) {
      if (formData.productType === 'FILTER') {
        if (filterType === 'BOX') {
          const code = (nextCodeRes?.filterType === 'BOX' && nextCodeRes?.nextItemCode)
            ? nextCodeRes.nextItemCode
            : 'NFB-0001';
          setFormData((prev) => ({ ...prev, itemCode: code }));
        } else if (filterType === 'FLANGE') {
          const code = (nextCodeRes?.filterType === 'FLANGE' && nextCodeRes?.nextItemCode)
            ? nextCodeRes.nextItemCode
            : 'NFF-0001';
          setFormData((prev) => ({ ...prev, itemCode: code }));
        } else {
          setFormData((prev) => ({ ...prev, itemCode: 'AUTO' }));
        }
      } else {
        setFormData((prev) => ({ ...prev, itemCode: nextCodeRes?.nextItemCode || 'AUTO' }));
      }
    }
  }, [filterType, formData.productType, nextCodeRes, isEditMode]);

  const isFlange = (filterType || formData.constructionType || '').toUpperCase() === 'FLANGE';
  const isBox = (filterType || formData.constructionType || '').toUpperCase() === 'BOX';

  // Resolve master temperature spec & configured UOM
  const tempSpec = useMemo(() => {
    const list = allSpecsRes?.specifications || [];
    return list.find((s) => {
      const code = (s.specificationCode || '').toUpperCase().trim();
      const name = (s.specificationName || '').toUpperCase().trim();
      return code.includes('TEMP') || name.includes('TEMPERATURE') || name.includes('OPERATING TEMP');
    });
  }, [allSpecsRes]);

  const tempUom = tempSpec?.unit?.uomCode || '°C';

  const isSystemCode = (code) => {
    if (!code) return false;
    const u = String(code).toUpperCase();
    return (
      u.startsWith('CAT-WO-') ||
      u === 'CAT-INV' ||
      u === 'CAT-OBOM' ||
      u.startsWith('GP-WO-') ||
      u === 'GP-INV' ||
      u === 'GP-OBOM'
    );
  };

  const itemGroups = useMemo(() => {
    const raw = groupsRes?.itemGroups || groupsRes?.groups || [];
    return Array.isArray(raw) ? raw.filter((g) => g.status === 'active' && !isSystemCode(g.groupCode)) : [];
  }, [groupsRes]);

  const itemCategories = useMemo(() => {
    const raw = catsRes?.itemCategories || catsRes?.categories || [];
    return Array.isArray(raw) ? raw.filter((c) => c.status === 'active' && !isSystemCode(c.categoryCode)) : [];
  }, [catsRes]);

  const uoms = useMemo(() => {
    const raw = uomsRes?.uoms || [];
    return Array.isArray(raw) ? raw.filter((u) => u.status === 'active') : [];
  }, [uomsRes]);

  const bins = useMemo(() => {
    const raw = binsRes?.bins || [];
    return Array.isArray(raw) ? raw.filter((b) => b.status === 'active') : [];
  }, [binsRes]);

  const filterGrades = useMemo(() => {
    const raw = fgsRes?.filterGrades || [];
    return Array.isArray(raw) ? raw.filter((f) => f.status === 'active') : [];
  }, [fgsRes]);

  // Helper to extract micron rating from a FilterGrade document
  const getMicronForGrade = useCallback((fgId) => {
    if (!fgId) return '';
    const fg = filterGrades.find(f => String(f._id) === String(fgId));
    if (!fg || !Array.isArray(fg.variants)) return '';
    for (const v of fg.variants) {
      if (v.efficiency) {
        const m = v.efficiency.match(/@\s*([0-9.]+)\s*(?:micron|µm)/i) || v.efficiency.match(/([0-9.]+)\s*(?:micron|µm)/i);
        if (m && m[1]) return m[1];
      }
    }
    return '';
  }, [filterGrades]);

  // Extract all unique microns available across active filter grades
  const availableMicrons = useMemo(() => {
    const set = new Set();
    filterGrades.forEach(fg => {
      const m = getMicronForGrade(fg._id);
      if (m) set.add(m);
    });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [filterGrades, getMicronForGrade]);

  const loadingData = loadingGroups || loadingCats || loadingUoms || loadingBins || loadingFgs;

  // RTK Query Mutations
  const [createItemMutation] = useCreateItemMutation();
  const [updateItemMutation] = useUpdateItemMutation();
  const [uploadItemImageMutation] = useUploadItemImageMutation();
  const [removeItemImageMutation] = useRemoveItemImageMutation();
  const [assignItemSpecMutation] = useAssignItemSpecificationMutation();
  const [updateItemSpecMutation] = useUpdateItemSpecificationMutation();

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Category specifications via RTK Query
  const { data: catSpecsRes } = useGetCategorySpecificationsQuery(formData.itemCategory, {
    skip: !formData.itemCategory,
  });

  const categorySpecs = useMemo(() => {
    if (!catSpecsRes?.specifications || !Array.isArray(catSpecsRes.specifications)) return [];
    const specs = catSpecsRes.specifications
      .map((cs) => {
        if (!cs.specification) return null;
        return {
          ...cs.specification,
          isRequiredCategorySpec: !!cs.required,
          categoryDisplayOrder: cs.displayOrder ?? 0,
        };
      })
      .filter(Boolean);
    specs.sort((a, b) => a.categoryDisplayOrder - b.categoryDisplayOrder);
    return specs;
  }, [catSpecsRes]);

  // Item specifications via RTK Query (edit mode)
  const { data: itemSpecsData } = useGetItemSpecificationsQuery(item?._id, {
    skip: !item?._id || !isOpen,
  });

  useEffect(() => {
    if (itemSpecsData?.specifications && Array.isArray(itemSpecsData.specifications)) {
      const map = {};
      let specLength = '';
      let specWidth = '';
      let specDepth = '';

      itemSpecsData.specifications.forEach((s) => {
        const specId = s.specification?._id || s.specification;
        const code = (s.specification?.specificationCode || '').toUpperCase().trim();
        const name = (s.specification?.specificationName || '').toUpperCase().trim();
        if (code === 'SPEC-LENGTH-01' || name === 'LENGTH') specLength = s.value;
        if (code === 'SPEC-WIDTH-01' || name === 'WIDTH') specWidth = s.value;
        if (code === 'DEPTH' || name === 'DEPTH') specDepth = s.value;

        map[specId] = {
          value: s.value,
          isApply: s.isApply || false,
          isFix: s.isFix || false,
          isExisting: true,
        };
      });
      setSpecsData(map);

      setFormData((prev) => ({
        ...prev,
        filterLength: prev.filterLength !== '' ? prev.filterLength : (specLength || ''),
        filterWidth: prev.filterWidth !== '' ? prev.filterWidth : (specWidth || ''),
        filterDepth: prev.filterDepth !== '' ? prev.filterDepth : (specDepth || ''),
      }));
    }
  }, [itemSpecsData]);

  // Step 2 Requirement: Automatically select 'NOS' as default Inventory UOM for Filter items
  useEffect(() => {
    if (!isOpen) return;
    if (formData.productType === 'FILTER' && uoms.length > 0) {
      if (!formData.inventoryUom) {
        const nosUom = uoms.find((u) => (u.uomCode || '').toUpperCase() === 'NOS');
        if (nosUom) {
          setFormData((prev) => ({
            ...prev,
            inventoryUom: nosUom._id,
            purchaseUom: prev.purchaseUom || nosUom._id,
            salesUom: prev.salesUom || nosUom._id,
          }));
        }
      }
    }
  }, [formData.productType, uoms, formData.inventoryUom, isOpen]);

  // Initialize or reset form data
  useEffect(() => {
    if (item) {
      let initialMoc = item.moc || '';
      if (initialMoc.toLowerCase() === 'aluminum' || initialMoc.toLowerCase() === 'aluminium') {
        initialMoc = 'Aluminium';
      }
      if (initialMoc) {
        setIsMocManuallySelected(true);
      } else {
        setIsMocManuallySelected(false);
      }

      const resolvedFilterType = (item.filterType === 'BOX' || item.filterType === 'FLANGE')
        ? item.filterType
        : (item.constructionType === 'BOX' || item.constructionType === 'FLANGE')
          ? item.constructionType
          : 'BOX';

      const initGroupId = item.itemGroup?._id || item.itemGroup || item.itemCategory?.itemGroup?._id || item.itemCategory?.itemGroup || '';
      setSelectedItemGroupId(initGroupId);

      const m = item.micronRating || getMicronForGrade(item.filterGrade?._id || item.filterGrade);
      if (m) {
        setSelectedMicron(m);
        setIsGradeMicronLocked(true);
      } else if (item.filterGrade) {
        setIsGradeMicronLocked(true);
      } else {
        setIsGradeMicronLocked(false);
      }

      // Match temperature range if present
      const itemTemp = item.temperatureRange || item.temperatureRating;
      let matchedR = null;
      if (itemTemp) {
        matchedR = TEMPERATURE_RANGE_OPTIONS.find(r =>
          String(itemTemp).includes(r.rangeLabel) ||
          String(itemTemp).includes(r.id) ||
          (!isNaN(Number(itemTemp)) && Number(itemTemp) >= r.minTemp && Number(itemTemp) <= r.maxTemp)
        );
        if (matchedR) setSelectedTempRangeId(matchedR.id);
      }

      let initialGasket = item.gasketMoc || (matchedR ? matchedR.gasketMoc : 'EPDM');
      if (initialGasket !== 'Glass Fiber Pad') {
        initialGasket = 'EPDM';
      }

      setFormData({
        itemCode: item.itemCode || '',
        itemName: item.itemName || '',
        itemGroup: initGroupId,
        itemCategory: item.itemCategory?._id || item.itemCategory || '',
        inventoryUom: item.inventoryUom?._id || item.inventoryUom || '',
        purchaseUom: item.purchaseUom?._id || item.purchaseUom || '',
        salesUom: item.salesUom?._id || item.salesUom || '',
        itemPerPurchaseUnit: item.itemPerPurchaseUnit !== undefined ? item.itemPerPurchaseUnit : 1,
        itemPerSalesUnit: item.itemPerSalesUnit !== undefined ? item.itemPerSalesUnit : 1,
        hsnCode: item.hsnCode || '',
        reorderLevel: item.reorderLevel || 0,
        reorderQty: item.reorderQty || 0,
        minInventory: item.minInventory || 0,
        maxInventory: item.maxInventory || 0,
        leadTimeDays: item.leadTimeDays || 0,
        defaultBin: item.defaultBin?._id || item.defaultBin || '',
        description: item.description || '',
        itemType: item.itemType || PRODUCT_TYPE_TO_ITEM_TYPE[item.productType] || 'raw_material',
        productType: item.productType || (item.filterGrade ? 'FILTER' : 'RAW_ITEM'),
        filterGrade: item.filterGrade?._id || item.filterGrade || '',
        filterGradeVariant: item.filterGradeVariant || '',
        drawing: item.drawing?._id || item.drawing || '',
        drawingSnapshot: item.drawingSnapshot || null,
        status: item.status || 'active',
        filterType: resolvedFilterType,
        imageUrl: item.imageUrl || '',
        imagePublicId: item.imagePublicId || '',
        constructionType: resolvedFilterType,
        moc: initialMoc,
        customMoc: '',
        flangeType: item.flangeType?._id || item.flangeType || '',
        filterLength: item.outerLength !== null && item.outerLength !== undefined ? item.outerLength : (item.overallLength ?? (item.filterLength !== null && item.filterLength !== undefined ? item.filterLength : '')),
        filterWidth: item.outerWidth !== null && item.outerWidth !== undefined ? item.outerWidth : (item.overallWidth ?? (item.filterWidth !== null && item.filterWidth !== undefined ? item.filterWidth : '')),
        filterDepth: item.outerDepth !== null && item.outerDepth !== undefined ? item.outerDepth : (item.overallDepth ?? (item.filterDepth !== null && item.filterDepth !== undefined ? item.filterDepth : '')),
        faceVelocity: item.faceVelocity !== null && item.faceVelocity !== undefined ? item.faceVelocity : '',
        faceVelocityMaster: item.faceVelocityMaster?._id || item.faceVelocityMaster || '',
        pleatsPerFeet: item.pleatsPerFeet !== null && item.pleatsPerFeet !== undefined ? item.pleatsPerFeet : '',
        filtrationArea: item.filtrationArea !== null && item.filtrationArea !== undefined ? item.filtrationArea : '',
        temperatureRating: item.temperatureRange || (matchedR ? matchedR.rangeLabel : (item.temperatureRating || '')),
        temperatureRange: item.temperatureRange || (matchedR ? matchedR.rangeLabel : (typeof item.temperatureRating === 'string' ? item.temperatureRating : '')),
        gasketMoc: initialGasket,
        customGasketMoc: '',
        bonding: item.bonding || (matchedR ? matchedR.bondingValue : ''),
        noOfFolds: item.noOfFolds || item.filterGrade?.noOfFolds || '',
      });
      if (item.faceVelocityMaster && typeof item.faceVelocityMaster === 'object') {
        setMatchedFaceVelocityConfig(item.faceVelocityMaster);
      } else {
        setMatchedFaceVelocityConfig(null);
      }
      setFaceVelocityAmbiguityError('');
      setFilterType(resolvedFilterType);
      setImageError('');
      setCurrentStep(2);
    } else {
      const pType = initialProductType || '';
      setSelectedItemGroupId('');
      setIsMocManuallySelected(false);
      setMatchedFaceVelocityConfig(null);
      setFaceVelocityLookupAttempted(false);
      setFaceVelocityAmbiguityError('');
      setFormData({
        itemCode: 'AUTO',
        itemName: initialItemName || '',
        itemGroup: '',
        itemCategory: '',
        inventoryUom: '',
        purchaseUom: '',
        salesUom: '',
        itemPerPurchaseUnit: 1,
        itemPerSalesUnit: 1,
        hsnCode: '',
        reorderLevel: 0,
        reorderQty: 0,
        minInventory: 0,
        maxInventory: 0,
        leadTimeDays: 0,
        defaultBin: '',
        description: '',
        itemType: PRODUCT_TYPE_TO_ITEM_TYPE[pType] || 'finished_goods',
        productType: pType,
        filterGrade: '',
        filterGradeVariant: '',
        drawing: '',
        drawingSnapshot: null,
        status: 'active',
        filterType: '',
        imageUrl: '',
        imagePublicId: '',
        constructionType: '',
        moc: '',
        customMoc: '',
        flangeType: '',
        filterLength: '',
        filterWidth: '',
        filterDepth: '',
        faceVelocity: '',
        faceVelocityMaster: '',
        pleatsPerFeet: '',
        filtrationArea: '',
        temperatureRating: '',
        temperatureRange: '',
        gasketMoc: 'EPDM',
        customGasketMoc: '',
        bonding: '',
        noOfFolds: '',
      });
      setFilterType('');
      setImageError('');
      setSpecsData({});
      setSelectedMicron('');
      setIsGradeMicronLocked(false);
      setSelectedTempRangeId('');
      setShowAdvancedDetails(false);
      setCurrentStep(1);
    }

    setErrorMessage('');
    setSuccessMessage('');
  }, [item, isOpen, initialProductType, initialItemName, getMicronForGrade]);

  // Sync selected Item Group on modal open or when itemGroups load
  useEffect(() => {
    if (itemGroups.length === 0 || !isOpen) return;

    if (item) {
      const initGrp = item.itemGroup?._id || item.itemGroup || item.itemCategory?.itemGroup?._id || item.itemCategory?.itemGroup;
      if (initGrp) {
        setSelectedItemGroupId(initGrp);
        return;
      }
      const pType = item.productType || (item.filterGrade ? 'FILTER' : 'RAW_ITEM');
      const matched = itemGroups.find((g) =>
        (g.applicableProductTypes || []).includes(pType) ||
        (g.groupName || '').toUpperCase() === (pType === 'RAW_ITEM' ? 'RAW' : pType)
      );
      if (matched) setSelectedItemGroupId(matched._id);
    } else if (formData.productType) {
      const pType = formData.productType;
      const matched = itemGroups.find((g) =>
        (g.applicableProductTypes || []).includes(pType) ||
        (g.groupName || '').toUpperCase() === (pType === 'RAW_ITEM' ? 'RAW' : pType)
      );
      if (matched && String(selectedItemGroupId) !== String(matched._id)) {
        setSelectedItemGroupId(matched._id);
        setFormData((prev) => ({ ...prev, itemGroup: matched._id }));
      }
    } else {
      setSelectedItemGroupId('');
    }
  }, [itemGroups, item, isOpen, formData.productType, selectedItemGroupId]);

// Available categories: strictly filter by selected Item Group
const availableCategories = useMemo(() => {
  let list = [...itemCategories];
  if (selectedItemGroupId) {
    list = list.filter((cat) => {
      const catGroupId = typeof cat.itemGroup === 'object' ? cat.itemGroup?._id : cat.itemGroup;
      if (catGroupId && String(catGroupId) === String(selectedItemGroupId)) return true;
      const selectedGroup = itemGroups.find((g) => String(g._id) === String(selectedItemGroupId));
      if (!catGroupId && selectedGroup) {
        const gNorm = (selectedGroup.groupName || selectedGroup.groupCode || '').toUpperCase();
        const cNorm = (cat.categoryName || cat.categoryCode || '').toUpperCase();
        return cNorm.includes(gNorm) || gNorm.includes(cNorm);
      }
      return false;
    });
  }

  return list.sort((a, b) => {
    const aFixed = FIXED_CATEGORY_CODES.indexOf(a.categoryCode?.toUpperCase());
    const bFixed = FIXED_CATEGORY_CODES.indexOf(b.categoryCode?.toUpperCase());
    if (aFixed !== -1 && bFixed !== -1) return aFixed - bFixed;
    if (aFixed !== -1) return -1;
    if (bFixed !== -1) return 1;
    return (a.categoryName || '').localeCompare(b.categoryName || '');
  });
}, [itemCategories, selectedItemGroupId, itemGroups]);

// Auto-match category based on selectedItemGroupId when creating a new item
useEffect(() => {
  if (!isEditMode && availableCategories.length > 0 && !formData.itemCategory && selectedItemGroupId) {
    const matched = availableCategories[0];
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        itemCategory: matched._id,
        itemGroup: selectedItemGroupId,
      }));
    }
  }
}, [selectedItemGroupId, availableCategories, isEditMode, formData.itemCategory]);

const isFilterCoreSpec = (spec) => {
  const code = (spec.specificationCode || '').toUpperCase().trim();
  const name = (spec.specificationName || '').toUpperCase().trim();
  return (
    code === 'SPEC-LENGTH-01' || name === 'LENGTH' ||
    code === 'SPEC-WIDTH-01' || name === 'WIDTH' ||
    code === 'DEPTH' || name === 'DEPTH' ||
    code === 'CFM' || name === 'CFM' || name.includes('AIRFLOW') ||
    code === 'FILTER GRADE' || name.includes('FILTER GRADE') || name === 'GRADE' ||
    code.includes('TEMP') || name.includes('TEMPERATURE') || name.includes('OPERATING TEMP') ||
    code.includes('BOX_CONST') || name.includes('BOX CONSTRUCTION') || name.includes('OVERALL BOX')
  );
};

// Divide specs into required vs optional
const { requiredSpecs, optionalSpecs } = useMemo(() => {
  const isFilter = formData.productType === 'FILTER';
  const applicable = isFilter
    ? categorySpecs.filter((s) => !isFilterCoreSpec(s))
    : categorySpecs;

  return {
    requiredSpecs: applicable.filter((s) => s.isRequiredCategorySpec),
    optionalSpecs: applicable.filter((s) => !s.isRequiredCategorySpec),
  };
}, [categorySpecs, formData.productType]);

// Automatic calculation of inner dimensions from outer dimensions
// FLANGE: Inner Length = Outer Length - 60mm, Inner Width = Outer Width - 60mm, Inner Depth = Outer Depth
// BOX: Inner Dimensions = Outer Dimensions
const calculatedInnerDimensions = useMemo(() => {
  const rawL = Number(formData.filterLength);
  const rawW = Number(formData.filterWidth);
  const rawD = Number(formData.filterDepth);
  const hasL = Number.isFinite(rawL) && rawL > 0;
  const hasW = Number.isFinite(rawW) && rawW > 0;
  const hasD = Number.isFinite(rawD) && rawD > 0;

  const effConstruction = (filterType || formData.constructionType || formData.filterType || '').toUpperCase().trim();
  const isFlange = effConstruction === 'FLANGE';
  const isBox = effConstruction === 'BOX';

  let innerL = null;
  let innerW = null;
  let innerD = hasD ? rawD : null;
  let validationError = '';

  if (isFlange) {
    if (hasL) {
      if (rawL <= 60) {
        validationError = 'Outer Length must be greater than 60 mm for FLANGE construction to allow for 30 mm flange on each side';
        innerL = null;
      } else {
        innerL = rawL - 60;
      }
    }
    if (hasW) {
      if (rawW <= 60) {
        validationError = validationError
          ? 'Outer Length and Outer Width must be greater than 60 mm for FLANGE construction to allow for 30 mm flange on each side'
          : 'Outer Width must be greater than 60 mm for FLANGE construction to allow for 30 mm flange on each side';
        innerW = null;
      } else {
        innerW = rawW - 60;
      }
    }
  } else {
    // BOX or standard
    if (hasL) innerL = rawL;
    if (hasW) innerW = rawW;
  }

  const overallL = hasL ? rawL : null;
  const overallW = hasW ? rawW : null;
  const overallD = hasD ? rawD : null;

  const isInvalid = Boolean(validationError) || (isFlange && ((hasL && rawL <= 60) || (hasW && rawW <= 60)));

  return {
    outerLength: overallL,
    outerWidth: overallW,
    outerDepth: overallD,
    innerLength: isInvalid ? null : innerL,
    innerWidth: isInvalid ? null : innerW,
    innerDepth: innerD,
    overallLength: overallL,
    overallWidth: overallW,
    overallDepth: overallD,
    hasInnerDimensions: !isInvalid && innerL !== null && innerW !== null && innerD !== null && innerL > 0 && innerW > 0,
    displayInnerL: (!isInvalid && innerL !== null && innerL > 0) ? `${innerL} mm` : '—',
    displayInnerW: (!isInvalid && innerW !== null && innerW > 0) ? `${innerW} mm` : '—',
    displayInnerD: innerD !== null ? `${innerD} mm` : '—',
    summaryInner: (!isInvalid && innerL !== null && innerW !== null && innerD !== null && innerL > 0 && innerW > 0)
      ? `${innerL} × ${innerW} × ${innerD} mm`
      : '—',
    summaryOuter: (hasL && hasW && hasD) ? `${rawL} × ${rawW} × ${rawD} mm` : '—',
    summary: (hasL && hasW && hasD) ? `${rawL} × ${rawW} × ${rawD} mm` : '—',
    validationError,
    isInvalid,
    isFlange,
    isBox
  };
}, [formData.filterLength, formData.filterWidth, formData.filterDepth, filterType, formData.constructionType, formData.filterType]);

// Alias for backwards compatibility
const calculatedOverallDimensions = calculatedInnerDimensions;

// Calculated CFM based on active core / inner dimensions:
// (Inner Length / 304.8) * (Inner Width / 304.8) * Face Velocity, rounded to nearest 10
const calculatedCfm = useMemo(() => {
  if (!matchedFaceVelocityConfig || !formData.faceVelocityMaster) {
    return null;
  }
  const innerL = calculatedInnerDimensions.innerLength;
  const innerW = calculatedInnerDimensions.innerWidth;
  const fv = Number(formData.faceVelocity);
  if (!Number.isFinite(innerL) || innerL <= 0 || !Number.isFinite(innerW) || innerW <= 0 || !Number.isFinite(fv) || fv <= 0) {
    return null;
  }
  const rawCfm = (innerL / 304.8) * (innerW / 304.8) * fv;
  const rounded10 = Math.round(rawCfm / 10) * 10;
  return rounded10 === 0 && rawCfm > 0 ? Math.round(rawCfm) : rounded10;
}, [matchedFaceVelocityConfig, formData.faceVelocityMaster, calculatedInnerDimensions.innerLength, calculatedInnerDimensions.innerWidth, formData.faceVelocity]);

// Selected Filter Grade Object
const selectedFg = useMemo(() => {
  if (!formData.filterGrade) return null;
  return filterGrades.find((fg) => String(fg._id) === String(formData.filterGrade));
}, [formData.filterGrade, filterGrades]);

// Filter Grade Variant options
const variantOptions = useMemo(() => {
  if (!selectedFg || !Array.isArray(selectedFg.variants)) return [];
  return selectedFg.variants.map((v) => {
    const classVal = v.filterClass || v.class || 'Std';
    const typeVal = v.filterType || v.mountingType || (filterType || 'Std');
    const tempVal = v.temperature || v.tempRating || 'Std Temp';
    const mediaVal = v.media || v.mediaType || 'Std Media';
    const key = `${classVal}||${typeVal}||${tempVal}||${mediaVal}`;
    const label = `${classVal} — ${typeVal} (${tempVal}, ${mediaVal})`;
    return { key, label, variant: v };
  });
}, [selectedFg, filterType]);

const selectedVariantObj = useMemo(() => {
  if (!selectedFg || !Array.isArray(selectedFg.variants) || !formData.filterGradeVariant) return null;
  const match = variantOptions.find((vo) => vo.key === formData.filterGradeVariant);
  return match?.variant || null;
}, [selectedFg, variantOptions, formData.filterGradeVariant]);

// Auto-select first variant when grade changes and variants are available
useEffect(() => {
  if (variantOptions.length > 0) {
    const currentMatches = variantOptions.some((vo) => vo.key === formData.filterGradeVariant);
    if (!formData.filterGradeVariant || !currentMatches) {
      const firstVo = variantOptions[0];
      setFormData((prev) => ({
        ...prev,
        filterGradeVariant: firstVo.key,
        noOfFolds: firstVo.variant?.noOfFolds || ''
      }));
    }
  } else if (!selectedFg) {
    if (formData.filterGradeVariant || formData.noOfFolds) {
      setFormData((prev) => ({
        ...prev,
        filterGradeVariant: '',
        noOfFolds: ''
      }));
    }
  }
}, [variantOptions, formData.filterGradeVariant, selectedFg]);

// Dynamic Face Velocity Master Lookup:
// When filterGrade and filterDepth are entered for FILTER items,
// query the backend for matching Face Velocity Master configuration within the depth range.
// Filter Length and Breadth do NOT participate in Face Velocity Master lookup.
useEffect(() => {
  if (formData.productType !== 'FILTER') return;

  const gradeId = formData.filterGrade;
  const d = Number(formData.filterDepth);

  if (gradeId && !isNaN(d) && d > 0) {
    const reqId = ++lookupRequestIdRef.current;

    // Immediately clear stale/previous values while new request is in flight
    setMatchedFaceVelocityConfig(null);
    setFaceVelocityAmbiguityError('');
    setFormData((prev) => ({
      ...prev,
      faceVelocity: '',
      pleatsPerFeet: '',
      filtrationArea: '',
      faceVelocityMaster: '',
    }));

    triggerLookupFaceVelocity({
      filterGrade: gradeId,
      depth: d,
    })
      .unwrap()
      .then((res) => {
        if (reqId !== lookupRequestIdRef.current) return;
        setFaceVelocityLookupAttempted(true);
        if (res?.ambiguous) {
          setFaceVelocityAmbiguityError(res.message || 'Multiple matching Face Velocity Master configurations found for the selected Filter Grade and depth. Please resolve overlapping ranges in Face Velocity Master.');
          setMatchedFaceVelocityConfig(null);
          setFormData((prev) => ({
            ...prev,
            faceVelocity: '',
            pleatsPerFeet: '',
            filtrationArea: '',
            faceVelocityMaster: '',
          }));
        } else if (res?.matched && res?.configuration) {
          setFaceVelocityAmbiguityError('');
          setMatchedFaceVelocityConfig(res.configuration);
          setFormData((prev) => ({
            ...prev,
            faceVelocity: res.configuration.faceVelocity,
            faceVelocityMaster: res.configuration._id,
          }));
        } else {
          setFaceVelocityAmbiguityError('');
          setMatchedFaceVelocityConfig(null);
          setFormData((prev) => ({
            ...prev,
            faceVelocity: '',
            pleatsPerFeet: '',
            filtrationArea: '',
            faceVelocityMaster: '',
          }));
        }
      })
      .catch((err) => {
        if (reqId !== lookupRequestIdRef.current) return;
        console.warn('Face Velocity lookup error:', err);
        setFaceVelocityLookupAttempted(true);
        const errMsg = err?.data?.message || err?.message || '';
        if (err?.data?.ambiguous || errMsg.toLowerCase().includes('multiple matching')) {
          setFaceVelocityAmbiguityError(errMsg || 'Multiple matching Face Velocity Master configurations found for the selected Filter Grade and depth. Please resolve overlapping ranges in Face Velocity Master.');
        } else {
          setFaceVelocityAmbiguityError('');
        }
        setMatchedFaceVelocityConfig(null);
        setFormData((prev) => ({
          ...prev,
          faceVelocity: '',
          pleatsPerFeet: '',
          filtrationArea: '',
          faceVelocityMaster: '',
        }));
      });
  } else {
    lookupRequestIdRef.current++;
    setMatchedFaceVelocityConfig(null);
    setFaceVelocityLookupAttempted(false);
    setFaceVelocityAmbiguityError('');
    setFormData((prev) => ({
      ...prev,
      faceVelocity: '',
      pleatsPerFeet: '',
      filtrationArea: '',
      faceVelocityMaster: '',
    }));
  }
}, [
  formData.productType,
  formData.filterGrade,
  formData.filterDepth,
  triggerLookupFaceVelocity,
]);

// Step 1: Select Item Group Card Handler
const handleSelectGroupCard = (card) => {
  const pType = card.productType;
  let targetGroupId = '';

  const matched = itemGroups.find((g) =>
    (g.applicableProductTypes || []).includes(pType) ||
    (g.groupName || '').toUpperCase() === (pType === 'RAW_ITEM' ? 'RAW' : pType)
  );

  if (matched) {
    targetGroupId = matched._id;
    setSelectedItemGroupId(matched._id);
  }

  const nextItemType = PRODUCT_TYPE_TO_ITEM_TYPE[pType] || 'raw_material';

  // Find category for this group
  const groupCategories = itemCategories.filter((c) => {
    const catGrpId = typeof c.itemGroup === 'object' ? c.itemGroup?._id : cat.itemGroup;
    if (catGrpId && String(catGrpId) === String(targetGroupId)) return true;
    const gNorm = (matched?.groupName || matched?.groupCode || '').toUpperCase();
    const cNorm = (c.categoryName || c.categoryCode || '').toUpperCase();
    return cNorm.includes(gNorm) || gNorm.includes(cNorm);
  });

  const nextCategory = groupCategories[0]?._id || '';

  // Step 2 Requirement: Default NOS for Filter items
  let defaultUom = formData.inventoryUom;
  if (pType === 'FILTER' && uoms.length > 0) {
    const nosUom = uoms.find((u) => (u.uomCode || '').toUpperCase() === 'NOS');
    if (nosUom) defaultUom = nosUom._id;
  }

  setFormData((prev) => ({
    ...prev,
    productType: pType,
    itemType: nextItemType,
    itemGroup: targetGroupId || prev.itemGroup,
    itemCategory: nextCategory,
    inventoryUom: defaultUom,
    purchaseUom: defaultUom,
    salesUom: defaultUom,
    // If switching away from filter, clear filter-specific inputs
    ...(pType !== 'FILTER' ? {
      filterGrade: '',
      filterGradeVariant: '',
      drawing: '',
      drawingSnapshot: null,
      filterType: '',
      constructionType: '',
      filterLength: '',
      filterWidth: '',
      filterDepth: '',
      temperatureRating: '',
      temperatureRange: '',
      bonding: '',
      gasketMoc: '',
    } : {
      moc: prev.moc || '',
      temperatureRange: prev.temperatureRange || '',
      temperatureRating: prev.temperatureRating || '',
      bonding: prev.bonding || '',
      gasketMoc: prev.gasketMoc || 'EPDM'
    })
  }));

  if (pType !== 'FILTER') {
    setFilterType('');
    setSelectedMicron('');
    setSelectedTempRangeId('');
  } else if (!isEditMode && !filterType) {
    setFilterType('');
    setFormData((prev) => ({ ...prev, filterType: '', constructionType: '' }));
  }

  setErrorMessage('');
};

// Section 3.1: Interconnected Grade Selection
const handleGradeSelect = (gradeId) => {
  if (!gradeId) {
    setFormData(prev => ({
      ...prev,
      filterGrade: '',
      filterGradeVariant: '',
      noOfFolds: ''
    }));
    setSelectedMicron('');
    setIsGradeMicronLocked(false);
    setErrorMessage('');
    return;
  }

  const fg = filterGrades.find(f => String(f._id) === String(gradeId));
  const extractedMicron = fg ? getMicronForGrade(gradeId) : '';
  if (extractedMicron) {
    setSelectedMicron(extractedMicron);
    setIsGradeMicronLocked(true);
  } else {
    setSelectedMicron('');
    setIsGradeMicronLocked(false);
  }

  setFormData(prev => ({
    ...prev,
    filterGrade: gradeId,
    filterGradeVariant: '',
    noOfFolds: ''
  }));
  setErrorMessage('');
};

// Section 3.1: Interconnected Micron Selection
const handleMicronSelect = (micronVal) => {
  setSelectedMicron(micronVal);
  if (!micronVal) {
    setFormData(prev => ({
      ...prev,
      filterGrade: '',
      filterGradeVariant: '',
      noOfFolds: ''
    }));
    setIsGradeMicronLocked(false);
    setErrorMessage('');
    return;
  }

  // Filter compatible grades for this micron
  const matchingGrades = filterGrades.filter(fg => getMicronForGrade(fg._id) === micronVal);
  if (matchingGrades.length > 0) {
    const isAlreadyMatching = matchingGrades.some(fg => String(fg._id) === String(formData.filterGrade));
    const targetGrade = isAlreadyMatching
      ? filterGrades.find(fg => String(fg._id) === String(formData.filterGrade))
      : matchingGrades[0];
    const targetGradeId = targetGrade?._id;
    setFormData(prev => ({
      ...prev,
      filterGrade: targetGradeId,
      filterGradeVariant: '',
      noOfFolds: ''
    }));
    setIsGradeMicronLocked(true);
  } else {
    setIsGradeMicronLocked(false);
  }
  setErrorMessage('');
};

// Section 3.1: Reset/Change action to unlock and reset both fields together
const handleResetGradeMicron = () => {
  setIsGradeMicronLocked(false);
  setFormData(prev => ({
    ...prev,
    filterGrade: '',
    filterGradeVariant: '',
    noOfFolds: ''
  }));
  setSelectedMicron('');
  setErrorMessage('');
};

// Section 3.2: Construction Type Selection (BOX vs FLANGE)
// Updates item code prefix: BOX -> NFB series, FLANGE -> NFF series
const handleConstructionSelect = (type) => {
  setFilterType(type);
  setFormData(prev => ({
    ...prev,
    filterType: type,
    constructionType: type,
    flangeType: type === 'FLANGE' ? prev.flangeType : '',
  }));
  setErrorMessage('');
};

// Section 3.3, 3.4 & 3.5: Temperature Range Selection, Bonding Adhesive, Gasket MOC & MOC
// Requirements:
// 1. Gasket MOC: <= 250 °C -> EPDM, 250–350 °C -> Glass Fiber Pad.
// 2. MOC: 200–250 °C and 250–350 °C -> automatically preselect SS304.
// 3. User can manually change it to Aluminium or SS316.
// 4. When switching to another temperature range, apply relevant default selection without unnecessarily overwriting a deliberate manual selection.
const handleTempRangeSelect = (rangeId) => {
  setSelectedTempRangeId(rangeId);
  const range = TEMPERATURE_RANGE_OPTIONS.find(r => r.id === rangeId);
  if (range) {
    setFormData(prev => {
      // Determine MOC:
      // If user made a deliberate manual selection, preserve it.
      // Otherwise, apply the relevant default selection:
      // For 200–250 °C and 250–350 °C -> SS304.
      // For other ranges -> Aluminium (or range.defaultMoc).
      const nextMoc = isMocManuallySelected && prev.moc
        ? prev.moc
        : (range.defaultMoc || 'SS304');

      return {
        ...prev,
        temperatureRange: range.rangeLabel,
        temperatureRating: range.rangeLabel,
        bonding: range.adhesiveName,
        gasketMoc: range.gasketMoc,
        moc: nextMoc,
        customGasketMoc: '',
        customMoc: ''
      };
    });
  }
  setErrorMessage('');
};

const handleCategoryChange = (e) => {
  const catId = e.target.value;
  const catObj = itemCategories.find((c) => String(c._id) === String(catId));
  const linkedGroupId = typeof catObj?.itemGroup === 'object' ? catObj.itemGroup?._id : catObj?.itemGroup;

  if (linkedGroupId) {
    setSelectedItemGroupId(linkedGroupId);
  }

  setFormData((prev) => ({
    ...prev,
    itemCategory: catId,
    itemGroup: linkedGroupId || selectedItemGroupId || prev.itemGroup,
  }));
};

const handleChange = (e) => {
  const { name, value } = e.target;
  if (name === 'moc') {
    if (value) {
      setIsMocManuallySelected(true);
    } else {
      setIsMocManuallySelected(false);
    }
  }
  setFormData((prev) => {
    const next = {
      ...prev,
      [name]: name === 'itemCode' ? value.toUpperCase() : value,
    };

    if (name === 'inventoryUom') {
      if (!prev.purchaseUom) next.purchaseUom = value;
      if (!prev.salesUom) next.salesUom = value;
    }

    if (name === 'filterGrade') {
      next.filterGradeVariant = '';
      next.noOfFolds = '';
    }

    if (name === 'filterGradeVariant') {
      const match = variantOptions.find((vo) => vo.key === value);
      next.noOfFolds = match?.variant?.noOfFolds || '';
    }

    if (name === 'temperatureRange') {
      next.temperatureRating = value;
      if (!isMocManuallySelected) {
        if (value.includes('200–250') || value.includes('250–350') || value.includes('200-250') || value.includes('250-350')) {
          next.moc = 'SS304';
        } else if (value.includes('20–70') || value.includes('70–150') || value.includes('150–200')) {
          next.moc = 'Aluminium';
        }
      }
      if (value.includes('250–350') || value.includes('250-350') || value.includes('350')) {
        next.gasketMoc = 'Glass Fiber Pad';
      } else if (value.includes('20–70') || value.includes('70–150') || value.includes('150–200') || value.includes('200–250')) {
        next.gasketMoc = 'EPDM';
      }
    }

    return next;
  });
};

const handleSpecChange = (specId, field, value) => {
  setSpecsData((prev) => ({
    ...prev,
    [specId]: {
      ...prev[specId],
      [field]: value,
    },
  }));
};

const handleImageFileChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
  const originalNameLower = (file.name || '').toLowerCase();
  const hasAllowedExt = ['.png', '.jpg', '.jpeg', '.webp', '.svg'].some((ext) => originalNameLower.endsWith(ext));

  if (!allowedTypes.includes(file.type) && !hasAllowedExt) {
    setImageError('Only PNG, JPG, JPEG, WEBP, or SVG images are allowed.');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setImageError('Image file size must not exceed 5 MB.');
    return;
  }

  setImageError('');
  setUploadingImage(true);

  try {
    const uploadData = new FormData();
    uploadData.append('image', file);

    const res = await uploadItemImageMutation({ id: item?._id || null, formData: uploadData }).unwrap();
    if (res?.imageUrl) {
      setFormData((prev) => ({
        ...prev,
        imageUrl: res.imageUrl,
        imagePublicId: res.imagePublicId || '',
      }));
    } else {
      setImageError(res?.message || 'Failed to upload image.');
    }
  } catch (err) {
    console.error('Item image upload error:', err);
    setImageError(err?.data?.message || err.message || 'Image upload failed.');
  } finally {
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }
};

const handleRemoveImage = async () => {
  if (isEditMode && item?._id && formData.imagePublicId) {
    try {
      await removeItemImageMutation(item._id).unwrap();
    } catch (err) {
      console.warn('Could not remove remote image asset:', err);
    }
  }
  setFormData((prev) => ({
    ...prev,
    imageUrl: '',
    imagePublicId: '',
  }));
  setImageError('');
  if (fileInputRef.current) fileInputRef.current.value = '';
};

// Step-level Validation before proceeding to Next Step
const validateCurrentStep = (step) => {
  const isFilter = formData.productType === 'FILTER';

  if (step === 1) {
    if (!formData.productType) {
      return 'Please select an Item Group to proceed.';
    }
    return null;
  }

  if (step === 2) {
    // Step 2: Item Details validation (mandatory for all groups)
    if (!formData.itemName.trim()) {
      return 'Item Name is mandatory. Please enter the item name.';
    }
    if (!formData.itemCategory) {
      return 'Item Category is required.';
    }
    if (!formData.inventoryUom) {
      return 'Inventory UOM is required.';
    }
    return null;
  }

  if (step === 3) {
    if (isFilter) {
      // Step 3: Filter Configuration Validation
      if (!formData.filterGrade) {
        return 'Filter Grade is required.';
      }
      if (!filterType) {
        return 'Filter Construction Type (BOX or FLANGE) is required.';
      }
      if (!formData.temperatureRange && !formData.temperatureRating && !selectedTempRangeId) {
        return 'Operating Temperature Range is required.';
      }
      if (!formData.gasketMoc) {
        return 'Gasket MOC is required (EPDM or Glass Fiber Pad).';
      }
      if (!formData.bonding?.trim()) {
        return 'Bonding Adhesive is required.';
      }
      if (!formData.moc) {
        return 'Material of Construction (MOC) is required (Aluminium, SS304, or SS316).';
      }
      if (formData.filterLength === '' || Number(formData.filterLength) <= 0 || isNaN(Number(formData.filterLength))) {
        return 'Outer Filter Length must be a positive number in MM.';
      }
      if (formData.filterWidth === '' || Number(formData.filterWidth) <= 0 || isNaN(Number(formData.filterWidth))) {
        return 'Outer Filter Width must be a positive number in MM.';
      }
      if (formData.filterDepth === '' || Number(formData.filterDepth) <= 0 || isNaN(Number(formData.filterDepth))) {
        return 'Outer Filter Depth must be a positive number in MM.';
      }
      const isFlange = (filterType || formData.constructionType || '').toUpperCase() === 'FLANGE';
      if (isFlange) {
        if (Number(formData.filterLength) <= 60) {
          return 'Outer Length must be greater than 60 mm for FLANGE construction to allow for 30 mm flange on each side.';
        }
        if (Number(formData.filterWidth) <= 60) {
          return 'Outer Width must be greater than 60 mm for FLANGE construction to allow for 30 mm flange on each side.';
        }
      }
      if (isFetchingFaceVelocity) {
        return 'Searching Face Velocity Master configuration... Please wait.';
      }
      if (faceVelocityAmbiguityError) {
        return faceVelocityAmbiguityError;
      }
      if (!matchedFaceVelocityConfig || !formData.faceVelocityMaster || !formData.faceVelocity) {
        return 'No matching Face Velocity Master configuration found for the selected Filter Grade and Depth. Please configure the required depth range.';
      }
      return null;
    } else {
      // Non-Filter Step 3: Required Category Specifications
      for (const spec of requiredSpecs) {
        let val = specsData[spec._id]?.value;
        if (val === undefined || val === null || String(val).trim() === '') {
          return `Specification '${spec.specificationName}' is required.`;
        }
      }
      return null;
    }
  }

  return null;
};

const handleNextStep = () => {
  const error = validateCurrentStep(currentStep);
  if (error) {
    setErrorMessage(error);
    return;
  }
  setErrorMessage('');
  if (currentStep < 4) {
    setCurrentStep((prev) => prev + 1);
  }
};

const handlePrevStep = () => {
  setErrorMessage('');
  if (currentStep > 1) {
    setCurrentStep((prev) => prev - 1);
  }
};

const validate = () => {
  if (!formData.itemName.trim()) {
    return 'Item Name is required.';
  }
  if (!formData.productType) {
    return 'Product Type is required.';
  }
  if (!formData.itemCategory) {
    return 'Item Category is required.';
  }
  if (!formData.inventoryUom) {
    return 'Inventory UOM is required.';
  }

  if (formData.productType === 'FILTER') {
    if (!filterType) {
      return 'Filter Type (Box or Flange) is required for Filter items.';
    }
    if (!formData.filterGrade) {
      return 'Filter Grade is required.';
    }
    if (formData.filterGrade && !formData.filterGradeVariant) {
      return 'Filter Grade Variant is required when a Filter Grade is selected.';
    }
    if (!formData.temperatureRange && !formData.temperatureRating && !selectedTempRangeId) {
      return 'Operating Temperature Range is required.';
    }
    if (!formData.gasketMoc || (formData.gasketMoc === 'OTHER' && !formData.customGasketMoc?.trim())) {
      return 'Gasket MOC is required.';
    }
    if (!formData.bonding?.trim()) {
      return 'Bonding Adhesive is required.';
    }
    if (formData.filterLength !== '' && (Number(formData.filterLength) <= 0 || isNaN(Number(formData.filterLength)))) {
      return 'Outer Filter Length must be a positive number in MM.';
    }
    if (formData.filterWidth !== '' && (Number(formData.filterWidth) <= 0 || isNaN(Number(formData.filterWidth)))) {
      return 'Outer Filter Width must be a positive number in MM.';
    }
    if (formData.filterDepth !== '' && (Number(formData.filterDepth) <= 0 || isNaN(Number(formData.filterDepth)))) {
      return 'Outer Filter Depth must be a positive number in MM.';
    }
    const isFlange = (filterType || formData.constructionType || '').toUpperCase() === 'FLANGE';
    if (isFlange) {
      if (Number(formData.filterLength) <= 60) {
        return 'Outer Length must be greater than 60 mm for FLANGE construction to allow for 30 mm flange on each side.';
      }
      if (Number(formData.filterWidth) <= 60) {
        return 'Outer Width must be greater than 60 mm for FLANGE construction to allow for 30 mm flange on each side.';
      }
    }
    if (formData.moc === 'OTHER' && !formData.customMoc?.trim()) {
      return 'Please specify the custom Material of Construction (MOC).';
    }
    if (faceVelocityAmbiguityError) {
      return faceVelocityAmbiguityError;
    }
    if (!formData.faceVelocityMaster || !formData.faceVelocity || !matchedFaceVelocityConfig) {
      return 'No matching Face Velocity Master configuration found for the selected Filter Grade and dimensions/depth. Please update Face Velocity Master or correct the filter dimensions.';
    }
  }

  if (Number(formData.itemPerPurchaseUnit) <= 0) {
    return 'Item per purchase unit must be greater than 0.';
  }
  if (Number(formData.itemPerSalesUnit) <= 0) {
    return 'Item per sales unit must be greater than 0.';
  }

  for (const spec of requiredSpecs) {
    let val = specsData[spec._id]?.value;
    if (val === undefined || val === null || String(val).trim() === '') {
      return `Specification '${spec.specificationName}' is required for this category.`;
    }
  }

  return null;
};

const handleSubmit = async (e) => {
  if (e) e.preventDefault();
  const valError = validate();
  if (valError) {
    setErrorMessage(valError);
    return;
  }

  setSubmitting(true);
  setErrorMessage('');
  setSuccessMessage('');

  try {
    const selectedCategoryObj = itemCategories.find((c) => String(c._id) === String(formData.itemCategory));
    const derivedGroupId = selectedCategoryObj?.itemGroup?._id || selectedCategoryObj?.itemGroup || null;

    const resolvedPurchaseUom = formData.purchaseUom || formData.inventoryUom;
    const resolvedSalesUom = formData.salesUom || formData.inventoryUom;

    const effectiveGasketMoc = formData.gasketMoc || 'EPDM';

    const effectiveTempRange = formData.temperatureRange || (typeof formData.temperatureRating === 'string' ? formData.temperatureRating : '') || (selectedTempRangeId ? TEMPERATURE_RANGE_OPTIONS.find(r => r.id === selectedTempRangeId)?.rangeLabel : '');

    const submitPayload = {
      itemCode: isEditMode ? formData.itemCode : (formData.itemCode === 'AUTO' || !formData.itemCode ? 'AUTO' : formData.itemCode),
      itemName: formData.itemName.trim(),
      productType: formData.productType,
      itemCategory: formData.itemCategory,
      itemGroup: derivedGroupId || formData.itemGroup || selectedItemGroupId || null,
      itemType: PRODUCT_TYPE_TO_ITEM_TYPE[formData.productType] || 'raw_material',
      inventoryUom: formData.inventoryUom,
      purchaseUom: resolvedPurchaseUom,
      salesUom: resolvedSalesUom,
      itemPerPurchaseUnit: Number(formData.itemPerPurchaseUnit) || 1,
      itemPerSalesUnit: Number(formData.itemPerSalesUnit) || 1,
      hsnCode: formData.hsnCode?.trim() || '',
      defaultBin: formData.defaultBin || null,
      reorderLevel: Number(formData.reorderLevel) || 0,
      reorderQty: Number(formData.reorderQty) || 0,
      minInventory: Number(formData.minInventory) || 0,
      maxInventory: Number(formData.maxInventory) || 0,
      leadTimeDays: Number(formData.leadTimeDays) || 0,
      description: formData.description?.trim() || '',
      status: formData.status || 'active',
      // Filter specific fields
      filterType: formData.productType === 'FILTER' ? filterType : '',
      constructionType: formData.productType === 'FILTER' ? filterType : '',
      filterGrade: formData.productType === 'FILTER' && formData.filterGrade ? formData.filterGrade : null,
      filterGradeVariant: formData.productType === 'FILTER' ? formData.filterGradeVariant : '',
      micronRating: formData.productType === 'FILTER' ? (selectedMicron || '') : '',
      drawing: formData.productType === 'FILTER' && formData.drawing ? formData.drawing : null,
      drawingSnapshot: formData.productType === 'FILTER' ? formData.drawingSnapshot : null,
      outerLength: formData.productType === 'FILTER' && formData.filterLength !== '' ? Number(formData.filterLength) : null,
      outerWidth: formData.productType === 'FILTER' && formData.filterWidth !== '' ? Number(formData.filterWidth) : null,
      outerDepth: formData.productType === 'FILTER' && formData.filterDepth !== '' ? Number(formData.filterDepth) : null,
      innerLength: formData.productType === 'FILTER' && calculatedInnerDimensions.innerLength !== null ? Number(calculatedInnerDimensions.innerLength) : null,
      innerWidth: formData.productType === 'FILTER' && calculatedInnerDimensions.innerWidth !== null ? Number(calculatedInnerDimensions.innerWidth) : null,
      innerDepth: formData.productType === 'FILTER' && calculatedInnerDimensions.innerDepth !== null ? Number(calculatedInnerDimensions.innerDepth) : null,
      filterLength: formData.productType === 'FILTER' && calculatedInnerDimensions.innerLength !== null ? Number(calculatedInnerDimensions.innerLength) : (formData.filterLength !== '' ? Number(formData.filterLength) : null),
      filterWidth: formData.productType === 'FILTER' && calculatedInnerDimensions.innerWidth !== null ? Number(calculatedInnerDimensions.innerWidth) : (formData.filterWidth !== '' ? Number(formData.filterWidth) : null),
      filterDepth: formData.productType === 'FILTER' && calculatedInnerDimensions.innerDepth !== null ? Number(calculatedInnerDimensions.innerDepth) : (formData.filterDepth !== '' ? Number(formData.filterDepth) : null),
      faceVelocity: formData.productType === 'FILTER' && formData.faceVelocity !== '' ? Number(formData.faceVelocity) : null,
      faceVelocityMaster: formData.productType === 'FILTER' && formData.faceVelocityMaster ? formData.faceVelocityMaster : null,
      pleatsPerFeet: formData.productType === 'FILTER' && formData.pleatsPerFeet !== '' ? Number(formData.pleatsPerFeet) : null,
      filtrationArea: formData.productType === 'FILTER' && formData.filtrationArea !== '' ? Number(formData.filtrationArea) : null,
      cfm: formData.productType === 'FILTER' ? calculatedCfm : null,
      moc: formData.productType === 'FILTER' ? (formData.moc || '') : '',
      bonding: formData.productType === 'FILTER' ? (formData.bonding || '') : '',
      gasketMoc: formData.productType === 'FILTER' ? effectiveGasketMoc : '',
      noOfFolds: formData.productType === 'FILTER' ? (selectedVariantObj?.noOfFolds || formData.noOfFolds || '') : '',
      // Store temperature range as the range itself (e.g. 20–70 °C), NOT converted to a number
      temperatureRating: formData.productType === 'FILTER' ? (effectiveTempRange || formData.temperatureRating || '') : null,
      temperatureRange: formData.productType === 'FILTER' ? (effectiveTempRange || '') : '',
      overallLength: formData.productType === 'FILTER' && formData.filterLength !== '' ? Number(formData.filterLength) : null,
      overallWidth: formData.productType === 'FILTER' && formData.filterWidth !== '' ? Number(formData.filterWidth) : null,
      overallDepth: formData.productType === 'FILTER' && formData.filterDepth !== '' ? Number(formData.filterDepth) : null,
      overallFlangeLength: (formData.productType === 'FILTER' && filterType === 'FLANGE' && formData.filterLength !== '') ? Number(formData.filterLength) : null,
      overallFlangeWidth: (formData.productType === 'FILTER' && filterType === 'FLANGE' && formData.filterWidth !== '') ? Number(formData.filterWidth) : null,
      overallFlangeDepth: (formData.productType === 'FILTER' && filterType === 'FLANGE' && formData.filterDepth !== '') ? Number(formData.filterDepth) : null,
      overallBoxConstruction: formData.productType === 'FILTER'
        ? (calculatedInnerDimensions.summaryOuter !== '—' ? calculatedInnerDimensions.summaryOuter : '')
        : '',
      boxConstruction: formData.productType === 'FILTER'
        ? (calculatedInnerDimensions.summaryOuter !== '—' ? calculatedInnerDimensions.summaryOuter : '')
        : '',
      imageUrl: formData.imageUrl || '',
      imagePublicId: formData.imagePublicId || '',
    };

    let savedItem;
    if (isEditMode) {
      const res = await updateItemMutation({ id: item._id, ...submitPayload }).unwrap();
      savedItem = res.item || res;
    } else {
      const res = await createItemMutation(submitPayload).unwrap();
      savedItem = res.item || res;
    }

    // Synchronize specifications
    const effectiveSpecs = { ...specsData };
    if (formData.productType === 'FILTER') {
      categorySpecs.forEach((spec) => {
        const specId = spec._id;
        const code = (spec.specificationCode || '').toUpperCase().trim();
        const name = (spec.specificationName || '').toUpperCase().trim();

        let autoVal = null;
        if (code === 'SPEC-LENGTH-01' || name === 'LENGTH') autoVal = formData.filterLength;
        else if (code === 'SPEC-WIDTH-01' || name === 'WIDTH') autoVal = formData.filterWidth;
        else if (code === 'DEPTH' || name === 'DEPTH') autoVal = formData.filterDepth;
        else if (code === 'CFM' || name === 'CFM' || name.includes('AIRFLOW')) autoVal = calculatedCfm;
        else if (code === 'FILTER GRADE' || name.includes('FILTER GRADE') || name === 'GRADE') {
          const fg = filterGrades.find(f => String(f._id) === String(formData.filterGrade));
          autoVal = fg ? fg.filterGrade : '';
        }
        else if (code.includes('TEMP') || name.includes('TEMPERATURE') || name.includes('OPERATING TEMP')) {
          autoVal = effectiveTempRange || formData.temperatureRating || '';
        }
        else if (code.includes('GASKET') || name.includes('GASKET')) {
          autoVal = effectiveGasketMoc;
        }
        else if (code.includes('BOND') || name.includes('BONDING') || name.includes('ADHESIVE')) {
          autoVal = formData.bonding || '';
        }
        else if (code.includes('BOX_CONST') || code.includes('OVERALL_BOX') || name.includes('BOX CONSTRUCTION') || name.includes('OVERALL BOX')) {
          autoVal = calculatedOverallDimensions.summary !== '—' ? calculatedOverallDimensions.summary : '';
        }
        else if (code === 'MOC' || code === 'SPEC_MOC' || code.includes('MOC') || name === 'MOC' || name.includes('MATERIAL OF CONSTRUCTION') || name.includes('CASING MATERIAL')) {
          autoVal = formData.moc || '';
        }

        if (autoVal !== null && autoVal !== undefined && autoVal !== '') {
          effectiveSpecs[specId] = {
            ...(effectiveSpecs[specId] || {}),
            value: String(autoVal),
            isApply: true,
            isFix: true,
          };
        }
      });
    }

    // Save category specifications to backend
    const targetItemId = savedItem._id || savedItem.id;
    if (targetItemId) {
      for (const [specId, specVal] of Object.entries(effectiveSpecs)) {
        if (specVal && specVal.value !== undefined && specVal.value !== null && String(specVal.value).trim() !== '') {
          try {
            if (specVal.isExisting && isEditMode) {
              await updateItemSpecMutation({
                itemId: targetItemId,
                specId,
                specData: {
                  value: specVal.value,
                  isApply: !!specVal.isApply,
                  isFix: !!specVal.isFix,
                },
              }).unwrap();
            } else {
              await assignItemSpecMutation({
                itemId: targetItemId,
                specData: {
                  specificationId: specId,
                  value: specVal.value,
                  isApply: !!specVal.isApply,
                  isFix: !!specVal.isFix,
                },
              }).unwrap();
            }
          } catch (specErr) {
            console.error(`Error saving spec ${specId}:`, specErr);
          }
        }
      }
    }

    setSuccessMessage(isEditMode ? 'Item updated successfully!' : 'Item created successfully!');
    setTimeout(() => {
      if (typeof onSuccess === 'function') onSuccess(savedItem);
      onClose();
    }, 700);

  } catch (err) {
    const apiMsg = err.data?.message || err.response?.data?.message || err.message || 'Failed to save item.';
    setErrorMessage(apiMsg);
  } finally {
    setSubmitting(false);
  }
};

const renderSpecInput = (spec, isRequired = false) => {
  const specId = spec._id;
  const currentData = specsData[specId] || { value: '', isApply: false, isFix: false };
  const unitLabel = spec.unit?.uomCode || spec.unit?.uomName || (typeof spec.unit === 'string' ? spec.unit : '');

  return (
    <div key={specId} className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
        <span className="flex items-center gap-1">
          {spec.specificationName}
          {isRequired && <span className="text-red-500 font-bold">*</span>}
        </span>
        {unitLabel && (
          <span className="text-[10.5px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {unitLabel}
          </span>
        )}
      </label>

      {spec.dataType === 'select' && Array.isArray(spec.options) ? (
        <Select
          value={currentData.value || ''}
          onChange={(e) => handleSpecChange(specId, 'value', e.target.value)}
          disabled={submitting}
        >
          <option value="">-- Select {spec.specificationName} --</option>
          {spec.options.map((opt, idx) => (
            <option key={idx} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
      ) : spec.dataType === 'number' ? (
        <Input
          type="number"
          step="any"
          placeholder={unitLabel ? `Enter value in ${unitLabel}` : 'Enter numeric value'}
          value={currentData.value || ''}
          onChange={(e) => handleSpecChange(specId, 'value', e.target.value)}
          disabled={submitting}
        />
      ) : spec.dataType === 'boolean' ? (
        <Select
          value={String(currentData.value ?? '')}
          onChange={(e) => handleSpecChange(specId, 'value', e.target.value === 'true')}
          disabled={submitting}
        >
          <option value="">-- Select --</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </Select>
      ) : (
        <Input
          placeholder={`Enter ${spec.specificationName.toLowerCase()}`}
          value={currentData.value || ''}
          onChange={(e) => handleSpecChange(specId, 'value', e.target.value)}
          disabled={submitting}
        />
      )}
    </div>
  );
};

const isFilter = formData.productType === 'FILTER';
const totalSteps = 4;

const stepLabels = useMemo(() => [
  { num: 1, label: 'Item Group' },
  { num: 2, label: 'Item Details' },
  { num: 3, label: isFilter ? 'Filter Config' : 'Configuration' },
  { num: 4, label: 'Review & Save' }
], [isFilter]);

  const isNextDisabled = useMemo(() => {
    if (submitting) return true;
    if (currentStep === 1) {
      return !formData.productType;
    }
    if (currentStep === 2) {
      return !formData.itemName?.trim() || !formData.itemCategory || !formData.inventoryUom;
    }
    if (currentStep === 3 && isFilter) {
      if (!filterType) return true;
      if (!formData.filterGrade) return true;
      if (calculatedInnerDimensions.validationError) return true;
      const l = Number(formData.filterLength);
      const w = Number(formData.filterWidth);
      const d = Number(formData.filterDepth);
      if (!l || l <= 0 || isNaN(l)) return true;
      if (!w || w <= 0 || isNaN(w)) return true;
      if (!d || d <= 0 || isNaN(d)) return true;
      const isFlange = (filterType || formData.constructionType || '').toUpperCase() === 'FLANGE';
      if (isFlange && (l <= 60 || w <= 60)) return true;
      if (isFetchingFaceVelocity) return true;
      if (faceVelocityAmbiguityError) return true;
      if (!matchedFaceVelocityConfig || !formData.faceVelocityMaster || !formData.faceVelocity) return true;
    }
    return false;
  }, [
    submitting,
    currentStep,
    formData.productType,
    formData.itemName,
    formData.itemCategory,
    formData.inventoryUom,
    isFilter,
    filterType,
    formData.filterGrade,
    formData.constructionType,
    calculatedInnerDimensions.validationError,
    formData.filterLength,
    formData.filterWidth,
    formData.filterDepth,
    isFetchingFaceVelocity,
    faceVelocityAmbiguityError,
    matchedFaceVelocityConfig,
    formData.faceVelocityMaster,
    formData.faceVelocity
  ]);

if (!isOpen) return null;

return (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={isEditMode ? `Edit Item — ${formData.itemCode}` : 'Add New Item'}
    maxWidth="840px"
    footer={
      <div className="flex items-center justify-between w-full">
        <div>
          {currentStep > 1 ? (
            <Button
              variant="outline"
              type="button"
              onClick={handlePrevStep}
              disabled={submitting}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Back
            </Button>
          ) : (
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <Button variant="ghost" onClick={onClose} disabled={submitting} className="text-slate-500 text-xs">
              Cancel
            </Button>
          )}

          {currentStep < totalSteps ? (
            <Button
              variant="primary"
              type="button"
              onClick={handleNextStep}
              disabled={isNextDisabled}
              className="flex items-center gap-1.5"
            >
              Next <ArrowRight size={14} />
            </Button>
          ) : (
            <Button
              variant="primary"
              type="button"
              onClick={handleSubmit}
              loading={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold"
            >
              {isEditMode ? 'Update Item' : 'Save Item'}
            </Button>
          )}
        </div>
      </div>
    }
  >
    <div className="flex flex-col gap-4 text-xs">
      {/* Step Indicator Header */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-2xs">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
          {stepLabels.map((st) => {
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            return (
              <div
                key={st.num}
                className="flex flex-col items-center relative z-10 cursor-pointer"
                onClick={() => {
                  if (isCompleted) setCurrentStep(st.num);
                }}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${isCompleted
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isCurrent
                        ? 'bg-blue-700 text-white ring-4 ring-blue-100 shadow-sm'
                        : 'bg-white text-slate-400 border border-slate-300'
                    }`}
                >
                  {isCompleted ? <Check size={14} className="stroke-[3]" /> : st.num}
                </div>
                <span
                  className={`text-[11px] font-semibold mt-1 transition-colors ${isCurrent ? 'text-blue-700 font-bold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                    }`}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {errorMessage && <Alert type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />}
      {successMessage && <Alert type="success" message={successMessage} />}

      {/* ======================================================== */}
      {/* STEP 1: SELECT ITEM GROUP                                */}
      {/* ======================================================== */}
      {currentStep === 1 && (
        <div className="space-y-5 py-2">
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Select Item Group</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Choose an Item Group to configure specifications and create a new catalog item.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {ITEM_GROUP_CARDS.map((card) => {
              const isSelected = formData.productType === card.productType;
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleSelectGroupCard(card)}
                  className={`flex flex-col text-left p-5 rounded-xl transition-all duration-150 cursor-pointer relative min-h-[148px] justify-between ${
                    isSelected
                      ? 'border-2 border-blue-600 bg-blue-50/80 shadow-sm ring-2 ring-blue-500/20'
                      : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-2xs'
                  }`}
                >
                  {/* Top Row: Icon on left, checkmark only when selected on right */}
                  <div className="flex items-center justify-between w-full mb-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon size={22} />
                    </div>

                    {/* Selected checkmark indicator */}
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Check size={14} className="stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Bottom Block: Name + Description */}
                  <div className="space-y-1">
                    <div className={`text-sm font-bold transition-colors ${
                      isSelected ? 'text-blue-900' : 'text-slate-900'
                    }`}>
                      {card.name}
                    </div>
                    <p className="text-[11.5px] text-slate-500 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

        {/* ======================================================== */}
        {/* STEP 2: ITEM DETAILS                                     */}
        {/* ======================================================== */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Step 2 – Item Details
              </span>
              <span className="text-[10.5px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">
                Group: {formData.productType}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3.5">
              {/* Item Name (Normal editable input, mandatory, never auto-populated) */}
              <FormField
                label="Item Name"
                required
                fullWidth
                helperText="Enter item name manually. This field is mandatory and is saved directly to Item Master."
              >
                <Input
                  name="itemName"
                  placeholder={
                    isFilter
                      ? 'e.g. SUPER-H13-455X965X150-SS304-350C'
                      : formData.productType === 'RAW_ITEM'
                      ? 'e.g. Stainless Steel Sheet 304 2mm'
                      : formData.productType === 'COIL'
                      ? 'e.g. Chilled Water Cooling Coil 4-Row'
                      : 'e.g. Double Skin Air Handling Unit 5000 CFM'
                  }
                  value={formData.itemName}
                  onChange={handleChange}
                  disabled={submitting}
                  autoFocus
                />
              </FormField>

              {/* 2-Column: Item Category, Inventory UOM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Item Category */}
                <FormField label="Item Category" required helperText="Filtered by selected Item Group.">
                  <Select
                    name="itemCategory"
                    value={formData.itemCategory}
                    onChange={handleCategoryChange}
                    disabled={submitting || loadingData || availableCategories.length === 0}
                  >
                    <option value="">
                      {availableCategories.length === 0 ? '-- No Categories In Group --' : '-- Select Category --'}
                    </option>
                    {availableCategories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {FIXED_CATEGORY_CODES.includes(c.categoryCode?.toUpperCase())
                          ? c.categoryName
                          : `${c.categoryName} (${c.categoryCode})`}
                      </option>
                    ))}
                  </Select>
                </FormField>

                {/* Inventory UOM (Default NOS for Filter) */}
                <FormField label="Inventory UOM" required helperText={isFilter ? "Defaults to NOS for Filter items." : "Base stocking / inventory unit."}>
                  <Select
                    name="inventoryUom"
                    value={formData.inventoryUom}
                    onChange={handleChange}
                    disabled={submitting || loadingData}
                  >
                    <option value="">-- Select UOM --</option>
                    {uoms.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.uomCode} — {u.uomName}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              {/* Optional Description */}
              <div className="pt-2 border-t border-slate-100">
                <FormField label="Description (Optional)" fullWidth helperText="Internal specifications or procurement notes.">
                  <Input
                    name="description"
                    placeholder="e.g. Standard production catalog item"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </FormField>
              </div>

              {/* Product Photo Upload */}
              <div className="pt-2 border-t border-slate-100">
                <FormField label="Product Photo (Optional)" helperText="Item photo or catalog visual.">
                  <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 p-2 rounded-lg">
                    {formData.imageUrl ? (
                      <div className="relative group w-10 h-10 rounded border border-slate-300 overflow-hidden bg-white shrink-0">
                        <img src={formData.imageUrl} alt="Item" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPreviewImageModalOpen(true)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"
                          title="View photo"
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                        <ImageIcon size={16} />
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                      className="hidden"
                    />

                    <div className="flex items-center gap-1.5 flex-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        icon={uploadingImage ? RefreshCw : (formData.imageUrl ? RefreshCw : UploadCloud)}
                        disabled={uploadingImage || submitting}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploadingImage ? '...' : formData.imageUrl ? 'Change' : 'Upload'}
                      </Button>
                      {formData.imageUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          className="text-red-600 hover:bg-red-50"
                          icon={Trash2}
                          disabled={uploadingImage || submitting}
                          onClick={handleRemoveImage}
                        />
                      )}
                    </div>
                  </div>
                  {imageError && <span className="text-[10px] text-red-600 mt-1 block">{imageError}</span>}
                </FormField>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: FILTER CONFIG (OR PRODUCT CONFIG FOR NON-FILTER) */}
        {/* ======================================================== */}
        {currentStep === 3 && isFilter && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200 p-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <Wrench size={16} className="text-blue-700" />
                <span className="font-bold text-blue-900 text-xs uppercase tracking-wider">
                  Step 3 – Filter Technical Configuration
                </span>
              </div>
              <span className="text-[10.5px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded border border-blue-200">
                Item Group: Filter
              </span>
            </div>

            {/* 3.1 Grade / Micron Selection (Interconnected & Locked on Mapping) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                  <ShieldCheck size={15} className="text-blue-600" />
                  <span>3.1 Grade & Micron Classification</span>
                  <span className="text-red-500 font-bold">*</span>
                </div>
                {isGradeMicronLocked && formData.filterGrade && selectedMicron ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <Lock size={10} className="text-emerald-600" />
                      Mapping Locked
                    </span>
                    <button
                      type="button"
                      onClick={handleResetGradeMicron}
                      disabled={submitting}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                      title="Unlock both fields together to select a different compatible pair"
                    >
                      <RotateCcw size={11} />
                      Reset / Change
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400">Interconnected selection</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {isGradeMicronLocked && formData.filterGrade && selectedMicron ? (
                  <>
                    <FormField
                      label={
                        <div className="flex items-center justify-between w-full">
                          <span>Filter Grade</span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                            <Lock size={10} className="text-slate-500" /> Locked
                          </span>
                        </div>
                      }
                      required
                      helperText="Filter Grade is locked to verified compatible mapping."
                    >
                      <div className="h-[38px] w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 flex items-center justify-between shadow-2xs select-none cursor-not-allowed">
                        <span className="truncate">
                          {selectedFg?.filterGrade || 'Selected Grade'} {selectedFg?.eurovent ? `(${selectedFg.eurovent})` : ''}
                        </span>
                        <Lock size={13} className="text-slate-400 shrink-0 ml-2" />
                      </div>
                    </FormField>

                    <FormField
                      label={
                        <div className="flex items-center justify-between w-full">
                          <span>Micron Rating</span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                            <Lock size={10} className="text-slate-500" /> Locked
                          </span>
                        </div>
                      }
                      required
                      helperText="Micron Rating is locked to verified compatible mapping."
                    >
                      <div className="h-[38px] w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 flex items-center justify-between shadow-2xs select-none cursor-not-allowed">
                        <span className="truncate font-mono">
                          {selectedMicron} µm ({selectedMicron} micron)
                        </span>
                        <Lock size={13} className="text-slate-400 shrink-0 ml-2" />
                      </div>
                    </FormField>
                  </>
                ) : (
                  <>
                    <FormField label="Filter Grade" required helperText="Selecting Grade auto-populates Micron and locks mapping.">
                      <Select
                        name="filterGrade"
                        value={formData.filterGrade}
                        onChange={(e) => handleGradeSelect(e.target.value)}
                        disabled={submitting || loadingData}
                      >
                        <option value="">-- Select Filter Grade --</option>
                        {filterGrades.map((fg) => {
                          const m = getMicronForGrade(fg._id);
                          return (
                            <option key={fg._id} value={fg._id}>
                              {fg.filterGrade} {fg.eurovent ? `(${ fg.eurovent })` : ''} {m ? `— ${m} µm` : ''}
                            </option>
                          );
                        })}
                      </Select>
                    </FormField>

                    <FormField label="Micron Rating" required helperText="Selecting Micron auto-populates Grade and locks mapping.">
                      <Select
                        value={selectedMicron}
                        onChange={(e) => handleMicronSelect(e.target.value)}
                        disabled={submitting || loadingData}
                      >
                        <option value="">-- Select Micron Rating --</option>
                        {availableMicrons.map((m) => (
                          <option key={m} value={m}>
                            {m} µm ({m} micron)
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </>
                )}
              </div>

              {formData.filterGrade && selectedMicron && (
                <div className="bg-emerald-50/90 border border-emerald-200 text-emerald-950 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] shadow-2xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    Verified Mapping: <strong>{selectedFg?.filterGrade || 'Selected Grade'}</strong> ({selectedFg?.eurovent || 'Eurovent'}) ⟷ <strong>{selectedMicron} µm</strong>
                  </span>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-emerald-700 font-mono text-[10.5px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
                      <Lock size={10} /> Verified & Locked
                    </span>
                    <button
                      type="button"
                      onClick={handleResetGradeMicron}
                      disabled={submitting}
                      className="text-[11px] font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Unlock both fields together to select a different compatible pair"
                    >
                      <RotateCcw size={11} className="text-blue-600" />
                      Reset / Change
                    </button>
                  </div>
                </div>
              )}

      {/* Grade Variant & Engineering Drawing Assignment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
        <FormField
          label="Grade Variant"
          required={!!formData.filterGrade}
          helperText={formData.filterGrade ? 'Select specification variant.' : 'Requires Filter Grade first.'}
        >
          <Select
            name="filterGradeVariant"
            value={formData.filterGradeVariant}
            onChange={handleChange}
            disabled={submitting || !formData.filterGrade || variantOptions.length === 0}
          >
            <option value="">
              {!formData.filterGrade
                ? '-- Select Grade First --'
                : variantOptions.length === 0
                  ? '-- No Variants Found --'
                  : '-- Select Variant --'}
            </option>
            {variantOptions.map((vo) => (
              <option key={vo.key} value={vo.key}>
                {vo.label}
              </option>
            ))}
          </Select>
        </FormField>

        {formData.filterGrade && (
          <div>
            <DrawingSelector
              filterGradeId={formData.filterGrade}
              filterGradeName={selectedFg?.filterGrade || ''}
              value={formData.drawing}
              drawingSnapshot={formData.drawingSnapshot}
              onChange={(drawingId, drawingSnapshot) => {
                setFormData((prev) => ({
                  ...prev,
                  drawing: drawingId || '',
                  drawingSnapshot: drawingSnapshot || null,
                }));
              }}
              disabled={submitting || loadingData}
              label="Assigned Engineering Drawing"
            />
          </div>
        )}

        {formData.filterGrade && formData.filterGradeVariant && (
          <div className="sm:col-span-2 pt-1">
            {selectedVariantObj?.noOfFolds ? (
              <div className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 flex items-center justify-between text-[11px] shadow-2xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <Layers size={13} className="text-slate-600 shrink-0" />
                  <span>No. of Folds (from Technical Variant):</span>
                  <strong className="text-slate-900 font-semibold">{selectedVariantObj.noOfFolds}</strong>
                </span>
                <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                  Variant Config
                </span>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-2.5 flex items-center gap-2 text-[11px] shadow-2xs">
                <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                <span>
                  ⚠️ <strong>Missing configuration:</strong> No fold value configured for this Technical Variant in Filter Grade Master.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* 3.2 Construction Type (BOX vs FLANGE) */}
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
          <Box size={15} className="text-purple-600" />
          <span>3.2 Filter Construction Type</span>
          <span className="text-red-500 font-bold">*</span>
        </div>
        <span className="text-[11px] text-slate-400">Controls drawing views & item code prefix</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleConstructionSelect('BOX')}
          className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left ${filterType === 'BOX'
              ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-1 ring-blue-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${filterType === 'BOX' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
          >
            <Box size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
              <span>BOX Construction</span>
              <span className="font-mono text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-bold">NFB Series</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Box casing without flange projection</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleConstructionSelect('FLANGE')}
          className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left ${filterType === 'FLANGE'
              ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${filterType === 'FLANGE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
          >
            <Maximize2 size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
              <span>FLANGE Construction</span>
              <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">NFF Series</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">With mounting flange & pitch pattern</p>
          </div>
        </button>
      </div>

      {/* Generated Item Code Display */}
      {filterType ? (
        <div
          className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
            filterType === 'BOX'
              ? 'bg-blue-50/70 border-blue-200'
              : 'bg-emerald-50/70 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold shadow-2xs ${
                filterType === 'BOX'
                  ? 'bg-blue-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              <Hash size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Generated Item Code
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    filterType === 'BOX'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {filterType === 'BOX' ? 'BOX • NFB Series' : 'FLANGE • NFF Series'}
                </span>
              </div>
              <div className="font-mono font-black text-slate-900 text-lg tracking-wider mt-0.5">
                {displayItemCode}
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right text-[11px] text-slate-500 leading-snug">
            <span className="font-medium text-slate-700">Live sequential code preview</span>
            <span className="block text-[10.5px] text-slate-400">
              {filterType === 'BOX'
                ? 'Assigned independently to BOX series'
                : 'Assigned independently to FLANGE series'}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 flex items-center gap-2.5 text-slate-500 text-xs">
          <Info size={16} className="text-blue-500 shrink-0" />
          <span>
            Select <strong>BOX Construction</strong> or <strong>FLANGE Construction</strong> above to generate and display the corresponding sequential item code (<strong>NFB-XXXX</strong> or <strong>NFF-XXXX</strong>).
          </span>
        </div>
      )}
    </div>

    {/* 3.3 Operating Temperature & Bonding Adhesive */}
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
          <Thermometer size={15} className="text-amber-600" />
          <span>3.3 Operating Temperature & Bonding Adhesive</span>
          <span className="text-red-500 font-bold">*</span>
        </div>
        <span className="text-[11px] text-slate-400">Stored as temperature range (e.g. 20–70 °C)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {TEMPERATURE_RANGE_OPTIONS.map((rng) => {
          const isSelected = selectedTempRangeId === rng.id || (
            formData.temperatureRange && formData.temperatureRange.includes(rng.rangeLabel)
          );
          return (
            <button
              key={rng.id}
              type="button"
              onClick={() => handleTempRangeSelect(rng.id)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${isSelected
                  ? 'border-blue-600 bg-blue-50/70 font-semibold shadow-2xs ring-1 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-900">{rng.rangeLabel}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                  {rng.adhesiveName}
                </span>
              </div>
              <span className="text-[10.5px] text-slate-500">
                Adhesive: <strong>{rng.adhesiveName}</strong>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <FormField
          label="Operating Temperature Range"
          required
          helperText="Temperature range string stored directly in database."
        >
          <Input
            name="temperatureRange"
            placeholder="e.g. 20–70 °C"
            value={formData.temperatureRange}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>

        <FormField label="Bonding Adhesive" required helperText="Media-to-casing bonding adhesive.">
          <Input
            name="bonding"
            value={formData.bonding}
            onChange={handleChange}
            placeholder="e.g. PU"
            disabled={submitting}
          />
        </FormField>
      </div>
    </div>

    {/* 3.4 Gasket MOC (Mandatory Separate Field) */}
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
          <ShieldCheck size={15} className="text-teal-600" />
          <span>3.4 Gasket MOC</span>
          <span className="text-red-500 font-bold">*</span>
        </div>
        <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-medium border border-teal-200">
          Auto-mapped from Temperature Range
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <FormField
          label="Gasket MOC"
          required
          helperText={
            formData.temperatureRange?.includes('250–350')
              ? "Automatically set to Glass Fiber Pad for 250–350 °C."
              : "Automatically set to EPDM for temperatures up to 250 °C."
          }
        >
          <Select
            name="gasketMoc"
            value={formData.gasketMoc}
            onChange={handleChange}
            disabled={submitting}
          >
            {STANDARD_GASKET_MOC_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
            {formData.gasketMoc && !STANDARD_GASKET_MOC_OPTIONS.includes(formData.gasketMoc) && (
              <option value={formData.gasketMoc}>
                {formData.gasketMoc} (Historical)
              </option>
            )}
          </Select>
        </FormField>
      </div>
    </div>

    {/* 3.5 Material of Construction (MOC) */}
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
          <Wrench size={15} className="text-slate-600" />
          <span>3.5 Material of Construction (MOC)</span>
          <span className="text-red-500 font-bold">*</span>
        </div>
        <span className="text-[11px] text-slate-400">Frame casing material</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <FormField label="Select MOC" required helperText="Options: Aluminium, SS304, SS316">
          <Select
            name="moc"
            value={formData.moc}
            onChange={handleChange}
            disabled={submitting}
          >
            <option value="">-- Select MOC --</option>
            {STANDARD_MOC_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            {formData.moc && !STANDARD_MOC_OPTIONS.includes(formData.moc) && (
              <option value={formData.moc}>
                {formData.moc} (Historical)
              </option>
            )}
          </Select>
        </FormField>
      </div>
    </div>

    {/* 3.6 Filter Size: Custom Filter Box Size / Dimensions */}
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
          <Maximize2 size={15} className="text-indigo-600" />
          <span>3.6 Filter Size: {isFlange ? 'Custom Filter Box Size (MM)' : 'Filter Dimensions (MM)'}</span>
          <span className="text-red-500 font-bold">*</span>
        </div>
        <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-200">
          {isFlange ? 'Custom Filter Box Size' : 'Enter Dimensions Only'}
        </span>
      </div>
      {isFlange && (
        <div className="text-[11.5px] text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
          Define custom filter/body dimensions (Length, Breadth, Depth). Custom dimensions are stored in Item Master and control inner airflow core, airflow (CFM), and drawing generation.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
        <FormField label="Length (MM)" required>
          <Input
            type="number"
            step="any"
            name="filterLength"
            placeholder="e.g. 610"
            value={formData.filterLength}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>

        <FormField label="Breadth (MM)" required>
          <Input
            type="number"
            step="any"
            name="filterWidth"
            placeholder="e.g. 610"
            value={formData.filterWidth}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>

        <FormField label="Depth (MM)" required>
          <Input
            type="number"
            step="any"
            name="filterDepth"
            placeholder="e.g. 150"
            value={formData.filterDepth}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>

        <FormField
          label={
            <div className="flex items-center justify-between gap-1 w-full">
              <span>Face Velocity (FPM)</span>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                Fetched from Face Velocity Master
              </span>
            </div>
          }
        >
          <Input
            type="text"
            name="faceVelocity"
            placeholder={isFetchingFaceVelocity ? "Searching..." : (matchedFaceVelocityConfig ? `${formData.faceVelocity} FPM` : "Auto-fetched")}
            value={formData.faceVelocity ? `${formData.faceVelocity} FPM` : ''}
            readOnly
            disabled
            className="bg-slate-50 cursor-not-allowed font-medium text-slate-800"
          />
        </FormField>

        <FormField label="Airflow (CFM)">
          <div className="h-[38px] flex items-center justify-center bg-blue-50 border border-blue-200 rounded-md font-mono font-bold text-blue-700 text-xs">
            {calculatedCfm !== null ? `${calculatedCfm} CFM` : '—'}
          </div>
        </FormField>
      </div>

      {/* Face Velocity Master Lookup Status & Parameters */}
      {formData.productType === 'FILTER' && (
        <div className="space-y-2.5">
          {/* Searching Spinner */}
          {isFetchingFaceVelocity && (
            <div className="bg-blue-50/90 rounded-xl border border-blue-200 p-3 flex items-center gap-2.5 text-xs text-blue-900 shadow-2xs">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <div>
                <span className="font-semibold block text-blue-950">Searching Face Velocity Master configuration...</span>
                <span className="text-blue-700 text-[11px]">Looking up matching Filter Grade and Depth range...</span>
              </div>
            </div>
          )}

          {/* Matched Configuration Banner */}
          {matchedFaceVelocityConfig && (
            <div className="bg-emerald-50/90 rounded-xl border border-emerald-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Gauge size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-950">
                      Face Velocity Master Matched
                    </span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                      Depth {matchedFaceVelocityConfig.minDepth}–{matchedFaceVelocityConfig.maxDepth} mm
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-emerald-900 mt-1 font-medium">
                    <span>Grade: <strong>{selectedFg?.filterGrade || matchedFaceVelocityConfig.filterGrade?.filterGrade || 'Selected'}</strong></span>
                    {matchedFaceVelocityConfig.filterGrades && matchedFaceVelocityConfig.filterGrades.length > 1 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded border border-emerald-200">
                        {matchedFaceVelocityConfig.filterGrades.length} Grades Configured
                      </span>
                    )}
                    <span>•</span>
                    <span>Face Velocity: <strong>{matchedFaceVelocityConfig.faceVelocity} FPM</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multiple Matching Ambiguity Notice */}
          {!isFetchingFaceVelocity && faceVelocityAmbiguityError && (
            <div className="bg-red-50 rounded-xl border border-red-300 p-3.5 flex items-start gap-2.5 text-xs text-red-950 shadow-2xs">
              <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block text-red-950">Configuration Ambiguity Error</span>
                <p className="text-red-900 text-xs leading-relaxed">
                  {faceVelocityAmbiguityError}
                </p>
                <div className="pt-0.5">
                  <span className="inline-block text-[11px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                    Next step is disabled until overlapping depth ranges in Face Velocity Master are resolved.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Missing Configuration Notice */}
          {!isFetchingFaceVelocity && faceVelocityLookupAttempted && !matchedFaceVelocityConfig && !faceVelocityAmbiguityError && formData.filterGrade && formData.filterDepth && (
            <div className="bg-amber-50 rounded-xl border border-amber-300 p-3.5 flex items-start gap-2.5 text-xs text-amber-950 shadow-2xs">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block text-amber-950">No matching Face Velocity Master configuration found</span>
                <p className="text-amber-900 text-xs leading-relaxed">
                  No matching Face Velocity Master configuration found for the selected Filter Grade and Depth. Please configure the required depth range.
                </p>
                <div className="pt-0.5">
                  <span className="inline-block text-[11px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                    Next step is disabled until a matching Face Velocity Master configuration is available.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calculated Inner Dimensions Display */}
      <div
        className={`p-3.5 rounded-xl border transition-all ${
          calculatedInnerDimensions.validationError
            ? 'bg-red-50/70 border-red-200'
            : calculatedInnerDimensions.isFlange
            ? 'bg-emerald-50/60 border-emerald-200'
            : 'bg-blue-50/60 border-blue-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/60 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                calculatedInnerDimensions.validationError
                  ? 'bg-red-600 text-white'
                  : calculatedInnerDimensions.isFlange
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              <Layers size={14} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800">
                Calculated Inner Dimensions (MM)
              </span>
              <span className="text-[10px] text-slate-500 block">
                Auto-calculated in real time from outer dimensions (Read-only)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {calculatedInnerDimensions.isFlange ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                −60 mm Flange Allowance (30 mm per side)
              </span>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                BOX Construction (Inner = Outer)
              </span>
            )}
          </div>
        </div>

        {calculatedInnerDimensions.validationError ? (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-100/90 px-3 py-2 rounded-lg border border-red-200 font-medium">
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            <span>{calculatedInnerDimensions.validationError}</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Inner Length (MM)</span>
              <strong className="text-sm font-mono font-bold text-slate-900">
                {calculatedInnerDimensions.displayInnerL}
              </strong>
              {calculatedInnerDimensions.isFlange && calculatedInnerDimensions.innerLength !== null ? (
                <span className="text-[9.5px] text-emerald-700 block mt-0.5 font-medium">
                  {formData.filterLength} − 60 mm
                </span>
              ) : (
                <span className="text-[9.5px] text-slate-400 block mt-0.5">
                  Equal to outer length
                </span>
              )}
            </div>

            <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Inner Width (MM)</span>
              <strong className="text-sm font-mono font-bold text-slate-900">
                {calculatedInnerDimensions.displayInnerW}
              </strong>
              {calculatedInnerDimensions.isFlange && calculatedInnerDimensions.innerWidth !== null ? (
                <span className="text-[9.5px] text-emerald-700 block mt-0.5 font-medium">
                  {formData.filterWidth} − 60 mm
                </span>
              ) : (
                <span className="text-[9.5px] text-slate-400 block mt-0.5">
                  Equal to outer width
                </span>
              )}
            </div>

            <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Inner Depth (MM)</span>
              <strong className="text-sm font-mono font-bold text-slate-900">
                {calculatedInnerDimensions.displayInnerD}
              </strong>
              <span className="text-[9.5px] text-slate-400 block mt-0.5">
                Depth unchanged
              </span>
            </div>

            <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Inner / Core Size</span>
              <strong className="text-xs font-mono font-bold text-indigo-700 truncate block">
                {calculatedInnerDimensions.summaryInner}
              </strong>
              <span className="text-[9.5px] text-indigo-600 block mt-0.5">
                Active airflow area
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dimensional Rule Explanation */}
      <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start gap-2">
        <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
        <span>
          {calculatedInnerDimensions.isFlange ? (
            <>
              <strong>FLANGE Construction:</strong> Enter outer casing dimensions. The system automatically subtracts the standard 60 mm flange allowance (30 mm per side) to calculate Inner Length and Inner Width. Inner Depth equals Outer Depth.
            </>
          ) : (
            <>
              <strong>BOX Construction:</strong> Inner dimensions are strictly equal to outer dimensions without flange extension.
            </>
          )}
        </span>
      </div>
    </div>
  </div>
)}

{/* ======================================================== */ }
{/* STEP 3 (NON-FILTER): PRODUCT CONFIG & SPECIFICATIONS     */ }
{/* ======================================================== */ }
{
  currentStep === 3 && !isFilter && (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
        <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
          Step 3 – Product Specifications & Configuration
        </span>
        <span className="text-[10.5px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">
          Group: {formData.productType}
        </span>
      </div>

      {/* Required Category Specifications */}
      {requiredSpecs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800 text-xs">Required Category Specifications</span>
            <span className="text-[10.5px] text-slate-500">Mandatory parameters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {requiredSpecs.map((spec) => renderSpecInput(spec, true))}
          </div>
        </div>
      )}

      {/* Optional Category Specifications */}
      {optionalSpecs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800 text-xs">Optional Category Specifications</span>
            <span className="text-[10.5px] text-slate-500">Additional parameters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {optionalSpecs.map((spec) => renderSpecInput(spec, false))}
          </div>
        </div>
      )}

      {requiredSpecs.length === 0 && optionalSpecs.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-500">
          <p className="text-xs">No additional category specifications configured for this category.</p>
          <p className="text-[11px] text-slate-400 mt-1">Click Next to review and save the item.</p>
        </div>
      )}
    </div>
  )
}

{/* ======================================================== */ }
{/* STEP 4: REVIEW & SAVE                                    */ }
{/* ======================================================== */ }
{
  currentStep === 4 && (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
        <span className="font-bold text-emerald-950 text-xs uppercase tracking-wider">
          Step 4 – Review Configuration & Save Item
        </span>
        <span className="text-[10.5px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
          Final Review
        </span>
      </div>

      {/* Final Review Summary Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-3.5">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
          Item Configuration Summary
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Item Code</span>
            <strong className="text-xs font-mono font-bold text-blue-700">{displayItemCode}</strong>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 col-span-2 sm:col-span-3">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Item Name</span>
            <strong className="text-xs font-bold text-slate-900 truncate block">{formData.itemName || '—'}</strong>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Item Group</span>
            <strong className="text-xs text-slate-800">{formData.productType}</strong>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Item Category</span>
            <strong className="text-xs text-slate-800 truncate block">
              {itemCategories.find(c => String(c._id) === String(formData.itemCategory))?.categoryName || '—'}
            </strong>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Inventory UOM</span>
            <strong className="text-xs text-slate-800">
              {uoms.find(u => String(u._id) === String(formData.inventoryUom))?.uomCode || 'NOS'}
            </strong>
          </div>

          {isFilter && (
            <>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Construction</span>
                <strong className="text-xs text-purple-700 font-bold">{filterType || 'BOX'}</strong>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Grade / Micron</span>
                <strong className="text-xs text-slate-800">
                  {selectedFg?.filterGrade || 'Grade'} {selectedMicron ? `(${selectedMicron} µm)` : ''}
                </strong>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">No. of Folds</span>
                <strong className="text-xs text-slate-800">
                  {selectedVariantObj?.noOfFolds || formData.noOfFolds || <span className="text-amber-600 font-normal italic">Not configured</span>}
                </strong>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Operating Temperature</span>
                <strong className="text-xs text-slate-800 font-mono">
                  {formData.temperatureRange || (formData.temperatureRating ? `${formData.temperatureRating} °C` : '—')}
                </strong>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Bonding Adhesive</span>
                <strong className="text-xs text-slate-800">
                  {formData.bonding || 'PU'}
                </strong>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Gasket MOC</span>
                <strong className="text-xs text-teal-700 font-bold">
                  {formData.gasketMoc || 'EPDM'}
                </strong>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Material (MOC)</span>
                <strong className="text-xs text-slate-800">
                  {formData.moc || '—'}
                </strong>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Outer Dimensions (L × W × D)</span>
                <strong className="text-xs font-mono font-bold text-slate-900 block truncate">
                  {calculatedInnerDimensions.summaryOuter}
                </strong>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Calculated Inner Dimensions</span>
                <strong className="text-xs font-mono font-bold text-emerald-800 block truncate">
                  {calculatedInnerDimensions.summaryInner}
                </strong>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Face Velocity</span>
                <strong className="text-xs text-blue-700 font-bold">
                  {formData.faceVelocity ? `${formData.faceVelocity} FPM` : '—'}
                </strong>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Airflow Capacity</span>
                <strong className="text-xs font-mono font-bold text-blue-700">
                  {calculatedCfm !== null ? `${calculatedCfm} CFM` : '—'}
                </strong>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Collapsible Advanced Inventory Planning */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <button
          type="button"
          onClick={() => setShowAdvancedDetails((prev) => !prev)}
          className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 transition-colors text-left font-semibold text-slate-800 text-xs cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            {showAdvancedDetails ? <ChevronDown size={15} className="text-blue-600" /> : <ChevronRight size={15} className="text-slate-500" />}
            <span>Advanced Inventory & Storage Controls</span>
            <span className="text-slate-400 font-normal">
              (UOM conversions, inventory reorder levels, default bin)
            </span>
          </div>
          <span className="text-[11px] text-blue-600 font-medium">
            {showAdvancedDetails ? 'Collapse ▲' : 'Expand ▼'}
          </span>
        </button>

        {showAdvancedDetails && (
          <div className="p-4 border-t border-slate-200 space-y-4 bg-white">
            {/* UOM Conversions */}
            <div>
              <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                UOM Conversions & Multipliers
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <FormField label="Purchase UOM" helperText="Unit when purchasing.">
                  <Select
                    name="purchaseUom"
                    value={formData.purchaseUom}
                    onChange={handleChange}
                    disabled={submitting || loadingData}
                  >
                    <option value="">-- Same as Inventory --</option>
                    {uoms.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.uomCode} — {u.uomName}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Sales UOM" helperText="Unit when selling.">
                  <Select
                    name="salesUom"
                    value={formData.salesUom}
                    onChange={handleChange}
                    disabled={submitting || loadingData}
                  >
                    <option value="">-- Same as Inventory --</option>
                    {uoms.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.uomCode} — {u.uomName}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Item / Purchase Unit">
                  <Input
                    type="number"
                    step="any"
                    min="0.000001"
                    name="itemPerPurchaseUnit"
                    value={formData.itemPerPurchaseUnit}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </FormField>

                <FormField label="Item / Sales Unit">
                  <Input
                    type="number"
                    step="any"
                    min="0.000001"
                    name="itemPerSalesUnit"
                    value={formData.itemPerSalesUnit}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </FormField>
              </div>
            </div>

            {/* Taxation & Storage Controls */}
            <div className="pt-3 border-t border-slate-100">
              <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Taxation & Storage Location
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="HSN / SAC Code">
                  <Input
                    name="hsnCode"
                    placeholder="e.g. 84213920"
                    value={formData.hsnCode}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </FormField>

                <FormField label="Default Storage Bin">
                  <Select
                    name="defaultBin"
                    value={formData.defaultBin}
                    onChange={handleChange}
                    disabled={submitting || loadingData}
                  >
                    <option value="">-- Unassigned --</option>
                    {bins.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.binCode} {b.zone ? `(${b.zone})` : ''}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Catalog Status">
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </FormField>
              </div>
            </div>

            {/* Inventory Levels */}
            <div className="pt-3 border-t border-slate-100">
              <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Inventory Thresholds & Lead Time
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <FormField label="Reorder Level">
                  <Input
                    type="number"
                    name="reorderLevel"
                    value={formData.reorderLevel}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </FormField>

                <FormField label="Reorder Qty">
                  <Input
                    type="number"
                    name="reorderQty"
                    value={formData.reorderQty}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </FormField>

                <FormField label="Min Inventory">
                  <Input
                    type="number"
                    name="minInventory"
                    value={formData.minInventory}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </FormField>

                <FormField label="Max Inventory">
                  <Input
                    type="number"
                    name="maxInventory"
                    value={formData.maxInventory}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </FormField>

                <FormField label="Lead Time (Days)">
                  <Input
                    type="number"
                    name="leadTimeDays"
                    value={formData.leadTimeDays}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </FormField>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
      </div >

  {/* Image Preview Zoom Modal */ }
{
  previewImageModalOpen && formData.imageUrl && (
    <Modal
      isOpen={previewImageModalOpen}
      onClose={() => setPreviewImageModalOpen(false)}
      title="Item Photo Preview"
      maxWidth="500px"
    >
      <div className="flex flex-col items-center justify-center p-2">
        <img
          src={formData.imageUrl}
          alt={formData.itemName}
          className="max-h-[380px] w-auto rounded object-contain border border-slate-200"
        />
        <div className="mt-3 flex justify-end w-full">
          <Button variant="secondary" onClick={() => setPreviewImageModalOpen(false)}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
    </Modal >
  );
};

export default ItemFormModal;
