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
