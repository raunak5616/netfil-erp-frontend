/**
 * Sales Order Drawing Workspace Constants & Utilities
 */

export const isRealGuardValue = (val) => {
  if (!val) return false;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s !== '' && s !== '-' && s !== 'no' && s !== 'none' && s !== 'false' && s !== 'no protection grid' && s !== 'no guard' && s !== 'no protection guard' && s !== 'null' && s !== 'undefined';
  }
  if (typeof val === 'object') {
    if (val.hasGuard === true || val.enabled === true) return true;
    if (val.hasGuard === false) return false;
    if (val.material && String(val.material).trim().toUpperCase() !== 'NO' && String(val.material).trim().toUpperCase() !== 'NONE') {
      return true;
    }
  }
  return false;
};

export const DRAWING_WORKSPACE_TABS = [
  { id: 'preview', label: 'Drawing Preview' },
  { id: 'holes', label: 'Hole Configuration' },
  { id: 'templates', label: 'Drawing Templates' }
];

export const DEFAULT_HOLE_FORM = {
  filterType: 'FLANGE',
  L: 100,
  M: 100,
  dia: 12,
  X: '-',
  Y: '-',
  holeCount: 12,
  flangeHoleConfig: 'HOLE-12H',
  tolerance: '± 2 mm',
  protectionGuardMoc: 'NO Protection Grid',
  guard: { hasGuard: false, material: 'SS304', sides: 'Both side' }
};

export const STANDARD_TOLERANCES = [
  '± 1 mm',
  '± 2 mm',
  '± 3 mm',
  '± 5 mm'
];
