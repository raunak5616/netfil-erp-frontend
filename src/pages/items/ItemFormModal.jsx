import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  useCreateItemMutation,
  useUpdateItemMutation,
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
  Box
} from 'lucide-react';

const PRODUCT_TYPE_TO_ITEM_TYPE = {
  RAW_ITEM: 'raw_material',
  FILTER: 'finished_goods',
  COIL: 'finished_goods',
  AHU: 'finished_goods',
};

// Fixed predefined system category codes
const FIXED_CATEGORY_CODES = ['RAW', 'FILTER', 'COIL', 'AHU'];

const PRODUCT_TYPES = [
  { value: 'RAW_ITEM', label: 'Raw', desc: 'Raw material / components' },
  { value: 'FILTER', label: 'Filter', desc: 'Air filter products' },
  { value: 'COIL', label: 'Coil', desc: 'Heating / cooling coils' },
  { value: 'AHU', label: 'AHU', desc: 'Air handling units' },
];

// Standard MOC options discovered from master data and historical ERP records
const STANDARD_MOC_OPTIONS = [
  'Aluminum',
  'SS304',
  'SS316L',
  'Galvanized Iron (GI)',
  'CRCA Powder Coated',
  'Mild Steel',
  'OTHER'
];

// Confirmed Bonding options with operating temperature ranges
const BONDING_OPTIONS = [
  { value: 'PU Bonding', label: 'PU Bonding (50–150 °C)', minTemp: 50, maxTemp: 150 },
  { value: 'Epoxy Bonding', label: 'Epoxy Bonding (200–350 °C)', minTemp: 200, maxTemp: 350 },
  { value: 'White Adhesive (Ceramic)', label: 'White Adhesive (Ceramic) (230–400 °C)', minTemp: 230, maxTemp: 400 }
];

