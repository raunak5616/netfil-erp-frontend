/**
 * Comprehensive Quotation vs Sales Order Change Detection Utility for Frontend
 * Compares ALL quotation-derived fields against proposed Sales Order values
 * with robust normalization, stable line-item pairing, and category grouping.
 */

export const CATEGORIES = {
  CUSTOMER_ORDER: 'Customer / Order Details',
  LINE_ITEMS: 'Line Items',
  TECHNICAL_SPECS: 'Dimensions and Technical Specifications',
  COMMERCIAL_TAX: 'Commercial Charges and Tax',
  TERMS_REMARKS: 'Payment and Delivery Terms',
  OTHER: 'Other Changes'
};

// Normalizes numbers; returns null if undefined, null, or empty string (does not coerce missing to 0)
export const normalizeNumber = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[₹$,%]/g, '').trim();
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
};

export const areNumbersEqual = (a, b) => {
  const numA = normalizeNumber(a);
  const numB = normalizeNumber(b);
  if (numA === null && numB === null) return true;
  if (numA === null || numB === null) return false;
  return Math.abs(numA - numB) < 0.0001;
};

// Normalizes string with whitespace trimming and multiple space collapsing
export const normalizeString = (val) => {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(/\s+/g, ' ');
};

export const areStringsEqual = (a, b, caseInsensitive = false) => {
  const strA = normalizeString(a);
  const strB = normalizeString(b);
  if (caseInsensitive) {
    return strA.toLowerCase() === strB.toLowerCase();
  }
  return strA === strB;
};

// Normalizes ObjectId or reference representation
export const normalizeId = (val) => {
  if (!val) return null;
  if (typeof val === 'object') {
    const id = val._id || val.id;
    if (id) return String(id).trim();
    if (typeof val.toString === 'function') {
      const str = val.toString().trim();
      if (str && str !== '[object Object]') return str;
    }
    return null;
  }
  return String(val).trim();
};

export const areIdsEqual = (a, b) => {
  const idA = normalizeId(a);
  const idB = normalizeId(b);
  if (!idA && !idB) return true;
  if (!idA || !idB) return false;
  return idA === idB;
};

/**
 * Extract comprehensive technical details and specifications from a line item.
 */
