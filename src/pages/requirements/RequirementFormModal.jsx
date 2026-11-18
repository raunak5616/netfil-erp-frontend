import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCreateRequirementMutation, useUpdateRequirementMutation } from '../../features/requirements/requirementsApi';
import {
  useGetClientsQuery,
  useGetItemCategoriesQuery,
  useGetUOMsQuery,
  useGetFlangeDesignsQuery,
  useGetFilterGradesQuery,
} from '../../features/masterData/masterDataApi';
import { useGetEmployeesQuery } from '../../features/employees/employeesApi';
import { useGetItemsQuery } from '../../features/products/productsApi';
import { useGetHoleConfigurationsQuery } from '../../features/drawingMaster/drawingMasterApi';
import DrawingSelector from '../../components/drawing/DrawingSelector';
import ItemFormModal from '../items/ItemFormModal';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import {
  Search,
  X,
  Plus,
  Trash2,
  User,
  Package,
  Maximize2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Lock
} from 'lucide-react';

// Standard MOC options discovered from master data and historical ERP records
const STANDARD_MOC_OPTIONS = [
  'Aluminium',
  'SS304',
  'SS316',
  'Galvanized Iron (GI)',
  'CRCA Powder Coated',
  'Mild Steel'
];

// Confirmed Gasket MOC options
const STANDARD_GASKET_MOC_OPTIONS = [
  'EPDM',
  'Glass Fiber Pad'
];

/**
 * Resolves technical specifications (MOC, Temperature Range, Bonding, Gasket MOC) from an Item Master object
 * ensuring exact string representations (e.g. 20–70 °C, 250–350 °C) and Gasket MOC (EPDM, Glass Fiber Pad).
 */
export const resolveItemTechnicalSpecs = (itemObj = null, fallbackDims = {}) => {
  if (!itemObj && !fallbackDims) {
    return { moc: '', temperatureRange: '', bonding: '', gasketMoc: '' };
  }

  // 1. Resolve Temperature Range string (e.g. 20–70 °C, 70–150 °C, 150–200 °C, 200–250 °C, 250–350 °C)
  let resolvedTempRange = '';
  const rawRange = itemObj?.temperatureRange || fallbackDims?.temperatureRange;
  const rawRating = itemObj?.temperatureRating ?? fallbackDims?.temperature;
  const rawGradeTemp = itemObj?.grade_items?.filterTemp;

  if (rawRange && typeof rawRange === 'string' && rawRange.trim() !== '') {
    resolvedTempRange = rawRange.trim();
  } else if (rawRating !== undefined && rawRating !== null && String(rawRating).trim() !== '') {
    const strVal = String(rawRating).trim();
    if (strVal.includes('–') || strVal.includes('-') || strVal.includes('°') || strVal.includes('C')) {
      resolvedTempRange = strVal;
    } else {
      const numVal = Number(strVal);
      if (!Number.isNaN(numVal)) {
        if (numVal <= 70) resolvedTempRange = '20–70 °C';
        else if (numVal <= 150) resolvedTempRange = '70–150 °C';
        else if (numVal <= 200) resolvedTempRange = '150–200 °C';
        else if (numVal <= 250) resolvedTempRange = '200–250 °C';
        else resolvedTempRange = '250–350 °C';
      }
    }
  } else if (rawGradeTemp !== undefined && rawGradeTemp !== null && String(rawGradeTemp).trim() !== '') {
    const numVal = Number(rawGradeTemp);
    if (!Number.isNaN(numVal)) {
      if (numVal <= 70) resolvedTempRange = '20–70 °C';
      else if (numVal <= 150) resolvedTempRange = '70–150 °C';
      else if (numVal <= 200) resolvedTempRange = '150–200 °C';
      else if (numVal <= 250) resolvedTempRange = '200–250 °C';
      else resolvedTempRange = '250–350 °C';
    }
  }

  // 2. Resolve Gasket MOC ('EPDM' or 'Glass Fiber Pad')
  let resolvedGasketMoc = (itemObj?.gasketMoc || fallbackDims?.gasketMoc || itemObj?.gasket || '').trim();
  if (!resolvedGasketMoc && resolvedTempRange) {
    if (resolvedTempRange.includes('250–350') || resolvedTempRange.includes('250-350') || resolvedTempRange.includes('350')) {
      resolvedGasketMoc = 'Glass Fiber Pad';
    } else {
      resolvedGasketMoc = 'EPDM';
    }
  }

  // 3. Resolve Bonding Adhesive
  let resolvedBonding = (itemObj?.bonding || fallbackDims?.bonding || itemObj?.adhesive || '').trim();
  if (!resolvedBonding && resolvedTempRange) {
    if (resolvedTempRange.includes('250–350') || resolvedTempRange.includes('350')) {
      resolvedBonding = 'White Adhesive (Ceramic)';
    } else if (resolvedTempRange.includes('150–200') || resolvedTempRange.includes('200–250') || resolvedTempRange.includes('200') || resolvedTempRange.includes('250')) {
      resolvedBonding = 'Epoxy Bonding';
    } else {
      resolvedBonding = 'PU Bonding';
    }
  }

  // 4. Resolve MOC ('Aluminium', 'SS304', 'SS316')
  let resolvedMoc = (itemObj?.moc || fallbackDims?.moc || itemObj?.casingMoc || '').trim();
  if (!resolvedMoc && resolvedTempRange) {
    if (resolvedTempRange.includes('200–250') || resolvedTempRange.includes('250–350')) {
      resolvedMoc = 'SS304';
    } else {
      resolvedMoc = 'Aluminium';
    }
  }

  return {
    moc: resolvedMoc,
    temperatureRange: resolvedTempRange,
    bonding: resolvedBonding,
    gasketMoc: resolvedGasketMoc,
  };
};

// Confirmed Bonding options with operating temperature ranges
const BONDING_OPTIONS = [
  { value: 'PU Bonding', label: 'PU Bonding' },
  { value: 'Epoxy Bonding', label: 'Epoxy Bonding' },
  { value: 'White Adhesive (Ceramic)', label: 'Silicon based Ceramic' }
];

// Standard airflow CFM calculation from effective inner dimensions in MM and face velocity in FPM
const calculateFilterCfm = (innerLength, innerWidth, faceVelocity = 500) => {
  const l = Number(innerLength);
  const w = Number(innerWidth);
  const fv = Number(faceVelocity);
  if (!l || !w || !fv || isNaN(l) || isNaN(w) || isNaN(fv) || l <= 0 || w <= 0 || fv <= 0) {
    return null;
  }
  const raw = (l / 304.8) * (w / 304.8) * fv;
  const rounded10 = Math.round(raw / 10) * 10;
  return (rounded10 === 0 && raw > 0) ? Math.round(raw) : rounded10;
};

// Helper to normalize and extract construction from a variant object
const getVariantConstruction = (v) => {
  const raw = (v?.mountingType && String(v.mountingType).trim()) || (v?.filterType && String(v.filterType).trim()) || '';
  return raw.toUpperCase();
};

const getCatalogDetailsForEnquiryItem = (itemObj, prevCatalogDetails = {}) => {
  const bw = Number(itemObj?.dimensions?.bodyWidth || itemObj?.dimensions?.itemBreadth) || '';
  const bh = Number(itemObj?.dimensions?.bodyHeight || itemObj?.dimensions?.itemLength) || '';
  const bd = Number(itemObj?.dimensions?.depth || itemObj?.dimensions?.itemDepth) || '';
  const fpm = Number(itemObj?.dimensions?.faceVelocity) || 500;
  const isFlange = (itemObj?.constructionType || 'FLANGE').toUpperCase() === 'FLANGE';

  return {
    itemCode: prevCatalogDetails?.itemCode || 'AUTO',
    itemName: prevCatalogDetails?.itemName || itemObj?.newItemName || itemObj?.itemSearch || '',
    itemCategory: itemObj?.itemCategory || prevCatalogDetails?.itemCategory || '',
    productType: prevCatalogDetails?.productType || 'FILTER',
    itemType: prevCatalogDetails?.itemType || 'finished_goods',
    inventoryUom: itemObj?.uom || prevCatalogDetails?.inventoryUom || '',
    purchaseUom: prevCatalogDetails?.purchaseUom || itemObj?.uom || '',
    salesUom: prevCatalogDetails?.salesUom || itemObj?.uom || '',
    itemPerPurchaseUnit: prevCatalogDetails?.itemPerPurchaseUnit || 1,
    itemPerSalesUnit: prevCatalogDetails?.itemPerSalesUnit || 1,
    hsnCode: prevCatalogDetails?.hsnCode || '',
    description: prevCatalogDetails?.description || '',
    // Filter specifics
    filterGrade: prevCatalogDetails?.filterGrade || '',
    filterGradeVariant: prevCatalogDetails?.filterGradeVariant || '',
    drawing: prevCatalogDetails?.drawing || '',
    constructionType: prevCatalogDetails?.constructionType || itemObj?.constructionType || 'FLANGE',
    flangeType: isFlange ? (prevCatalogDetails?.flangeType || itemObj?.flangeDesign || '') : '',
    filterLength: prevCatalogDetails?.filterLength !== undefined && prevCatalogDetails?.filterLength !== ''
      ? prevCatalogDetails.filterLength
      : bh,
    filterWidth: prevCatalogDetails?.filterWidth !== undefined && prevCatalogDetails?.filterWidth !== ''
      ? prevCatalogDetails.filterWidth
      : bw,
    filterDepth: prevCatalogDetails?.filterDepth !== undefined && prevCatalogDetails?.filterDepth !== ''
      ? prevCatalogDetails.filterDepth
      : bd,
    faceVelocity: prevCatalogDetails?.faceVelocity !== undefined && prevCatalogDetails?.faceVelocity !== ''
      ? prevCatalogDetails.faceVelocity
      : fpm,
    moc: prevCatalogDetails?.moc !== undefined && prevCatalogDetails?.moc !== ''
      ? prevCatalogDetails.moc
      : (itemObj?.dimensions?.moc || ''),
    customMoc: prevCatalogDetails?.customMoc || '',
    temperatureRating: prevCatalogDetails?.temperatureRating !== undefined && prevCatalogDetails?.temperatureRating !== ''
      ? prevCatalogDetails.temperatureRating
      : (itemObj?.dimensions?.temperature || itemObj?.dimensions?.temperatureRange || ''),
    bonding: prevCatalogDetails?.bonding || itemObj?.dimensions?.bonding || '',
    reorderLevel: prevCatalogDetails?.reorderLevel || 0,
    reorderQty: prevCatalogDetails?.reorderQty || 0,
    minInventory: prevCatalogDetails?.minInventory || 0,
    maxInventory: prevCatalogDetails?.maxInventory || 0,
    leadTimeDays: prevCatalogDetails?.leadTimeDays || 0,
    defaultBin: prevCatalogDetails?.defaultBin || ''
  };
};

const createNewItemObj = (idIndex = 0, defaultFlangeId = '') => ({
  id: `item_${Date.now()}_${idIndex}_${Math.random().toString(36).substring(2, 7)}`,
  itemCategory: '',
  item: '',
  quantity: '',
  uom: '',
  constructionType: 'FLANGE',
  flangeDesign: defaultFlangeId || '',
  holeCount: null,
  flangeHoleConfig: '',
  dimensions: {
    itemLength: '',
    itemBreadth: '',
    itemDepth: '',
    innerLength: '',
    innerWidth: '',
    innerDepth: '',
    bodyWidth: '',
    bodyHeight: '',
    depth: '',
    overallFlangeWidth: '',
    overallFlangeHeight: '',
    overallFlangeLength: '',
    overallFlangeBreadth: '',
    faceVelocity: 500,
    cfm: null,
    unit: 'mm',
    moc: '',
    temperature: '',
    temperatureRange: '',
    bonding: '',
    gasketMoc: '',
  },
  specifications: [],
  remarks: '',
  isExpanded: true,
  itemSearch: '',
  isItemDropdownOpen: false,
  saveToCatalog: false,
  newItemName: '',
  catalogDetails: {
    itemCode: 'AUTO',
    itemName: '',
    itemCategory: '',
    productType: 'FILTER',
    itemType: 'finished_goods',
    inventoryUom: '',
    purchaseUom: '',
    salesUom: '',
    itemPerPurchaseUnit: 1,
    itemPerSalesUnit: 1,
    hsnCode: '',
    description: '',
    filterGrade: '',
    filterGradeVariant: '',
    drawing: '',
    constructionType: 'FLANGE',
    flangeType: defaultFlangeId || '',
    filterLength: '',
    filterWidth: '',
    filterDepth: '',
    faceVelocity: 500,
    moc: '',
    customMoc: '',
    temperatureRating: '',
    bonding: '',
    reorderLevel: 0,
    reorderQty: 0,
    minInventory: 0,
    maxInventory: 0,
    leadTimeDays: 0,
    defaultBin: ''
  }
});

