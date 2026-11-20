import { Filter, Layers, Wind, Package } from 'lucide-react';

export const PRODUCT_TYPE_TO_ITEM_TYPE = {
  RAW_ITEM: 'raw_material',
  FILTER: 'finished_goods',
  COIL: 'finished_goods',
  AHU: 'finished_goods',
};

// Fixed predefined system category codes
export const FIXED_CATEGORY_CODES = ['RAW', 'FILTER', 'COIL', 'AHU'];

// 4 Selectable Item Groups for Step 1
export const ITEM_GROUP_CARDS = [
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
export const TEMPERATURE_RANGE_OPTIONS = [
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
export const STANDARD_GASKET_MOC_OPTIONS = [
  'EPDM',
  'Glass Fiber Pad'
];

// Standard MOC options (Only Aluminium, SS304, SS316)
export const STANDARD_MOC_OPTIONS = [
  'Aluminium',
  'SS304',
  'SS316'
];

/**
 * Parses numeric bounds from a temperature string or number.
 * e.g., "20–70 °C", "20-70", "50 - 70", "71 - 500", "50-500", 50
 */
export const parseTempBounds = (tempStr) => {
  if (tempStr === null || tempStr === undefined || tempStr === '') return null;
  if (typeof tempStr === 'number') {
    return { min: tempStr, max: tempStr };
  }
  const matches = String(tempStr).match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length === 0) return null;
  const numbers = matches.map(Number).filter(n => !isNaN(n));
  if (numbers.length === 0) return null;
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0] };
  return {
    min: Math.min(...numbers),
    max: Math.max(...numbers)
  };
};

/**
 * Checks whether a Technical Variant rated temperature range is compatible
 * with the selected Operating Temperature range.
 */
export const isTemperatureCompatible = (variantTempStr, selectedTempStr) => {
  if (!variantTempStr || !selectedTempStr) return true;

  const vRange = parseTempBounds(variantTempStr);
  const sRange = parseTempBounds(selectedTempStr);

  if (!vRange || !sRange) return true;

  // Rule 1: High operating temp (>70°C) cannot use low-temp only variant (max <= 70°C)
  if (sRange.max > 70 && vRange.max <= 70) {
    return false;
  }

  // Rule 2: Strictly ambient/low operating temp (max <= 70°C) cannot use high-temp only variant (min > 70°C)
  if (sRange.max <= 70 && vRange.min > 70) {
    return false;
  }

  // Rule 3: Operating max temperature cannot exceed variant's rated maximum
  if (sRange.max > vRange.max) {
    return false;
  }

  return true;
};

/**
 * Checks whether a Technical Variant is compatible with both Construction Type and Temperature Range.
 */
export const isVariantCompatible = (v, { filterType, constructionType, temperatureRange, temperatureRating } = {}) => {
  if (!v) return false;

  // 1. Construction type compatibility (BOX vs FLANGE)
  const targetConstruction = (filterType || constructionType || '').toUpperCase().trim();
  if (targetConstruction) {
    const vType = (v.filterType || v.mountingType || '').toUpperCase().trim();
    if (vType) {
      if (targetConstruction === 'BOX' && vType.includes('FLANGE') && !vType.includes('BOX')) {
        return false;
      }
      if (targetConstruction === 'FLANGE' && vType.includes('BOX') && !vType.includes('FLANGE')) {
        return false;
      }
    }
  }

  // 2. Operating temperature compatibility
  const targetTemp = temperatureRange || temperatureRating || '';
  if (targetTemp && v.temperature) {
    if (!isTemperatureCompatible(v.temperature, targetTemp)) {
      return false;
    }
  }

  return true;
};

/**
 * Formats a clean, compact dropdown label displaying ONLY:
 * Filter Class | No. of Folds
 * e.g. "Fine | 72–76 Folds"
 */
export const formatVariantOptionLabel = (v) => {
  if (!v) return '';
  const filterClass = v.filterClass || v.class || 'Standard';
  const folds = v.noOfFolds ? String(v.noOfFolds).trim() : '';

  if (!folds) {
    return `${filterClass}`;
  }

  const foldsText = /folds?$/i.test(folds) ? folds : `${folds} Folds`;
  return `${filterClass} | ${foldsText}`;
};

