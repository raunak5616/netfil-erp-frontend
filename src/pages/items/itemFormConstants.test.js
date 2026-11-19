import { describe, it, expect } from 'vitest';
import {
  PRODUCT_TYPE_TO_ITEM_TYPE,
  FIXED_CATEGORY_CODES,
  TEMPERATURE_RANGE_OPTIONS,
  STANDARD_GASKET_MOC_OPTIONS,
  STANDARD_MOC_OPTIONS
} from './components/itemFormConstants';

describe('Item Form Constants & Mappings', () => {
  it('correctly maps product types to item types', () => {
    expect(PRODUCT_TYPE_TO_ITEM_TYPE.FILTER).toBe('finished_goods');
    expect(PRODUCT_TYPE_TO_ITEM_TYPE.RAW_ITEM).toBe('raw_material');
    expect(PRODUCT_TYPE_TO_ITEM_TYPE.COIL).toBe('finished_goods');
    expect(PRODUCT_TYPE_TO_ITEM_TYPE.AHU).toBe('finished_goods');
  });

  it('contains valid fixed category codes for filters and raw materials', () => {
    expect(FIXED_CATEGORY_CODES).toContain('RAW');
    expect(FIXED_CATEGORY_CODES).toContain('FILTER');
    expect(FIXED_CATEGORY_CODES).toContain('COIL');
    expect(FIXED_CATEGORY_CODES).toContain('AHU');
  });

  it('contains expected standard MOC and Gasket options', () => {
    expect(STANDARD_MOC_OPTIONS).toContain('Aluminium');
    expect(STANDARD_MOC_OPTIONS).toContain('SS304');
    expect(STANDARD_MOC_OPTIONS).toContain('SS316');

    expect(STANDARD_GASKET_MOC_OPTIONS).toContain('EPDM');
    expect(STANDARD_GASKET_MOC_OPTIONS).toContain('Glass Fiber Pad');
  });

  it('has consistent temperature range options', () => {
    const labels = TEMPERATURE_RANGE_OPTIONS.map(opt => opt.rangeLabel);
    expect(labels).toContain('20–70 °C');
    expect(labels).toContain('70–150 °C');
    expect(labels).toContain('150–200 °C');
    expect(labels).toContain('200–250 °C');
    expect(labels).toContain('250–350 °C');
  });
});