export const extractTechnicalDetails = (item) => {
  if (!item) return {};
  const dims = item.dimensions || {};
  const specs = item.specifications || [];

  const findSpec = (keys) => {
    for (const k of keys) {
      if (dims[k] !== undefined && dims[k] !== null && String(dims[k]).trim() !== '') {
        return String(dims[k]).trim();
      }
    }

    const normalizedKeys = keys.map((k) => k.toLowerCase().replace(/[\s_-]/g, ''));

    if (Array.isArray(specs)) {
      for (const s of specs) {
        const rawName = s.name || s.key || s.parameterName || s.specificationCode || '';
        const cleanName = rawName.toLowerCase().replace(/[\s_-]/g, '');
        if (cleanName && normalizedKeys.some((nk) => cleanName === nk || cleanName === `${nk}name` || cleanName === `${nk}type` || cleanName === `${nk}rating`)) {
          const val = s.value !== undefined ? s.value : s.actualValue;
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            return String(val).trim();
          }
        }
      }
    } else if (typeof specs === 'object' && specs !== null) {
      for (const [k, v] of Object.entries(specs)) {
        const cleanK = k.toLowerCase().replace(/[\s_-]/g, '');
        if (cleanK && normalizedKeys.some((nk) => cleanK === nk || cleanK === `${nk}name` || cleanK === `${nk}type` || cleanK === `${nk}rating`)) {
          if (v !== undefined && v !== null && String(v).trim() !== '') {
            return String(v).trim();
          }
        }
      }
    }

    for (const k of keys) {
      if (item[k] !== undefined && item[k] !== null && String(item[k]).trim() !== '') {
        return String(item[k]).trim();
      }
    }
    return null;
  };

  const customSpecs = {};
  const knownKeys = [
    'moc', 'material', 'framematerial', 'casingmaterial', 'casingmoc',
    'temperature', 'temp', 'maxtemp', 'operatingtemp', 'temperaturerating',
    'efficiency', 'eff', 'filtrationefficiency', 'efficiencyrating', 'rating',
    'pressuredrop', 'initialpressuredrop', 'finalpressuredrop', 'pd', 'initialpd', 'finalpd',
    'filtergrade', 'bonding', 'bondingtype', 'facevelocity', 'velocity', 'cfm'
  ];

  if (Array.isArray(specs)) {
    for (const s of specs) {
      const rawKey = s.name || s.key || s.parameterName || s.specificationCode;
      const val = s.value !== undefined ? s.value : s.actualValue;
      if (rawKey && val !== undefined && val !== null && String(val).trim() !== '') {
        const cleanKey = String(rawKey).toLowerCase().replace(/[\s_-]/g, '');
        if (!knownKeys.includes(cleanKey)) {
          customSpecs[rawKey] = String(val).trim();
        }
      }
    }
  } else if (typeof specs === 'object' && specs !== null) {
    for (const [k, v] of Object.entries(specs)) {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        const cleanKey = k.toLowerCase().replace(/[\s_-]/g, '');
        if (!knownKeys.includes(cleanKey)) {
          customSpecs[k] = String(v).trim();
        }
      }
    }
  }

  const width = dims.bodyWidth !== undefined ? dims.bodyWidth : dims.width;
  const height = dims.bodyHeight !== undefined ? dims.bodyHeight : dims.height;
  const depth = dims.depth !== undefined ? dims.depth : (dims.length !== undefined ? dims.length : null);
  const length = dims.length !== undefined ? dims.length : (dims.depth !== undefined ? dims.depth : null);

  const ofw = dims.overallFlangeWidth !== undefined ? dims.overallFlangeWidth : dims.flangeWidth;
  const ofh = dims.overallFlangeHeight !== undefined ? dims.overallFlangeHeight : dims.flangeHeight;
  const ofd = dims.overallFlangeDepth !== undefined ? dims.overallFlangeDepth : dims.flangeDepth;

  const cfm = dims.cfm !== undefined ? dims.cfm : findSpec(['cfm', 'capacity', 'airFlow']);
  const faceVelocity = dims.faceVelocity !== undefined ? dims.faceVelocity : findSpec(['faceVelocity', 'velocity', 'fpm']);

  const fdCode = item.flangeDesignSnapshot?.designCode ||
                 item.flangeDesign?.designCode ||
                 dims.flangeDesignCode ||
                 (typeof item.flangeDesign === 'object' && item.flangeDesign?.designName) ||
                 normalizeId(item.flangeDesign);

  const rawConstType = item.constructionType || dims.constructionType;

  return {
    constructionType: rawConstType ? String(rawConstType).trim().toUpperCase() : null,
    flangeDesign: fdCode || null,
    width: normalizeNumber(width),
    height: normalizeNumber(height),
    depth: normalizeNumber(depth),
    length: normalizeNumber(length),
    overallFlangeWidth: normalizeNumber(ofw),
    overallFlangeHeight: normalizeNumber(ofh),
    overallFlangeDepth: normalizeNumber(ofd),
    cfm: normalizeNumber(cfm),
    faceVelocity: normalizeNumber(faceVelocity),
    outerDiameter: normalizeNumber(dims.outerDiameter),
    innerDiameter: normalizeNumber(dims.innerDiameter),
    moc: findSpec(['moc', 'material', 'frameMaterial', 'casing']),
    temperature: findSpec(['temperature', 'temp', 'maxTemp', 'operatingTemp']),
    efficiency: findSpec(['efficiency', 'eff', 'filtrationEfficiency', 'rating']),
    initialPressureDrop: findSpec(['initialPressureDrop', 'initial_pressure_drop', 'initial pressure', 'initial pd', 'init pd']),
    finalPressureDrop: findSpec(['finalPressureDrop', 'final_pressure_drop', 'final pressure', 'final pd']),
    pressureDrop: findSpec(['pressureDrop', 'pressure drop', 'pd']),
    filterGrade: findSpec(['filterGrade', 'filter_grade', 'eurovent', 'iso', 'grade']),
    bonding: findSpec(['bonding', 'bondingType', 'sealant', 'adhesive']),
    hsnCode: item.hsnCode || dims.hsnCode || null,
    customSpecs
  };
};

/**
 * Compare authoritative Quotation document and its line items against
 * the Sales Order creation payload or form state.
 */
