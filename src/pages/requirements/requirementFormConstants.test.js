import { describe, it, expect } from 'vitest';
import {
  resolveItemTechnicalSpecs,
  STANDARD_MOC_OPTIONS,
  STANDARD_GASKET_MOC_OPTIONS
} from './components/requirementFormConstants';

describe('Requirement Technical Specs Resolver', () => {
  it('returns default empty values when no item or fallback given', () => {
    const res = resolveItemTechnicalSpecs(null, null);
    expect(res).toEqual({ moc: '', temperatureRange: '', bonding: '', gasketMoc: '' });
  });

  it('correctly resolves specifications for ambient temperature filters (<= 70 °C)', () => {
    const item = {
      temperatureRating: 60,
      filterGrade: { noOfFolds: '10–12' }
    };
    const res = resolveItemTechnicalSpecs(item);
    expect(res.temperatureRange).toBe('20–70 °C');
    expect(res.gasketMoc).toBe('EPDM');
    expect(res.bonding).toBe('PU Bonding');
    expect(res.moc).toBe('Aluminium');
    expect(res.noOfFolds).toBe('10–12');
  });

  it('correctly resolves high-temperature ceramic specifications (250–350 °C)', () => {
    const item = {
      temperatureRange: '250–350 °C',
      noOfFolds: '15'
    };
    const res = resolveItemTechnicalSpecs(item);
    expect(res.temperatureRange).toBe('250–350 °C');
    expect(res.gasketMoc).toBe('Glass Fiber Pad');
    expect(res.bonding).toBe('White Adhesive (Ceramic)');
    expect(res.moc).toBe('SS304');
    expect(res.noOfFolds).toBe('15');
  });

  it('preserves explicitly defined MOC and Gasket overrides', () => {
    const item = {
      temperatureRange: '20–70 °C',
      moc: 'SS316',
      gasketMoc: 'Glass Fiber Pad',
      bonding: 'Epoxy Bonding'
    };
    const res = resolveItemTechnicalSpecs(item);
    expect(res.moc).toBe('SS316');
    expect(res.gasketMoc).toBe('Glass Fiber Pad');
    expect(res.bonding).toBe('Epoxy Bonding');
  });
});
