import React, { useState, useMemo } from 'react';
import { printQuotationPdf } from '../../services/quotationService';
import {
  useGetQuotationByIdQuery,
  useGetQuotationReferencesQuery,
  useReleaseQuotationMutation,
} from '../../features/quotations/quotationsApi';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import QuotationAmendmentModal from './QuotationAmendmentModal';
import {
  Building2,
  Calendar,
  User,
  Package,
  FileText,
  Clock,
  Edit,
  CheckCircle2,
  FileDiff,
  Tag,
  DollarSign,
  Printer,
  History,
  ArrowLeft,
  AlertTriangle,
  Eye,
  Download,
} from 'lucide-react';

const findFilterGradeVariant = (filterGrade, itemDoc = {}, it = {}) => {
  if (!filterGrade || !Array.isArray(filterGrade.variants) || filterGrade.variants.length === 0) {
    return null;
  }
  const variants = filterGrade.variants;
  if (variants.length === 1) return variants[0];

  const variantKey = (itemDoc.filterGradeVariant || it.filterGradeVariant || '').trim();
  const construction = (it.constructionType || it.dimensions?.constructionType || itemDoc.constructionType || '').trim().toUpperCase();

  if (variantKey) {
    const found = variants.find((v) => {
      const k1 = [v.filterClass, v.mountingType || v.filterType, v.temperature, v.media].join('||').toLowerCase();
      const k2 = [v.filterClass, v.filterType || v.mountingType, v.temperature, v.media].join('||').toLowerCase();
      const vk = variantKey.toLowerCase();
      return vk === k1 || vk === k2;
    });
    if (found) return found;

    if (variantKey.includes('||')) {
      const parts = variantKey.split('||').map((p) => p.trim().toLowerCase()).filter(Boolean);
      const foundPartial = variants.find((v) => {
        const vParts = [v.filterClass, v.mountingType, v.filterType, v.temperature, v.media].map((x) => (x || '').toLowerCase());
        return parts.every((part) => vParts.some((vp) => vp.includes(part) || part.includes(vp)));
      });
      if (foundPartial) return foundPartial;
    }

    const foundByName = variants.find((v) => {
      const fc = (v.filterClass || '').toLowerCase();
      const ft = (v.filterType || '').toLowerCase();
      const mt = (v.mountingType || '').toLowerCase();
      const vk = variantKey.toLowerCase();
      return fc === vk || ft === vk || mt === vk || vk.includes(fc) || vk.includes(ft);
    });
    if (foundByName) return foundByName;
  }

  if (construction) {
    const constMatches = variants.filter((v) => {
      const m = (v.mountingType || v.filterType || '').toUpperCase();
      return m.includes(construction);
    });
    if (constMatches.length > 0) return constMatches[0];
  }

  return variants[0];
};

const formatPressureDropValue = (rawInit, rawFinal, rawGeneral) => {
  const cleanPd = (val) => {
    if (val === undefined || val === null) return null;
    const str = String(val).trim();
    if (!str || str === '—' || str === '-' || str.toLowerCase() === 'undefined' || str.toLowerCase() === 'null' || str.toLowerCase() === 'nan') {
      return null;
    }
    const numMatch = str.match(/^0+(?:\.0+)?(?:\s*(?:mm\s*w[cg]|pa))?$/i);
    if (numMatch) return null;
    return str;
  };

  const initStr = cleanPd(rawInit);
  const finalStr = cleanPd(rawFinal);
  const genStr = cleanPd(rawGeneral);

  if (!initStr && !finalStr && !genStr) return null;

  const formatSingle = (val) => {
    if (/mm\s*w[cg]/i.test(val)) return val.replace(/mm\s*w[cg]/gi, 'mm WC');
    if (/(?:pa|kpa|bar|mbar|in\s*w[cg])/i.test(val)) return val;
    return `${val} mm WC`;
  };

  if (initStr && finalStr) {
    return `Init ${formatSingle(initStr)} / Final ${formatSingle(finalStr)}`;
  } else if (initStr) {
    if (/initial/i.test(initStr) || /final/i.test(initStr)) return initStr;
    return `Init ${formatSingle(initStr)}`;
  } else if (finalStr) {
    if (/final/i.test(finalStr)) return finalStr;
    return `Final ${formatSingle(finalStr)}`;
  } else if (genStr) {
    if (/initial/i.test(genStr) || /final/i.test(genStr)) return genStr;
    return formatSingle(genStr);
  }
  return null;
};

