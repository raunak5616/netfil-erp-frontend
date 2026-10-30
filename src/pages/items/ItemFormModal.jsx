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
  Camera,
  X
} from 'lucide-react';

const PRODUCT_TYPE_TO_ITEM_TYPE = {
  RAW_ITEM: 'raw_material',
  FILTER: 'finished_goods',
  COIL: 'finished_goods',
  AHU: 'finished_goods',
};

// Verified category codes for Filter constructions
const VERIFIED_BOX_CATEGORY_CODES = ['BOX TYPE'];
const VERIFIED_FLANGE_CATEGORY_CODES = ['FLANGE TYPE'];

// Standard MOC options discovered from master data and historical ERP records
const STANDARD_MOC_OPTIONS = [
  'Aluminum',
  'SS304',
  'SS316L',
  'Galvanized Iron (GI)',
  'CRCA Powder Coated',
  'Mild Steel'
];

// Confirmed Bonding options with operating temperature ranges
const BONDING_OPTIONS = [
  { value: 'PU Bonding', label: 'PU Bonding (50–150 °C)', minTemp: 50, maxTemp: 150 },
  { value: 'Epoxy Bonding', label: 'Epoxy Bonding (200–350 °C)', minTemp: 200, maxTemp: 350 },
  { value: 'White Adhesive (Ceramic)', label: 'White Adhesive (Ceramic) (230–400 °C)', minTemp: 230, maxTemp: 400 }
];

// Helper to normalize and extract construction from a variant object
// Explicitly prioritizes mountingType with filterType as a fallback
const getVariantConstruction = (v) => {
  const raw = (v?.mountingType && String(v.mountingType).trim()) || (v?.filterType && String(v.filterType).trim()) || '';
  return raw.toUpperCase();
};