const ItemFormModal = ({
  item,
  isOpen,
  onClose,
  onSuccess,
  initialProductType = 'RAW_ITEM',
  initialItemName = '',
}) => {
  const isEditMode = !!item;

  const [filterType, setFilterType] = useState(
    (item?.filterType === 'BOX' || item?.filterType === 'FLANGE')
      ? item.filterType
      : (item?.constructionType === 'BOX' || item?.constructionType === 'FLANGE')
        ? item.constructionType
        : ''
  );

  const [selectedItemGroupId, setSelectedItemGroupId] = useState('');
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
    productType: initialProductType || 'RAW_ITEM',
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
    faceVelocity: 500,
    temperatureRating: '',
    bonding: '',
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

  // Populate form data on open / change of item
  useEffect(() => {
    if (item) {
      const initialMoc = STANDARD_MOC_OPTIONS.includes(item.moc) ? item.moc : (item.moc ? 'OTHER' : '');
      const initialCustomMoc = initialMoc === 'OTHER' ? item.moc : '';
      const resolvedFilterType = (item.filterType === 'BOX' || item.filterType === 'FLANGE')
        ? item.filterType
        : (item.constructionType === 'BOX' || item.constructionType === 'FLANGE')
          ? item.constructionType
          : '';

      const initGroupId = item.itemGroup?._id || item.itemGroup || item.itemCategory?.itemGroup?._id || item.itemCategory?.itemGroup || '';
      setSelectedItemGroupId(initGroupId);

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
        customMoc: initialCustomMoc,
        flangeType: item.flangeType?._id || item.flangeType || '',
        filterLength: item.filterLength !== null && item.filterLength !== undefined ? item.filterLength : '',
        filterWidth: item.filterWidth !== null && item.filterWidth !== undefined ? item.filterWidth : '',
        filterDepth: item.filterDepth !== null && item.filterDepth !== undefined ? item.filterDepth : '',
        faceVelocity: item.faceVelocity !== null && item.faceVelocity !== undefined ? item.faceVelocity : 500,
        temperatureRating: item.temperatureRating !== null && item.temperatureRating !== undefined ? item.temperatureRating : '',
        bonding: item.bonding || '',
      });
      setFilterType(resolvedFilterType);
      setImageError('');
    } else {
      const pType = initialProductType || 'RAW_ITEM';
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
        itemType: PRODUCT_TYPE_TO_ITEM_TYPE[pType] || 'raw_material',
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
        faceVelocity: 500,
        temperatureRating: '',
        bonding: '',
      });
      setFilterType('');
      setImageError('');
      setSpecsData({});
      setShowAdvancedDetails(false);
    }

    setErrorMessage('');
    setSuccessMessage('');
  }, [item, isOpen, initialProductType, initialItemName]);

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
    } else if (!selectedItemGroupId) {
      const pType = initialProductType || 'RAW_ITEM';
      const matched = itemGroups.find((g) =>
        (g.applicableProductTypes || []).includes(pType) ||
        (g.groupName || '').toUpperCase() === (pType === 'RAW_ITEM' ? 'RAW' : pType)
      );
      if (matched) {
        setSelectedItemGroupId(matched._id);
        setFormData((prev) => ({ ...prev, itemGroup: matched._id }));
      } else if (itemGroups[0]) {
        setSelectedItemGroupId(itemGroups[0]._id);
        setFormData((prev) => ({ ...prev, itemGroup: itemGroups[0]._id }));
      }
    }
  }, [itemGroups, item, initialProductType, isOpen, selectedItemGroupId]);

  // Available categories: strictly filter by selected Item Group
  const availableCategories = useMemo(() => {
    let list = [...itemCategories];
    if (selectedItemGroupId) {
      list = list.filter((cat) => {
        const catGroupId = typeof cat.itemGroup === 'object' ? cat.itemGroup?._id : cat.itemGroup;
        if (catGroupId && String(catGroupId) === String(selectedItemGroupId)) return true;
        // Fallback matching if category has no itemGroup yet
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

  // Filter core specs identification (handled by dedicated filter inputs)
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

  // Calculated CFM: (Length in MM / 304.8) * (Width in MM / 304.8) * Face Velocity in FPM, rounded to 10
  const calculatedCfm = useMemo(() => {
    const l = Number(formData.filterLength);
    const w = Number(formData.filterWidth);
    const fv = Number(formData.faceVelocity);
    if (!Number.isFinite(l) || l <= 0 || !Number.isFinite(w) || w <= 0 || !Number.isFinite(fv) || fv <= 0) {
      return null;
    }
    const rawCfm = (l / 304.8) * (w / 304.8) * fv;
    const rounded10 = Math.round(rawCfm / 10) * 10;
    return rounded10 === 0 && rawCfm > 0 ? Math.round(rawCfm) : rounded10;
  }, [formData.filterLength, formData.filterWidth, formData.faceVelocity]);

  // Automatic calculation of overall physical filter dimensions
  // When Flange Type = FLANGE: 30 mm flange allowance on both sides (+60 mm total) for Length and Width. Depth unchanged.
  // When Flange Type = BOX: No flange allowance added. Overall dimensions remain equal to body dimensions.
  const calculatedOverallDimensions = useMemo(() => {
    const rawL = Number(formData.filterLength);
    const rawW = Number(formData.filterWidth);
    const rawD = Number(formData.filterDepth);
    const hasL = Number.isFinite(rawL) && rawL > 0;
    const hasW = Number.isFinite(rawW) && rawW > 0;
    const hasD = Number.isFinite(rawD) && rawD > 0;

    const isFlange = filterType === 'FLANGE';
    const isBox = filterType === 'BOX';

    if (!isFlange && !isBox) {
      return {
        overallLength: hasL ? rawL : '',
        overallWidth: hasW ? rawW : '',
        overallDepth: hasD ? rawD : '',
        displayL: hasL ? `${rawL} mm` : '—',
        displayW: hasW ? `${rawW} mm` : '—',
        displayD: hasD ? `${rawD} mm` : '—',
        summary: (hasL && hasW && hasD) ? `${rawL} × ${rawW} × ${rawD} mm` : '—'
      };
    }

    const overallL = hasL ? (isFlange ? rawL + 60 : rawL) : '';
    const overallW = hasW ? (isFlange ? rawW + 60 : rawW) : '';
    const overallD = hasD ? rawD : '';

    return {
      overallLength: overallL,
      overallWidth: overallW,
      overallDepth: overallD,
      displayL: overallL !== '' ? `${overallL} mm` : '—',
      displayW: overallW !== '' ? `${overallW} mm` : '—',
      displayD: overallD !== '' ? `${overallD} mm` : '—',
      summary: (overallL !== '' && overallW !== '' && overallD !== '') ? `${overallL} × ${overallW} × ${overallD} mm` : '—'
    };
  }, [formData.filterLength, formData.filterWidth, formData.filterDepth, filterType]);

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

  const handleItemGroupSelect = (group) => {
    const groupId = group?._id;
    setSelectedItemGroupId(groupId);

    let pType = 'RAW_ITEM';
    if (group.applicableProductTypes && group.applicableProductTypes.length > 0) {
      pType = group.applicableProductTypes[0];
    } else {
      const gNorm = (group.groupName || group.groupCode || '').toUpperCase();
      if (gNorm.includes('FILTER')) pType = 'FILTER';
      else if (gNorm.includes('COIL')) pType = 'COIL';
      else if (gNorm.includes('AHU')) pType = 'AHU';
      else pType = 'RAW_ITEM';
    }

    const nextItemType = PRODUCT_TYPE_TO_ITEM_TYPE[pType] || 'raw_material';

    // Find categories belonging to this newly selected group
    const groupCategories = itemCategories.filter((c) => {
      const catGrpId = typeof c.itemGroup === 'object' ? c.itemGroup?._id : c.itemGroup;
      if (catGrpId && String(catGrpId) === String(groupId)) return true;
      const gNorm = (group.groupName || group.groupCode || '').toUpperCase();
      const cNorm = (c.categoryName || c.categoryCode || '').toUpperCase();
      return cNorm.includes(gNorm) || gNorm.includes(cNorm);
    });

    const isCurrentCatInGroup = groupCategories.some((c) => String(c._id) === String(formData.itemCategory));
    const nextCategory = isCurrentCatInGroup ? formData.itemCategory : (groupCategories[0]?._id || '');

    setFormData((prev) => {
      const next = {
        ...prev,
        itemGroup: groupId,
        productType: pType,
        itemType: nextItemType,
        itemCategory: nextCategory,
      };

      if (pType !== 'FILTER') {
        setFilterType('');
        next.filterType = '';
        next.constructionType = '';
        next.flangeType = '';
        next.filterGrade = '';
        next.filterGradeVariant = '';
        next.filterLength = '';
        next.filterWidth = '';
        next.filterDepth = '';
        next.faceVelocity = 500;
        next.temperatureRating = '';
        next.bonding = '';
      }

      return next;
    });
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

  const handleProductTypeChange = (newType) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        productType: newType,
        itemType: PRODUCT_TYPE_TO_ITEM_TYPE[newType] || 'raw_material',
      };

      const targetCode = newType === 'RAW_ITEM' ? 'RAW' : newType;
      const matched = itemCategories.find(c => c.categoryCode?.toUpperCase() === targetCode);
      if (matched) {
        next.itemCategory = matched._id;
      }

      if (newType !== 'FILTER') {
        setFilterType('');
        next.filterType = '';
        next.constructionType = '';
        next.flangeType = '';
        next.filterGrade = '';
        next.filterGradeVariant = '';
        next.filterLength = '';
        next.filterWidth = '';
        next.filterDepth = '';
        next.faceVelocity = 500;
        next.temperatureRating = '';
        next.bonding = '';
      }

      return next;
    });
  };

  const handleFilterTypeChange = (e) => {
    const val = e.target.value;
    setFilterType(val);
    setFormData((prev) => ({
      ...prev,
      filterType: val,
      constructionType: val,
      flangeType: val === 'FLANGE' ? prev.flangeType : '',
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: name === 'itemCode' ? value.toUpperCase() : value,
      };

      // Auto-set purchase and sales UOM when inventory UOM is picked for the first time
      if (name === 'inventoryUom') {
        if (!prev.purchaseUom) next.purchaseUom = value;
        if (!prev.salesUom) next.salesUom = value;
      }

      if (name === 'filterGrade') {
        next.filterGradeVariant = '';
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

    // Filter-specific validation
    if (formData.productType === 'FILTER') {
      if (!filterType) {
        return 'Filter Type (Box or Flange) is required for Filter items.';
      }
      if (formData.filterGrade && !formData.filterGradeVariant) {
        return 'Filter Grade Variant is required when a Filter Grade is selected.';
      }
      if (formData.filterLength !== '' && (Number(formData.filterLength) <= 0 || isNaN(Number(formData.filterLength)))) {
        return 'Filter Length must be a positive number in MM.';
      }
      if (formData.filterWidth !== '' && (Number(formData.filterWidth) <= 0 || isNaN(Number(formData.filterWidth)))) {
        return 'Filter Width must be a positive number in MM.';
      }
      if (formData.faceVelocity !== '' && (Number(formData.faceVelocity) <= 0 || isNaN(Number(formData.faceVelocity)))) {
        return 'Face Velocity must be a positive number in FPM.';
      }
      if (formData.moc === 'OTHER' && !formData.customMoc?.trim()) {
        return 'Please specify the custom Material of Construction (MOC).';
      }
    }

    if (Number(formData.itemPerPurchaseUnit) <= 0) {
      return 'Item per purchase unit must be greater than 0.';
    }
    if (Number(formData.itemPerSalesUnit) <= 0) {
      return 'Item per sales unit must be greater than 0.';
    }

    // Validate required category specifications
    for (const spec of requiredSpecs) {
      let val = specsData[spec._id]?.value;
      if (val === undefined || val === null || String(val).trim() === '') {
        return `Specification '${spec.specificationName}' is required for this category.`;
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        drawing: formData.productType === 'FILTER' && formData.drawing ? formData.drawing : null,
        drawingSnapshot: formData.productType === 'FILTER' ? formData.drawingSnapshot : null,
        filterLength: formData.productType === 'FILTER' && formData.filterLength !== '' ? Number(formData.filterLength) : null,
        filterWidth: formData.productType === 'FILTER' && formData.filterWidth !== '' ? Number(formData.filterWidth) : null,
        filterDepth: formData.productType === 'FILTER' && formData.filterDepth !== '' ? Number(formData.filterDepth) : null,
        faceVelocity: formData.productType === 'FILTER' && formData.faceVelocity !== '' ? Number(formData.faceVelocity) : 500,
        cfm: formData.productType === 'FILTER' ? calculatedCfm : null,
        moc: formData.productType === 'FILTER' ? (formData.moc === 'OTHER' ? (formData.customMoc?.trim() || 'OTHER') : formData.moc) : '',
        bonding: formData.productType === 'FILTER' ? formData.bonding : '',
        temperatureRating: formData.productType === 'FILTER' && formData.temperatureRating !== '' ? Number(formData.temperatureRating) : null,
        overallLength: formData.productType === 'FILTER' && calculatedOverallDimensions.overallLength !== ''
          ? Number(calculatedOverallDimensions.overallLength)
          : null,
        overallWidth: formData.productType === 'FILTER' && calculatedOverallDimensions.overallWidth !== ''
          ? Number(calculatedOverallDimensions.overallWidth)
          : null,
        overallDepth: formData.productType === 'FILTER' && calculatedOverallDimensions.overallDepth !== ''
          ? Number(calculatedOverallDimensions.overallDepth)
          : null,
        overallBoxConstruction: formData.productType === 'FILTER'
          ? (calculatedOverallDimensions.summary !== '—' ? calculatedOverallDimensions.summary : '')
          : '',
        boxConstruction: formData.productType === 'FILTER'
          ? (calculatedOverallDimensions.summary !== '—' ? calculatedOverallDimensions.summary : '')
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
            autoVal = formData.temperatureRating !== '' ? formData.temperatureRating : null;
          }
          else if (code.includes('BOX_CONST') || code.includes('OVERALL_BOX') || name.includes('BOX CONSTRUCTION') || name.includes('OVERALL BOX')) {
            autoVal = calculatedOverallDimensions.summary !== '—' ? calculatedOverallDimensions.summary : '';
          }

          if (autoVal !== null && autoVal !== undefined && autoVal !== '') {
            effectiveSpecs[specId] = {
              ...(effectiveSpecs[specId] || {}),
              value: String(autoVal),
              isApply: effectiveSpecs[specId]?.isApply ?? true,
              isFix: effectiveSpecs[specId]?.isFix ?? false,
            };
          }
        });
      }

      const targetItemId = savedItem?._id || item?._id;
      if (targetItemId) {
        for (const [specId, specVal] of Object.entries(effectiveSpecs)) {
          if (specVal.value !== undefined && specVal.value !== null && specVal.value !== '') {
            try {
              if (specVal.isExisting) {
                await updateItemSpecMutation({
                  itemId: targetItemId,
                  specificationId: specId,
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

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Item — ${formData.itemCode}` : 'Add New Item'}
      maxWidth="760px"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEditMode ? 'Update Item' : 'Save Item'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
        {errorMessage && <Alert type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />}
        {successMessage && <Alert type="success" message={successMessage} />}

        {/* 1. BASIC INFORMATION */}
        <div className="space-y-3.5">
          {/* Item Group (Select Item Group First) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Item Group <span className="text-red-500 font-bold">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Select Item Group first to filter available categories
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {itemGroups.map((group) => {
                const isSelected = String(selectedItemGroupId) === String(group._id);
                return (
                  <button
                    key={group._id}
                    type="button"
                    onClick={() => handleItemGroupSelect(group)}
                    disabled={submitting}
                    className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50/40'
                    }`}
                  >
                    <span className="text-xs font-bold">{group.groupName}</span>
                    <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {group.groupCode}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Item Name */}
          <FormField label="Item Name" required fullWidth helperText="Full descriptive name of the item.">
            <Input
              name="itemName"
              placeholder={
                formData.productType === 'FILTER'
                  ? 'e.g. Synthetic Pocket Filter G4 610x610x305'
                  : formData.productType === 'RAW_ITEM'
                  ? 'e.g. Stainless Steel Sheet 304 2mm'
                  : formData.productType === 'COIL'
                  ? 'e.g. Chilled Water Cooling Coil 4-Row'
                  : 'e.g. Double Skin Air Handling Unit 5000 CFM'
              }
              value={formData.itemName}
              onChange={handleChange}
              disabled={submitting}
              autoFocus={!isEditMode}
            />
          </FormField>

          {/* 3-Column Basic Info Row: Category, Item Code, Inventory UOM */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Item Category" required helperText="Filtered by selected Item Group.">
              <Select
                name="itemCategory"
                value={formData.itemCategory}
                onChange={handleCategoryChange}
                disabled={submitting || loadingData || availableCategories.length === 0}
              >
                <option value="">
                  {availableCategories.length === 0 ? '-- No Categories In This Group --' : '-- Select Category --'}
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

            <FormField label="Item Code" helperText="Auto-generated by system counter.">
              <div className="flex items-center h-[38px] px-3 bg-slate-100 border border-slate-300 rounded-md text-slate-700 font-mono font-semibold text-xs select-none">
                {isEditMode ? formData.itemCode : 'AUTO GENERATED'}
              </div>
            </FormField>

            <FormField label="Inventory UOM" required helperText="Base stocking / inventory unit.">
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
        </div>

        {/* 2. FILTER CONFIGURATION (CONDITIONAL - ONLY SHOWN FOR FILTER PRODUCTS) */}
        {formData.productType === 'FILTER' && (
          <div className="border border-blue-200 rounded-xl bg-blue-50/30 p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-blue-200 pb-2">
              <div className="flex items-center gap-2">
                <Wrench size={15} className="text-blue-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Filter Configuration
                </span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                Product Type: Filter
              </span>
            </div>

            {/* Filter Type & Grade Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Filter Type" required helperText="Select Box or Flange construction.">
                <Select
                  name="filterType"
                  value={filterType}
                  onChange={handleFilterTypeChange}
                  disabled={submitting}
                >
                  <option value="">-- Select Filter Type --</option>
                  <option value="BOX">Box</option>
                  <option value="FLANGE">Flange</option>
                </Select>
              </FormField>

              <FormField label="Filter Grade" helperText="Master grade classification.">
                <Select
                  name="filterGrade"
                  value={formData.filterGrade}
                  onChange={handleChange}
                  disabled={submitting || loadingData}
                >
                  <option value="">-- Select Filter Grade --</option>
                  {filterGrades.map((fg) => (
                    <option key={fg._id} value={fg._id}>
                      {fg.filterGrade} {fg.eurovent ? `(${fg.eurovent})` : ''}
                    </option>
                  ))}
                </Select>
              </FormField>

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
            </div>

            {/* Engineering Drawing Assignment */}
            {formData.filterGrade && (
              <div className="bg-white p-3 rounded-lg border border-blue-100">
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

            {/* 1. Body Dimensions (MM) & Airflow Rating */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-3">
              <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Box size={14} className="text-blue-600" />
                  Filter Body Dimensions (MM)
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Internal body dimensions</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end">
                <FormField label="Body Length (MM)">
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

                <FormField label="Body Width (MM)">
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

                <FormField label="Body Depth (MM)">
                  <Input
                    type="number"
                    step="any"
                    name="filterDepth"
                    placeholder="e.g. 305"
                    value={formData.filterDepth}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </FormField>

                <FormField label="Velocity (FPM)">
                  <Input
                    type="number"
                    step="any"
                    name="faceVelocity"
                    placeholder="500"
                    value={formData.faceVelocity}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </FormField>

                <FormField label="Airflow (CFM)">
                  <div className="h-[38px] flex items-center justify-center bg-blue-50 border border-blue-200 rounded-md font-mono font-bold text-blue-700 text-xs">
                    {calculatedCfm !== null ? `${calculatedCfm} CFM` : '—'}
                  </div>
                </FormField>
              </div>
            </div>

            {/* 2. Calculated Overall Physical Dimensions (Read-Only) */}
            <div className="bg-slate-50/90 p-3.5 rounded-lg border border-slate-300 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-1.5">
                  <Maximize2 size={14} className="text-indigo-600" />
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    Overall Box Dimensions (MM) — Physical Filter Outline
                  </span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                  filterType === 'FLANGE'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : filterType === 'BOX'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-slate-200 text-slate-600 border-slate-300'
                }`}>
                  {filterType === 'FLANGE'
                    ? 'Flange Allowance Applied (+30 mm/side)'
                    : filterType === 'BOX'
                    ? 'Box (Equal to Body Dimensions)'
                    : 'Select Filter Type'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <FormField label="Overall Length (MM)" helperText={filterType === 'FLANGE' ? 'Body Length + 30 + 30 mm' : 'Equal to Body Length'}>
                  <div className="h-[38px] px-3 flex items-center justify-between bg-white border border-slate-300 rounded-md font-mono text-xs font-bold text-slate-800 shadow-inner">
                    <span>{calculatedOverallDimensions.displayL}</span>
                    <span className="text-[10.5px] text-slate-400 font-normal">
                      {filterType === 'FLANGE' && Number(formData.filterLength) > 0 ? `${Number(formData.filterLength)} + 60` : 'Read-only'}
                    </span>
                  </div>
                </FormField>

                <FormField label="Overall Width (MM)" helperText={filterType === 'FLANGE' ? 'Body Width + 30 + 30 mm' : 'Equal to Body Width'}>
                  <div className="h-[38px] px-3 flex items-center justify-between bg-white border border-slate-300 rounded-md font-mono text-xs font-bold text-slate-800 shadow-inner">
                    <span>{calculatedOverallDimensions.displayW}</span>
                    <span className="text-[10.5px] text-slate-400 font-normal">
                      {filterType === 'FLANGE' && Number(formData.filterWidth) > 0 ? `${Number(formData.filterWidth)} + 60` : 'Read-only'}
                    </span>
                  </div>
                </FormField>

                <FormField label="Overall Depth (MM)" helperText="No flange addition on depth">
                  <div className="h-[38px] px-3 flex items-center justify-between bg-white border border-slate-300 rounded-md font-mono text-xs font-bold text-slate-800 shadow-inner">
                    <span>{calculatedOverallDimensions.displayD}</span>
                    <span className="text-[10.5px] text-slate-400 font-normal">Equal to Depth</span>
                  </div>
                </FormField>
              </div>

              {/* Calculation explanation helper text */}
              <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-200 flex items-start sm:items-center gap-2">
                <Info size={14} className="text-slate-500 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  {filterType === 'FLANGE' ? (
                    <>
                      <strong>Flange Type = FLANGE:</strong> Automatically adds 30 mm flange allowance to both sides (+60 mm total) for Length and Width. Overall Depth remains equal to Body Depth (no flange addition).
                    </>
                  ) : filterType === 'BOX' ? (
                    <>
                      <strong>Flange Type = BOX:</strong> No flange allowance is added. Overall dimensions remain strictly equal to Body Dimensions.
                    </>
                  ) : (
                    'Select Filter Type (Box or Flange) above to compute overall physical dimensions.'
                  )}
                </span>
              </div>
            </div>

            {/* 3. Construction, Bonding & Thermal Specifications */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
              <FormField label="Material of Construction (MOC)" helperText="Frame material casing.">
                <Select
                  name="moc"
                  value={formData.moc}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="">-- Select MOC --</option>
                  {STANDARD_MOC_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m === 'OTHER' ? 'Other (Specify Custom MOC)' : m}
                    </option>
                  ))}
                </Select>
                {formData.moc === 'OTHER' && (
                  <Input
                    className="mt-1.5"
                    name="customMoc"
                    placeholder="Enter custom MOC"
                    value={formData.customMoc}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                )}
              </FormField>

              <FormField label="Bonding Adhesive" helperText="Adhesive bonding between media and frame.">
                <Select
                  name="bonding"
                  value={formData.bonding}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="">-- Select Bonding --</option>
                  {BONDING_OPTIONS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                label={`Rated Operating Temperature (${tempUom})`}
                helperText="Maximum continuous rated operating temperature."
              >
                <div className="relative">
                  <Input
                    type="number"
                    step="any"
                    name="temperatureRating"
                    placeholder="e.g. 120"
                    value={formData.temperatureRating}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                    {tempUom}
                  </div>
                </div>
              </FormField>
            </div>

            {/* 4. Product Photo Upload */}
            <div>
              <FormField label="Product Photo" helperText="Item photo or catalog technical visual.">
                <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-md">
                    {formData.imageUrl ? (
                      <div className="relative group w-9 h-9 rounded border border-slate-300 overflow-hidden bg-white shrink-0">
                        <img
                          src={formData.imageUrl}
                          alt="Item"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewImageModalOpen(true)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"
                          title="View photo"
                        >
                          <Eye size={11} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                        <ImageIcon size={14} />
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
                  {imageError && <span className="text-[10px] text-red-600">{imageError}</span>}
                </FormField>
              </div>
            </div>
          )}

        {/* 3. DYNAMIC CATEGORY SPECIFICATIONS (REQUIRED SPECIFICATIONS) */}
        {requiredSpecs.length > 0 && (
          <div className="border border-slate-200 rounded-xl bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Sliders size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Category Specifications
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Mandatory parameters for this category
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {requiredSpecs.map((spec) => renderSpecInput(spec, true))}
            </div>
          </div>
        )}

        {/* 4. ITEM DESCRIPTION */}
        <FormField label="Description (Optional)" fullWidth helperText="Optional usage notes or catalog details.">
          <Input
            name="description"
            placeholder="e.g. Standard industrial production item"
            value={formData.description}
            onChange={handleChange}
            disabled={submitting}
          />
        </FormField>

        {/* 5. ADVANCED DETAILS (COLLAPSIBLE) */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setShowAdvancedDetails((prev) => !prev)}
            className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 transition-colors text-left font-semibold text-slate-800 text-xs cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              {showAdvancedDetails ? <ChevronDown size={15} className="text-blue-600" /> : <ChevronRight size={15} className="text-slate-500" />}
              <span>Advanced Details</span>
              <span className="text-slate-400 font-normal">
                (UOM conversions, inventory reorder levels, optional specs)
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

                  <FormField label="Item / Purchase Unit" helperText="Conversion to base UOM.">
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

                  <FormField label="Item / Sales Unit" helperText="Conversion to base UOM.">
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
                  Taxation & Storage Bin
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label="HSN / SAC Code" helperText="Taxation tariff code.">
                    <Input
                      name="hsnCode"
                      placeholder="e.g. 84213920"
                      value={formData.hsnCode}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                  </FormField>

                  <FormField label="Default Storage Bin" helperText="Assigned warehouse location.">
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

                  <FormField label="Catalog Status" helperText="Active items are available across ERP.">
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

              {/* Inventory Levels & Lead Time */}
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

              {/* Optional Category Specifications */}
              {optionalSpecs.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span>Optional Category Specifications ({optionalSpecs.length})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional technical parameters</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {optionalSpecs.map((spec) => renderSpecInput(spec, false))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </form>

      {/* Image Preview Zoom Modal */}
      {previewImageModalOpen && formData.imageUrl && (
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
      )}
    </Modal>
  );
};

export default ItemFormModal;