const RequirementFormModal = ({ requirement, isOpen, onClose, onSuccess }) => {
  const isEditMode = !!requirement;
  const { hasPermission } = useAuth();
  const canCreateItem = typeof hasPermission === 'function' ? hasPermission('ITEM_CREATE') : false;

  const [createRequirementMutation] = useCreateRequirementMutation();
  const [updateRequirementMutation] = useUpdateRequirementMutation();

  // RTK Query Master Data Hooks
  const { data: clientsData, isLoading: loadingClients } = useGetClientsQuery(
    { typeFilter: 'MASTER', approvalStatus: 'APPROVED', status: 'active' },
    { skip: !isOpen }
  );
  const { data: itemsData, isLoading: loadingItems, refetch: refetchItems } = useGetItemsQuery(
    { typeFilter: 'MASTER', all: true },
    { skip: !isOpen }
  );
  const { data: catData, isLoading: loadingCats } = useGetItemCategoriesQuery(
    { typeFilter: 'MASTER' },
    { skip: !isOpen }
  );
  const { data: uomData, isLoading: loadingUoms } = useGetUOMsQuery(undefined, { skip: !isOpen });
  const { data: empData, isLoading: loadingEmps } = useGetEmployeesQuery({ all: true }, { skip: !isOpen });
  const { data: flangeData, isLoading: loadingFlanges } = useGetFlangeDesignsQuery({ status: 'active' }, { skip: !isOpen });
  const { data: filterGradesData, isLoading: loadingGrades } = useGetFilterGradesQuery(undefined, { skip: !isOpen });
  const { data: holeConfigData } = useGetHoleConfigurationsQuery(undefined, { skip: !isOpen });

  const isSystemCode = (code) => {
    if (!code) return false;
    const u = String(code).toUpperCase();
    return (
      u.startsWith('CAT-WO-') ||
      u === 'CAT-INV' ||
      u === 'CAT-OBOM' ||
      u.startsWith('GP-WO-') ||
      u === 'GP-INV' ||
      u === 'GP-OBOM' ||
      u.startsWith('CL-WO-') ||
      u.startsWith('CL-INV-') ||
      u.startsWith('CL-OBOM') ||
      u.startsWith('ITEM-WO-') ||
      u.startsWith('ITEM-INV-') ||
      u.startsWith('ITEM-OBOM-')
    );
  };

  const clients = useMemo(() => {
    const list = clientsData?.clients || [];
    return list.filter((c) => c.status === 'active' && !isSystemCode(c.clientCode));
  }, [clientsData]);

  const items = useMemo(() => {
    const list = itemsData?.items || [];
    return list.filter((i) => i.status === 'active' && !isSystemCode(i.itemCode));
  }, [itemsData]);

  const itemCategories = useMemo(() => {
    const list = catData?.itemCategories || catData?.categories || [];
    return list.filter((cat) => cat.status === 'active' && !isSystemCode(cat.categoryCode));
  }, [catData]);

  const uoms = useMemo(() => {
    const list = uomData?.uoms || [];
    return list.filter((u) => u.status === 'active');
  }, [uomData]);

  const employees = useMemo(() => {
    const list = empData?.employees || [];
    return list.filter((e) => e.status === 'active');
  }, [empData]);

  const flangeDesigns = useMemo(() => {
    const list = flangeData?.flangeDesigns || [];
    return list.filter((f) => f.status === 'active' && f.constructionType === 'FLANGE' && f.designCode !== 'BOX-001');
  }, [flangeData]);

  const filterGrades = useMemo(() => {
    const list = filterGradesData?.filterGrades || [];
    return list.filter((g) => g.status === 'active');
  }, [filterGradesData]);

  const holeOptions = useMemo(() => {
    return (holeConfigData?.options && holeConfigData.options.length > 0)
      ? holeConfigData.options
      : ['4 Holes', '8 Holes', '12 Holes'];
  }, [holeConfigData]);

  const loadingMasters = loadingClients || loadingItems || loadingCats || loadingUoms || loadingEmps || loadingFlanges || loadingGrades;

  // Default active FLANGE construction design ID
  const defaultFlangeId = useMemo(() => {
    if (!flangeDesigns || flangeDesigns.length === 0) return '';
    const found =
      flangeDesigns.find((f) => f.constructionType === 'FLANGE' && f.status === 'active' && f.designCode !== 'BOX-001') ||
      flangeDesigns.find((f) => f.constructionType === 'FLANGE');
    return found?._id || '';
  }, [flangeDesigns]);

  // Search states for party dropdown selector
  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  const getFourDaysFromDate = (baseDateStr) => {
    try {
      const d = baseDateStr ? new Date(baseDateStr) : new Date();
      if (isNaN(d.getTime())) return '';
      d.setDate(d.getDate() + 4);
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  // Main Form state
  const [formData, setFormData] = useState({
    client: '',
    requirementDate: new Date().toISOString().split('T')[0],
    type: 'product',
    serviceDescription: '',
    items: [createNewItemObj(0)],
    remarks: '',
    followUpDate: getFourDaysFromDate(),
    status: 'draft',
    salesPerson: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Quick Catalog Item creation modal states
  const [isItemCatalogModalOpen, setIsItemCatalogModalOpen] = useState(false);
  const [catalogCreationIndex, setCatalogCreationIndex] = useState(null);
  const [catalogCreationName, setCatalogCreationName] = useState('');

  // Populate form data when editing or creating
  useEffect(() => {
    if (!isOpen) return;

    const defaultFlangeId = flangeDesigns.length > 0 ? (flangeDesigns.find(f => f.constructionType === 'FLANGE' && f.status === 'active' && f.designCode !== 'BOX-001')?._id || '') : '';

    if (requirement) {
      const formattedReqDate = requirement.requirementDate
        ? new Date(requirement.requirementDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const formattedFollowDate = requirement.followUpDate
        ? new Date(requirement.followUpDate).toISOString().split('T')[0]
        : '';

      let formItems = [];

      if (Array.isArray(requirement.items) && requirement.items.length > 0) {
        formItems = requirement.items.map((reqItem, idx) => {
          const specs = Array.isArray(reqItem.specifications)
            ? reqItem.specifications.map((s) =>
              typeof s === 'object' && s !== null
                ? { key: s.key || s.name || '', value: s.value || s.val || '' }
                : { key: 'Spec', value: String(s) }
            )
            : [];

          const rawDims = reqItem.dimensions && typeof reqItem.dimensions === 'object' && !Array.isArray(reqItem.dimensions)
            ? reqItem.dimensions
            : {};

          const itemObj = typeof reqItem.item === 'object' ? reqItem.item : (items.find(i => String(i._id) === String(reqItem.item)) || null);
          const constType = (reqItem.constructionType || rawDims.constructionType || itemObj?.constructionType || 'FLANGE').toUpperCase();
          const isFlange = constType === 'FLANGE';

          const origL = rawDims.itemLength || itemObj?.outerLength || itemObj?.overallLength || itemObj?.filterLength || rawDims.bodyHeight || rawDims.height || '';
          const origW = rawDims.itemBreadth || itemObj?.outerWidth || itemObj?.overallWidth || itemObj?.filterWidth || rawDims.bodyWidth || rawDims.width || '';
          const origD = rawDims.itemDepth || itemObj?.outerDepth || itemObj?.overallDepth || itemObj?.filterDepth || rawDims.depth || rawDims.length || '';

          const innerL = rawDims.innerLength || (isFlange ? (origL && Number(origL) > 60 ? Number(origL) - 60 : (rawDims.bodyHeight || origL)) : origL);
          const innerW = rawDims.innerWidth || (isFlange ? (origW && Number(origW) > 60 ? Number(origW) - 60 : (rawDims.bodyWidth || origW)) : origW);
          const innerD = rawDims.innerDepth || origD;

          let fw = '';
          let fh = '';
          if (isFlange) {
            fw = rawDims.overallFlangeBreadth || rawDims.overallFlangeWidth || rawDims.flangeWidth || origW;
            fh = rawDims.overallFlangeLength || rawDims.overallFlangeHeight || rawDims.flangeHeight || origL;
          }

          const fpm = Number(rawDims.faceVelocity || itemObj?.faceVelocity || 500);
          let cfm = rawDims.cfm || rawDims.capacity || '';
          if (!cfm && innerL && innerW && fpm) {
            cfm = calculateFilterCfm(innerL, innerW, fpm);
          }

          const itemSpecs = resolveItemTechnicalSpecs(itemObj, rawDims);
          const moc = itemSpecs.moc;
          const tempRange = itemSpecs.temperatureRange;
          const bonding = itemSpecs.bonding;
          const gasketMoc = itemSpecs.gasketMoc;

          const dims = {
            itemLength: origL,
            itemBreadth: origW,
            itemDepth: origD,
            innerLength: innerL,
            innerWidth: innerW,
            innerDepth: innerD,
            bodyWidth: innerW,
            bodyHeight: innerL,
            depth: origD,
            overallFlangeWidth: fw,
            overallFlangeHeight: fh,
            overallFlangeLength: fh,
            overallFlangeBreadth: fw,
            overallFlangeDepth: isFlange ? origD : undefined,
            faceVelocity: fpm,
            cfm: cfm,
            unit: rawDims.unit || 'mm',
            moc: moc,
            temperature: tempRange,
            temperatureRange: tempRange,
            bonding: bonding,
            gasketMoc: gasketMoc,
          };

          const flangeId = reqItem.flangeDesign?._id || reqItem.flangeDesign || reqItem.flangeDesignSnapshot?.flangeDesignId || '';
          const searchStr = itemObj ? `${itemObj.itemCode ? itemObj.itemCode + ' - ' : ''}${itemObj.itemName}` : '';

          return {
            id: `item_${Date.now()}_${idx}`,
            itemCategory: reqItem.itemCategory?._id || reqItem.itemCategory || '',
            item: reqItem.item?._id || reqItem.item || '',
            quantity: reqItem.quantity !== null && reqItem.quantity !== undefined ? reqItem.quantity : '',
            uom: reqItem.uom?._id || reqItem.uom || '',
            constructionType: constType,
            flangeDesign: constType === 'FLANGE' ? (flangeId || defaultFlangeId) : '',
            holeCount: constType === 'FLANGE' ? (reqItem.holeCount || null) : null,
            flangeHoleConfig: constType === 'FLANGE' ? (reqItem.flangeHoleConfig || (reqItem.holeCount ? `${reqItem.holeCount} Holes` : '')) : '',
            dimensions: dims,
            specifications: specs,
            remarks: reqItem.remarks || '',
            isExpanded: true,
            itemSearch: searchStr,
            isItemDropdownOpen: false,
          };
        });
      } else {
        const specs = Array.isArray(requirement.specifications)
          ? requirement.specifications.map((s) =>
            typeof s === 'object' && s !== null
              ? { key: s.key || s.name || '', value: s.value || s.val || '' }
              : { key: 'Spec', value: String(s) }
          )
          : [];

        const rawDims = requirement.dimensions && typeof requirement.dimensions === 'object' && !Array.isArray(requirement.dimensions)
          ? requirement.dimensions
          : {};

        const itemObj = typeof requirement.item === 'object' ? requirement.item : (items.find(i => String(i._id) === String(requirement.item)) || null);
        const constType = (requirement.constructionType || rawDims.constructionType || itemObj?.constructionType || 'FLANGE').toUpperCase();
        const isFlange = constType === 'FLANGE';

        const origL = rawDims.itemLength || itemObj?.outerLength || itemObj?.overallLength || itemObj?.filterLength || rawDims.bodyHeight || rawDims.height || '';
        const origW = rawDims.itemBreadth || itemObj?.outerWidth || itemObj?.overallWidth || itemObj?.filterWidth || rawDims.bodyWidth || rawDims.width || '';
        const origD = rawDims.itemDepth || itemObj?.outerDepth || itemObj?.overallDepth || itemObj?.filterDepth || rawDims.depth || rawDims.length || '';

        const innerL = rawDims.innerLength || (isFlange ? (origL && Number(origL) > 60 ? Number(origL) - 60 : (rawDims.bodyHeight || origL)) : origL);
        const innerW = rawDims.innerWidth || (isFlange ? (origW && Number(origW) > 60 ? Number(origW) - 60 : (rawDims.bodyWidth || origW)) : origW);
        const innerD = rawDims.innerDepth || origD;

        let fw = '';
        let fh = '';
        if (isFlange) {
          fw = rawDims.overallFlangeBreadth || rawDims.overallFlangeWidth || rawDims.flangeWidth || origW;
          fh = rawDims.overallFlangeLength || rawDims.overallFlangeHeight || rawDims.flangeHeight || origL;
        }

        const fpm = Number(rawDims.faceVelocity || itemObj?.faceVelocity || 500);
        let cfm = rawDims.cfm || rawDims.capacity || '';
        if (!cfm && innerL && innerW && fpm) {
          cfm = calculateFilterCfm(innerL, innerW, fpm);
        }

        const moc = rawDims.moc || itemObj?.moc || '';
        const tempRange = rawDims.temperatureRange || rawDims.temperature || itemObj?.temperatureRange || (typeof itemObj?.temperatureRating === 'string' ? itemObj.temperatureRating : '') || '';
        const bonding = rawDims.bonding || itemObj?.bonding || '';
        const gasketMoc = rawDims.gasketMoc || itemObj?.gasketMoc || '';

        const dims = {
          itemLength: origL,
          itemBreadth: origW,
          itemDepth: origD,
          innerLength: innerL,
          innerWidth: innerW,
          innerDepth: innerD,
          bodyWidth: innerW,
          bodyHeight: innerL,
          depth: origD,
          overallFlangeWidth: fw,
          overallFlangeHeight: fh,
          overallFlangeLength: fh,
          overallFlangeBreadth: fw,
          overallFlangeDepth: isFlange ? origD : undefined,
          faceVelocity: fpm,
          cfm: cfm,
          unit: rawDims.unit || 'mm',
          moc: moc,
          temperature: tempRange,
          temperatureRange: tempRange,
          bonding: bonding,
          gasketMoc: gasketMoc,
        };

        const flangeId = requirement.flangeDesign?._id || requirement.flangeDesign || requirement.flangeDesignSnapshot?.flangeDesignId || '';
        const searchStr = itemObj ? `${itemObj.itemCode ? itemObj.itemCode + ' - ' : ''}${itemObj.itemName}` : '';

        formItems = [{
          id: `item_${Date.now()}_0`,
          itemCategory: requirement.itemCategory?._id || requirement.itemCategory || '',
          item: requirement.item?._id || requirement.item || '',
          quantity: requirement.quantity !== null && requirement.quantity !== undefined ? requirement.quantity : '',
          uom: requirement.uom?._id || requirement.uom || '',
          constructionType: constType,
          flangeDesign: constType === 'FLANGE' ? (flangeId || defaultFlangeId) : '',
          holeCount: constType === 'FLANGE' ? (requirement.holeCount || null) : null,
          flangeHoleConfig: constType === 'FLANGE' ? (requirement.flangeHoleConfig || (requirement.holeCount ? `${requirement.holeCount} Holes` : '')) : '',
          dimensions: dims,
          specifications: specs,
          remarks: '',
          isExpanded: true,
          itemSearch: searchStr,
          isItemDropdownOpen: false,
        }];
      }

      setFormData({
        client: requirement.client?._id || requirement.client || '',
        requirementDate: formattedReqDate,
        type: requirement.type || 'product',
        serviceDescription: requirement.serviceDescription || '',
        items: formItems,
        remarks: requirement.remarks || '',
        followUpDate: formattedFollowDate,
        status: requirement.status || 'draft',
        salesPerson: requirement.salesPerson?._id || requirement.salesPerson || '',
      });

      if (requirement.client) {
        const partyObj = typeof requirement.client === 'object' ? requirement.client : null;
        if (partyObj) {
          setClientSearch(`${partyObj.clientCode ? partyObj.clientCode + ' - ' : ''}${partyObj.companyName}`);
        }
      } else {
        setClientSearch('');
      }
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        client: '',
        requirementDate: today,
        type: 'product',
        serviceDescription: '',
        items: [createNewItemObj(0, defaultFlangeId)],
        remarks: '',
        followUpDate: getFourDaysFromDate(today),
        status: 'draft',
        salesPerson: '',
      });
      setClientSearch('');
    }

    setErrorMessage('');
    setSuccessMessage('');
  }, [requirement, isOpen, flangeDesigns]);

  if (!isOpen) return null;

  // Filtered clients list (exclude system operational test clients)
  const filteredClients = clients.filter((c) => {
    const code = c.clientCode || '';
    if (code.startsWith('CL-WO-') || code.startsWith('CL-INV-') || code === 'CL-OBOM') {
      return false;
    }
    if (!clientSearch.trim()) return true;
    const term = clientSearch.toLowerCase();
    const name = (c.companyName || '').toLowerCase();
    return code.toLowerCase().includes(term) || name.includes(term);
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'requirementDate' && value && !isEditMode) {
        updated.followUpDate = getFourDaysFromDate(value);
      }
      return updated;
    });
  };

  const selectParty = (party) => {
    setFormData((prev) => ({ ...prev, client: party._id }));
    setClientSearch(`${party.clientCode ? party.clientCode + ' - ' : ''}${party.companyName}`);
    setIsClientDropdownOpen(false);
  };

  const clearParty = () => {
    setFormData((prev) => ({ ...prev, client: '' }));
    setClientSearch('');
  };

  // MULTI-ITEM ARRAY HANDLERS
  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        createNewItemObj(prev.items.length, defaultFlangeId),
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const toggleItemExpand = (index) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], isExpanded: !updated[index].isExpanded };
      return { ...prev, items: updated };
    });
  };

  const handleItemFieldChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      const curItem = updated[index];
      let newFlangeDesign = curItem.flangeDesign;
      let newDims = { ...curItem.dimensions };

      if (field === 'constructionType') {
        const ct = (value || '').toUpperCase();
        if (ct === 'BOX') {
          newFlangeDesign = '';
          newDims.overallFlangeWidth = '';
          newDims.overallFlangeHeight = '';
          newDims.overallFlangeLength = '';
          newDims.overallFlangeBreadth = '';
          newDims.overallFlangeDepth = '';
          curItem.holeCount = null;
          curItem.flangeHoleConfig = '';
          // BOX: inner equals item dimensions
          const l = Number(newDims.itemLength || newDims.bodyHeight);
          const w = Number(newDims.itemBreadth || newDims.bodyWidth);
          if (l) {
            newDims.innerLength = l;
            newDims.bodyHeight = l;
          }
          if (w) {
            newDims.innerWidth = w;
            newDims.bodyWidth = w;
          }
        } else if (ct === 'FLANGE') {
          if (!newFlangeDesign) {
            newFlangeDesign = defaultFlangeId;
          }
          const l = Number(newDims.itemLength || newDims.bodyHeight);
          const w = Number(newDims.itemBreadth || newDims.bodyWidth);
          if (l) {
            newDims.innerLength = l > 60 ? l - 60 : l;
            newDims.bodyHeight = newDims.innerLength;
            newDims.overallFlangeLength = l;
            newDims.overallFlangeHeight = l;
          }
          if (w) {
            newDims.innerWidth = w > 60 ? w - 60 : w;
            newDims.bodyWidth = newDims.innerWidth;
            newDims.overallFlangeBreadth = w;
            newDims.overallFlangeWidth = w;
          }
          newDims.overallFlangeDepth = newDims.itemDepth || newDims.depth;
        }

        const effL = Number(newDims.innerLength);
        const effW = Number(newDims.innerWidth);
        const fpm = Number(newDims.faceVelocity || 500);
        newDims.cfm = calculateFilterCfm(effL, effW, fpm);
      }

      updated[index] = {
        ...curItem,
        [field]: value,
        flangeDesign: newFlangeDesign,
        dimensions: newDims,
      };
      return { ...prev, items: updated };
    });
  };

  const handleItemDimensionChange = (index, dimField, value) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      const curItem = updated[index];
      const isFlange = (curItem.constructionType || 'FLANGE').toUpperCase() === 'FLANGE';
      const nextDims = {
        ...curItem.dimensions,
        [dimField]: value,
      };

      // Sales team editing overall flange dimensions (Enquiry-editable)
      if (dimField === 'overallFlangeLength' || dimField === 'overallFlangeHeight') {
        nextDims.overallFlangeLength = value;
        nextDims.overallFlangeHeight = value;
      } else if (dimField === 'overallFlangeBreadth' || dimField === 'overallFlangeWidth') {
        nextDims.overallFlangeBreadth = value;
        nextDims.overallFlangeWidth = value;
      } else if (dimField === 'itemLength' || dimField === 'bodyHeight') {
        nextDims.itemLength = value;
        const numL = Number(value);
        if (!isNaN(numL) && numL > 0) {
          nextDims.innerLength = isFlange ? (numL > 60 ? numL - 60 : numL) : numL;
          nextDims.bodyHeight = nextDims.innerLength;
          if (isFlange && !nextDims.overallFlangeLength) {
            nextDims.overallFlangeLength = numL;
            nextDims.overallFlangeHeight = numL;
          }
        }
      } else if (dimField === 'itemBreadth' || dimField === 'bodyWidth') {
        nextDims.itemBreadth = value;
        const numW = Number(value);
        if (!isNaN(numW) && numW > 0) {
          nextDims.innerWidth = isFlange ? (numW > 60 ? numW - 60 : numW) : numW;
          nextDims.bodyWidth = nextDims.innerWidth;
          if (isFlange && !nextDims.overallFlangeBreadth) {
            nextDims.overallFlangeBreadth = numW;
            nextDims.overallFlangeWidth = numW;
          }
        }
      } else if (dimField === 'depth' || dimField === 'itemDepth') {
        nextDims.itemDepth = value;
        nextDims.innerDepth = value;
        nextDims.depth = value;
        if (isFlange) {
          nextDims.overallFlangeDepth = value;
        }
      }

      // Airflow calculated strictly from effective inner dimensions
      const effInnerL = Number(nextDims.innerLength || nextDims.bodyHeight || nextDims.itemLength);
      const effInnerW = Number(nextDims.innerWidth || nextDims.bodyWidth || nextDims.itemBreadth);
      const fpm = Number(dimField === 'faceVelocity' ? value : (nextDims.faceVelocity || 500));
      nextDims.cfm = calculateFilterCfm(effInnerL, effInnerW, fpm);

      updated[index] = {
        ...curItem,
        dimensions: nextDims,
      };
      return { ...prev, items: updated };
    });
  };

  const handleCatalogDetailChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      const curItem = updated[index];
      const currentCat = curItem.catalogDetails || getCatalogDetailsForEnquiryItem(curItem);
      const nextCat = { ...currentCat, [field]: value };

      if (field === 'itemName') {
        curItem.newItemName = value;
      }
      if (field === 'filterGrade') {
        nextCat.filterGradeVariant = '';
        nextCat.drawing = '';
      }
      if (field === 'productType' && value !== 'FILTER') {
        nextCat.filterGrade = '';
        nextCat.filterGradeVariant = '';
        nextCat.drawing = '';
      }

      updated[index] = { ...curItem, catalogDetails: nextCat };
      return { ...prev, items: updated };
    });
  };

  const handleSelectItemForIndex = (index, selectedItemObj) => {
    const itemCatId = typeof selectedItemObj.itemCategory === 'object' ? selectedItemObj.itemCategory?._id : selectedItemObj.itemCategory;
    const itemUomId = typeof selectedItemObj.salesUom === 'object' ? selectedItemObj.salesUom?._id : (selectedItemObj.salesUom || selectedItemObj.inventoryUom);

    setFormData((prev) => {
      const updated = [...prev.items];
      const curItem = updated[index];

      // 1. Resolve Construction Type from selected Item Master
      const itemConst = (selectedItemObj.constructionType || selectedItemObj.filterType || '').toUpperCase().trim();
      const nextConstruction = (itemConst === 'BOX' || itemConst === 'FLANGE') ? itemConst : 'FLANGE';
      const isFlange = nextConstruction === 'FLANGE';

      // 2. Fetch Original Filter Dimensions from Item Master
      const origL = (selectedItemObj.outerLength !== null && selectedItemObj.outerLength !== undefined && selectedItemObj.outerLength !== '')
        ? Number(selectedItemObj.outerLength)
        : (selectedItemObj.overallLength !== null && selectedItemObj.overallLength !== undefined && selectedItemObj.overallLength !== '')
          ? Number(selectedItemObj.overallLength)
          : (selectedItemObj.filterLength !== null && selectedItemObj.filterLength !== undefined && selectedItemObj.filterLength !== '')
            ? Number(selectedItemObj.filterLength)
            : null;

      const origW = (selectedItemObj.outerWidth !== null && selectedItemObj.outerWidth !== undefined && selectedItemObj.outerWidth !== '')
        ? Number(selectedItemObj.outerWidth)
        : (selectedItemObj.overallWidth !== null && selectedItemObj.overallWidth !== undefined && selectedItemObj.overallWidth !== '')
          ? Number(selectedItemObj.overallWidth)
          : (selectedItemObj.filterWidth !== null && selectedItemObj.filterWidth !== undefined && selectedItemObj.filterWidth !== '')
            ? Number(selectedItemObj.filterWidth)
            : null;

      const origD = (selectedItemObj.outerDepth !== null && selectedItemObj.outerDepth !== undefined && selectedItemObj.outerDepth !== '')
        ? Number(selectedItemObj.outerDepth)
        : (selectedItemObj.overallDepth !== null && selectedItemObj.overallDepth !== undefined && selectedItemObj.overallDepth !== '')
          ? Number(selectedItemObj.overallDepth)
          : (selectedItemObj.filterDepth !== null && selectedItemObj.filterDepth !== undefined && selectedItemObj.filterDepth !== '')
            ? Number(selectedItemObj.filterDepth)
            : null;

      const itemFpm = Number(selectedItemObj.faceVelocity) || 500;

      // 3. Calculate Inner Dimensions
      // FLANGE: Inner = Item Master - 60mm; BOX: Inner = Item Master
      let innerL = null;
      let innerW = null;
      let innerD = origD;

      if (isFlange) {
        innerL = (origL !== null && origL > 60) ? origL - 60 : origL;
        innerW = (origW !== null && origW > 60) ? origW - 60 : origW;
      } else {
        innerL = origL;
        innerW = origW;
      }

      // 4. Calculate Airflow (CFM) from effective inner dimensions
      const calculatedCfm = calculateFilterCfm(innerL, innerW, itemFpm);

      // 5. Initial Overall Flange Dimensions (Editable by Sales Team)
      let ofl = '';
      let ofb = '';
      let ofd = '';
      if (isFlange) {
        ofl = origL !== null ? origL : '';
        ofb = origW !== null ? origW : '';
        ofd = origD !== null ? origD : '';
      }

      // 6. Fetch Technical Specifications from Item Master
      const itemSpecs = resolveItemTechnicalSpecs(selectedItemObj);
      const itemMoc = itemSpecs.moc;
      const itemTempRange = itemSpecs.temperatureRange;
      const itemBonding = itemSpecs.bonding;
      const itemGasketMoc = itemSpecs.gasketMoc;

      // 7. Flange Design & Hole Config
      let nextFlangeDesign = '';
      if (isFlange) {
        const itemFlangeId = selectedItemObj.flangeType?._id || selectedItemObj.flangeType;
        nextFlangeDesign = itemFlangeId ? String(itemFlangeId) : defaultFlangeId;
      } else {
        curItem.holeCount = null;
        curItem.flangeHoleConfig = '';
      }

      // 8. Replace dimensions completely so no previous technical overrides are retained
      const nextDims = {
        itemLength: origL !== null ? origL : '',
        itemBreadth: origW !== null ? origW : '',
        itemDepth: origD !== null ? origD : '',
        innerLength: innerL !== null ? innerL : '',
        innerWidth: innerW !== null ? innerW : '',
        innerDepth: innerD !== null ? innerD : '',
        bodyWidth: innerW !== null ? innerW : '',
        bodyHeight: innerL !== null ? innerL : '',
        depth: origD !== null ? origD : '',
        overallFlangeWidth: ofb,
        overallFlangeHeight: ofl,
        overallFlangeLength: ofl,
        overallFlangeBreadth: ofb,
        overallFlangeDepth: ofd,
        faceVelocity: itemFpm,
        cfm: calculatedCfm,
        unit: 'mm',
        moc: itemMoc,
        temperature: itemTempRange,
        temperatureRange: itemTempRange,
        bonding: itemBonding,
        gasketMoc: itemGasketMoc,
      };

      updated[index] = {
        ...curItem,
        item: selectedItemObj._id,
        itemCategory: itemCatId || curItem.itemCategory,
        uom: itemUomId || curItem.uom,
        constructionType: nextConstruction,
        flangeDesign: nextFlangeDesign,
        dimensions: nextDims,
        itemSearch: `${selectedItemObj.itemCode ? selectedItemObj.itemCode + ' - ' : ''}${selectedItemObj.itemName}`,
        isItemDropdownOpen: false,
        saveToCatalog: false,
        newItemName: '',
      };
      return { ...prev, items: updated };
    });
  };

  const handleClearItemForIndex = (index) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = {
        ...updated[index],
        item: '',
        itemSearch: '',
        saveToCatalog: false,
        newItemName: '',
      };
      return { ...prev, items: updated };
    });
  };

  const handleCatalogItemCreated = (newlyCreatedItem) => {
    if (catalogCreationIndex !== null && newlyCreatedItem) {
      handleSelectItemForIndex(catalogCreationIndex, newlyCreatedItem);
    }
    if (typeof refetchItems === 'function') {
      refetchItems();
    }
    setIsItemCatalogModalOpen(false);
    setCatalogCreationIndex(null);
    setCatalogCreationName('');
  };

  const addItemSpecificationRow = (index) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = {
        ...updated[index],
        specifications: [...updated[index].specifications, { key: '', value: '' }],
      };
      return { ...prev, items: updated };
    });
  };

  const updateItemSpecificationRow = (itemIndex, specIndex, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      const updatedSpecs = [...updated[itemIndex].specifications];
      updatedSpecs[specIndex] = { ...updatedSpecs[specIndex], [field]: value };
      updated[itemIndex] = { ...updated[itemIndex], specifications: updatedSpecs };
      return { ...prev, items: updated };
    });
  };

  const removeItemSpecificationRow = (itemIndex, specIndex) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[itemIndex] = {
        ...updated[itemIndex],
        specifications: updated[itemIndex].specifications.filter((_, i) => i !== specIndex),
      };
      return { ...prev, items: updated };
    });
  };

  const validate = () => {
    if (!formData.client) {
      return 'Please select a Party / Customer.';
    }
    if (!formData.requirementDate) {
      return 'Requirement Date is required.';
    }

    if (formData.type === 'product') {
      if (!formData.items || formData.items.length === 0) {
        return 'At least one item is required for product enquiries.';
      }

      for (let i = 0; i < formData.items.length; i++) {
        const itemObj = formData.items[i];
        const numLabel = `Item #${i + 1}`;

        if (!itemObj.uom) {
          return `${numLabel}: UOM is required.`;
        }
        if (!itemObj.quantity || Number(itemObj.quantity) <= 0) {
          return `${numLabel}: Quantity must be a valid number greater than 0.`;
        }
        if (!Number.isInteger(Number(itemObj.quantity))) {
          return `${numLabel}: Quantity cannot be a fractional/decimal number.`;
        }

        if (itemObj.saveToCatalog && !itemObj.item) {
          if (!canCreateItem) {
            return `${numLabel}: You do not have permission to save products to the Item Catalog. Please uncheck 'Save to Item Catalog'.`;
          }
          const catDetails = getCatalogDetailsForEnquiryItem(itemObj, itemObj.catalogDetails);
          const enteredName = (catDetails.itemName || itemObj.newItemName || itemObj.itemSearch || '').trim();
          if (!enteredName) {
            return `${numLabel}: Catalog Item Name is required when 'Save to Item Catalog' is checked.`;
          }
          const targetCatId = catDetails.itemCategory || itemObj.itemCategory;
          if (!targetCatId) {
            return `${numLabel}: Item Category is required when 'Save to Item Catalog' is checked.`;
          }
          const targetUomId = catDetails.inventoryUom || itemObj.uom;
          if (!targetUomId) {
            return `${numLabel}: UOM is required when 'Save to Item Catalog' is checked.`;
          }

          if (catDetails.productType === 'FILTER') {
            if (catDetails.filterGrade && !catDetails.filterGradeVariant) {
              return `${numLabel}: Filter Grade Variant is required when a Filter Grade is selected for the catalog item.`;
            }
            if (catDetails.filterLength !== '' && (Number(catDetails.filterLength) <= 0 || isNaN(Number(catDetails.filterLength)))) {
              return `${numLabel}: Catalog Filter Length must be a positive number in mm.`;
            }
            if (catDetails.filterWidth !== '' && (Number(catDetails.filterWidth) <= 0 || isNaN(Number(catDetails.filterWidth)))) {
              return `${numLabel}: Catalog Filter Width must be a positive number in mm.`;
            }
            if (catDetails.filterDepth !== '' && (Number(catDetails.filterDepth) <= 0 || isNaN(Number(catDetails.filterDepth)))) {
              return `${numLabel}: Catalog Filter Depth must be a positive number in mm.`;
            }
            if (catDetails.faceVelocity !== '' && (Number(catDetails.faceVelocity) <= 0 || isNaN(Number(catDetails.faceVelocity)))) {
              return `${numLabel}: Catalog Face Velocity must be a positive number in FPM.`;
            }
            if (catDetails.moc === 'OTHER' && !catDetails.customMoc?.trim()) {
              return `${numLabel}: Please specify the custom Material of Construction (MOC) for the catalog item.`;
            }
            if (catDetails.temperatureRating !== '' && isNaN(Number(catDetails.temperatureRating))) {
              return `${numLabel}: Catalog Temperature Rating must be a valid number in °C.`;
            }
          }
        }

        const cType = (itemObj.constructionType || 'FLANGE').toUpperCase();
        const bw = Number(itemObj.dimensions.bodyWidth || itemObj.dimensions.innerWidth || itemObj.dimensions.itemBreadth);
        const bh = Number(itemObj.dimensions.bodyHeight || itemObj.dimensions.innerLength || itemObj.dimensions.itemLength);
        const d = Number(itemObj.dimensions.depth || itemObj.dimensions.itemDepth);

        if (!bw || bw <= 0) return `${numLabel}: Width / Breadth must be a positive number.`;
        if (!bh || bh <= 0) return `${numLabel}: Length must be a positive number.`;
        if (!d || d <= 0) return `${numLabel}: Depth must be a positive number.`;

        if (cType === 'FLANGE') {
          if (!itemObj.flangeDesign && defaultFlangeId) {
            itemObj.flangeDesign = defaultFlangeId;
          }
          const fw = Number(itemObj.dimensions.overallFlangeWidth || itemObj.dimensions.overallFlangeBreadth) || (bw > 0 ? bw + 60 : 0);
          const fh = Number(itemObj.dimensions.overallFlangeHeight || itemObj.dimensions.overallFlangeLength) || (bh > 0 ? bh + 60 : 0);

          if (!fw || fw <= 0) return `${numLabel}: Flange Width must be a positive number.`;
          if (!fh || fh <= 0) return `${numLabel}: Flange Height must be a positive number.`;
        }
      }
    } else {
      if (!formData.serviceDescription.trim()) {
        return 'Service Description is required for service enquiries.';
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valErr = validate();
    if (valErr) {
      setErrorMessage(valErr);
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const formattedItems = formData.type === 'product' ? formData.items.map((itemObj) => {
      const isFlange = itemObj.constructionType === 'FLANGE';
      const origL = Number(itemObj.dimensions.itemLength) || Number(itemObj.dimensions.bodyHeight) || 0;
      const origW = Number(itemObj.dimensions.itemBreadth) || Number(itemObj.dimensions.bodyWidth) || 0;
      const origD = Number(itemObj.dimensions.itemDepth || itemObj.dimensions.depth) || 0;

      let innerL = 0;
      let innerW = 0;
      let innerD = origD;

      if (isFlange) {
        innerL = origL > 60 ? origL - 60 : (Number(itemObj.dimensions.innerLength) || origL);
        innerW = origW > 60 ? origW - 60 : (Number(itemObj.dimensions.innerWidth) || origW);
      } else {
        innerL = origL || Number(itemObj.dimensions.innerLength) || 0;
        innerW = origW || Number(itemObj.dimensions.innerWidth) || 0;
      }

      const ofw = isFlange ? (Number(itemObj.dimensions.overallFlangeWidth || itemObj.dimensions.overallFlangeBreadth) || origW) : undefined;
      const ofh = isFlange ? (Number(itemObj.dimensions.overallFlangeHeight || itemObj.dimensions.overallFlangeLength) || origL) : undefined;
      const ofd = isFlange ? origD : undefined;

      const fpm = Number(itemObj.dimensions.faceVelocity || 500);

      // Recalculate CFM strictly from effective inner dimensions
      let computedCfm = itemObj.dimensions.cfm;
      if (innerL > 0 && innerW > 0 && fpm > 0) {
        const rawCfm = (innerL / 304.8) * (innerW / 304.8) * fpm;
        const rounded10 = Math.round(rawCfm / 10) * 10;
        computedCfm = (rounded10 === 0 && rawCfm > 0) ? Math.round(rawCfm) : rounded10;
      }

      const isSaveToCat = !itemObj.item && Boolean(itemObj.saveToCatalog);
      const rawCatDetails = isSaveToCat ? getCatalogDetailsForEnquiryItem(itemObj, itemObj.catalogDetails) : undefined;
      const targetItemName = isSaveToCat ? (rawCatDetails?.itemName || itemObj.newItemName || itemObj.itemSearch || '').trim() : '';

      const resolvedCatDetails = isSaveToCat ? {
        ...rawCatDetails,
        itemName: targetItemName,
        itemCategory: itemObj.itemCategory || rawCatDetails.itemCategory,
        inventoryUom: itemObj.uom || rawCatDetails.inventoryUom,
        purchaseUom: rawCatDetails.purchaseUom || itemObj.uom || rawCatDetails.inventoryUom,
        salesUom: rawCatDetails.salesUom || itemObj.uom || rawCatDetails.inventoryUom,
        moc: rawCatDetails.moc === 'OTHER' ? (rawCatDetails.customMoc || 'OTHER') : rawCatDetails.moc,
      } : undefined;

      return {
        itemCategory: itemObj.itemCategory || null,
        item: itemObj.item || null,
        saveToCatalog: isSaveToCat,
        newItemName: targetItemName,
        catalogDetails: resolvedCatDetails,
        quantity: itemObj.quantity ? Number(itemObj.quantity) : null,
        uom: itemObj.uom || null,
        constructionType: itemObj.constructionType || 'FLANGE',
        flangeDesign: isFlange ? itemObj.flangeDesign : null,
        holeCount: isFlange && itemObj.holeCount ? Number(itemObj.holeCount) : null,
        flangeHoleConfig: isFlange && itemObj.flangeHoleConfig ? itemObj.flangeHoleConfig : null,
        dimensions: {
          constructionType: itemObj.constructionType,
          itemLength: origL,
          itemBreadth: origW,
          itemDepth: origD,
          innerLength: innerL,
          innerWidth: innerW,
          innerDepth: innerD,
          bodyWidth: innerW,
          bodyHeight: innerL,
          depth: innerD,
          overallFlangeWidth: ofw,
          overallFlangeHeight: ofh,
          overallFlangeLength: ofh,
          overallFlangeBreadth: ofw,
          overallFlangeDepth: ofd,
          width: innerW,
          height: innerL,
          length: innerD,
          flangeWidth: ofw,
          flangeHeight: ofh,
          flangeDepth: ofd,
          faceVelocity: fpm,
          cfm: computedCfm !== undefined && computedCfm !== null ? Number(computedCfm) : undefined,
          unit: itemObj.dimensions.unit || 'mm',
          moc: itemObj.dimensions.moc || '',
          temperature: itemObj.dimensions.temperature || itemObj.dimensions.temperatureRange || '',
          temperatureRange: itemObj.dimensions.temperatureRange || itemObj.dimensions.temperature || '',
          bonding: itemObj.dimensions.bonding || '',
          gasketMoc: itemObj.dimensions.gasketMoc || '',
        },
        specifications: (itemObj.specifications || []).filter((s) => s.key?.trim() || s.value?.trim()),
        remarks: itemObj.remarks || '',
      };
    }) : [];

    const firstItem = formattedItems[0] || {};

    const payload = {
      client: formData.client,
      requirementDate: formData.requirementDate,
      type: formData.type,
      serviceDescription: formData.type === 'service' ? formData.serviceDescription : '',
      items: formattedItems,
      itemCategory: firstItem.itemCategory || null,
      item: firstItem.item || null,
      saveToCatalog: firstItem.saveToCatalog || false,
      newItemName: firstItem.newItemName || '',
      catalogDetails: firstItem.catalogDetails || undefined,
      quantity: firstItem.quantity || null,
      uom: firstItem.uom || null,
      constructionType: firstItem.constructionType || 'FLANGE',
      flangeDesign: firstItem.flangeDesign || null,
      holeCount: firstItem.holeCount || null,
      flangeHoleConfig: firstItem.flangeHoleConfig || null,
      dimensions: firstItem.dimensions || {},
      specifications: firstItem.specifications || [],
      remarks: formData.remarks,
      followUpDate: formData.followUpDate || null,
      status: formData.status,
      salesPerson: formData.salesPerson || null,
    };

    try {
      if (isEditMode) {
        const res = await updateRequirementMutation({ id: requirement._id, data: payload }).unwrap();
        setSuccessMessage('Requirement updated successfully!');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 800);
      } else {
        const res = await createRequirementMutation(payload).unwrap();
        setSuccessMessage(`Requirement created successfully (${res.requirement?.requirementNo || ''})`);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 800);
      }
    } catch (err) {
      console.error('Save requirement error:', err);
      setErrorMessage(err?.data?.message || err?.message || 'Failed to save Requirement record.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPartyObj = clients.find((c) => c._id === formData.client) || (typeof requirement?.client === 'object' && requirement?.client?._id === formData.client ? requirement.client : null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditMode
          ? `Edit Requirement / Enquiry (${requirement.requirementNo})`
          : 'New Customer Requirement / Enquiry'
      }
      maxWidth="860px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEditMode ? 'Update Requirement' : 'Create Requirement'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {errorMessage && <Alert type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />}
        {successMessage && <Alert type="success" message={successMessage} />}

        {/* SECTION 1: PARTY & GENERAL INFORMATION */}
        <div style={{ backgroundColor: 'var(--neutral-50)', padding: '14px', borderRadius: '6px', border: '1px solid var(--neutral-200)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} /> 1. Party & Enquiry Identification
          </div>

          <div className="form-grid">
            {/* Searchable Party Selector */}
            <div style={{ gridColumn: 'span 2' }}>
              <FormField label="Select Party / Customer" required helperText="Search and select existing customer party record">
                <div style={{ position: 'relative' }}>
                  <div className="relative flex-1 min-w-[220px]" style={{ width: '100%' }}>
                    <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <Input
                      className="pl-8"
                      placeholder="Type party code or company name to search..."
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setIsClientDropdownOpen(true);
                        if (!e.target.value) {
                          setFormData((prev) => ({ ...prev, client: '' }));
                        }
                      }}
                      onFocus={() => setIsClientDropdownOpen(true)}
                      disabled={submitting || loadingMasters}
                      style={{ paddingRight: formData.client ? '32px' : '10px' }}
                    />
                    {formData.client && (
                      <button
                        type="button"
                        onClick={clearParty}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--neutral-500)',
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {isClientDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        backgroundColor: '#fff',
                        border: '1px solid var(--neutral-300)',
                        borderRadius: '4px',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 200,
                        marginTop: '2px',
                      }}
                    >
                      {filteredClients.length > 0 ? (
                        filteredClients.map((party) => (
                          <div
                            key={party._id}
                            onClick={() => selectParty(party)}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--neutral-100)',
                              backgroundColor: formData.client === party._id ? 'var(--primary-50)' : '#fff',
                            }}
                            className="search-option-item"
                          >
                            <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                              {party.companyName}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--neutral-500)', display: 'flex', gap: '12px' }}>
                              <span>Code: <strong>{party.clientCode}</strong></span>
                              {party.contactPerson && <span>Contact: {party.contactPerson}</span>}
                              {party.city && <span>City: {party.city}</span>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '10px', fontSize: '12px', color: 'var(--neutral-500)', textAlign: 'center' }}>
                          No active Party records match "{clientSearch}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedPartyObj && (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--primary-800)', backgroundColor: 'var(--primary-50)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--primary-200)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Party Selected: <strong>{selectedPartyObj.companyName}</strong> ({selectedPartyObj.clientCode})</span>
                    {selectedPartyObj.mobile && <span>Ph: {selectedPartyObj.mobile}</span>}
                  </div>
                )}
              </FormField>
            </div>

            <FormField label="Requirement Date" required>
              <Input
                type="date"
                name="requirementDate"
                value={formData.requirementDate}
                onChange={handleFormChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Enquiry Type" required>
              <Select
                name="type"
                value={formData.type}
                onChange={handleFormChange}
                disabled={submitting}
              >
                <option value="product">Product Enquiry (Air Filter / Assembly)</option>
                <option value="service">Service Enquiry (Maintenance / Custom)</option>
              </Select>
            </FormField>

            <FormField label="Sales Person (Assigned Employee)">
              <Select
                name="salesPerson"
                value={formData.salesPerson}
                onChange={handleFormChange}
                disabled={submitting || loadingMasters}
              >
                <option value="">-- Unassigned --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName} ({emp.employeeCode})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Follow-up Date" helperText="Optional target date for client follow-up">
              <Input
                type="date"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleFormChange}
                disabled={submitting}
              />
            </FormField>
          </div>
        </div>

        {/* SECTION 2: REQUIREMENT ITEMS & ENGINEERING SPECIFICATIONS */}
        <div style={{ backgroundColor: 'var(--neutral-50)', padding: '14px', borderRadius: '6px', border: '1px solid var(--neutral-200)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={14} /> 2. Requirement Items ({formData.items.length})
            </div>
            {formData.type === 'product' && (
              <Button type="button" variant="primary" size="sm" icon={Plus} onClick={handleAddItem}>
                Add More Item
              </Button>
            )}
          </div>

          {formData.type === 'product' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* ITEM ACCORDION CARDS WITH FULL VISUAL FLANGE SELECTOR */}
              {formData.items.map((itemObj, itemIndex) => {
                const selectedCatalogItem = items.find((i) => i._id === itemObj.item) || null;
                const selectedFlangeDesignObj = flangeDesigns.find((f) => f._id === itemObj.flangeDesign) || null;

                const filteredItems = items.filter((i) => {
                  if (itemObj.itemCategory) {
                    const catId = typeof i.itemCategory === 'object' ? i.itemCategory?._id : i.itemCategory;
                    if (catId && catId !== itemObj.itemCategory) return false;
                  }
                  if (!itemObj.itemSearch.trim()) return true;
                  const term = itemObj.itemSearch.toLowerCase();
                  const code = (i.itemCode || '').toLowerCase();
                  const name = (i.itemName || '').toLowerCase();
                  return code.includes(term) || name.includes(term);
                });

                let summaryTitle = selectedCatalogItem
                  ? selectedCatalogItem.itemName
                  : itemObj.dimensions.bodyWidth && itemObj.dimensions.bodyHeight
                    ? `${itemObj.constructionType} Filter (${itemObj.dimensions.bodyWidth}×${itemObj.dimensions.bodyHeight}×${itemObj.dimensions.depth || '0'}mm)`
                    : `Item #${itemIndex + 1}`;

                return (
                  <div
                    key={itemObj.id || itemIndex}
                    style={{
                      border: '1px solid var(--neutral-300)',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      overflow: 'hidden',
                    }}
                  >
                    {/* ACCORDION HEADER BAR WITH REDESIGNED ITEM BADGE */}
                    <div
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#f8fafc',
                        borderBottom: itemObj.isExpanded ? '1px solid var(--neutral-200)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, cursor: 'pointer' }} onClick={() => toggleItemExpand(itemIndex)}>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>
                          Item #{itemIndex + 1}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--neutral-900)' }}>
                          {summaryTitle}
                        </span>
                        {itemObj.quantity && (
                          <span style={{ fontSize: '11.5px', color: 'var(--neutral-600)' }}>
                            (Qty: {itemObj.quantity})
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {formData.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleRemoveItem(itemIndex)}
                            style={{ color: '#dc2626' }}
                            title="Remove Item"
                          />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          icon={itemObj.isExpanded ? ChevronUp : ChevronDown}
                          onClick={() => toggleItemExpand(itemIndex)}
                          style={{ color: 'var(--neutral-600)' }}
                        >
                          {itemObj.isExpanded ? 'Hide' : 'Edit'}
                        </Button>
                      </div>
                    </div>

                    {/* EXPANDABLE BODY WITH FULL VISUAL FLANGE SELECTOR & DIMENSIONS */}
                    {itemObj.isExpanded && (
                      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="form-grid">
                          {/* Item Category Filter */}
                          <FormField label="Filter by Item Category">
                            <Select
                              value={itemObj.itemCategory}
                              onChange={(e) => {
                                handleItemFieldChange(itemIndex, 'itemCategory', e.target.value);
                                if (selectedCatalogItem) {
                                  const catId = typeof selectedCatalogItem.itemCategory === 'object' ? selectedCatalogItem.itemCategory?._id : selectedCatalogItem.itemCategory;
                                  if (catId && catId !== e.target.value) {
                                    handleClearItemForIndex(itemIndex);
                                  }
                                }
                              }}
                              disabled={submitting || loadingMasters}
                            >
                              <option value="">-- All Categories --</option>
                              {itemCategories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                  {cat.categoryName} ({cat.categoryCode})
                                </option>
                              ))}
                            </Select>
                          </FormField>

                          {/* Searchable Item Selector */}
                          <div style={{ gridColumn: 'span 2' }}>
                            <FormField
                              label={
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  <span>Required Item / Air Filter</span>
                                  {canCreateItem && !itemObj.item && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCatalogCreationIndex(itemIndex);
                                        setCatalogCreationName(itemObj.itemSearch || '');
                                        setIsItemCatalogModalOpen(true);
                                      }}
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#2563eb',
                                        backgroundColor: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        borderRadius: '4px',
                                        padding: '2px 8px',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                      }}
                                      title="Open Add New Item dialog pre-filled with current search term"
                                    >
                                      <Plus size={11} />
                                      <span>+ Add New Item to Catalog</span>
                                    </button>
                                  )}
                                </div>
                              }
                              helperText="Select standard catalog item from Item Master (Optional if custom filter requirement)"
                            >
                              <div style={{ position: 'relative' }}>
                                <div className="relative flex-1 min-w-[220px]" style={{ width: '100%' }}>
                                  <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                  <Input
                                    className="pl-8"
                                    placeholder="Search catalog item by code or name..."
                                    value={itemObj.itemSearch}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setFormData((prev) => {
                                        const updated = [...prev.items];
                                        updated[itemIndex] = {
                                          ...updated[itemIndex],
                                          itemSearch: val,
                                          isItemDropdownOpen: true,
                                          item: val ? updated[itemIndex].item : '',
                                        };
                                        return { ...prev, items: updated };
                                      });
                                    }}
                                    onFocus={() => {
                                      setFormData((prev) => {
                                        const updated = [...prev.items];
                                        updated[itemIndex] = { ...updated[itemIndex], isItemDropdownOpen: true };
                                        return { ...prev, items: updated };
                                      });
                                    }}
                                    disabled={submitting || loadingMasters}
                                    style={{ paddingRight: itemObj.item ? '32px' : '10px' }}
                                  />
                                  {itemObj.item && (
                                    <button
                                      type="button"
                                      onClick={() => handleClearItemForIndex(itemIndex)}
                                      style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--neutral-500)',
                                      }}
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>

                                {itemObj.isItemDropdownOpen && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: '100%',
                                      left: 0,
                                      right: 0,
                                      maxHeight: '200px',
                                      overflowY: 'auto',
                                      backgroundColor: '#fff',
                                      border: '1px solid var(--neutral-300)',
                                      borderRadius: '4px',
                                      boxShadow: 'var(--shadow-md)',
                                      zIndex: 200,
                                      marginTop: '2px',
                                    }}
                                  >
                                    {filteredItems.length > 0 ? (
                                      filteredItems.map((itm) => (
                                        <div
                                          key={itm._id}
                                          onClick={() => handleSelectItemForIndex(itemIndex, itm)}
                                          style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid var(--neutral-100)',
                                            backgroundColor: itemObj.item === itm._id ? 'var(--primary-50)' : '#fff',
                                          }}
                                          className="search-option-item"
                                        >
                                          <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                                            {itm.itemName}
                                          </div>
                                          <div style={{ fontSize: '11.5px', color: 'var(--neutral-500)' }}>
                                            Code: <strong>{itm.itemCode}</strong>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>
                                          No active items found matching <strong style={{ color: 'var(--neutral-700)' }}>"{itemObj.itemSearch}"</strong>
                                        </span>
                                        {canCreateItem && (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setCatalogCreationIndex(itemIndex);
                                                setCatalogCreationName(itemObj.itemSearch || '');
                                                setIsItemCatalogModalOpen(true);
                                                setFormData((prev) => {
                                                  const updated = [...prev.items];
                                                  updated[itemIndex] = { ...updated[itemIndex], isItemDropdownOpen: false };
                                                  return { ...prev, items: updated };
                                                });
                                              }}
                                              style={{
                                                flexShrink: 0,
                                                fontSize: '11.5px',
                                                fontWeight: 700,
                                                color: '#1e40af',
                                                backgroundColor: '#eff6ff',
                                                border: '1px solid #bfdbfe',
                                                borderRadius: '5px',
                                                padding: '4px 10px',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                              }}
                                            >
                                              <Plus size={12} />
                                              Create New Item
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {selectedCatalogItem && (
                                <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--primary-800)', backgroundColor: 'var(--primary-50)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--primary-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    Catalog Item Selected: <strong>{selectedCatalogItem.itemName}</strong> ({selectedCatalogItem.itemCode})
                                    {selectedCatalogItem.filterGrade && (
                                      <div style={{ fontSize: '11px', color: 'var(--neutral-600)', marginTop: '2px' }}>
                                        Filter Grade: <strong>{typeof selectedCatalogItem.filterGrade === 'object' ? selectedCatalogItem.filterGrade.filterGrade : selectedCatalogItem.filterGrade}</strong>
                                        {typeof selectedCatalogItem.filterGrade === 'object' && selectedCatalogItem.filterGrade.eurovent ? ` (${selectedCatalogItem.filterGrade.eurovent})` : ''}
                                      </div>
                                    )}
                                  </div>
                                  <button type="button" onClick={() => handleClearItemForIndex(itemIndex)} className="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1 bg-white border border-red-200 rounded shadow-xs">
                                    Change Item
                                  </button>
                                </div>
                              )}

                              {!selectedCatalogItem && (
                                <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: itemObj.saveToCatalog ? '1.5px solid #3b82f6' : '1px solid #cbd5e1', transition: 'all 0.2s ease-in-out' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: canCreateItem ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 600, color: itemObj.saveToCatalog ? '#1d4ed8' : 'var(--neutral-800)' }}>
                                    <input
                                      type="checkbox"
                                      checked={itemObj.saveToCatalog || false}
                                      onChange={(e) => {
                                        const isChecked = e.target.checked;
                                        handleItemFieldChange(itemIndex, 'saveToCatalog', isChecked);
                                        if (isChecked) {
                                          const initialCat = getCatalogDetailsForEnquiryItem(itemObj, itemObj.catalogDetails);
                                          handleCatalogDetailChange(itemIndex, 'itemName', initialCat.itemName || itemObj.itemSearch || '');
                                        }
                                      }}
                                      disabled={submitting || !canCreateItem}
                                      style={{ width: '16px', height: '16px', cursor: canCreateItem ? 'pointer' : 'not-allowed' }}
                                    />
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <Sparkles size={15} style={{ color: itemObj.saveToCatalog ? '#2563eb' : '#64748b' }} />
                                      <span>Save to Item Master Catalog (Reusable Product)</span>
                                    </span>
                                  </label>

                                  {!canCreateItem && (
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', marginLeft: '24px' }}>
                                      Requires ITEM_CREATE permission to add new products to the catalog.
                                    </div>
                                  )}

                                  {itemObj.saveToCatalog && (() => {
                                    const catDetails = getCatalogDetailsForEnquiryItem(itemObj, itemObj.catalogDetails);
                                    const isFilterProduct = (catDetails.productType || 'FILTER') === 'FILTER';
                                    const selectedFgDoc = filterGrades.find((fg) => String(fg._id) === String(catDetails.filterGrade));
                                    const currentConst = (catDetails.constructionType || itemObj.constructionType || 'FLANGE').toUpperCase();
                                    const applicableVariants = (selectedFgDoc?.variants || []).filter((v) => {
                                      const c = getVariantConstruction(v);
                                      return !c || c === currentConst;
                                    });

                                    const cL = Number(catDetails.filterLength !== undefined && catDetails.filterLength !== '' ? catDetails.filterLength : itemObj.dimensions.bodyHeight);
                                    const cW = Number(catDetails.filterWidth !== undefined && catDetails.filterWidth !== '' ? catDetails.filterWidth : itemObj.dimensions.bodyWidth);
                                    const cFpm = Number(catDetails.faceVelocity !== undefined && catDetails.faceVelocity !== '' ? catDetails.faceVelocity : (itemObj.dimensions.faceVelocity || 500));
                                    let catalogCalculatedCfm = null;
                                    if (cL > 0 && cW > 0 && cFpm > 0) {
                                      const raw = (cL / 304.8) * (cW / 304.8) * cFpm;
                                      const r10 = Math.round(raw / 10) * 10;
                                      catalogCalculatedCfm = r10 === 0 && raw > 0 ? Math.round(raw) : r10;
                                    }

                                    const nameToCheck = (catDetails.itemName || itemObj.newItemName || itemObj.itemSearch || '').trim().toLowerCase();
                                    const duplicate = nameToCheck ? items.find((i) => {
                                      const matchesName = (i.itemName || '').toLowerCase() === nameToCheck;
                                      if (!matchesName) return false;
                                      const targetCat = catDetails.itemCategory || itemObj.itemCategory;
                                      if (targetCat) {
                                        const catId = typeof i.itemCategory === 'object' ? i.itemCategory?._id : i.itemCategory;
                                        return String(catId) === String(targetCat);
                                      }
                                      return true;
                                    }) : null;

                                    return (
                                      <div style={{ marginTop: '12px', padding: '14px', backgroundColor: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        {/* Banner */}
                                        <div style={{ padding: '8px 12px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #dbeafe', fontSize: '12px', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Info size={15} style={{ flexShrink: 0, color: '#2563eb' }} />
                                            <span><strong>Item Master Registration:</strong> Enter standard catalog specifications for reusable master records. Customer requirement dimensions ({itemObj.dimensions.bodyWidth || 0} × {itemObj.dimensions.bodyHeight || 0} × {itemObj.dimensions.depth || 0} mm) will be preserved separately on this enquiry.</span>
                                          </div>
                                        </div>

                                        {/* Duplicate Warning */}
                                        {duplicate && (
                                          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                                            <div style={{ fontSize: '12px', color: '#92400e' }}>
                                              ⚠️ An active catalog item with this name already exists in this category: <strong>{duplicate.itemName}</strong> ({duplicate.itemCode})
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => handleSelectItemForIndex(itemIndex, duplicate)}
                                              style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                            >
                                              Select Existing Item
                                            </button>
                                          </div>
                                        )}

                                        {/* Row 1: Item Name, Code, Product Type */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                          <FormField label="Catalog Item Name" required helperText="Reusable standard product name in Item Master">
                                            <Input
                                              placeholder="e.g. Synthetic Pocket Filter 592x592x500"
                                              value={catDetails.itemName}
                                              onChange={(e) => handleCatalogDetailChange(itemIndex, 'itemName', e.target.value)}
                                              disabled={submitting}
                                            />
                                          </FormField>

                                          <FormField label="Item Code" helperText="'AUTO' for sequential numbering (e.g. ITEM-000123)">
                                            <Input
                                              placeholder="AUTO"
                                              value={catDetails.itemCode}
                                              onChange={(e) => handleCatalogDetailChange(itemIndex, 'itemCode', e.target.value.toUpperCase())}
                                              disabled={submitting}
                                            />
                                          </FormField>

                                          <FormField label="Product Type" required>
                                            <Select
                                              value={catDetails.productType || 'FILTER'}
                                              onChange={(e) => handleCatalogDetailChange(itemIndex, 'productType', e.target.value)}
                                              disabled={submitting}
                                            >
                                              <option value="FILTER">FILTER (Air Filter Product)</option>
                                              <option value="RAW_ITEM">RAW_ITEM (Raw Material / Component)</option>
                                              <option value="COIL">COIL (Cooling / Heating Coil)</option>
                                              <option value="AHU">AHU (Air Handling Unit)</option>
                                            </Select>
                                          </FormField>
                                        </div>

                                        {/* Row 2: Category, Inventory UOM, HSN */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                          <FormField label="Item Category" required helperText="Item Master classification category">
                                            <Select
                                              value={catDetails.itemCategory || itemObj.itemCategory}
                                              onChange={(e) => {
                                                handleCatalogDetailChange(itemIndex, 'itemCategory', e.target.value);
                                                if (!itemObj.itemCategory) handleItemFieldChange(itemIndex, 'itemCategory', e.target.value);
                                              }}
                                              disabled={submitting || loadingMasters}
                                            >
                                              <option value="">-- Select Category --</option>
                                              {itemCategories.map((c) => (
                                                <option key={c._id} value={c._id}>
                                                  {c.categoryName} ({c.categoryCode})
                                                </option>
                                              ))}
                                            </Select>
                                          </FormField>

                                          <FormField label="Inventory UOM" required helperText="Base stock measurement unit">
                                            <Select
                                              value={catDetails.inventoryUom || itemObj.uom}
                                              onChange={(e) => {
                                                handleCatalogDetailChange(itemIndex, 'inventoryUom', e.target.value);
                                                if (!itemObj.uom) handleItemFieldChange(itemIndex, 'uom', e.target.value);
                                              }}
                                              disabled={submitting || loadingMasters}
                                            >
                                              <option value="">-- Select UOM --</option>
                                              {uoms.map((u) => (
                                                <option key={u._id} value={u._id}>
                                                  {u.uomName} ({u.uomCode})
                                                </option>
                                              ))}
                                            </Select>
                                          </FormField>

                                          <FormField label="HSN Code" helperText="Goods and Services Tax Tariff Code">
                                            <Input
                                              placeholder="e.g. 84213920"
                                              value={catDetails.hsnCode}
                                              onChange={(e) => handleCatalogDetailChange(itemIndex, 'hsnCode', e.target.value)}
                                              disabled={submitting}
                                            />
                                          </FormField>
                                        </div>

                                        {/* Filter Specifications Section */}
                                        {isFilterProduct && (
                                          <div style={{ marginTop: '4px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--neutral-800)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <Package size={15} className="text-blue-600" />
                                              <span>Filter Grade & Technical Specifications</span>
                                            </div>

                                            {/* Filter Grade & Variant */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                              <FormField label="Filter Grade" helperText="Standard Eurovent / EN779 / EN1822 classification">
                                                <Select
                                                  value={catDetails.filterGrade}
                                                  onChange={(e) => handleCatalogDetailChange(itemIndex, 'filterGrade', e.target.value)}
                                                  disabled={submitting || loadingMasters}
                                                >
                                                  <option value="">-- None / Select Filter Grade --</option>
                                                  {filterGrades.map((g) => (
                                                    <option key={g._id} value={g._id}>
                                                      {g.filterGrade} {g.eurovent ? `(${g.eurovent})` : ''}
                                                    </option>
                                                  ))}
                                                </Select>
                                              </FormField>

                                              <FormField label="Filter Grade Variant" helperText="Mounting, temperature & media variant" required={!!catDetails.filterGrade}>
                                                <Select
                                                  value={catDetails.filterGradeVariant}
                                                  onChange={(e) => handleCatalogDetailChange(itemIndex, 'filterGradeVariant', e.target.value)}
                                                  disabled={submitting || !catDetails.filterGrade}
                                                >
                                                  <option value="">-- Select Variant --</option>
                                                  {applicableVariants.map((v, vIdx) => {
                                                    const key = [v.filterClass, v.mountingType || v.filterType, v.temperature, v.media].join('||');
                                                    return (
                                                      <option key={`fg_var_${vIdx}`} value={key}>
                                                        {v.filterClass || 'Standard'} | {v.mountingType || v.filterType || 'Any'} | {v.temperature || 'Ambient'} | {v.media || 'Standard Media'}
                                                      </option>
                                                    );
                                                  })}
                                                </Select>
                                              </FormField>
                                            </div>

                                            {/* Drawing Selector Integration */}
                                            <div style={{ width: '100%' }}>
                                              <DrawingSelector
                                                selectedDrawingId={catDetails.drawing}
                                                filterGradeId={catDetails.filterGrade}
                                                onSelect={(drawingId) => {
                                                  handleCatalogDetailChange(itemIndex, 'drawing', drawingId);
                                                }}
                                                disabled={submitting}
                                              />
                                            </div>

                                            {/* Catalog Standard Dimensions Grid */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--neutral-700)' }}>
                                                Catalog Standard Dimensions (mm) & Face Velocity
                                              </div>
                                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                                                <FormField label="Box Length (mm)">
                                                  <Input
                                                    type="number"
                                                    min="1"
                                                    placeholder={itemObj.dimensions.bodyHeight || 'e.g. 592'}
                                                    value={catDetails.filterLength !== undefined && catDetails.filterLength !== '' ? catDetails.filterLength : (itemObj.dimensions.bodyHeight || '')}
                                                    onChange={(e) => handleCatalogDetailChange(itemIndex, 'filterLength', e.target.value)}
                                                    disabled={submitting}
                                                  />
                                                </FormField>
                                                <FormField label="Box Width (mm)">
                                                  <Input
                                                    type="number"
                                                    min="1"
                                                    placeholder={itemObj.dimensions.bodyWidth || 'e.g. 592'}
                                                    value={catDetails.filterWidth !== undefined && catDetails.filterWidth !== '' ? catDetails.filterWidth : (itemObj.dimensions.bodyWidth || '')}
                                                    onChange={(e) => handleCatalogDetailChange(itemIndex, 'filterWidth', e.target.value)}
                                                    disabled={submitting}
                                                  />
                                                </FormField>
                                                <FormField label="Box Depth (mm)">
                                                  <Input
                                                    type="number"
                                                    min="1"
                                                    placeholder={itemObj.dimensions.depth || 'e.g. 292'}
                                                    value={catDetails.filterDepth !== undefined && catDetails.filterDepth !== '' ? catDetails.filterDepth : (itemObj.dimensions.depth || '')}
                                                    onChange={(e) => handleCatalogDetailChange(itemIndex, 'filterDepth', e.target.value)}
                                                    disabled={submitting}
                                                  />
                                                </FormField>
                                                <FormField label="Velocity (FPM)">
                                                  <Input
                                                    type="number"
                                                    min="1"
                                                    placeholder="500"
                                                    value={catDetails.faceVelocity !== undefined && catDetails.faceVelocity !== '' ? catDetails.faceVelocity : (itemObj.dimensions.faceVelocity || 500)}
                                                    onChange={(e) => handleCatalogDetailChange(itemIndex, 'faceVelocity', e.target.value)}
                                                    disabled={submitting}
                                                  />
                                                </FormField>
                                              </div>

                                              {/* Standard Airflow (CFM) badge */}
                                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#1e40af', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '4px 8px', alignSelf: 'flex-start', marginTop: '2px' }}>
                                                <span>Standard Catalog Airflow:</span>
                                                <strong>{catalogCalculatedCfm !== null ? `${catalogCalculatedCfm} CFM` : '—'}</strong>
                                                <span style={{ fontSize: '10.5px', color: '#64748b' }}>(calculated from Box Length × Width @ {cFpm} FPM)</span>
                                              </div>
                                            </div>

                                            {/* MOC, Temperature, Bonding */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                                              <FormField label="Material of Construction (MOC)">
                                                <Select
                                                  value={catDetails.moc || ''}
                                                  onChange={(e) => handleCatalogDetailChange(itemIndex, 'moc', e.target.value)}
                                                  disabled={submitting}
                                                >
                                                  <option value="">-- Select MOC --</option>
                                                  {STANDARD_MOC_OPTIONS.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                      {opt}
                                                    </option>
                                                  ))}
                                                  <option value="OTHER">Other / Custom MOC</option>
                                                </Select>
                                              </FormField>

                                              {catDetails.moc === 'OTHER' && (
                                                <FormField label="Custom MOC Description" required>
                                                  <Input
                                                    placeholder="Specify custom material..."
                                                    value={catDetails.customMoc || ''}
                                                    onChange={(e) => handleCatalogDetailChange(itemIndex, 'customMoc', e.target.value)}
                                                    disabled={submitting}
                                                  />
                                                </FormField>
                                              )}

                                              <FormField label="Operating Temperature (°C)">
                                                <Input
                                                  type="number"
                                                  placeholder="e.g. 80"
                                                  value={catDetails.temperatureRating !== undefined && catDetails.temperatureRating !== '' ? catDetails.temperatureRating : (itemObj.dimensions.temperature || '')}
                                                  onChange={(e) => handleCatalogDetailChange(itemIndex, 'temperatureRating', e.target.value)}
                                                  disabled={submitting}
                                                />
                                              </FormField>

                                              <FormField label="Bonding Adhesive">
                                                <Select
                                                  value={(catDetails.bonding === 'Silicon based Ceramic' || catDetails.bonding === 'White Adhesive') ? 'White Adhesive (Ceramic)' : (catDetails.bonding || '')}
                                                  onChange={(e) => handleCatalogDetailChange(itemIndex, 'bonding', e.target.value)}
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
                                            </div>
                                          </div>
                                        )}

                                        {/* Catalog Description */}
                                        <FormField label="Catalog Description / Master Engineering Notes">
                                          <Textarea
                                            rows={2}
                                            placeholder="Optional master specifications or catalog description..."
                                            value={catDetails.description || ''}
                                            onChange={(e) => handleCatalogDetailChange(itemIndex, 'description', e.target.value)}
                                            disabled={submitting}
                                          />
                                        </FormField>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </FormField>
                          </div>

                          <FormField label="Required Quantity" required>
                            <Input
                              type="number"
                              step="1"
                              min="1"
                              placeholder="e.g. 50"
                              value={itemObj.quantity}
                              onChange={(e) => handleItemFieldChange(itemIndex, 'quantity', e.target.value)}
                              disabled={submitting}
                            />
                          </FormField>

                          <FormField label="Unit of Measure (UOM)" required>
                            <Select
                              value={itemObj.uom}
                              onChange={(e) => handleItemFieldChange(itemIndex, 'uom', e.target.value)}
                              disabled={submitting || loadingMasters}
                            >
                              <option value="">-- Select UOM --</option>
                              {uoms.map((u) => (
                                <option key={u._id} value={u._id}>
                                  {u.uomName} ({u.uomCode})
                                </option>
                              ))}
                            </Select>
                          </FormField>

                          {/* CONSTRUCTION TYPE SEGMENTED SWITCHER CARDS */}
                          {(() => {
                            const isFlange = (itemObj.constructionType || 'FLANGE').toUpperCase() === 'FLANGE';
                            const hasCatalogItem = Boolean(itemObj.item);

                            return (
                              <>
                                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--neutral-700)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span>Filter Construction Type</span>
                                      <span style={{ color: 'red' }}>*</span>
                                      {hasCatalogItem && (
                                        <Lock size={13} className="text-blue-600" />
                                      )}
                                    </div>
                                    {hasCatalogItem ? (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#1e40af', backgroundColor: '#dbeafe', padding: '3px 10px', borderRadius: '4px', border: '1px solid #bfdbfe', fontWeight: 700 }}>
                                        <Lock size={12} /> Locked: {itemObj.constructionType} Construction (Catalog Item)
                                      </span>
                                    ) : null}
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (hasCatalogItem) return;
                                        handleItemFieldChange(itemIndex, 'constructionType', 'FLANGE');
                                        if (!itemObj.flangeDesign) {
                                          handleItemFieldChange(itemIndex, 'flangeDesign', defaultFlangeId);
                                        }
                                      }}
                                      disabled={hasCatalogItem || submitting}
                                      title={hasCatalogItem ? `Construction type is locked to ${itemObj.constructionType} for selected Item Master item` : 'Select FLANGE construction'}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: itemObj.constructionType === 'FLANGE' ? '2px solid #2563eb' : '1px solid var(--neutral-300)',
                                        backgroundColor: itemObj.constructionType === 'FLANGE' ? '#eff6ff' : (hasCatalogItem ? '#f8fafc' : '#ffffff'),
                                        color: itemObj.constructionType === 'FLANGE' ? '#1e40af' : (hasCatalogItem ? '#94a3b8' : 'var(--neutral-700)'),
                                        cursor: hasCatalogItem ? 'not-allowed' : 'pointer',
                                        opacity: hasCatalogItem && itemObj.constructionType !== 'FLANGE' ? 0.45 : 1,
                                        textAlign: 'left',
                                        transition: 'all 0.15s ease-in-out',
                                      }}
                                    >
                                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: itemObj.constructionType === 'FLANGE' ? '5px solid #2563eb' : '2px solid var(--neutral-400)', backgroundColor: '#fff', flexShrink: 0 }} />
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <span>FLANGE Construction</span>
                                          {hasCatalogItem && itemObj.constructionType === 'FLANGE' && (
                                            <span style={{ fontSize: '10px', color: '#1e40af', backgroundColor: '#dbeafe', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>Locked</span>
                                          )}
                                        </div>
                                        <div style={{ fontSize: '11px', color: itemObj.constructionType === 'FLANGE' ? '#3b82f6' : 'var(--neutral-500)' }}>
                                          Filter Body + External Flange Dimensions
                                        </div>
                                      </div>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (hasCatalogItem) return;
                                        handleItemFieldChange(itemIndex, 'constructionType', 'BOX');
                                        handleItemFieldChange(itemIndex, 'flangeDesign', '');
                                      }}
                                      disabled={hasCatalogItem || submitting}
                                      title={hasCatalogItem ? `Construction type is locked to ${itemObj.constructionType} for selected Item Master item` : 'Select BOX construction'}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: itemObj.constructionType === 'BOX' ? '2px solid #7c3aed' : '1px solid var(--neutral-300)',
                                        backgroundColor: itemObj.constructionType === 'BOX' ? '#faf5ff' : (hasCatalogItem ? '#f8fafc' : '#ffffff'),
                                        color: itemObj.constructionType === 'BOX' ? '#5b21b6' : (hasCatalogItem ? '#94a3b8' : 'var(--neutral-700)'),
                                        cursor: hasCatalogItem ? 'not-allowed' : 'pointer',
                                        opacity: hasCatalogItem && itemObj.constructionType !== 'BOX' ? 0.45 : 1,
                                        textAlign: 'left',
                                        transition: 'all 0.15s ease-in-out',
                                      }}
                                    >
                                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: itemObj.constructionType === 'BOX' ? '5px solid #7c3aed' : '2px solid var(--neutral-400)', backgroundColor: '#fff', flexShrink: 0 }} />
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <span>BOX Construction</span>
                                          {hasCatalogItem && itemObj.constructionType === 'BOX' && (
                                            <span style={{ fontSize: '10px', color: '#6d28d9', backgroundColor: '#f3e8ff', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>Locked</span>
                                          )}
                                        </div>
                                        <div style={{ fontSize: '11px', color: itemObj.constructionType === 'BOX' ? '#8b5cf6' : 'var(--neutral-500)' }}>
                                          Standard Box Filter (No External Flange)
                                        </div>
                                      </div>
                                    </button>
                                  </div>

                                  {hasCatalogItem && (
                                    <div style={{ fontSize: '11px', color: '#475569', backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <Lock size={12} className="text-blue-600" />
                                      <span>
                                        Filter construction type is <strong>locked to {itemObj.constructionType}</strong> per selected catalog item ({itemObj.itemSearch || 'Item Master'}).
                                      </span>
                                    </div>
                                  )}
                                </div>

                                                                {/* ENGINEERING SPECIFICATIONS SECTION */}
                                <div style={{ gridColumn: 'span 2', marginTop: '6px', padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid var(--neutral-300)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid var(--neutral-200)' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <Maximize2 size={15} className="text-blue-600" /> ENGINEERING SPECIFICATIONS
                                    </div>
                                    {hasCatalogItem && (
                                      <span style={{ fontSize: '11px', color: '#1e40af', backgroundColor: '#dbeafe', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bfdbfe', fontWeight: 600 }}>
                                        From Item Master
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* Flange Hole Configuration (Preserved for FLANGE Construction) */}
                                    {isFlange && (
                                      <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#1e40af' }}>
                                            Flange Hole Configuration
                                          </div>
                                          <span style={{ fontSize: '10.5px', color: '#1d4ed8', backgroundColor: '#dbeafe', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bfdbfe', fontWeight: 600 }}>
                                            Mounting Specification
                                          </span>
                                        </div>
                                        <FormField
                                          label="Flange Hole Configuration"
                                          helperText="Optional flange hole configuration for mounting specification"
                                        >
                                          <Select
                                            value={itemObj.flangeHoleConfig || (itemObj.holeCount ? `${itemObj.holeCount} Holes` : '')}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              let count = null;
                                              if (val) {
                                                const m = val.match(/^(\d+)/);
                                                if (m) count = Number(m[1]);
                                              }
                                              handleItemFieldChange(itemIndex, 'flangeHoleConfig', val);
                                              handleItemFieldChange(itemIndex, 'holeCount', count);
                                            }}
                                            disabled={submitting}
                                          >
                                            <option value="">No Selection</option>
                                            {holeOptions.map((opt) => (
                                              <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                            {itemObj.flangeHoleConfig && !holeOptions.includes(itemObj.flangeHoleConfig) && (
                                              <option value={itemObj.flangeHoleConfig}>{itemObj.flangeHoleConfig}</option>
                                            )}
                                          </Select>
                                        </FormField>
                                      </div>
                                    )}

                                    {/* Technical Specifications */}
                                    <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#166534' }}>
                                          Technical Specifications
                                        </div>
                                        <span style={{ fontSize: '10.5px', color: hasCatalogItem ? '#15803d' : '#475569', backgroundColor: hasCatalogItem ? '#dcfce7' : '#e2e8f0', padding: '2px 8px', borderRadius: '4px', border: hasCatalogItem ? '1px solid #bbf7d0' : '1px solid #cbd5e1', fontWeight: 600 }}>
                                          {hasCatalogItem ? 'Fetched from Item Master' : 'Technical Specifications'}
                                        </span>
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                                        <FormField label="Material of Construction (MOC)" helperText="Aluminium, SS304, SS316">
                                          <Select
                                            value={itemObj.dimensions.moc || ''}
                                            onChange={(e) => handleItemDimensionChange(itemIndex, 'moc', e.target.value)}
                                            disabled={submitting}
                                          >
                                            <option value="">-- Select MOC --</option>
                                            {STANDARD_MOC_OPTIONS.map((opt) => (
                                              <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                            {itemObj.dimensions.moc && !STANDARD_MOC_OPTIONS.includes(itemObj.dimensions.moc) && (
                                              <option value={itemObj.dimensions.moc}>{itemObj.dimensions.moc}</option>
                                            )}
                                          </Select>
                                        </FormField>

                                        <FormField label="Operating Temperature Range" helperText="Exact range string e.g. 20–70 °C">
                                          <Input
                                            type="text"
                                            placeholder="e.g. 20–70 °C"
                                            value={itemObj.dimensions.temperatureRange || itemObj.dimensions.temperature || ''}
                                            onChange={(e) => {
                                              handleItemDimensionChange(itemIndex, 'temperatureRange', e.target.value);
                                              handleItemDimensionChange(itemIndex, 'temperature', e.target.value);
                                            }}
                                            disabled={submitting}
                                          />
                                        </FormField>

                                        <FormField label="Bonding Adhesive" helperText="Adhesive used for media bonding">
                                          <Select
                                            value={(itemObj.dimensions.bonding === 'Silicon based Ceramic' || itemObj.dimensions.bonding === 'White Adhesive') ? 'White Adhesive (Ceramic)' : (itemObj.dimensions.bonding || '')}
                                            onChange={(e) => handleItemDimensionChange(itemIndex, 'bonding', e.target.value)}
                                            disabled={submitting}
                                          >
                                            <option value="">-- Select Bonding --</option>
                                            {BONDING_OPTIONS.map((b) => (
                                              <option key={b.value} value={b.value}>{b.label}</option>
                                            ))}
                                            {itemObj.dimensions.bonding && !BONDING_OPTIONS.some((b) => b.value === itemObj.dimensions.bonding) && (
                                              <option value={itemObj.dimensions.bonding}>{itemObj.dimensions.bonding}</option>
                                            )}
                                          </Select>
                                        </FormField>

                                        <FormField label="Gasket MOC" helperText="Gasket material (separate from Bonding)">
                                          <Select
                                            value={itemObj.dimensions.gasketMoc || ''}
                                            onChange={(e) => handleItemDimensionChange(itemIndex, 'gasketMoc', e.target.value)}
                                            disabled={submitting}
                                          >
                                            <option value="">-- Select Gasket MOC --</option>
                                            {STANDARD_GASKET_MOC_OPTIONS.map((g) => (
                                              <option key={g} value={g}>{g}</option>
                                            ))}
                                            {itemObj.dimensions.gasketMoc && !STANDARD_GASKET_MOC_OPTIONS.includes(itemObj.dimensions.gasketMoc) && (
                                              <option value={itemObj.dimensions.gasketMoc}>{itemObj.dimensions.gasketMoc}</option>
                                            )}
                                          </Select>
                                        </FormField>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        {/* Item Remarks */}
                        <FormField label="Item Remarks / Special Requirements">
                          <Input
                            placeholder="Enter specific notes for this filter item..."
                            value={itemObj.remarks}
                            onChange={(e) => handleItemFieldChange(itemIndex, 'remarks', e.target.value)}
                            disabled={submitting}
                          />
                        </FormField>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* BUTTON TO ADD MORE ITEMS */}
              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px dashed #2563eb',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                  marginTop: '4px',
                }}
                className="hover:bg-blue-100 hover:border-blue-700"
              >
                <Plus size={18} />
                <span>Add More Item</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <FormField label="Service Description / Requirements" required helperText="Provide detailed scope of service requested by customer">
                <Textarea
                  name="serviceDescription"
                  rows={4}
                  placeholder="e.g. Air filter maintenance, air audit, duct cleaning, or custom filter installation service required..."
                  value={formData.serviceDescription}
                  onChange={handleFormChange}
                  disabled={submitting}
                />
              </FormField>
            </div>
          )}
        </div>

        {/* SECTION 3: WORKFLOW STATUS & REMARKS */}
        <div style={{ backgroundColor: 'var(--neutral-50)', padding: '14px', borderRadius: '6px', border: '1px solid var(--neutral-200)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase', marginBottom: '10px' }}>
            3. Workflow Status & Overall Remarks
          </div>
          <div className="form-grid">
            <FormField label="Enquiry Status" required>
              <Select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                disabled={submitting}
              >
                <option value="draft">Draft</option>
                <option value="quotation_pending">Quotation Pending</option>
                <option value="quoted">Quoted</option>
                <option value="follow_up">Follow Up</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </FormField>

            <div style={{ gridColumn: 'span 2' }}>
              <FormField label="Overall Remarks / Internal Notes">
                <Textarea
                  name="remarks"
                  rows={2}
                  placeholder="Enter any overall context, customer urgency, delivery notes, etc."
                  value={formData.remarks}
                  onChange={handleFormChange}
                  disabled={submitting}
                />
              </FormField>
            </div>
          </div>
        </div>
      </form>

      {/* Quick Add Catalog Item Modal */}
      {isItemCatalogModalOpen && (
        <ItemFormModal
          isOpen={isItemCatalogModalOpen}
          initialItemName={catalogCreationName}
          initialProductType={
            catalogCreationIndex !== null && formData.items[catalogCreationIndex]?.dimensions
              ? 'FILTER'
              : 'RAW_ITEM'
          }
          onClose={() => {
            setIsItemCatalogModalOpen(false);
            setCatalogCreationIndex(null);
            setCatalogCreationName('');
          }}
          onSuccess={handleCatalogItemCreated}
        />
      )}
    </Modal>
  );
};

export default RequirementFormModal;