const ItemFormModal = ({ item, isOpen, onClose, onSuccess, initialProductType = 'RAW_ITEM' }) => {
  const isEditMode = !!item;

  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'uom' | 'inventory' | 'specifications'
  const [filterType, setFilterType] = useState(item?.filterType || ''); // 'HEPA' | 'PRE/FINE' | ''
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [previewImageModalOpen, setPreviewImageModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    itemCode: 'AUTO',
    itemName: '',
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
    filterType: item?.filterType || '',
    imageUrl: item?.imageUrl || '',
    imagePublicId: item?.imagePublicId || '',
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

  // Specification state: map of specId -> { value, isApply, isFix, existingSpecId }
  const [specsData, setSpecsData] = useState({});

  // RTK Query Master Data
  const { data: groupsRes, isLoading: loadingGroups } = useGetItemGroupsQuery({ typeFilter: 'MASTER' }, { skip: !isOpen });
  const { data: catsRes, isLoading: loadingCats } = useGetItemCategoriesQuery({ typeFilter: 'MASTER' }, { skip: !isOpen });
  const { data: uomsRes, isLoading: loadingUoms } = useGetUOMsQuery({}, { skip: !isOpen });
  const { data: binsRes, isLoading: loadingBins } = useGetBinsQuery({}, { skip: !isOpen });
  const { data: fgsRes, isLoading: loadingFgs } = useGetFilterGradesQuery({}, { skip: !isOpen });

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
  const [showAdvancedInventory, setShowAdvancedInventory] = useState(false);

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

  // Item specifications via RTK Query
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

  // Populate form data
  useEffect(() => {
    if (item) {
      let initialConstruction = item.constructionType || '';
      if (!initialConstruction && (item.productType === 'FILTER' || (!item.productType && item.filterGrade))) {
        // Derive construction from item.filterGradeVariant if unambiguous
        if (item.filterGradeVariant && typeof item.filterGradeVariant === 'string') {
          const parts = item.filterGradeVariant.split('||');
          if (parts.length >= 2) {
            const candidate = parts[1]?.trim().toUpperCase();
            if (candidate === 'BOX' || candidate === 'FLANGE') {
              initialConstruction = candidate;
            }
          }
        }
        // Fallback: check itemCategory if unambiguously linked to a verified construction
        if (!initialConstruction && item.itemCategory) {
          const catCode = (item.itemCategory?.categoryCode || '').trim().toUpperCase();
          if (VERIFIED_BOX_CATEGORY_CODES.includes(catCode)) {
            initialConstruction = 'BOX';
          } else if (VERIFIED_FLANGE_CATEGORY_CODES.includes(catCode)) {
            initialConstruction = 'FLANGE';
          }
        }
      }

      let initialMoc = item.moc || '';
      let initialCustomMoc = '';
      if (initialMoc && !STANDARD_MOC_OPTIONS.includes(initialMoc)) {
        initialCustomMoc = initialMoc;
        initialMoc = 'OTHER';
      }

      setFormData({
        itemCode: item.itemCode || '',
        itemName: item.itemName || '',
        itemGroup: item.itemGroup?._id || item.itemGroup || '',
        itemCategory: item.itemCategory?._id || item.itemCategory || '',
        inventoryUom: item.inventoryUom?._id || item.inventoryUom || '',
        purchaseUom: item.purchaseUom?._id || item.purchaseUom || '',
        salesUom: item.salesUom?._id || item.salesUom || '',
        itemPerPurchaseUnit: item.itemPerPurchaseUnit ?? 1,
        itemPerSalesUnit: item.itemPerSalesUnit ?? 1,
        hsnCode: item.hsnCode || '',
        reorderLevel: item.reorderLevel ?? 0,
        reorderQty: item.reorderQty ?? 0,
        minInventory: item.minInventory ?? 0,
        maxInventory: item.maxInventory ?? 0,
        leadTimeDays: item.leadTimeDays ?? 0,
        defaultBin: item.defaultBin?._id || item.defaultBin || '',
        description: item.description || '',
        itemType: item.itemType || PRODUCT_TYPE_TO_ITEM_TYPE[item.productType || 'RAW_ITEM'] || 'raw_material',
        productType: item.productType || (item.filterGrade ? 'FILTER' : 'RAW_ITEM'),
        filterGrade: item.filterGrade?._id || item.filterGrade || '',
        filterGradeVariant: item.filterGradeVariant || '',
        drawing: item.drawing?._id || item.drawing || '',
        drawingSnapshot: item.drawingSnapshot || null,
        status: item.status || 'active',
        filterType: item.filterType || '',
        imageUrl: item.imageUrl || '',
        imagePublicId: item.imagePublicId || '',
        constructionType: item.constructionType || initialConstruction,
        moc: initialMoc,
        customMoc: initialCustomMoc,
        flangeType: item.flangeType?._id || item.flangeType || '',
        filterLength: item.filterLength !== null && item.filterLength !== undefined ? item.filterLength : (item.grade_items?.height ?? ''),
        filterWidth: item.filterWidth !== null && item.filterWidth !== undefined ? item.filterWidth : (item.grade_items?.width ?? ''),
        filterDepth: item.filterDepth !== null && item.filterDepth !== undefined ? item.filterDepth : (item.grade_items?.length ?? ''),
        faceVelocity: item.faceVelocity !== null && item.faceVelocity !== undefined ? item.faceVelocity : 500,
        temperatureRating: item.temperatureRating !== null && item.temperatureRating !== undefined ? item.temperatureRating : (item.grade_items?.filterTemp ?? ''),
        bonding: item.bonding || '',
      });
      setFilterType(item.filterType || '');
      setImageError('');

    } else {
      const pType = initialProductType || 'RAW_ITEM';
      setFormData({
        itemCode: 'AUTO',
        itemName: '',
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
    }

    setActiveTab('basic');
    setErrorMessage('');
    setSuccessMessage('');
  }, [item, isOpen, initialProductType]);

  // For edit mode: derive filterType if not set on item
  useEffect(() => {
    if (!isEditMode || !item || filterType) return;
    if (item.filterType) {
      setFilterType(item.filterType);
    } else if (item.productType === 'FILTER' || item.filterGrade) {
      const catName = (item.itemCategory?.categoryName || '').toUpperCase();
      const catCode = (item.itemCategory?.categoryCode || '').toUpperCase();
      if (catName.includes('HEPA') || catCode.includes('HEPA')) {
        setFilterType('HEPA');
      } else if (catName.includes('PRE') || catName.includes('FINE') || catCode.includes('PRE') || catCode.includes('FINE')) {
        setFilterType('PRE/FINE');
      }
    }
  }, [isEditMode, item, filterType]);

  // Auto-select Item Group as "Filter" when Product Type is FILTER
  useEffect(() => {
    if (formData.productType === 'FILTER' && itemGroups.length > 0) {
      const filterGroup = itemGroups.find(
        (g) =>
          (g.name || g.groupName || '').toLowerCase() === 'filter' ||
          g.groupCode === 'FILTER BOX' ||
          g.groupCode === 'FILTER' ||
          ((g.applicableProductTypes || []).includes('FILTER') && (g.name || '').toLowerCase().includes('filter'))
      );
      if (filterGroup && (!formData.itemGroup || (formData.itemGroup !== filterGroup._id && !isEditMode))) {
        setFormData((prev) => ({
          ...prev,
          itemGroup: filterGroup._id,
        }));
      }
    }
  }, [formData.productType, itemGroups, isEditMode]);

  // Filtered groups: exclude system-generated groups and filter by applicable product types
  const availableGroups = itemGroups.filter((group) => {
    if (group.groupType === 'SYSTEM' || (group.groupCode && group.groupCode.startsWith('GP-'))) {
      return false;
    }
    if (group.applicableProductTypes && group.applicableProductTypes.length > 0) {
      if (!group.applicableProductTypes.includes(formData.productType)) {
        return false;
      }
    }
    return true;
  });

  // Filtered categories: strictly by Filter Type (HEPA or PRE/FINE) when FILTER, or by applicableProductTypes for others
  const availableCategories = itemCategories.filter((cat) => {
    // If productType is FILTER, strictly filter by selected Filter Type (HEPA or PRE/FINE)
    if (formData.productType === 'FILTER') {
      if (!filterType) {
        // Must select Filter Type first
        return false;
      }
      const catName = (cat.categoryName || '').toUpperCase();
      const catCode = (cat.categoryCode || '').toUpperCase();

      if (filterType === 'HEPA') {
        return catName.includes('HEPA') || catCode.includes('HEPA');
      } else if (filterType === 'PRE/FINE' || filterType === 'PRE_FINE') {
        return (
          catName.includes('PRE') || 
          catName.includes('FINE') || 
          catCode.includes('PRE') || 
          catCode.includes('FINE')
        );
      }
      return false;
    } else {
      // Non-Filter Product Types: Preserve existing group-level applicableProductTypes logic
      const parentGroup = typeof cat.itemGroup === 'object' ? cat.itemGroup : itemGroups.find((g) => String(g._id) === String(cat.itemGroup));
      if (parentGroup && parentGroup.applicableProductTypes && parentGroup.applicableProductTypes.length > 0) {
        if (!parentGroup.applicableProductTypes.includes(formData.productType)) return false;
      }

      // If a group is already chosen, only show categories that belong to it
      if (formData.itemGroup) {
        const catGroupId = cat.itemGroup?._id || cat.itemGroup;
        if (String(catGroupId) !== String(formData.itemGroup)) return false;
      }
    }

    return true;
  });

  // CFM = (Length in MM / 304.8) * (Width in MM / 304.8) * Face Velocity in FPM, rounded to nearest 10 CFM
  // Depth is strictly excluded from formula.
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

  // Derived overall dimensions:
  // For FLANGE: Length = BOX Length + 60 mm, Width = BOX Width + 60 mm, Depth = BOX Depth (+30 mm/side)
  // For BOX: Overall dimensions equal BOX dimensions, no flange projection added.
  const overallDims = useMemo(() => {
    const l = Number(formData.filterLength);
    const w = Number(formData.filterWidth);
    const d = Number(formData.filterDepth);
    const isFlange = formData.constructionType === 'FLANGE' || (formData.itemCategory && itemCategories.find(c => c._id === formData.itemCategory)?.categoryName?.toUpperCase().includes('FLANGE'));
    const isBox = !isFlange;

    if (isFlange) {
      return {
        isFlange: true,
        length: Number.isFinite(l) && l > 0 ? l + 60 : null,
        width: Number.isFinite(w) && w > 0 ? w + 60 : null,
        depth: Number.isFinite(d) && d > 0 ? d : (Number.isFinite(d) && d === 0 ? 0 : null),
        ruleText: 'Standard Flange: +30 mm per side (+60 mm total per applicable dimension). Depth remains unchanged.'
      };
    }

    if (isBox) {
      return {
        isBox: true,
        length: Number.isFinite(l) && l > 0 ? l : null,
        width: Number.isFinite(w) && w > 0 ? w : null,
        depth: Number.isFinite(d) && d > 0 ? d : (Number.isFinite(d) && d === 0 ? 0 : null),
        ruleText: 'BOX Construction: Overall dimensions equal BOX dimensions. No flange projection is added.'
      };
    }

    return null;
  }, [formData.constructionType, formData.itemCategory, itemCategories, formData.filterLength, formData.filterWidth, formData.filterDepth]);

  // Non-blocking warning if temperature rating is outside the selected bonding range
  const temperatureWarning = useMemo(() => {
    if (!formData.temperatureRating || !formData.bonding) return null;
    const temp = Number(formData.temperatureRating);
    if (Number.isNaN(temp)) return null;
    const selectedBonding = BONDING_OPTIONS.find((b) => b.value === formData.bonding);
    if (!selectedBonding) return null;
    if (temp < selectedBonding.minTemp || temp > selectedBonding.maxTemp) {
      return `Entered temperature rating (${temp} °C) is outside the recommended range for ${selectedBonding.value} (${selectedBonding.minTemp}–${selectedBonding.maxTemp} °C).`;
    }
    return null;
  }, [formData.temperatureRating, formData.bonding]);

  const handleFilterTypeChange = (e) => {
    const newFilterType = e.target.value; // 'HEPA' | 'PRE/FINE' | ''
    setFilterType(newFilterType);

    setFormData((prev) => {
      const next = {
        ...prev,
        filterType: newFilterType,
      };

      // Clear itemCategory if not compatible with newFilterType
      if (prev.itemCategory) {
        const currentCat = itemCategories.find((c) => String(c._id) === String(prev.itemCategory));
        const catName = (currentCat?.categoryName || '').toUpperCase();
        const catCode = (currentCat?.categoryCode || '').toUpperCase();
        let isCompatible = false;
        if (newFilterType === 'HEPA') {
          isCompatible = catName.includes('HEPA') || catCode.includes('HEPA');
        } else if (newFilterType === 'PRE/FINE') {
          isCompatible = catName.includes('PRE') || catName.includes('FINE') || catCode.includes('PRE') || catCode.includes('FINE');
        }
        if (!isCompatible) {
          next.itemCategory = '';
        }
      }

      // Auto-select filter group if not set
      if (!next.itemGroup && itemGroups.length > 0) {
        const filterGroup = itemGroups.find(
          (g) =>
            (g.name || g.groupName || '').toLowerCase() === 'filter' ||
            g.groupCode === 'FILTER BOX' ||
            g.groupCode === 'FILTER'
        );
        if (filterGroup) next.itemGroup = filterGroup._id;
      }

      return next;
    });
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: name === 'itemCode' ? value.toUpperCase() : value,
      };

      if (name === 'productType') {
        if (PRODUCT_TYPE_TO_ITEM_TYPE[value]) {
          next.itemType = PRODUCT_TYPE_TO_ITEM_TYPE[value];
        }
        if (value === 'FILTER') {
          // Auto-select Filter group
          const filterGroup = itemGroups.find(
            (g) =>
              (g.name || g.groupName || '').toLowerCase() === 'filter' ||
              g.groupCode === 'FILTER BOX' ||
              g.groupCode === 'FILTER'
          );
          if (filterGroup) {
            next.itemGroup = filterGroup._id;
          }
        } else {
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
        // Clear group if it no longer supports the new productType
        if (prev.itemGroup) {
          const currentGroup = itemGroups.find((g) => String(g._id) === String(prev.itemGroup));
          const groupStillValid =
            !currentGroup ||
            !currentGroup.applicableProductTypes ||
            currentGroup.applicableProductTypes.length === 0 ||
            currentGroup.applicableProductTypes.includes(value);
          if (!groupStillValid) {
            next.itemGroup = '';
            next.itemCategory = '';
          }
        }
        // Clear category if it no longer belongs to a group that supports the new productType
        if (next.itemCategory && next.itemGroup) {
          const currentCat = itemCategories.find((c) => String(c._id) === String(next.itemCategory));
          const catGroup = currentCat && (typeof currentCat.itemGroup === 'object'
            ? currentCat.itemGroup
            : itemGroups.find((g) => String(g._id) === String(currentCat.itemGroup)));
          const catStillValid =
            !catGroup ||
            !catGroup.applicableProductTypes ||
            catGroup.applicableProductTypes.length === 0 ||
            catGroup.applicableProductTypes.includes(value);
          if (!catStillValid) {
            next.itemCategory = '';
          }
        }
      }

      // Reset category if selected group changes and category is no longer valid
      if (name === 'itemGroup') {
        const validCategories = itemCategories.filter(
          (c) => String(c.itemGroup?._id || c.itemGroup) === String(value)
        );
        const validCat = validCategories.find((c) => c._id === prev.itemCategory);
        if (validCat) {
          next.itemCategory = validCat._id;
        } else if (validCategories.length === 1) {
          // Auto-select if only 1 category exists under this group
          next.itemCategory = validCategories[0]._id;
        } else {
          next.itemCategory = '';
        }
      }

      // Auto-derive Item Group when Item Category is selected
      if (name === 'itemCategory' && value) {
        const selectedCat = itemCategories.find((c) => c._id === value);
        if (selectedCat) {
          const derivedGroupId = selectedCat.itemGroup?._id || selectedCat.itemGroup;
          if (derivedGroupId) next.itemGroup = String(derivedGroupId);
        }
      }

      // Auto-set purchase and sales UOM when inventory UOM is picked first time
      if (name === 'inventoryUom') {
        if (!prev.purchaseUom) next.purchaseUom = value;
        if (!prev.salesUom) next.salesUom = value;
      }

      if (name === 'filterGrade') {
        next.filterGradeVariant = '';
        next.drawing = '';
        next.drawingSnapshot = null;
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

  const validate = () => {
    if (!formData.itemName.trim()) {
      return 'Item Name is required.';
    }
    if (!formData.itemGroup) {
      return 'Item Group is required.';
    }
    if (!formData.itemCategory) {
      return 'Item Category is required.';
    }
    if (!formData.inventoryUom) {
      return 'Inventory UOM is required.';
    }
    
    // Filter validation
    if (formData.productType === 'FILTER') {
      if (!filterType) {
        return 'Filter Type (HEPA or PRE/FINE) is required for Filter items.';
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
      if (formData.filterDepth !== '' && (Number(formData.filterDepth) <= 0 || isNaN(Number(formData.filterDepth)))) {
        return 'Filter Depth must be a positive number in MM.';
      }
      if (formData.faceVelocity !== '' && (Number(formData.faceVelocity) <= 0 || isNaN(Number(formData.faceVelocity)))) {
        return 'Face Velocity must be a positive number in FPM.';
      }
      if (formData.temperatureRating !== '' && isNaN(Number(formData.temperatureRating))) {
        return 'Temperature Rating must be a valid numeric temperature in °C.';
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
    for (const spec of categorySpecs) {
      if (spec.isRequiredCategorySpec) {
        let val = specsData[spec._id]?.value;
        // If it's a Filter item, check if this spec maps to one of our filter fields
        if (formData.productType === 'FILTER' && (val === undefined || val === null || val === '')) {
          const code = (spec.specificationCode || '').toUpperCase().trim();
          const name = (spec.specificationName || '').toUpperCase().trim();
          if (code === 'SPEC-LENGTH-01' || name === 'LENGTH') val = formData.filterLength;
          else if (code === 'SPEC-WIDTH-01' || name === 'WIDTH') val = formData.filterWidth;
          else if (code === 'DEPTH' || name === 'DEPTH') val = formData.filterDepth;
          else if (code === 'CFM' || name === 'CFM' || name.includes('AIRFLOW')) val = calculatedCfm;
          else if (code === 'FILTER GRADE' || name.includes('FILTER GRADE') || name === 'GRADE') val = formData.filterGrade;
        }

        if (val === undefined || val === null || val === '') {
          return `Specification '${spec.specificationName}' is required for this item category.`;
        }
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
      const finalMoc = formData.moc === 'OTHER' ? (formData.customMoc?.trim() || 'Other') : (formData.moc || '');

      const submitPayload = {
        ...formData,
        filterType: formData.productType === 'FILTER' ? filterType : '',
        imageUrl: formData.imageUrl || '',
        imagePublicId: formData.imagePublicId || '',
        moc: finalMoc,
        constructionType: formData.productType === 'FILTER' ? (formData.constructionType || '') : '',
        flangeType: formData.productType === 'FILTER' && formData.constructionType === 'FLANGE' ? (formData.flangeType || null) : null,
        filterLength: formData.productType === 'FILTER' && formData.filterLength !== '' ? Number(formData.filterLength) : null,
        filterWidth: formData.productType === 'FILTER' && formData.filterWidth !== '' ? Number(formData.filterWidth) : null,
        filterDepth: formData.productType === 'FILTER' && formData.filterDepth !== '' ? Number(formData.filterDepth) : null,
        overallFlangeLength: formData.productType === 'FILTER' && formData.constructionType === 'FLANGE' && formData.filterLength !== '' ? Number(formData.filterLength) + 60 : null,
        overallFlangeWidth: formData.productType === 'FILTER' && formData.constructionType === 'FLANGE' && formData.filterWidth !== '' ? Number(formData.filterWidth) + 60 : null,
        overallFlangeDepth: formData.productType === 'FILTER' && formData.constructionType === 'FLANGE' && formData.filterDepth !== '' ? Number(formData.filterDepth) : null,
        faceVelocity: formData.productType === 'FILTER' && formData.faceVelocity !== '' ? Number(formData.faceVelocity) : 500,
        temperatureRating: formData.productType === 'FILTER' && formData.temperatureRating !== '' ? Number(formData.temperatureRating) : null,
        bonding: formData.productType === 'FILTER' ? (formData.bonding || '') : '',
      };
      delete submitPayload.customMoc;

      let savedItem;
      if (isEditMode) {
        const res = await updateItemMutation({ id: item._id, ...submitPayload }).unwrap();
        savedItem = res.item || res;
      } else {
        const res = await createItemMutation(submitPayload).unwrap();
        savedItem = res.item || res;
      }

      // Build effective specs to save
      // For Filter items, synchronize dimensions and grade into matching specs
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

      // Save specification values for the item
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
        onSuccess();
        onClose();
      }, 800);

    } catch (err) {
      const apiMsg = err.data?.message || err.response?.data?.message || err.message || 'Failed to save Item record.';
      setErrorMessage(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Item (${formData.itemCode})` : `Add New Item — ${formData.productType === 'RAW_ITEM' ? 'Raw Item' : formData.productType === 'FILTER' ? 'Filter' : formData.productType === 'COIL' ? 'Coil' : 'AHU'}`}
      maxWidth="720px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEditMode ? 'Update Item' : 'Create Item'}
          </Button>
        </>
      }
    >
      <div className="mb-4 border-b border-slate-200">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'basic' ? 'border-blue-700 text-blue-700 font-semibold' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Basic Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('uom')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'uom' ? 'border-blue-700 text-blue-700 font-semibold' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            2. UOM & Units
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'inventory' ? 'border-blue-700 text-blue-700 font-semibold' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Inventory Controls
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specifications')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'specifications' ? 'border-blue-700 text-blue-700 font-semibold' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {formData.productType === 'FILTER' ? '4. Filter Specifications' : `4. Specifications ${categorySpecs.length > 0 ? `(${categorySpecs.length})` : ''}`}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {errorMessage && (
          <div className="col-span-full">
            <Alert type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />
          </div>
        )}

        {successMessage && (
          <div className="col-span-full">
            <Alert type="success" message={successMessage} />
          </div>
        )}

        {/* TAB 1: BASIC INFO */}
        {activeTab === 'basic' && (
          <>
            {/* Product Type + Filter Construction Type (if FILTER) / Item Code */}
            <FormField label="Product Type" required helperText="Select master item product type.">
              <Select
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="RAW_ITEM">Raw Item</option>
                <option value="FILTER">Filter</option>
                <option value="COIL">Coil</option>
                <option value="AHU">AHU</option>
              </Select>
            </FormField>

            {formData.productType === 'FILTER' ? (
              <FormField
                label="Filter Type"
                required
                helperText="Select Filter Type (HEPA or PRE/FINE) to view matching item categories."
              >
                <Select
                  name="filterType"
                  value={filterType}
                  onChange={handleFilterTypeChange}
                  disabled={submitting}
                >
                  <option value="">-- Select Filter Type --</option>
                  <option value="HEPA">HEPA</option>
                  <option value="PRE/FINE">PRE/FINE</option>
                </Select>
              </FormField>
            ) : (
              <FormField label="Item Code" required helperText="Enter code or leave 'AUTO' for auto-generated code.">
                <Input
                  name="itemCode"
                  placeholder="AUTO"
                  value={formData.itemCode}
                  onChange={handleChange}
                  disabled={submitting || isEditMode}
                />
              </FormField>
            )}

            {formData.productType === 'FILTER' && (
              <FormField label="Item Code" required helperText="Enter code or leave 'AUTO' for auto-generated code." fullWidth>
                <Input
                  name="itemCode"
                  placeholder="AUTO"
                  value={formData.itemCode}
                  onChange={handleChange}
                  disabled={submitting || isEditMode}
                />
              </FormField>
            )}

            {/* Item Name — full width for prominence */}
            <FormField label="Item Name" required fullWidth helperText="Full descriptive name of the item.">
              <Input
                name="itemName"
                placeholder="e.g. Synthetic Pocket Filter G4"
                value={formData.itemName}
                onChange={handleChange}
                disabled={submitting}
                autoFocus
              />
            </FormField>

            {/* Item Category first — filtered strictly according to Filter Type for Filter items */}
            <FormField
              label="Item Category"
              required
              helperText={
                formData.productType === 'FILTER' && !filterType
                  ? '⚠️ Please select Filter Type above first.'
                  : formData.productType === 'FILTER' && availableCategories.length === 0
                  ? `⚠️ No categories found for ${filterType} filter type. Please create a ${filterType} category in Item Categories.`
                  : formData.itemGroup && availableCategories.length === 0
                  ? '⚠️ No categories found under this group. Select another group or create a category first.'
                  : 'Select category for this item.'
              }
            >
              <Select
                name="itemCategory"
                value={formData.itemCategory}
                onChange={handleChange}
                disabled={submitting || loadingData || (formData.productType === 'FILTER' && (!filterType || availableCategories.length === 0))}
              >
                <option value="">
                  {formData.productType === 'FILTER' && !filterType
                    ? '-- Select Filter Type First --'
                    : formData.productType === 'FILTER' && availableCategories.length === 0
                    ? `-- No Categories Available for ${filterType} --`
                    : '-- Select Item Category --'}
                </option>
                {availableCategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.categoryCode} — {c.categoryName}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Item Group"
              required
              helperText={formData.itemCategory ? 'Auto-derived from selected category. Change here to override.' : 'Select top-level classification group.'}
            >
              <Select
                name="itemGroup"
                value={formData.itemGroup}
                onChange={handleChange}
                disabled={submitting || loadingData}
              >
                <option value="">-- Select Item Group --</option>
                {availableGroups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.groupCode} — {g.groupName}
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Item Type: editable select in edit mode; read-only chip in create mode */}
            {isEditMode ? (
              <FormField label="Item Type" helperText="Classification of item in ERP.">
                <Select
                  name="itemType"
                  value={formData.itemType}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="raw_material">Raw Material</option>
                  <option value="finished_goods">Finished Goods</option>
                  <option value="standard">Standard Item</option>
                  <option value="component">Component / Sub-Assembly</option>
                </Select>
              </FormField>
            ) : (
              <div className="col-span-full flex items-center gap-2 -mt-1 mb-0.5">
                <span className="text-xs text-slate-400">Derived Item Type:</span>
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded capitalize">
                  {(formData.itemType || 'raw_material').replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-slate-400">(auto-set from Product Type)</span>
              </div>
            )}

            {/* HSN / SAC Code — accessible in Basic Info and preserved in Inventory Controls */}
            <FormField label="HSN / SAC Code" helperText="Harmonized System Nomenclature code for taxation (preserved across tabs).">
              <Input
                name="hsnCode"
                placeholder="e.g. 84213990"
                value={formData.hsnCode}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            {/* Material of Construction (MOC) — Catalog default */}
            <FormField label="Material of Construction (MOC)" helperText="Select catalog-default material.">
              <Select
                name="moc"
                value={formData.moc}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="">-- Select MOC --</option>
                {STANDARD_MOC_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value="OTHER">Other / Custom</option>
              </Select>
            </FormField>

            {formData.moc === 'OTHER' && (
              <FormField label="Custom MOC Specification" required fullWidth helperText="Enter custom material of construction.">
                <Input
                  name="customMoc"
                  placeholder="e.g. SS316 with PTFE lining"
                  value={formData.customMoc}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </FormField>
            )}

            {/* Filter Grade Configuration: Enabled only when Product Type is FILTER */}
            {formData.productType === 'FILTER' && (() => {
              const selectedFg = filterGrades.find(fg => fg._id === formData.filterGrade);
              const getVariantKey = (v) => [v.filterClass, v.mountingType || v.filterType, v.temperature, v.media].join('||');
              const selectedVariantObj = selectedFg?.variants?.find(
                v => getVariantKey(v) === formData.filterGradeVariant || [v.filterClass, v.filterType, v.temperature, v.media].join('||') === formData.filterGradeVariant
              );
              const matchingVariants = selectedFg?.variants || [];
              
              return (
                <div className="col-span-full border border-blue-200 bg-blue-50 p-4 rounded-md mt-2">
                  <FormField label="Filter Grade Standard" helperText="Select standard filter grade for this filter item">
                    <Select
                      name="filterGrade"
                      value={formData.filterGrade}
                      onChange={handleChange}
                      disabled={submitting || loadingData}
                    >
                      <option value="">-- No Filter Grade / Custom --</option>
                      {filterGrades.map((fg) => (
                        <option key={fg._id} value={fg._id}>
                          {fg.filterGrade} {fg.eurovent ? `(${fg.eurovent})` : ''}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  
                  {selectedFg && (
                    <div className="mt-4">
                      <FormField
                        label="Filter Grade Variant"
                        required
                        helperText={
                          matchingVariants.length === 0
                            ? `No variants available for ${selectedFg.filterGrade}.`
                            : `Select the technical variant for this grade`
                        }
                      >
                        <Select
                          name="filterGradeVariant"
                          value={formData.filterGradeVariant}
                          onChange={handleChange}
                          disabled={submitting || loadingData || matchingVariants.length === 0}
                        >
                          <option value="">
                            {matchingVariants.length === 0
                              ? `-- No Variants Available --`
                              : '-- Select Variant --'}
                          </option>
                          {matchingVariants.map((v, i) => {
                            const vKey = getVariantKey(v);
                            const typeDisplay = v.mountingType || v.filterType;
                            return (
                              <option key={i} value={vKey}>
                                {v.filterClass} | {typeDisplay} | {v.temperature} | {v.media}
                              </option>
                            );
                          })}
                        </Select>
                      </FormField>
                    </div>
                  )}
                  
                  {selectedVariantObj && (
                    <div className="mt-4 text-xs">
                      <div className="text-[11px] text-blue-800 uppercase font-bold mb-1.5 border-b border-blue-200 pb-1">
                        Selected Technical Specification
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-4 mt-2 bg-white p-3 rounded border border-blue-100">
                        <div>
                          <div className="text-[10px] text-blue-600 uppercase font-semibold">Class</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{selectedVariantObj.filterClass || '—'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-blue-600 uppercase font-semibold">Construction</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{selectedVariantObj.mountingType || selectedVariantObj.filterType || '—'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-blue-600 uppercase font-semibold">Temperature</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{selectedVariantObj.temperature || '—'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-blue-600 uppercase font-semibold">Media</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{selectedVariantObj.media || '—'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-blue-600 uppercase font-semibold">Efficiency</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{selectedVariantObj.efficiency || '—'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-blue-600 uppercase font-semibold">Initial PD</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{selectedVariantObj.initialPressureDrop || '—'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-blue-600 uppercase font-semibold">Final PD</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{selectedVariantObj.finalPressureDrop || '—'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Filter Grade-Based Drawing Master Assignment */}
                  {formData.filterGrade && (
                    <div className="mt-4 pt-3 border-t border-blue-200/80 bg-white p-3 rounded-lg border border-blue-100">
                      <DrawingSelector
                        filterGradeId={formData.filterGrade}
                        filterGradeName={selectedFg?.filterGrade || ''}
                        value={formData.drawing}
                        drawingSnapshot={formData.drawingSnapshot}
                        onChange={(drawingId, drawingSnapshot) => {
                          setFormData((prev) => ({
                            ...prev,
                            drawing: drawingId || '',
                            drawingSnapshot: drawingSnapshot || null
                          }));
                        }}
                        disabled={submitting || loadingData}
                        label="Assigned Engineering Drawing (Filter Grade Master)"
                      />
                    </div>
                  )}
                </div>
              );
            })()}


            <FormField label="Status" required>
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

            {/* Image Uploadation right beside Status */}
            <FormField 
              label="Item Image" 
              helperText={
                uploadingImage 
                  ? 'Uploading image to cloud...' 
                  : formData.imageUrl 
                  ? 'Image uploaded. Click Replace or Remove to update.' 
                  : 'Upload product photo (PNG, JPG, WEBP, SVG max 5MB).'
              }
            >
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-md">
                {formData.imageUrl ? (
                  <div className="relative group w-14 h-14 rounded border border-slate-300 overflow-hidden bg-white shrink-0 shadow-2xs">
                    <img
                      src={formData.imageUrl}
                      alt={formData.itemName || 'Item'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setPreviewImageModalOpen(true)}
                        className="p-1 bg-white/90 rounded text-slate-700 hover:text-slate-900 cursor-pointer"
                        title="View image"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 shrink-0">
                    <ImageIcon size={18} />
                    <span className="text-[8px] mt-0.5 font-medium">No Image</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5 flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      icon={uploadingImage ? RefreshCw : (formData.imageUrl ? RefreshCw : UploadCloud)}
                      disabled={uploadingImage || submitting}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingImage ? 'Uploading...' : formData.imageUrl ? 'Replace' : 'Upload'}
                    </Button>
                    {formData.imageUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200"
                        icon={Trash2}
                        disabled={uploadingImage || submitting}
                        onClick={handleRemoveImage}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {imageError && (
                    <span className="text-[11px] text-red-600 font-medium">{imageError}</span>
                  )}
                </div>
              </div>
            </FormField>

            <FormField label="Item Description" fullWidth helperText="Additional specifications or usage notes.">
              <Input
                name="description"
                placeholder="e.g. Standard air filter media roll"
                value={formData.description}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>
          </>
        )}

        {/* TAB 2: UOM & UNITS */}
        {activeTab === 'uom' && (
          <>
            <FormField label="Inventory UOM" required helperText="Base unit used for stock counting & valuation.">
              <Select
                name="inventoryUom"
                value={formData.inventoryUom}
                onChange={handleChange}
                disabled={submitting || loadingData}
              >
                <option value="">-- Select Inventory UOM --</option>
                {uoms.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.uomCode} — {u.uomName} ({u.dimension})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Purchase UOM" helperText="Unit used on Purchase Orders (defaults to Inventory UOM).">
              <Select
                name="purchaseUom"
                value={formData.purchaseUom}
                onChange={handleChange}
                disabled={submitting || loadingData}
              >
                <option value="">-- Defaults to Inventory UOM --</option>
                {uoms.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.uomCode} — {u.uomName} ({u.dimension})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Item Per Purchase Unit" helperText="How many Inventory UOMs in 1 Purchase UOM?">
              <Input
                type="number"
                step="any"
                name="itemPerPurchaseUnit"
                value={formData.itemPerPurchaseUnit}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Sales UOM" helperText="Unit used on Sales Orders & Invoices.">
              <Select
                name="salesUom"
                value={formData.salesUom}
                onChange={handleChange}
                disabled={submitting || loadingData}
              >
                <option value="">-- Defaults to Inventory UOM --</option>
                {uoms.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.uomCode} — {u.uomName} ({u.dimension})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Item Per Sales Unit" helperText="How many Inventory UOMs in 1 Sales UOM?">
              <Input
                type="number"
                step="any"
                name="itemPerSalesUnit"
                value={formData.itemPerSalesUnit}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>
          </>
        )}

        {/* TAB 3: INVENTORY CONTROLS */}
        {activeTab === 'inventory' && (
          <>
            {/* Always-visible fields */}
            <FormField label="HSN / SAC Code" helperText="Harmonized System Nomenclature code for taxation.">
              <Input
                name="hsnCode"
                placeholder="e.g. 84213990"
                value={formData.hsnCode}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Default Storage Bin" helperText="Preferred bin for inventory receipts.">
              <Select
                name="defaultBin"
                value={formData.defaultBin}
                onChange={handleChange}
                disabled={submitting || loadingData}
              >
                <option value="">-- None / Select Bin --</option>
                {bins.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.binCode} — {b.binName}
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Collapsible: Reorder levels, safety stock, lead time */}
            <div className="col-span-full">
              <button
                type="button"
                onClick={() => setShowAdvancedInventory((v) => !v)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-3 py-2 w-full transition-colors cursor-pointer text-left"
              >
                <span style={{ fontSize: '10px' }}>{showAdvancedInventory ? '▾' : '▸'}</span>
                <span>Advanced Inventory Settings</span>
                <span className="text-slate-400 font-normal ml-1">— Reorder levels, safety stock, lead time</span>
              </button>
            </div>

            {showAdvancedInventory && (
              <>
                <FormField label="Reorder Level" helperText="Minimum stock threshold triggering reorder.">
                  <Input
                    type="number"
                    name="reorderLevel"
                    value={formData.reorderLevel}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </FormField>

                <FormField label="Reorder Quantity" helperText="Standard reorder quantity.">
                  <Input
                    type="number"
                    name="reorderQty"
                    value={formData.reorderQty}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </FormField>

                <FormField label="Min Inventory" helperText="Safety stock minimum level.">
                  <Input
                    type="number"
                    name="minInventory"
                    value={formData.minInventory}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </FormField>

                <FormField label="Max Inventory" helperText="Maximum allowed stock level.">
                  <Input
                    type="number"
                    name="maxInventory"
                    value={formData.maxInventory}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </FormField>

                <FormField label="Lead Time (Days)" helperText="Procurement / manufacturing lead time in days.">
                  <Input
                    type="number"
                    name="leadTimeDays"
                    value={formData.leadTimeDays}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </FormField>
              </>
            )}
          </>
        )}

        {/* TAB 4: SPECIFICATIONS / FILTER SPECIFICATIONS */}
        {activeTab === 'specifications' && (
          <div className="col-span-full">
            {formData.productType === 'FILTER' ? (
              <div className="flex flex-col gap-5">
                {/* Section A: Filter Dimensions and Airflow */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        A. Filter Dimensions & Airflow Rating
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Dimensions must be entered in millimeters (MM). CFM is calculated automatically at Face Velocity (FPM).
                      </p>
                    </div>
                    <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded">
                      Standard: MM & FPM
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    <FormField label="BOX Length (MM)" required helperText="Authoritative body length in millimeters.">
                      <Input
                        type="number"
                        step="any"
                        min="1"
                        name="filterLength"
                        placeholder="e.g. 610"
                        value={formData.filterLength}
                        onChange={handleChange}
                        disabled={submitting}
                      />
                    </FormField>

                    <FormField label="BOX Width (MM)" required helperText="Authoritative body width in millimeters.">
                      <Input
                        type="number"
                        step="any"
                        min="1"
                        name="filterWidth"
                        placeholder="e.g. 610"
                        value={formData.filterWidth}
                        onChange={handleChange}
                        disabled={submitting}
                      />
                    </FormField>

                    <FormField label="BOX Depth (MM)" helperText="Nominal depth in MM (excluded from CFM).">
                      <Input
                        type="number"
                        step="any"
                        min="1"
                        name="filterDepth"
                        placeholder="e.g. 305"
                        value={formData.filterDepth}
                        onChange={handleChange}
                        disabled={submitting}
                      />
                    </FormField>

                    <FormField label="Face Velocity (FPM)" required helperText="Airflow velocity across media face in FPM.">
                      <Input
                        type="number"
                        step="any"
                        min="1"
                        name="faceVelocity"
                        placeholder="e.g. 500"
                        value={formData.faceVelocity}
                        onChange={handleChange}
                        disabled={submitting}
                      />
                    </FormField>

                    {/* Calculated CFM Field (Read-Only) */}
                    <div className="sm:col-span-2 md:col-span-2">
                      <FormField
                        label="Calculated Airflow (CFM)"
                        helperText="Strictly calculated from BOX Length & Width: (L/304.8) × (W/304.8) × FPM. Depth excluded."
                      >
                        <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-md px-3.5 py-2">
                          <div className="flex-1 font-mono text-sm font-bold text-slate-800">
                            {calculatedCfm !== null ? (
                              <span className="text-blue-700">{calculatedCfm} CFM</span>
                            ) : (
                              <span className="text-slate-400 font-normal italic text-xs">
                                Enter valid BOX Length, Width & Face Velocity to calculate
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            Read-Only
                          </span>
                        </div>
                      </FormField>
                    </div>
                  </div>

                  {/* Overall Dimensions Card based on Construction Type */}
                  {overallDims?.isFlange && (
                    <div className="mt-4 border border-blue-200 bg-blue-50/70 p-3.5 rounded-md">
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-blue-200">
                        <div className="text-xs font-bold text-blue-900 uppercase">
                          Overall Flange Dimensions (Auto-Calculated)
                        </div>
                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                          +60 mm Flange Applied (+30 mm/side)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="bg-white p-2.5 rounded border border-blue-100">
                          <span className="text-[10px] uppercase font-bold text-blue-600 block">Overall Flange Length</span>
                          <div className="font-mono font-bold text-sm text-slate-800 mt-0.5">
                            {overallDims?.length ? `${overallDims.length} mm` : '—'}
                          </div>
                          <span className="text-[10px] text-slate-400">BOX {formData.filterLength || 0} + 60 mm</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-blue-100">
                          <span className="text-[10px] uppercase font-bold text-blue-600 block">Overall Flange Width</span>
                          <div className="font-mono font-bold text-sm text-slate-800 mt-0.5">
                            {overallDims?.width ? `${overallDims.width} mm` : '—'}
                          </div>
                          <span className="text-[10px] text-slate-400">BOX {formData.filterWidth || 0} + 60 mm</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-blue-100">
                          <span className="text-[10px] uppercase font-bold text-blue-600 block">Overall Depth</span>
                          <div className="font-mono font-bold text-sm text-slate-800 mt-0.5">
                            {overallDims?.depth !== null && overallDims?.depth !== undefined ? `${overallDims.depth} mm` : (formData.filterDepth ? `${formData.filterDepth} mm` : '—')}
                          </div>
                          <span className="text-[10px] text-slate-400">Unchanged (Same as BOX Depth)</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-blue-700 mt-2 font-medium">
                        * Confirmed rule: The flange projects 30 mm on each opposite side (+60 mm total per dimension). Airflow CFM is strictly calculated from original BOX dimensions ({formData.filterLength || 0} × {formData.filterWidth || 0} mm), never overall flange dimensions.
                      </p>
                    </div>
                  )}

                  {overallDims?.isBox && (
                    <div className="mt-4 border border-slate-200 bg-slate-100/60 p-3.5 rounded-md">
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200">
                        <div className="text-xs font-bold text-slate-800 uppercase">
                          Overall Dimensions (BOX Construction)
                        </div>
                        <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 border border-slate-300 px-2 py-0.5 rounded">
                          Equal to BOX Dimensions (No Flange)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Overall Length</span>
                          <div className="font-mono font-bold text-sm text-slate-800 mt-0.5">
                            {formData.filterLength ? `${formData.filterLength} mm` : '—'}
                          </div>
                          <span className="text-[10px] text-slate-400">Equal to BOX Length</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Overall Width</span>
                          <div className="font-mono font-bold text-sm text-slate-800 mt-0.5">
                            {formData.filterWidth ? `${formData.filterWidth} mm` : '—'}
                          </div>
                          <span className="text-[10px] text-slate-400">Equal to BOX Width</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Overall Depth</span>
                          <div className="font-mono font-bold text-sm text-slate-800 mt-0.5">
                            {formData.filterDepth ? `${formData.filterDepth} mm` : '—'}
                          </div>
                          <span className="text-[10px] text-slate-400">Equal to BOX Depth</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-2 font-medium">
                        * BOX Construction: Overall dimensions equal BOX dimensions. No flange projection is added.
                      </p>
                    </div>
                  )}
                </div>

                {/* Section B: Construction & Thermal Ratings */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                  <div className="mb-3 border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      B. Filter Construction & Thermal Specifications
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Continuous operating temperature and bonding adhesive.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Temperature Rating */}
                    <FormField
                      label="Rated Operating Temperature (°C)"
                      helperText="Catalog-level maximum continuous operating temperature."
                    >
                      <Input
                        type="number"
                        step="any"
                        name="temperatureRating"
                        placeholder="e.g. 120"
                        value={formData.temperatureRating}
                        onChange={handleChange}
                        disabled={submitting}
                      />
                    </FormField>

                    {/* Bonding Type */}
                    <FormField
                      label="Bonding Adhesive"
                      helperText={
                        formData.bonding
                          ? `Recommended range: ${
                              BONDING_OPTIONS.find((b) => b.value === formData.bonding)?.minTemp
                            }–${
                              BONDING_OPTIONS.find((b) => b.value === formData.bonding)?.maxTemp
                            } °C`
                          : 'Select bonding adhesive technology.'
                      }
                    >
                      <Select
                        name="bonding"
                        value={formData.bonding}
                        onChange={handleChange}
                        disabled={submitting}
                      >
                        <option value="">-- Select Bonding Technology --</option>
                        {BONDING_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    {/* Non-blocking Temperature Range Warning */}
                    {temperatureWarning && (
                      <div className="col-span-full">
                        <Alert type="warning" message={temperatureWarning} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Section C: Additional Category Specifications (Excluding dimensions/grade) */}
                {(() => {
                  const isFilterCoreSpec = (spec) => {
                    const code = (spec.specificationCode || '').toUpperCase().trim();
                    const name = (spec.specificationName || '').toUpperCase().trim();
                    return (
                      code === 'SPEC-LENGTH-01' || name === 'LENGTH' ||
                      code === 'SPEC-WIDTH-01' || name === 'WIDTH' ||
                      code === 'DEPTH' || name === 'DEPTH' ||
                      code === 'CFM' || name === 'CFM' || name.includes('AIRFLOW') ||
                      code === 'FILTER GRADE' || name.includes('FILTER GRADE') || name === 'GRADE'
                    );
                  };

                  const remainingSpecs = categorySpecs.filter((s) => !isFilterCoreSpec(s));

                  if (remainingSpecs.length === 0) {
                    return (
                      <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-md text-xs text-blue-800 flex items-center gap-2">
                        <span>ℹ️</span>
                        <span>
                          Category specifications for Length, Width, Depth, CFM, and Filter Grade are automatically synchronized from your inputs above.
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div className="border border-slate-200 rounded-lg p-4 bg-white">
                      <div className="mb-3 border-b border-slate-200 pb-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          C. Additional Category Specifications ({remainingSpecs.length})
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Configure any additional specifications defined for {formData.itemCategory ? 'this category' : 'the item'}.
                        </p>
                      </div>

                      <div className="flex flex-col gap-3">
                        {remainingSpecs.map((spec) => {
                          const specId = spec._id;
                          const currentData = specsData[specId] || { value: '', isApply: false, isFix: false };

                          return (
                            <div
                              key={specId}
                              className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_70px_70px] gap-2.5 items-center bg-slate-50 p-2.5 rounded-md border border-slate-200"
                            >
                              <div>
                                <strong className="text-xs font-semibold text-slate-900 inline-flex items-center gap-1">
                                  {spec.specificationName}
                                  {spec.isRequiredCategorySpec && <span className="text-red-600 font-bold">*</span>}
                                </strong>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                                  <span>{spec.specificationCode} ({spec.dataType})</span>
                                  {spec.unit && (
                                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10.5px] font-semibold">
                                      {spec.unit?.uomCode || spec.unit?.uomName || spec.unit}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div>
                                {spec.dataType === 'select' && Array.isArray(spec.options) ? (
                                  <Select
                                    value={currentData.value || ''}
                                    onChange={(e) => handleSpecChange(specId, 'value', e.target.value)}
                                    disabled={submitting}
                                  >
                                    <option value="">-- Select Option --</option>
                                    {spec.options.map((opt, idx) => (
                                      <option key={idx} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </Select>
                                ) : spec.dataType === 'number' ? (
                                  <Input
                                    type="number"
                                    placeholder="Enter number"
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
                                    <option value="true">True / Yes</option>
                                    <option value="false">False / No</option>
                                  </Select>
                                ) : (
                                  <Input
                                    placeholder="Enter text value"
                                    value={currentData.value || ''}
                                    onChange={(e) => handleSpecChange(specId, 'value', e.target.value)}
                                    disabled={submitting}
                                  />
                                )}
                              </div>

                              <label className="flex items-center gap-1 text-xs text-slate-700 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={!!currentData.isApply}
                                  onChange={(e) => handleSpecChange(specId, 'isApply', e.target.checked)}
                                  disabled={submitting}
                                  className="accent-blue-600 cursor-pointer"
                                />
                                <span>Apply</span>
                              </label>

                              <label className="flex items-center gap-1 text-xs text-slate-700 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={!!currentData.isFix}
                                  onChange={(e) => handleSpecChange(specId, 'isFix', e.target.checked)}
                                  disabled={submitting}
                                  className="accent-blue-600 cursor-pointer"
                                />
                                <span>Fix</span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Non-Filter products: Preserve standard Category Specifications list */
              <>
                {!formData.itemCategory ? (
                  <Alert type="info" message="Please select an Item Category in the 'Basic Info' tab to configure category specifications." />
                ) : categorySpecs.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs bg-slate-50 rounded-md border border-slate-200">
                    No specification parameters are configured for the selected Item Category.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="text-xs text-slate-600 mb-1">
                      Category Specifications for selected category ({categorySpecs.length} parameters):
                    </div>

                    {categorySpecs.map((spec) => {
                      const specId = spec._id;
                      const currentData = specsData[specId] || { value: '', isApply: false, isFix: false };

                      return (
                        <div
                          key={specId}
                          className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_70px_70px] gap-2.5 items-center bg-white p-2.5 rounded-md border border-slate-200"
                        >
                          <div>
                            <strong className="text-xs font-semibold text-slate-900 inline-flex items-center gap-1">
                              {spec.specificationName}
                              {spec.isRequiredCategorySpec && <span className="text-red-600 font-bold">*</span>}
                            </strong>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                              <span>{spec.specificationCode} ({spec.dataType})</span>
                              {spec.unit && (
                                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10.5px] font-semibold">
                                  {spec.unit?.uomCode || spec.unit?.uomName || spec.unit}
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            {spec.dataType === 'select' && Array.isArray(spec.options) ? (
                              <Select
                                value={currentData.value || ''}
                                onChange={(e) => handleSpecChange(specId, 'value', e.target.value)}
                                disabled={submitting}
                              >
                                <option value="">-- Select Option --</option>
                                {spec.options.map((opt, idx) => (
                                  <option key={idx} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </Select>
                            ) : spec.dataType === 'number' ? (
                              <Input
                                type="number"
                                placeholder="Enter number"
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
                                <option value="true">True / Yes</option>
                                <option value="false">False / No</option>
                              </Select>
                            ) : (
                              <Input
                                placeholder="Enter text value"
                                value={currentData.value || ''}
                                onChange={(e) => handleSpecChange(specId, 'value', e.target.value)}
                                disabled={submitting}
                              />
                            )}
                          </div>

                          <label className="flex items-center gap-1 text-xs text-slate-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!currentData.isApply}
                              onChange={(e) => handleSpecChange(specId, 'isApply', e.target.checked)}
                              disabled={submitting}
                              className="accent-blue-600 cursor-pointer"
                            />
                            <span>Apply</span>
                          </label>

                          <label className="flex items-center gap-1 text-xs text-slate-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!currentData.isFix}
                              onChange={(e) => handleSpecChange(specId, 'isFix', e.target.checked)}
                              disabled={submitting}
                              className="accent-blue-600 cursor-pointer"
                            />
                            <span>Fix</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </form>

      {/* Image Preview Lightbox Modal */}
      {previewImageModalOpen && formData.imageUrl && (
        <Modal
          isOpen={previewImageModalOpen}
          onClose={() => setPreviewImageModalOpen(false)}
          title={`Image Preview — ${formData.itemName || formData.itemCode}`}
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setPreviewImageModalOpen(false)}>
              Close
            </Button>
          }
        >
          <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-lg">
            <img
              src={formData.imageUrl}
              alt={formData.itemName || 'Item Image'}
              className="max-h-[65vh] w-auto max-w-full rounded object-contain shadow-lg"
            />
          </div>
        </Modal>
      )}
    </Modal>
  );
};

export default ItemFormModal;