const getItemTechnicalSpecs = (it) => {
  const itemDoc = (typeof it.item === 'object' ? it.item : {}) || {};
  const filterGrade = (typeof itemDoc.filterGrade === 'object' && itemDoc.filterGrade !== null)
    ? itemDoc.filterGrade
    : (typeof it.filterGrade === 'object' && it.filterGrade !== null ? it.filterGrade : null);

  const matchedVariant = findFilterGradeVariant(filterGrade, itemDoc, it);
  const dims = it.dimensions || {};
  const specsArr = Array.isArray(it.specifications) ? it.specifications : [];
  const remarksStr = it.remarks || '';

  const findSpecValue = (keys) => {
    for (const k of keys) {
      if (dims[k] !== undefined && dims[k] !== null && String(dims[k]).trim() !== '') {
        return String(dims[k]).trim();
      }
    }
    for (const k of keys) {
      const match = specsArr.find((s) => {
        const name = (s.name || s.specificationCode || s.key || '').toLowerCase();
        return name.includes(k.toLowerCase());
      });
      if (match && match.value !== undefined && match.value !== null && String(match.value).trim() !== '') {
        return String(match.value).trim();
      }
    }
    for (const k of keys) {
      const regex = new RegExp(`(?:${k})\\s*[:=]\\s*([^|;,\\n]+)`, 'i');
      const m = remarksStr.match(regex);
      if (m && m[1]) return m[1].trim();
    }
    return null;
  };

  const specs = [];

  // Construction type & dimensional extraction
  const constType = String(it.constructionType || dims.constructionType || '').toUpperCase();
  const isFlange = constType === 'FLANGE';
  const isBox = constType === 'BOX';

  const boxW = dims.bodyWidth || dims.width || dims.length || itemDoc?.grade_items?.width;
  const boxH = dims.bodyHeight || dims.height || itemDoc?.grade_items?.height;
  const boxD = dims.depth || dims.outerDiameter || itemDoc?.grade_items?.length;
  const unit = dims.unit || 'mm';

  // 1. Dimensions / Size Display
  if (isFlange) {
    if (boxW && boxH && boxD) {
      specs.push({ label: 'BOX Size', value: `${boxW} × ${boxH} × ${boxD} ${unit}` });
    } else if (boxW && boxH) {
      specs.push({ label: 'BOX Size', value: `${boxW} × ${boxH} ${unit}` });
    }

    const ofW = dims.overallFlangeWidth || dims.flangeWidth || (boxW ? Number(boxW) + 60 : null);
    const ofH = dims.overallFlangeHeight || dims.flangeHeight || (boxH ? Number(boxH) + 60 : null);
    const ofD = dims.overallFlangeDepth || dims.flangeDepth || boxD;

    if (ofW && ofH && ofD) {
      specs.push({ label: 'Overall Flange Size', value: `${ofW} × ${ofH} × ${ofD} ${unit}` });
    } else if (ofW && ofH) {
      specs.push({ label: 'Overall Flange Size', value: `${ofW} × ${ofH} ${unit}` });
    }

    const flangeCode = it.flangeDesignSnapshot?.designCode || it.flangeDesign?.designCode || dims.flangeDesignCode;
    const flangeName = it.flangeDesignSnapshot?.designName || it.flangeDesign?.designName;
    if (flangeCode || flangeName) {
      specs.push({ label: 'Flange Design', value: flangeCode ? `${flangeCode}${flangeName ? ` (${flangeName})` : ''}` : flangeName });
    }

    const holeVal = it.flangeHoleConfig || (it.holeCount ? `${it.holeCount} Holes` : null) || 'Not Specified';
    specs.push({ label: 'Flange Hole Configuration', value: holeVal });
  }

  const drwSnap = it.drawingSnapshot || (typeof it.drawing === 'object' ? it.drawing : null) || (typeof itemDoc?.drawing === 'object' ? itemDoc.drawing : null);
  if (drwSnap && drwSnap.drawingCode) {
    specs.push({ label: 'Engineering Drawing', value: `${drwSnap.drawingCode}${drwSnap.drawingName ? ` (${drwSnap.drawingName})` : ''}` });
  }

  if (isBox) {
    if (boxW && boxH && boxD) {
      specs.push({ label: 'BOX Size', value: `${boxW} × ${boxH} × ${boxD} ${unit}` });
      specs.push({ label: 'Overall Size', value: `${boxW} × ${boxH} × ${boxD} ${unit} (Equal to BOX)` });
    } else if (boxW && boxH) {
      specs.push({ label: 'BOX Size', value: `${boxW} × ${boxH} ${unit}` });
      specs.push({ label: 'Overall Size', value: `${boxW} × ${boxH} ${unit} (Equal to BOX)` });
    }
  } else {
    // General / legacy sizing fallback
    if (boxW && boxH && boxD) {
      specs.push({ label: 'Size', value: `${boxW} × ${boxH} × ${boxD} ${unit}` });
    } else if (boxW && boxH) {
      specs.push({ label: 'Size', value: `${boxW} × ${boxH} ${unit}` });
    }
  }

  // 2. Airflow CFM - strictly calculated from BOX dimensions
  let cfmVal = dims.cfm || findSpecValue(['capacity', 'cfm', 'cmf', 'airFlow']);
  if (!cfmVal) {
    let wVal = Number(boxW) || 0;
    let hVal = Number(boxH) || 0;
    const uVal = String(unit).toLowerCase();
    if (!wVal || !hVal) {
      const textStr = `${it.description || ''} ${remarksStr}`;
      const m = textStr.match(/(\d+(?:\.\d+)?)\s*[*×x]\s*(\d+(?:\.\d+)?)/i);
      if (m) {
        wVal = wVal || Number(m[1]);
        hVal = hVal || Number(m[2]);
      }
    }
    const fpm = Number(dims.faceVelocity || findSpecValue(['fpm', 'velocity', 'faceVelocity'])) || 0;
    if (wVal > 0 && hVal > 0 && fpm > 0) {
      let hFt = hVal;
      let wFt = wVal;
      if (uVal === 'mm') {
        hFt = hVal / 304.8;
        wFt = wVal / 304.8;
      } else if (uVal === 'inch' || uVal === 'in' || uVal === 'inches') {
        hFt = hVal / 12;
        wFt = wVal / 12;
      }
      const rawCfm = hFt * wFt * fpm;
      const rounded10 = Math.round(rawCfm / 10) * 10;
      const calcCfm = rounded10 === 0 && rawCfm > 0 ? Math.round(rawCfm) : rounded10;
      if (calcCfm > 0) cfmVal = `${calcCfm} CFM`;
    }
  }
  if (cfmVal) {
    const cleanCfm = String(cfmVal).toLowerCase().includes('cfm') ? cfmVal : `${cfmVal} CFM`;
    specs.push({ label: 'Airflow', value: cleanCfm });
  }

  // 3. MOC
  const moc = findSpecValue(['moc', 'material', 'frameMaterial', 'casing']) || itemDoc.moc;
  if (moc) {
    specs.push({ label: 'MOC', value: moc });
  }

  // 3b. Box Construction
  const boxConst = findSpecValue(['overallBoxConstruction', 'boxConstruction', 'overall_box_construction', 'box_construction', 'box construction'])
    || itemDoc.overallBoxConstruction
    || itemDoc.boxConstruction;
  if (boxConst) {
    specs.push({ label: 'Box Construction', value: boxConst });
  }

  // 4. Rated Operating Temperature (°C)
  const temp = findSpecValue(['temperature', 'temp', 'maxTemp', 'operatingTemp', 'ratedOperatingTemperature'])
    || itemDoc.temperatureRating
    || itemDoc.grade_items?.filterTemp
    || matchedVariant?.temperature;
  if (temp) {
    const cleanTemp = String(temp).replace(/(?:degree|celcious|celsius|°c)/gi, '').trim();
    if (cleanTemp && cleanTemp !== '0' && cleanTemp.toLowerCase() !== 'null' && cleanTemp.toLowerCase() !== 'undefined') {
      specs.push({ label: 'Rated Operating Temp', value: `${cleanTemp} °C` });
    }
  }

  // 5. Efficiency
  let efficiency = findSpecValue(['efficiency', 'eff', 'rating', 'filtration efficiency', 'spec_efficiency']);
  if (!efficiency && matchedVariant && matchedVariant.efficiency) {
    const effVal = String(matchedVariant.efficiency).trim();
    if (effVal && effVal !== '-' && effVal !== '—' && effVal.toLowerCase() !== 'undefined' && effVal.toLowerCase() !== 'null') {
      efficiency = effVal;
    }
  }
  if (!efficiency && filterGrade) {
    const effStr = [filterGrade.eurovent ? `EU ${filterGrade.eurovent}` : '', filterGrade.iso ? `ISO ${filterGrade.iso}` : ''].filter(Boolean).join(' / ');
    if (effStr) efficiency = effStr;
  }
  if (efficiency) {
    const cleanEff = String(efficiency).trim();
    if (cleanEff && cleanEff !== '0' && cleanEff !== '—' && cleanEff.toLowerCase() !== 'undefined' && cleanEff.toLowerCase() !== 'null') {
      specs.push({ label: 'Efficiency', value: cleanEff });
    }
  }

  // 6. Pressure Drop
  let initPD = findSpecValue(['initialPressureDrop', 'initial_pressure_drop', 'initial pressure', 'initial pd', 'init pd', 'init_pd']);
  let finalPD = findSpecValue(['finalPressureDrop', 'final_pressure_drop', 'final pressure', 'final pd', 'final_pd']);
  let generalPD = findSpecValue(['pressureDrop', 'pressure_drop', 'pressure drop', 'pd']);

  if (!initPD && !finalPD && !generalPD && matchedVariant) {
    initPD = matchedVariant.initialPressureDrop;
    finalPD = matchedVariant.finalPressureDrop;
  }

  const pdStr = formatPressureDropValue(initPD, finalPD, generalPD);
  if (pdStr) {
    specs.push({ label: 'Pressure Drop', value: pdStr });
  }

  // 7. Filter Media
  const media = findSpecValue(['media', 'filterMedia', 'mediaType'])
    || itemDoc.grade_items?.media
    || itemDoc.filterMedia
    || itemDoc.media
    || matchedVariant?.media;
  if (media) {
    const cleanMedia = String(media).trim();
    if (cleanMedia && cleanMedia !== '—' && cleanMedia.toLowerCase() !== 'null' && cleanMedia.toLowerCase() !== 'undefined') {
      specs.push({ label: 'Media', value: cleanMedia });
    }
  }

  // 8. Protection Guard Add-on
  const guardObj = it.guard || it.dimensions?.guard || itemDoc.guard || itemDoc.dimensions?.guard;
  if (guardObj && (guardObj.hasGuard || guardObj.enabled)) {
    const mat = guardObj.material || 'SS304';
    const sides = guardObj.sides || 'One side';
    specs.push({ label: 'Guard', value: `${mat} (${sides})` });
  }

  return specs;
};

