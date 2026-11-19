/**
 * Requirement and Enquiry Form Constants and Specification Resolvers
 */

export const STANDARD_MOC_OPTIONS = [
  'Aluminium',
  'SS304',
  'SS316',
  'Galvanized Iron (GI)',
  'CRCA Powder Coated',
  'Mild Steel'
];

export const STANDARD_GASKET_MOC_OPTIONS = [
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
  } else if (!resolvedMoc) {
    resolvedMoc = 'Aluminium';
  }

  // 5. Resolve No. of Folds
  let resolvedNoOfFolds = (itemObj?.noOfFolds || itemObj?.filterGrade?.noOfFolds || fallbackDims?.noOfFolds || '').trim();

  return {
    moc: resolvedMoc,
    temperatureRange: resolvedTempRange,
    bonding: resolvedBonding,
    gasketMoc: resolvedGasketMoc,
    noOfFolds: resolvedNoOfFolds,
  };
};