export const compareQuotationWithSalesOrder = (quotation, quotationItems = [], payload = {}) => {
  const changes = [];

  if (!quotation) {
    return { hasChanges: false, changes: [] };
  }

  // =========================================================================
  // SECTION A: Customer and Order Information
  // =========================================================================
  if (payload.client !== undefined) {
    if (!areIdsEqual(quotation.client, payload.client)) {
      changes.push({
        field: 'client',
        label: 'Customer / Party',
        category: CATEGORIES.CUSTOMER_ORDER,
        quotationValue: quotation.client?.companyName || normalizeId(quotation.client) || 'N/A',
        salesOrderValue: payload.clientName || normalizeId(payload.client) || 'N/A'
      });
    }
  }

  if (payload.orderType !== undefined) {
    const qType = quotation.quotationType || 'domestic';
    if (!areStringsEqual(qType, payload.orderType, true)) {
      changes.push({
        field: 'orderType',
        label: 'Order Type',
        category: CATEGORIES.CUSTOMER_ORDER,
        quotationValue: qType,
        salesOrderValue: payload.orderType
      });
    }
  }

  if (payload.orderCategory !== undefined) {
    const qCat = quotation.quotationCategory || 'product';
    if (!areStringsEqual(qCat, payload.orderCategory, true)) {
      changes.push({
        field: 'orderCategory',
        label: 'Order Category',
        category: CATEGORIES.CUSTOMER_ORDER,
        quotationValue: qCat,
        salesOrderValue: payload.orderCategory
      });
    }
  }

  if (payload.currency !== undefined && quotation.currency !== undefined) {
    if (!areStringsEqual(quotation.currency, payload.currency, true)) {
      changes.push({
        field: 'currency',
        label: 'Currency',
        category: CATEGORIES.CUSTOMER_ORDER,
        quotationValue: quotation.currency || 'INR',
        salesOrderValue: payload.currency || 'INR'
      });
    }
  }

  if (payload.attentionPerson !== undefined && quotation.attentionPerson !== undefined) {
    if (!areStringsEqual(quotation.attentionPerson, payload.attentionPerson)) {
      changes.push({
        field: 'attentionPerson',
        label: 'Attention Person',
        category: CATEGORIES.CUSTOMER_ORDER,
        quotationValue: quotation.attentionPerson || '(Empty)',
        salesOrderValue: payload.attentionPerson || '(Empty)'
      });
    }
  }

  // =========================================================================
  // SECTION B & C: Line Items, Dimensions & Technical Specifications
  // =========================================================================
  if (Array.isArray(payload.items) && payload.items.length > 0) {
    const qItems = quotationItems || [];
    const pItems = payload.items;

    const matchedQItemIndices = new Set();
    const pairedItems = [];
    const addedItems = [];

    pItems.forEach((pIt, pIdx) => {
      const pId = normalizeId(pIt._id) || normalizeId(pIt.quotationItemId);
      const pMasterId = normalizeId(pIt.item);

      let matchedQIdx = -1;

      if (pId) {
        matchedQIdx = qItems.findIndex((qIt, qIdx) => !matchedQItemIndices.has(qIdx) && normalizeId(qIt._id) === pId);
      }

      if (matchedQIdx === -1 && pMasterId) {
        matchedQIdx = qItems.findIndex((qIt, qIdx) => !matchedQItemIndices.has(qIdx) && normalizeId(qIt.item) === pMasterId);
      }

      if (matchedQIdx === -1 && pIt.description) {
        matchedQIdx = qItems.findIndex((qIt, qIdx) => !matchedQItemIndices.has(qIdx) && areStringsEqual(qIt.description, pIt.description, true));
      }

      if (matchedQIdx === -1 && pIdx < qItems.length && !matchedQItemIndices.has(pIdx)) {
        matchedQIdx = pIdx;
      }

      if (matchedQIdx !== -1) {
        matchedQItemIndices.add(matchedQIdx);
        pairedItems.push({ qIt: qItems[matchedQIdx], pIt, pIdx, qIdx: matchedQIdx });
      } else {
        addedItems.push({ pIt, pIdx });
      }
    });

    // Removed items
    qItems.forEach((qIt, qIdx) => {
      if (!matchedQItemIndices.has(qIdx)) {
        changes.push({
          field: `items.removed[${qIdx}]`,
          label: `Line Item Removed (#${qIdx + 1})`,
          itemIndex: qIdx,
          itemDescription: qIt.description || `Item #${qIdx + 1}`,
          category: CATEGORIES.LINE_ITEMS,
          quotationValue: `${qIt.description || `Item #${qIdx + 1}`} (Qty: ${qIt.quantity}, Rate: ₹${Number(qIt.unitPrice || 0).toLocaleString('en-IN')})`,
          salesOrderValue: '(Removed from Sales Order)'
        });
      }
    });

    // Added items
    addedItems.forEach(({ pIt, pIdx }) => {
      changes.push({
        field: `items.added[${pIdx}]`,
        label: `Line Item Added (#${pIdx + 1})`,
        itemIndex: pIdx,
        itemDescription: pIt.description || `New Item #${pIdx + 1}`,
        category: CATEGORIES.LINE_ITEMS,
        quotationValue: '(Not in Quotation)',
        salesOrderValue: `${pIt.description || `New Item #${pIdx + 1}`} (Qty: ${pIt.quantity || 1}, Rate: ₹${Number(pIt.unitPrice || 0).toLocaleString('en-IN')})`
      });
    });

    // Paired items
    pairedItems.forEach(({ qIt, pIt, pIdx }) => {
      const itemLabel = `Item ${pIdx + 1} (${pIt.description || qIt.description || `Item #${pIdx + 1}`})`;
      const itemDesc = qIt.description || pIt.description;

      // Reordering detection
      if (pIt.sortOrder !== undefined && qIt.sortOrder !== undefined && !areNumbersEqual(pIt.sortOrder, qIt.sortOrder)) {
        changes.push({
          field: `items[${pIdx}].sortOrder`,
          label: `${itemLabel} - Item Position / Order`,
          itemIndex: pIdx,
          itemDescription: itemDesc,
          category: CATEGORIES.LINE_ITEMS,
          quotationValue: `Position ${Number(qIt.sortOrder) + 1}`,
          salesOrderValue: `Position ${Number(pIt.sortOrder) + 1}`
        });
      }

      // Item Master Replacement
      if (pIt.item !== undefined && qIt.item !== undefined) {
        if (!areIdsEqual(qIt.item, pIt.item)) {
          const qItemCode = qIt.item?.itemCode || normalizeId(qIt.item);
          const pItemCode = pIt.item?.itemCode || normalizeId(pIt.item);
          changes.push({
            field: `items[${pIdx}].item`,
            label: `${itemLabel} - Item Code / Replacement`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.LINE_ITEMS,
            quotationValue: qItemCode || 'N/A',
            salesOrderValue: pItemCode || 'N/A'
          });
        }
      }

      // Description
      if (pIt.description !== undefined && qIt.description !== undefined) {
        if (!areStringsEqual(qIt.description, pIt.description)) {
          changes.push({
            field: `items[${pIdx}].description`,
            label: `${itemLabel} - Description`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.LINE_ITEMS,
            quotationValue: qIt.description || '(Empty)',
            salesOrderValue: pIt.description || '(Empty)'
          });
        }
      }

      // Quantity
      if (pIt.quantity !== undefined && qIt.quantity !== undefined) {
        if (!areNumbersEqual(qIt.quantity, pIt.quantity)) {
          changes.push({
            field: `items[${pIdx}].quantity`,
            label: `${itemLabel} - Quantity`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.LINE_ITEMS,
            quotationValue: String(qIt.quantity),
            salesOrderValue: String(pIt.quantity)
          });
        }
      }

      // Unit Price / Rate
      if (pIt.unitPrice !== undefined && qIt.unitPrice !== undefined) {
        if (!areNumbersEqual(qIt.unitPrice, pIt.unitPrice)) {
          changes.push({
            field: `items[${pIdx}].unitPrice`,
            label: `${itemLabel} - Unit Rate`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.LINE_ITEMS,
            quotationValue: `₹${Number(qIt.unitPrice || 0).toLocaleString('en-IN')}`,
            salesOrderValue: `₹${Number(pIt.unitPrice || 0).toLocaleString('en-IN')}`
          });
        }
      }

      // Item-level discount
      if (pIt.discountPercent !== undefined && qIt.discountPercent !== undefined && !areNumbersEqual(qIt.discountPercent, pIt.discountPercent)) {
        changes.push({
          field: `items[${pIdx}].discountPercent`,
          label: `${itemLabel} - Discount %`,
          itemIndex: pIdx,
          itemDescription: itemDesc,
          category: CATEGORIES.LINE_ITEMS,
          quotationValue: `${Number(qIt.discountPercent)}%`,
          salesOrderValue: `${Number(pIt.discountPercent)}%`
        });
      }

      // Line Total
      if (pIt.lineTotal !== undefined && qIt.lineTotal !== undefined && !areNumbersEqual(qIt.lineTotal, pIt.lineTotal)) {
        const qtyChanged = pIt.quantity !== undefined && qIt.quantity !== undefined && !areNumbersEqual(qIt.quantity, pIt.quantity);
        const rateChanged = pIt.unitPrice !== undefined && qIt.unitPrice !== undefined && !areNumbersEqual(qIt.unitPrice, pIt.unitPrice);
        if (!qtyChanged && !rateChanged) {
          changes.push({
            field: `items[${pIdx}].lineTotal`,
            label: `${itemLabel} - Line Total`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.LINE_ITEMS,
            quotationValue: `₹${Number(qIt.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            salesOrderValue: `₹${Number(pIt.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          });
        }
      }

      // UOM
      if (pIt.uom !== undefined && qIt.uom !== undefined) {
        if (!areIdsEqual(qIt.uom, pIt.uom)) {
          const qUomName = typeof qIt.uom === 'object' ? (qIt.uom?.uomCode || qIt.uom?.uomName) : normalizeId(qIt.uom);
          const pUomName = typeof pIt.uom === 'object' ? (pIt.uom?.uomCode || pIt.uom?.uomName) : normalizeId(pIt.uom);
          changes.push({
            field: `items[${pIdx}].uom`,
            label: `${itemLabel} - UOM`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.LINE_ITEMS,
            quotationValue: qUomName || 'N/A',
            salesOrderValue: pUomName || 'N/A'
          });
        }
      }

      // Item-level remarks
      if (pIt.remarks !== undefined && qIt.remarks !== undefined && qIt.remarks.trim() !== '') {
        if (!areStringsEqual(qIt.remarks, pIt.remarks)) {
          changes.push({
            field: `items[${pIdx}].remarks`,
            label: `${itemLabel} - Item Remarks`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.LINE_ITEMS,
            quotationValue: qIt.remarks || '(Empty)',
            salesOrderValue: pIt.remarks || '(Empty)'
          });
        }
      }

      // Technical Details Comparison
      const qTech = extractTechnicalDetails(qIt);
      const pTech = extractTechnicalDetails(pIt);

      // Construction Type
      if (pTech.constructionType && qTech.constructionType && pTech.constructionType !== qTech.constructionType) {
        changes.push({
          field: `items[${pIdx}].constructionType`,
          label: `${itemLabel} - Construction Type`,
          itemIndex: pIdx,
          itemDescription: itemDesc,
          category: CATEGORIES.TECHNICAL_SPECS,
          quotationValue: qTech.constructionType,
          salesOrderValue: pTech.constructionType
        });
      }

      // Flange Design
      const pHasFd = pIt.flangeDesign !== undefined || pIt.flangeDesignSnapshot !== undefined || (pIt.dimensions && pIt.dimensions.flangeDesignCode !== undefined);
      if (pHasFd) {
        if (pTech.flangeDesign && qTech.flangeDesign && !areStringsEqual(pTech.flangeDesign, qTech.flangeDesign)) {
          changes.push({
            field: `items[${pIdx}].flangeDesign`,
            label: `${itemLabel} - Flange Design`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.TECHNICAL_SPECS,
            quotationValue: qTech.flangeDesign,
            salesOrderValue: pTech.flangeDesign
          });
        } else if (!qTech.flangeDesign && pTech.flangeDesign) {
          changes.push({
            field: `items[${pIdx}].flangeDesign`,
            label: `${itemLabel} - Flange Design`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.TECHNICAL_SPECS,
            quotationValue: '(Not in Quotation)',
            salesOrderValue: pTech.flangeDesign
          });
        } else if (qTech.flangeDesign && !pTech.flangeDesign) {
          changes.push({
            field: `items[${pIdx}].flangeDesign`,
            label: `${itemLabel} - Flange Design`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.TECHNICAL_SPECS,
            quotationValue: qTech.flangeDesign,
            salesOrderValue: '(Cleared)'
          });
        }
      }

      // HSN Code
      if (pTech.hsnCode && qTech.hsnCode && !areStringsEqual(pTech.hsnCode, qTech.hsnCode)) {
        changes.push({
          field: `items[${pIdx}].hsnCode`,
          label: `${itemLabel} - HSN Code`,
          itemIndex: pIdx,
          itemDescription: itemDesc,
          category: CATEGORIES.TECHNICAL_SPECS,
          quotationValue: qTech.hsnCode,
          salesOrderValue: pTech.hsnCode
        });
      }

      // Dimensions: Width, Height, Depth, Length
      const checkDim = (key, dimLabel, unit = 'mm') => {
        const qVal = qTech[key];
        const pVal = pTech[key];

        // If checking 'length' and payload provided 'depth' that matches qVal, no diff
        if (key === 'length' && pTech.depth !== null && areNumbersEqual(qVal, pTech.depth)) return;
        if (key === 'depth' && pTech.length !== null && areNumbersEqual(qVal, pTech.length)) return;

        // If checking 'width' and payload provided 'bodyWidth' that matches qVal, no diff
        if (key === 'width' && pTech.width !== null && areNumbersEqual(qVal, pTech.width)) return;

        if (qVal !== null && pVal !== null && !areNumbersEqual(qVal, pVal)) {
          changes.push({
            field: `items[${pIdx}].dimensions.${key}`,
            label: `${itemLabel} - ${dimLabel}`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.TECHNICAL_SPECS,
            quotationValue: `${qVal} ${unit}`,
            salesOrderValue: `${pVal} ${unit}`
          });
        } else if (qVal !== null && pVal === null && pIt.dimensions && Object.keys(pIt.dimensions).length > 0) {
          changes.push({
            field: `items[${pIdx}].dimensions.${key}`,
            label: `${itemLabel} - ${dimLabel}`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.TECHNICAL_SPECS,
            quotationValue: `${qVal} ${unit}`,
            salesOrderValue: '(Cleared / Empty)'
          });
        } else if (qVal === null && pVal !== null) {
          changes.push({
            field: `items[${pIdx}].dimensions.${key}`,
            label: `${itemLabel} - ${dimLabel}`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.TECHNICAL_SPECS,
            quotationValue: '(Not in Quotation)',
            salesOrderValue: `${pVal} ${unit}`
          });
        }
      };

      checkDim('width', 'BOX Width');
      checkDim('height', 'BOX Height');
      checkDim('depth', 'BOX Depth');
      checkDim('length', 'Length');
      checkDim('overallFlangeWidth', 'Overall Flange Width');
      checkDim('overallFlangeHeight', 'Overall Flange Height');
      checkDim('overallFlangeDepth', 'Overall Flange Depth');

      // Cylindrical Dimensions
      if (qTech.outerDiameter !== null && pTech.outerDiameter !== null && !areNumbersEqual(qTech.outerDiameter, pTech.outerDiameter)) {
        changes.push({
          field: `items[${pIdx}].dimensions.outerDiameter`,
          label: `${itemLabel} - Outer Diameter`,
          itemIndex: pIdx,
          itemDescription: itemDesc,
          category: CATEGORIES.TECHNICAL_SPECS,
          quotationValue: `${qTech.outerDiameter} mm`,
          salesOrderValue: `${pTech.outerDiameter} mm`
        });
      } else if (qTech.outerDiameter === null && pTech.outerDiameter !== null) {
        changes.push({
          field: `items[${pIdx}].dimensions.outerDiameter`,
          label: `${itemLabel} - Outer Diameter`,
          itemIndex: pIdx,
          itemDescription: itemDesc,
          category: CATEGORIES.TECHNICAL_SPECS,
          quotationValue: '(Not in Quotation)',
          salesOrderValue: `${pTech.outerDiameter} mm`
        });
      }

      if (qTech.innerDiameter !== null && pTech.innerDiameter !== null && !areNumbersEqual(qTech.innerDiameter, pTech.innerDiameter)) {
        changes.push({
          field: `items[${pIdx}].dimensions.innerDiameter`,
          label: `${itemLabel} - Inner Diameter`,
          itemIndex: pIdx,
          itemDescription: itemDesc,
          category: CATEGORIES.TECHNICAL_SPECS,
          quotationValue: `${qTech.innerDiameter} mm`,
          salesOrderValue: `${pTech.innerDiameter} mm`
        });
      } else if (qTech.innerDiameter === null && pTech.innerDiameter !== null) {
        changes.push({
          field: `items[${pIdx}].dimensions.innerDiameter`,
          label: `${itemLabel} - Inner Diameter`,
          itemIndex: pIdx,
          itemDescription: itemDesc,
          category: CATEGORIES.TECHNICAL_SPECS,
          quotationValue: '(Not in Quotation)',
          salesOrderValue: `${pTech.innerDiameter} mm`
        });
      }

      // CFM / Airflow
      if (qTech.cfm !== null && pTech.cfm !== null && !areNumbersEqual(qTech.cfm, pTech.cfm)) {
        changes.push({
          field: `items[${pIdx}].dimensions.cfm`,
          label: `${itemLabel} - Airflow (CFM)`,
          itemIndex: pIdx,
          itemDescription: itemDesc,
          category: CATEGORIES.TECHNICAL_SPECS,
          quotationValue: `${qTech.cfm} CFM`,
          salesOrderValue: `${pTech.cfm} CFM`
        });
      } else if (qTech.cfm === null && pTech.cfm !== null) {
        changes.push({
          field: `items[${pIdx}].dimensions.cfm`,
          label: `${itemLabel} - Airflow (CFM)`,
          itemIndex: pIdx,
          itemDescription: itemDesc,
          category: CATEGORIES.TECHNICAL_SPECS,
          quotationValue: '(Not in Quotation)',
          salesOrderValue: `${pTech.cfm} CFM`
        });
      }

      // Face Velocity
      if (qTech.faceVelocity !== null && pTech.faceVelocity !== null && !areNumbersEqual(qTech.faceVelocity, pTech.faceVelocity)) {
        changes.push({
          field: `items[${pIdx}].dimensions.faceVelocity`,
          label: `${itemLabel} - Face Velocity`,
          itemIndex: pIdx,
          itemDescription: itemDesc,
          category: CATEGORIES.TECHNICAL_SPECS,
          quotationValue: `${qTech.faceVelocity} FPM`,
          salesOrderValue: `${pTech.faceVelocity} FPM`
        });
      } else if (qTech.faceVelocity === null && pTech.faceVelocity !== null) {
        changes.push({
          field: `items[${pIdx}].dimensions.faceVelocity`,
          label: `${itemLabel} - Face Velocity`,
          itemIndex: pIdx,
          itemDescription: itemDesc,
          category: CATEGORIES.TECHNICAL_SPECS,
          quotationValue: '(Not in Quotation)',
          salesOrderValue: `${pTech.faceVelocity} FPM`
        });
      }

      // Engineering Specifications
      const checkSpec = (key, specLabel) => {
        const qVal = qTech[key];
        const pVal = pTech[key];
        if (qVal && pVal && !areStringsEqual(qVal, pVal, true)) {
          changes.push({
            field: `items[${pIdx}].specifications.${key}`,
            label: `${itemLabel} - ${specLabel}`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.TECHNICAL_SPECS,
            quotationValue: qVal,
            salesOrderValue: pVal
          });
        } else if (qVal && !pVal && pIt.specifications && (Array.isArray(pIt.specifications) ? pIt.specifications.length > 0 : Object.keys(pIt.specifications).length > 0)) {
          changes.push({
            field: `items[${pIdx}].specifications.${key}`,
            label: `${itemLabel} - ${specLabel}`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.TECHNICAL_SPECS,
            quotationValue: qVal,
            salesOrderValue: '(Cleared / Empty)'
          });
        } else if (!qVal && pVal) {
          changes.push({
            field: `items[${pIdx}].specifications.${key}`,
            label: `${itemLabel} - ${specLabel}`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.TECHNICAL_SPECS,
            quotationValue: '(Not in Quotation)',
            salesOrderValue: pVal
          });
        }
      };

      checkSpec('moc', 'MOC / Frame Material');
      checkSpec('temperature', 'Temperature Rating');
      checkSpec('efficiency', 'Filtration Efficiency');
      checkSpec('initialPressureDrop', 'Initial Pressure Drop');
      checkSpec('finalPressureDrop', 'Final Pressure Drop');
      checkSpec('pressureDrop', 'Pressure Drop');
      checkSpec('filterGrade', 'Filter Grade');
      checkSpec('bonding', 'Bonding / Sealant');

      // Dynamic / custom specifications
      const pProvidedSpecs = pIt.specifications !== undefined;
      const allCustomKeys = new Set([
        ...Object.keys(qTech.customSpecs || {}),
        ...(pProvidedSpecs ? Object.keys(pTech.customSpecs || {}) : [])
      ]);

      allCustomKeys.forEach((key) => {
        const qVal = qTech.customSpecs?.[key];
        const pVal = pTech.customSpecs?.[key];
        if (qVal && pVal && !areStringsEqual(qVal, pVal, true)) {
          changes.push({
            field: `items[${pIdx}].specifications.${key}`,
            label: `${itemLabel} - Specification: ${key}`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.TECHNICAL_SPECS,
            quotationValue: qVal,
            salesOrderValue: pVal
          });
        } else if (pProvidedSpecs && qVal && !pVal) {
          changes.push({
            field: `items[${pIdx}].specifications.${key}`,
            label: `${itemLabel} - Specification Removed: ${key}`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.TECHNICAL_SPECS,
            quotationValue: qVal,
            salesOrderValue: '(Removed)'
          });
        } else if (pProvidedSpecs && !qVal && pVal) {
          changes.push({
            field: `items[${pIdx}].specifications.${key}`,
            label: `${itemLabel} - Specification Added: ${key}`,
            itemIndex: pIdx,
            itemDescription: itemDesc,
            category: CATEGORIES.TECHNICAL_SPECS,
            quotationValue: '(Not in Quotation)',
            salesOrderValue: pVal
          });
        }
      });
    });
  }

  // =========================================================================
  // SECTION D: Commercial Charges, Tax, and Calculations
  // =========================================================================
  if (payload.pfAmount !== undefined) {
    if (!areNumbersEqual(quotation.pfAmount, payload.pfAmount)) {
      changes.push({
        field: 'pfAmount',
        label: 'P&F Charges',
        category: CATEGORIES.COMMERCIAL_TAX,
        quotationValue: `₹${Number(quotation.pfAmount || 0).toLocaleString('en-IN')}`,
        salesOrderValue: `₹${Number(payload.pfAmount || 0).toLocaleString('en-IN')}`
      });
    }
  }

  if (payload.freightAmount !== undefined) {
    if (!areNumbersEqual(quotation.freightAmount, payload.freightAmount)) {
      changes.push({
        field: 'freightAmount',
        label: 'Freight Charges',
        category: CATEGORIES.COMMERCIAL_TAX,
        quotationValue: `₹${Number(quotation.freightAmount || 0).toLocaleString('en-IN')}`,
        salesOrderValue: `₹${Number(payload.freightAmount || 0).toLocaleString('en-IN')}`
      });
    }
  }

  if (payload.discountAmount !== undefined) {
    if (!areNumbersEqual(quotation.discountAmount, payload.discountAmount)) {
      changes.push({
        field: 'discountAmount',
        label: 'Discount Amount',
        category: CATEGORIES.COMMERCIAL_TAX,
        quotationValue: `₹${Number(quotation.discountAmount || 0).toLocaleString('en-IN')}`,
        salesOrderValue: `₹${Number(payload.discountAmount || 0).toLocaleString('en-IN')}`
      });
    }
  }

  if (payload.taxName !== undefined) {
    const qTaxName = quotation.taxName || '';
    if (qTaxName && !areStringsEqual(qTaxName, payload.taxName, true)) {
      changes.push({
        field: 'taxName',
        label: 'Tax Name',
        category: CATEGORIES.COMMERCIAL_TAX,
        quotationValue: qTaxName,
        salesOrderValue: payload.taxName
      });
    }
  }

  if (payload.taxRate !== undefined) {
    if (!areNumbersEqual(quotation.taxRate, payload.taxRate)) {
      changes.push({
        field: 'taxRate',
        label: 'Tax Rate',
        category: CATEGORIES.COMMERCIAL_TAX,
        quotationValue: `${Number(quotation.taxRate || 0)}%`,
        salesOrderValue: `${Number(payload.taxRate || 0)}%`
      });
    }
  }

  if (payload.taxableAmount !== undefined && quotation.taxableAmount !== undefined) {
    if (!areNumbersEqual(quotation.taxableAmount, payload.taxableAmount)) {
      changes.push({
        field: 'taxableAmount',
        label: 'Taxable Amount',
        category: CATEGORIES.COMMERCIAL_TAX,
        quotationValue: `₹${Number(quotation.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        salesOrderValue: `₹${Number(payload.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      });
    }
  }

  if (payload.taxAmount !== undefined && quotation.taxAmount !== undefined) {
    if (!areNumbersEqual(quotation.taxAmount, payload.taxAmount)) {
      changes.push({
        field: 'taxAmount',
        label: 'Tax Amount',
        category: CATEGORIES.COMMERCIAL_TAX,
        quotationValue: `₹${Number(quotation.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        salesOrderValue: `₹${Number(payload.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      });
    }
  }

  if (payload.discountType !== undefined && quotation.discountType !== undefined) {
    if (!areStringsEqual(quotation.discountType, payload.discountType, true)) {
      changes.push({
        field: 'discountType',
        label: 'Discount Type',
        category: CATEGORIES.COMMERCIAL_TAX,
        quotationValue: quotation.discountType || 'fixed',
        salesOrderValue: payload.discountType || 'fixed'
      });
    }
  }

  if (payload.grandTotal !== undefined && quotation.grandTotal !== undefined) {
    if (!areNumbersEqual(quotation.grandTotal, payload.grandTotal)) {
      changes.push({
        field: 'grandTotal',
        label: 'Grand Total',
        category: CATEGORIES.COMMERCIAL_TAX,
        quotationValue: `₹${Number(quotation.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        salesOrderValue: `₹${Number(payload.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      });
    }
  }

  if (payload.subtotal !== undefined && quotation.subtotal !== undefined) {
    if (!areNumbersEqual(quotation.subtotal, payload.subtotal)) {
      changes.push({
        field: 'subtotal',
        label: 'Subtotal',
        category: CATEGORIES.COMMERCIAL_TAX,
        quotationValue: `₹${Number(quotation.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        salesOrderValue: `₹${Number(payload.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      });
    }
  }

  // =========================================================================
  // SECTION E: Payment, Delivery, and Other Terms
  // =========================================================================
  if (payload.paymentTerms !== undefined) {
    const qTerms = quotation.paymentTerms || '';
    if (!areStringsEqual(qTerms, payload.paymentTerms)) {
      changes.push({
        field: 'paymentTerms',
        label: 'Payment Terms',
        category: CATEGORIES.TERMS_REMARKS,
        quotationValue: qTerms || '(Empty)',
        salesOrderValue: payload.paymentTerms || '(Empty)'
      });
    }
  }

  if (payload.deliveryTerms !== undefined) {
    const qDel = quotation.deliveryTerms || '';
    if (!areStringsEqual(qDel, payload.deliveryTerms)) {
      changes.push({
        field: 'deliveryTerms',
        label: 'Delivery Terms',
        category: CATEGORIES.TERMS_REMARKS,
        quotationValue: qDel || '(Empty)',
        salesOrderValue: payload.deliveryTerms || '(Empty)'
      });
    }
  }

  if (payload.warrantyTerms !== undefined && quotation.warrantyTerms !== undefined && quotation.warrantyTerms.trim() !== '') {
    if (!areStringsEqual(quotation.warrantyTerms, payload.warrantyTerms)) {
      changes.push({
        field: 'warrantyTerms',
        label: 'Warranty Terms',
        category: CATEGORIES.TERMS_REMARKS,
        quotationValue: quotation.warrantyTerms || '(Empty)',
        salesOrderValue: payload.warrantyTerms || '(Empty)'
      });
    }
  }

  if (payload.generalTerms !== undefined && quotation.generalTerms !== undefined && quotation.generalTerms.trim() !== '') {
    if (!areStringsEqual(quotation.generalTerms, payload.generalTerms)) {
      changes.push({
        field: 'generalTerms',
        label: 'General Terms & Conditions',
        category: CATEGORIES.TERMS_REMARKS,
        quotationValue: quotation.generalTerms || '(Empty)',
        salesOrderValue: payload.generalTerms || '(Empty)'
      });
    }
  }

  const isSoOnlySubmission = payload.customerPoNumber !== undefined || payload.customerPoDate !== undefined || payload.expectedDeliveryDate !== undefined;
  if (payload.quotationRemarks !== undefined && quotation.remarks) {
    if (!areStringsEqual(quotation.remarks, payload.quotationRemarks)) {
      changes.push({
        field: 'remarks',
        label: 'Quotation Remarks / Instructions',
        category: CATEGORIES.TERMS_REMARKS,
        quotationValue: quotation.remarks,
        salesOrderValue: payload.quotationRemarks || '(Cleared / Overridden)'
      });
    }
  } else if (!isSoOnlySubmission && payload.remarks !== undefined && quotation.remarks && quotation.remarks.trim() !== '') {
    const qRem = quotation.remarks.trim();
    const pRem = (payload.remarks || '').trim();
    if (!areStringsEqual(qRem, pRem)) {
      changes.push({
        field: 'remarks',
        label: 'Quotation Remarks / Instructions',
        category: CATEGORIES.TERMS_REMARKS,
        quotationValue: qRem,
        salesOrderValue: pRem || '(Cleared / Overridden)'
      });
    }
  }

  return {
    hasChanges: changes.length > 0,
    changes
  };
};

export const compareQuotationWithSalesOrderPayload = compareQuotationWithSalesOrder;