const QuotationDetailModal = ({
  isOpen,
  onClose,
  quotationId,
  onEdit,
  onRelease,
  canEdit,
  canRelease,
  canAmend,
}) => {
  const [actionError, setActionError] = useState('');
  const [selectedRevisionNo, setSelectedRevisionNo] = useState(null);
  const [isAmendModalOpen, setIsAmendModalOpen] = useState(false);

  // Reset selected revision when modal opens or quotationId changes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedRevisionNo(null);
      setIsAmendModalOpen(false);
      setActionError('');
    }
  }, [isOpen, quotationId]);

  const {
    data: detailData,
    isLoading: loading,
    error: detailError,
    refetch,
  } = useGetQuotationByIdQuery(quotationId, {
    skip: !isOpen || !quotationId,
  });

  const {
    data: refData,
  } = useGetQuotationReferencesQuery(quotationId, {
    skip: !isOpen || !quotationId,
  });

  const [releaseQuotationMutation, { isLoading: releasing }] = useReleaseQuotationMutation();

  const quotation = detailData?.quotation || null;
  const items = detailData?.items || [];
  const terms = detailData?.terms || [];
  const references = refData?.references || null;
  const rawAmendments = detailData?.amendments || [];
  const error = actionError || (detailError ? (detailError?.data?.message || 'Failed to load quotation details') : '');

  // Sort amendments chronologically
  const sortedAmendments = useMemo(() => {
    return [...rawAmendments].sort((a, b) => new Date(a.createdAt || a.amendmentDate) - new Date(b.createdAt || b.amendmentDate));
  }, [rawAmendments]);

  const amendmentCount = quotation?.amendmentCount || sortedAmendments.length || 0;

  // Build complete revisions history list: Rev 00 (Original) -> Rev 01 -> ... -> Rev 0N (Current)
  const revisionsList = useMemo(() => {
    if (!quotation) return [];
    const list = [];
    const N = amendmentCount;

    if (N === 0) {
      list.push({
        revisionNo: 0,
        revisionLabel: 'Rev 00',
        title: 'Original Quotation',
        isCurrent: true,
        status: quotation.status,
        statusBadge: 'Current',
        date: quotation.createdAt || quotation.quotationDate,
        createdBy: quotation.createdBy?.username || 'Creator',
        reason: 'Original Quotation',
        remarks: quotation.remarks || '',
        headerSnapshot: quotation,
        itemsSnapshot: items,
        termsSnapshot: terms,
      });
      return list;
    }

    // N >= 1
    // Rev 00: Original Quotation (snapshot preserved in first amendment)
    const firstAm = sortedAmendments[0];
    list.push({
      revisionNo: 0,
      revisionLabel: 'Rev 00',
      title: 'Original Quotation',
      isCurrent: false,
      status: 'superseded',
      statusBadge: 'Superseded',
      date: quotation.createdAt || quotation.quotationDate,
      createdBy: quotation.createdBy?.username || 'Creator',
      reason: 'Original Quotation',
      remarks: firstAm?.remarks || '',
      headerSnapshot: firstAm?.headerSnapshot || quotation,
      itemsSnapshot: firstAm?.itemsSnapshot || items,
      termsSnapshot: firstAm?.termsSnapshot || terms,
    });

    // Intermediate Revisions: Rev 01 ... Rev 0(N-1)
    for (let i = 1; i < N; i++) {
      const prevAm = sortedAmendments[i - 1];
      const curAm = sortedAmendments[i];
      list.push({
        revisionNo: i,
        revisionLabel: `Rev ${String(i).padStart(2, '0')}`,
        title: i === 1 ? 'First Amendment' : `Amendment ${i}`,
        isCurrent: false,
        status: 'superseded',
        statusBadge: 'Superseded',
        date: prevAm?.amendmentDate || prevAm?.createdAt,
        createdBy: prevAm?.createdBy?.username || 'User',
        reason: prevAm?.reason || `Amendment ${i}`,
        remarks: prevAm?.remarks || '',
        headerSnapshot: curAm?.headerSnapshot || prevAm?.headerSnapshot || quotation,
        itemsSnapshot: curAm?.itemsSnapshot || prevAm?.itemsSnapshot || items,
        termsSnapshot: curAm?.termsSnapshot || prevAm?.termsSnapshot || terms,
      });
    }

    // Latest Revision: Rev 0N (Current live quotation)
    const latestAm = sortedAmendments[N - 1];
    list.push({
      revisionNo: N,
      revisionLabel: `Rev ${String(N).padStart(2, '0')}`,
      title: N === 1 ? 'First Amendment' : `Latest Amendment (Rev ${String(N).padStart(2, '0')})`,
      isCurrent: true,
      status: quotation.status,
      statusBadge: 'Current',
      date: latestAm?.amendmentDate || latestAm?.createdAt || quotation.updatedAt,
      createdBy: latestAm?.createdBy?.username || quotation.updatedBy?.username || 'User',
      reason: latestAm?.reason || 'Latest Amendment',
      remarks: latestAm?.remarks || quotation.remarks || '',
      headerSnapshot: quotation,
      itemsSnapshot: items,
      termsSnapshot: terms,
    });

    return list;
  }, [quotation, items, terms, sortedAmendments, amendmentCount]);

  const activeRevision = useMemo(() => {
    if (selectedRevisionNo === null) {
      return revisionsList.find((r) => r.isCurrent) || null;
    }
    return revisionsList.find((r) => r.revisionNo === selectedRevisionNo) || revisionsList.find((r) => r.isCurrent) || null;
  }, [revisionsList, selectedRevisionNo]);

  const isViewingHistorical = Boolean(activeRevision && !activeRevision.isCurrent);

  // Authoritative display models for Quotation View
  const displayQuotation = useMemo(() => {
    if (!quotation) return null;
    if (!isViewingHistorical || !activeRevision) return quotation;
    return {
      ...quotation,
      ...activeRevision.headerSnapshot,
      client: quotation.client, // keep populated client reference
      requirement: quotation.requirement,
      salesPerson: quotation.salesPerson,
    };
  }, [quotation, activeRevision, isViewingHistorical]);

  const displayItems = useMemo(() => {
    if (!isViewingHistorical || !activeRevision) return items;
    return activeRevision.itemsSnapshot || [];
  }, [items, activeRevision, isViewingHistorical]);

  const displayTerms = useMemo(() => {
    if (!isViewingHistorical || !activeRevision) return terms;
    return activeRevision.termsSnapshot || [];
  }, [terms, activeRevision, isViewingHistorical]);

  if (!isOpen) return null;

  const handleReleaseAction = async () => {
    if (!quotation) return;
    const confirmMsg = `Are you sure you want to RELEASE Quotation "${quotation.quotationNo}"? Once released, direct edits will be locked.`;
    if (!window.confirm(confirmMsg)) return;

    setActionError('');
    try {
      const res = await releaseQuotationMutation(quotation._id).unwrap();
      if (res.success || res.quotation) {
        if (onRelease) onRelease();
      }
    } catch (err) {
      console.error('Failed to release quotation:', err);
      setActionError(err?.data?.message || err?.message || 'Failed to release quotation');
    }
  };

  const handleAmendmentSuccess = () => {
    setIsAmendModalOpen(false);
    setSelectedRevisionNo(null);
    if (refetch) refetch();
    if (onRelease) onRelease();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  const getDeadlineBadge = (dateStr) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return null;
    const now = new Date();
    const diffDays = Math.round((new Date(target.toDateString()) - new Date(now.toDateString())) / (24 * 60 * 60 * 1000));
    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (diffDays === 0) {
      return { text: 'Due Today', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    if (diffDays === 1) {
      return { text: 'Due Tomorrow', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    if (diffDays <= 4) {
      return { text: `Due in ${diffDays}d`, color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    return { text: `Upcoming (${diffDays}d)`, color: 'bg-slate-50 text-slate-700 border-slate-200' };
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span>Quotation Details</span>
          {quotation && (
            <span className="font-mono" style={{ color: 'var(--primary-700)', fontSize: '15px' }}>
              ({quotation.quotationNo})
            </span>
          )}
          {activeRevision && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 700,
                backgroundColor: activeRevision.isCurrent ? '#dcfce7' : '#fef3c7',
                color: activeRevision.isCurrent ? '#166534' : '#92400e',
                border: activeRevision.isCurrent ? '1px solid #bbf7d0' : '1px solid #fde68a',
                fontFamily: 'monospace',
              }}
            >
              {activeRevision.revisionLabel} {activeRevision.isCurrent ? '(Current)' : '(Historical Revision)'}
            </span>
          )}
        </div>
      }
      maxWidth="850px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
            {activeRevision && (
              <>
                {activeRevision.revisionLabel} • {activeRevision.isCurrent ? 'Current' : 'Superseded'} • {formatDate(activeRevision.date)} by {activeRevision.createdBy || 'System'}
              </>
            )}
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            {isViewingHistorical ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => printQuotationPdf(quotation._id, activeRevision.revisionNo)}
                  title={`Download PDF for ${activeRevision.revisionLabel}`}
                  style={{ color: 'var(--primary-700)', borderColor: 'var(--primary-300)' }}
                >
                  <Download size={14} style={{ marginRight: '4px' }} /> Download Rev PDF
                </Button>

                <Button
                  variant="primary"
                  onClick={() => setSelectedRevisionNo(null)}
                  title="Return to Current Quotation"
                >
                  <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Return to Current
                </Button>
              </>
            ) : (
              <>
                {quotation && (
                  <Button
                    variant="outline"
                    onClick={() => printQuotationPdf(quotation._id)}
                    title="Print Current Quotation PDF"
                  >
                    <Printer size={14} style={{ marginRight: '4px' }} /> Print Quotation
                  </Button>
                )}

                {quotation && !['won', 'converted', 'cancelled', 'lost'].includes(quotation.status) && canAmend && (
                  <Button
                    variant="outline"
                    onClick={() => setIsAmendModalOpen(true)}
                    title="Create Quotation Amendment"
                    style={{ color: 'var(--primary-700)', borderColor: 'var(--primary-300)', backgroundColor: 'var(--primary-50)' }}
                  >
                    <FileDiff size={14} style={{ marginRight: '4px' }} /> Amend Quotation
                  </Button>
                )}

                {quotation && quotation.status !== 'released' && canEdit && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      onClose();
                      if (onEdit) onEdit(quotation);
                    }}
                  >
                    <Edit size={14} style={{ marginRight: '4px' }} /> Edit Quotation
                  </Button>
                )}

                {quotation && quotation.status !== 'released' && canRelease && (
                  <Button variant="outline" onClick={handleReleaseAction} disabled={releasing}>
                    <CheckCircle2 size={14} style={{ marginRight: '4px' }} color="var(--success-600)" />
                    {releasing ? 'Releasing...' : 'Release Quotation'}
                  </Button>
                )}
              </>
            )}

            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading quotation details...</div>
      ) : error ? (
        <Alert type="error" message={error} />
      ) : quotation ? (
        <div>
          {/* Prominent Historical Revision Banner */}
          {isViewingHistorical && activeRevision && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: '#fffbeb',
                border: '2px solid #fcd34d',
                borderRadius: '8px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400e' }}>
                    Viewing Historical Revision: <span className="font-mono">{activeRevision.revisionLabel}</span> ({activeRevision.title})
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#b45309', marginTop: '2px' }}>
                    Status: <strong style={{ textTransform: 'uppercase' }}>SUPERSEDED</strong> • Recorded on {formatDate(activeRevision.date)} by {activeRevision.createdBy || 'User'}
                    {activeRevision.reason && <span> • Reason: <em>"{activeRevision.reason}"</em></span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => printQuotationPdf(quotation._id, activeRevision.revisionNo)}
                  style={{ backgroundColor: '#ffffff', color: '#92400e', borderColor: '#fcd34d', fontWeight: 600 }}
                >
                  <Download size={13} style={{ marginRight: '4px' }} /> Download Rev PDF
                </Button>
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => setSelectedRevisionNo(null)}
                  style={{ fontWeight: 600 }}
                >
                  <ArrowLeft size={13} style={{ marginRight: '4px' }} /> Return to Current Quotation
                </Button>
              </div>
            </div>
          )}

          {/* Header Summary Row */}
          <div
            style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: isViewingHistorical ? '#fef3c7' : 'var(--gray-100)',
              border: isViewingHistorical ? '1px solid #fde68a' : 'none',
              borderRadius: '6px',
              marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                {isViewingHistorical ? 'Revision Status' : 'Quotation Status'}
              </div>
              <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isViewingHistorical ? (
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#475569', fontWeight: 700, border: '1px solid #cbd5e1', textTransform: 'uppercase' }}>
                    SUPERSEDED
                  </span>
                ) : (
                  <StatusBadge status={displayQuotation.status} />
                )}
                <span
                  className="font-mono"
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: isViewingHistorical ? '#92400e' : 'var(--primary-700)',
                  }}
                >
                  ({activeRevision?.revisionLabel || 'Rev 00'})
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                {isViewingHistorical ? 'Revision Date' : 'Quotation Date'}
              </div>
              <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                {formatDate(displayQuotation.quotationDate || activeRevision?.date)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                Type / Category
              </div>
              <div style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--gray-800)' }}>
                {displayQuotation.quotationType} • {displayQuotation.quotationCategory}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                Grand Total ({activeRevision?.revisionLabel})
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-700)' }}>
                ₹{(displayQuotation.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Party & Requirement Context Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-5" style={{ padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-700)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={14} /> Client / Party Details
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-900)' }}>
                {quotation.client?.companyName || 'N/A'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '2px' }} className="font-mono">
                Code: {quotation.client?.clientCode || '—'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '4px' }}>
                Contact: {quotation.attentionPerson || quotation.client?.contactPerson || '—'}
              </div>
              {quotation.client?.city && (
                <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                  Location: {quotation.client.city}, {quotation.client.state}
                </div>
              )}
            </div>

            <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-5" style={{ padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-700)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} /> Requirement & Sales Context
              </div>
              <div style={{ fontSize: '13px', color: 'var(--gray-800)' }}>
                Requirement Ref: <strong className="font-mono">{quotation.requirement?.requirementNo || '—'}</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '4px' }}>
                Sales Person: {quotation.salesPerson?.fullName || '—'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '4px' }}>
                Valid Till: {formatDate(displayQuotation.validTill)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Attention Deadline: <strong>{formatDate(displayQuotation.deadline || displayQuotation.validTill || quotation.requirement?.deadline)}</strong></span>
                {(displayQuotation.deadline || displayQuotation.validTill || quotation.requirement?.deadline) && (() => {
                  const badge = getDeadlineBadge(displayQuotation.deadline || displayQuotation.validTill || quotation.requirement?.deadline);
                  return badge ? (
                    <span className={`text-[10.5px] px-1.5 py-0.5 rounded font-semibold border ${badge.color}`}>
                      {badge.text}
                    </span>
                  ) : null;
                })()}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '4px' }}>
                Next Follow-up: <strong>{formatDate(displayQuotation.nextFollowUpDate || quotation.requirement?.followUpDate)}</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '4px' }}>
                Currency: {displayQuotation.currency || 'INR'}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '10px' }}>
              Quotation Line Items ({displayItems.length}) {isViewingHistorical && <span className="font-mono text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 ml-2">Historical Snapshot: {activeRevision?.revisionLabel}</span>}
            </h4>

            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-2xs">
              <table className="w-full border-collapse text-left text-[12.5px]">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-center border-b border-slate-200" style={{ width: '40px' }}>#</th>
                    <th className="py-2.5 px-3 text-left border-b border-slate-200">Item Description & Specifications</th>
                    <th className="py-2.5 px-3 text-center border-b border-slate-200" style={{ width: '90px' }}>HSN</th>
                    <th className="py-2.5 px-3 text-center border-b border-slate-200" style={{ width: '110px' }}>Qty & UOM</th>
                    <th className="py-2.5 px-3 text-right border-b border-slate-200" style={{ width: '120px' }}>Unit Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right border-b border-slate-200" style={{ width: '130px' }}>Line Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((it, idx) => {
                    const techSpecs = getItemTechnicalSpecs(it);
                    const uomCode = it.uom?.uomCode || (typeof it.uom === 'string' ? it.uom : '') || 'NOS';
                    return (
                      <tr key={it._id || idx} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-center font-semibold text-slate-500 align-top">{idx + 1}</td>
                        <td className="py-3 px-3 align-top whitespace-normal">
                          <div className="font-bold text-slate-900 text-[13px]">
                            {it.item?.itemName || it.description}
                          </div>
                          {it.item?.itemCode && (
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              Code: {it.item.itemCode}
                            </div>
                          )}

                          {techSpecs.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {techSpecs.map((s, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200/90 shadow-2xs"
                                >
                                  <span className="text-slate-500 mr-1 font-normal">{s.label}:</span>
                                  <strong className="text-slate-900 font-semibold">{s.value}</strong>
                                </span>
                              ))}
                            </div>
                          )}

                          {it.remarks && (
                            <div className="text-[11px] text-slate-600 font-normal italic mt-1.5 bg-amber-50/60 px-2 py-1 rounded border border-amber-100/80 inline-block">
                              Note: {it.remarks}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[11.5px] text-slate-600 align-top">
                          {it.hsnCode || '—'}
                        </td>
                        <td className="py-3 px-3 text-center align-top whitespace-nowrap">
                          <span className="font-bold text-slate-900 text-xs">{it.quantity}</span>{' '}
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-block ml-0.5">
                            {uomCode}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-indigo-700 align-top font-mono text-xs whitespace-nowrap">
                          ₹{(it.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-950 align-top font-mono text-xs whitespace-nowrap">
                          ₹{(it.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commercial Breakdown Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '8px' }}>
                Commercial Terms
              </h4>
              <div style={{ fontSize: '12px', color: 'var(--gray-700)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div><strong>Payment Terms:</strong> {displayQuotation.paymentTerms || 'As per standard agreement'}</div>
                <div><strong>Delivery Terms:</strong> {displayQuotation.deliveryTerms || 'FOB Ex-works'}</div>
                <div><strong>General Terms:</strong> {displayQuotation.generalTerms || 'None specified'}</div>
                {displayQuotation.remarks && <div><strong>Remarks:</strong> {displayQuotation.remarks}</div>}
              </div>
            </div>

            <div
              style={{
                padding: '12px 16px',
                background: 'var(--gray-50)',
                border: '1px solid var(--gray-300)',
                borderRadius: '6px',
                fontSize: '12.5px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Subtotal:</span>
                <strong>₹{(displayQuotation.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              {displayQuotation.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--danger-700)' }}>
                  <span>
                    Discount
                    {displayQuotation.discountRate > 0
                      ? ` (${displayQuotation.discountRate}%)`
                      : displayQuotation.subtotal > 0
                      ? ` (${Number(((displayQuotation.discountAmount / displayQuotation.subtotal) * 100).toFixed(2))}%)`
                      : ''}
                    :
                  </span>
                  <span>- ₹{displayQuotation.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {displayQuotation.pfAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>P&F Charges:</span>
                  <span>+ ₹{displayQuotation.pfAmount.toFixed(2)}</span>
                </div>
              )}
              {displayQuotation.freightAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Freight Charges:</span>
                  <span>+ ₹{displayQuotation.freightAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', borderTop: '1px solid var(--gray-200)', paddingTop: '6px' }}>
                <span>Taxable Amount:</span>
                <strong>₹{(displayQuotation.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--primary-700)' }}>
                <span>{displayQuotation.taxName || 'Tax'} ({displayQuotation.taxRate || 0}%):</span>
                <span>+ ₹{(displayQuotation.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  marginTop: '8px',
                  borderTop: '2px solid var(--gray-400)',
                  paddingTop: '8px',
                  fontSize: '14px',
                }}
              >
                <strong>Grand Total:</strong>
                <strong style={{ color: 'var(--primary-700)' }}>
                  ₹{(displayQuotation.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>

          {/* Linked Sales Order Card (if Converted / Completed) */}
          {quotation.salesOrder && (
            <div
              style={{
                padding: '14px',
                background: 'var(--success-50)',
                border: '1px solid var(--success-200)',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--success-800)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Linked Sales Order Reference
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--success-900)', marginTop: '2px' }} className="font-mono">
                  {typeof quotation.salesOrder === 'object' ? quotation.salesOrder.salesOrderNo : quotation.salesOrder}
                </div>
                {typeof quotation.salesOrder === 'object' && quotation.salesOrder.quotationRevisionNo && (
                  <div style={{ marginTop: '4px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'var(--success-200)',
                        color: 'var(--success-900)',
                        fontSize: '11px',
                        fontWeight: 600,
                        fontFamily: 'monospace',
                      }}
                    >
                      Accepted Revision: {quotation.salesOrder.quotationRevisionNo} (Rev {String(quotation.salesOrder.quotationRevision ?? 0).padStart(2, '0')})
                    </span>
                  </div>
                )}
                {quotation.convertedAt && (
                  <div style={{ fontSize: '12px', color: 'var(--success-700)', marginTop: '4px' }}>
                    Converted on {formatDate(quotation.convertedAt)} {quotation.convertedBy?.username ? `by ${quotation.convertedBy.username}` : ''}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--success-800)', textTransform: 'uppercase' }}>
                  Sales Order Status
                </div>
                <div style={{ marginTop: '2px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: 'var(--success-600)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '11px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {typeof quotation.salesOrder === 'object' ? quotation.salesOrder.status : 'CREATED'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Lost Outcome Detail Card (if Lost) */}
          {(quotation.status === 'lost' || quotation.lostReason) && (
            <div
              style={{
                padding: '14px',
                background: 'var(--danger-50)',
                border: '1px solid var(--danger-200)',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--danger-800)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Quotation Outcome: LOST
              </div>
              <div style={{ fontSize: '13px', color: 'var(--danger-900)', marginBottom: '4px' }}>
                <strong>Reason:</strong> {quotation.lostReason ? quotation.lostReason.replace(/_/g, ' ') : 'N/A'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--danger-900)', marginBottom: '6px' }}>
                <strong>Remarks:</strong> {quotation.lostRemarks || 'No remarks provided.'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--danger-700)' }}>
                Marked Lost on {formatDate(quotation.lostAt)} {quotation.lostBy?.username ? `by ${quotation.lostBy.username}` : ''}
              </div>
            </div>
          )}

          {/* Follow-up History Section */}
          {quotation.followUps && quotation.followUps.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '10px' }}>
                Follow-up History ({quotation.followUps.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {quotation.followUps.slice().reverse().map((fu, idx) => (
                  <div
                    key={fu._id || idx}
                    style={{
                      padding: '10px 12px',
                      background: 'var(--gray-50)',
                      border: '1px solid var(--gray-200)',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11.5px', color: 'var(--gray-600)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Follow-up: <strong style={{ color: 'var(--primary-700)' }}>{formatDate(fu.followUpDate)}</strong> {fu.followUpTime ? `@ ${fu.followUpTime}` : ''}</span>
                        {fu.outcome && (
                          <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: 'var(--primary-50)', color: 'var(--primary-700)', fontWeight: 600 }}>
                            {fu.outcome}
                          </span>
                        )}
                      </span>
                      <span>Recorded on {formatDate(fu.createdAt)} {fu.followUpBy?.username ? `by ${fu.followUpBy.username}` : ''}</span>
                    </div>
                    <div style={{ color: 'var(--gray-900)' }}>{fu.remarks}</div>
                    {fu.outcomeNotes && (
                      <div style={{ color: 'var(--neutral-500)', fontSize: '11px', marginTop: '2px', fontStyle: 'italic' }}>
                        Next action: {fu.outcomeNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Progression Audit Log */}
          {quotation.statusHistory && quotation.statusHistory.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '10px' }}>
                Status Audit Trail ({quotation.statusHistory.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {quotation.statusHistory.slice().reverse().map((sh, idx) => (
                  <div
                    key={sh._id || idx}
                    style={{
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'var(--neutral-50)',
                      border: '1px solid var(--neutral-200)',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge status={sh.status} />
                      {sh.remarks && <span style={{ color: 'var(--neutral-700)' }}>— {sh.remarks}</span>}
                    </div>
                    <div style={{ color: 'var(--neutral-500)', fontSize: '11px' }}>
                      {formatDate(sh.performedAt)} {sh.performedBy?.username ? `by ${sh.performedBy.username}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quotation Amendment History Section */}
          <div
            style={{
              marginTop: '24px',
              borderTop: '2px solid var(--gray-200)',
              paddingTop: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} style={{ color: 'var(--primary-600)' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
                  Quotation Amendment History
                </h4>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--gray-100)',
                    color: 'var(--gray-700)',
                    border: '1px solid var(--gray-300)',
                  }}
                >
                  {revisionsList.length} {revisionsList.length === 1 ? 'Revision' : 'Revisions'}
                </span>
              </div>

              {!['won', 'converted', 'cancelled', 'lost'].includes(quotation.status) && canAmend && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAmendModalOpen(true)}
                  style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    color: 'var(--primary-700)',
                    borderColor: 'var(--primary-300)',
                    backgroundColor: 'var(--primary-50)',
                  }}
                >
                  <FileDiff size={13} style={{ marginRight: '5px' }} /> Create Amendment
                </Button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {revisionsList.map((rev) => {
                const isActive = activeRevision?.revisionNo === rev.revisionNo;
                const isCurrent = rev.isCurrent;
                const revTotal = rev.headerSnapshot?.grandTotal ?? 0;

                return (
                  <div
                    key={rev.revisionNo}
                    style={{
                      padding: '12px 14px',
                      background: isActive
                        ? isCurrent
                          ? '#f0fdf4'
                          : '#fffbeb'
                        : 'var(--gray-50)',
                      border: isActive
                        ? isCurrent
                          ? '1.5px solid #86efac'
                          : '1.5px solid #fde047'
                        : '1px solid var(--gray-200)',
                      borderRadius: '8px',
                      transition: 'all 0.15s ease-in-out',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            className="font-mono"
                            style={{
                              fontSize: '13px',
                              fontWeight: 700,
                              color: 'var(--gray-900)',
                            }}
                          >
                            {rev.revisionLabel}
                          </span>
                          <span style={{ color: 'var(--gray-400)' }}>|</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-800)' }}>
                            {rev.title}
                          </span>

                          {/* Status Badge */}
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: isCurrent ? '#dcfce7' : '#f1f5f9',
                              color: isCurrent ? '#15803d' : '#64748b',
                              border: isCurrent ? '1px solid #bbf7d0' : '1px solid #cbd5e1',
                            }}
                          >
                            {rev.statusBadge}
                          </span>

                          {/* Active viewing badge */}
                          {isActive && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: isCurrent ? '#15803d' : '#b45309',
                                color: '#ffffff',
                              }}
                            >
                              Currently Viewing
                            </span>
                          )}
                        </div>

                        {/* Revision Meta */}
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--gray-600)',
                            marginTop: '4px',
                            display: 'flex',
                            gap: '12px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span>Created: <strong>{formatDate(rev.date)}</strong></span>
                          <span>By: <strong>{rev.createdBy}</strong></span>
                          <span>Total: <strong style={{ color: 'var(--primary-700)' }}>₹{Number(revTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                        </div>

                        {/* Amendment Reason & Remarks */}
                        {rev.reason && rev.reason !== 'Original Quotation' && (
                          <div style={{ fontSize: '12px', color: 'var(--gray-700)', marginTop: '4px' }}>
                            <span style={{ fontWeight: 600 }}>Reason: </span>
                            <span>{rev.reason}</span>
                          </div>
                        )}
                        {rev.remarks && (
                          <div style={{ fontSize: '11.5px', color: 'var(--gray-500)', marginTop: '2px', fontStyle: 'italic' }}>
                            Note: {rev.remarks}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {isActive ? (
                          !isCurrent && (
                            <button
                              type="button"
                              onClick={() => setSelectedRevisionNo(null)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                color: 'var(--primary-700)',
                                background: '#ffffff',
                                border: '1px solid var(--primary-300)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                              title="Return to Current Quotation"
                            >
                              <ArrowLeft size={12} /> Return to Current
                            </button>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedRevisionNo(isCurrent ? null : rev.revisionNo)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              color: 'var(--gray-700)',
                              background: '#ffffff',
                              border: '1px solid var(--gray-300)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                            title={`View Details for ${rev.revisionLabel}`}
                          >
                            <Eye size={12} /> View Details
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => printQuotationPdf(quotation._id, rev.revisionNo)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: 'var(--primary-700)',
                            background: '#ffffff',
                            border: '1px solid var(--primary-300)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                          title={`Download PDF for ${rev.revisionLabel}`}
                        >
                          <Download size={12} /> Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
    {quotation && (
      <QuotationAmendmentModal
        isOpen={isAmendModalOpen}
        onClose={() => setIsAmendModalOpen(false)}
        quotation={quotation}
        onSuccess={handleAmendmentSuccess}
      />
    )}
    </>
  );
};

export default QuotationDetailModal;
