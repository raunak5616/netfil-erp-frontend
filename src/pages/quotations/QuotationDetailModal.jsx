import React, { useState, useEffect } from 'react';
import { getQuotationById, releaseQuotation, getQuotationReferences, printQuotationPdf } from '../../services/quotationService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
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
} from 'lucide-react';

const getItemTechnicalSpecs = (it) => {
  const itemDoc = (typeof it.item === 'object' ? it.item : {}) || {};
  const filterGrade = typeof itemDoc.filterGrade === 'object' ? itemDoc.filterGrade : null;
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
        const name = (s.name || s.specificationCode || '').toLowerCase();
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

  // 1. Dimensions / Size
  const width = dims.width || dims.length || itemDoc?.grade_items?.width;
  const height = dims.height || itemDoc?.grade_items?.height;
  const depth = dims.depth || dims.outerDiameter || itemDoc?.grade_items?.length;
  const unit = dims.unit || 'mm';

  if (width && height && depth) {
    specs.push({ label: 'Size', value: `${width} × ${height} × ${depth} ${unit}` });
  } else if (width && height) {
    specs.push({ label: 'Size', value: `${width} × ${height} ${unit}` });
  }

  // 2. Airflow CFM
  let cfmVal = findSpecValue(['capacity', 'cfm', 'cmf', 'airFlow']);
  if (!cfmVal) {
    let wVal = Number(width) || 0;
    let hVal = Number(height) || 0;
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
      const calcCfm = Math.round(hFt * wFt * fpm);
      if (calcCfm > 0) cfmVal = `${calcCfm} CFM`;
    }
  }
  if (cfmVal) {
    const cleanCfm = String(cfmVal).toLowerCase().includes('cfm') ? cfmVal : `${cfmVal} CFM`;
    specs.push({ label: 'Airflow', value: cleanCfm });
  }

  // 3. MOC
  const moc = findSpecValue(['moc', 'material', 'frameMaterial', 'casing']);
  if (moc) {
    specs.push({ label: 'MOC', value: moc });
  }

  // 4. Temperature (°C)
  const temp = findSpecValue(['temperature', 'temp', 'maxTemp', 'operatingTemp']);
  if (temp) {
    const cleanTemp = temp.replace(/(?:degree|celcious|celsius|°c)/gi, '').trim();
    specs.push({ label: 'Temp', value: `${cleanTemp} °C` });
  }

  // 5. Filter Media
  const media = findSpecValue(['media', 'filterMedia', 'mediaType']);
  if (media) {
    specs.push({ label: 'Media', value: media });
  }

  // 6. Efficiency
  const efficiency = findSpecValue(['efficiency', 'eff', 'rating']);
  if (efficiency) {
    specs.push({ label: 'Efficiency', value: efficiency });
  } else if (filterGrade) {
    const effStr = [filterGrade.eurovent ? `EU ${filterGrade.eurovent}` : '', filterGrade.iso ? `ISO ${filterGrade.iso}` : ''].filter(Boolean).join(' / ');
    if (effStr) specs.push({ label: 'Efficiency', value: effStr });
  }

  // 7. Pressure Drop
  const initPD = findSpecValue(['initialPressureDrop', 'initial pressure', 'initial pd', 'init pd']);
  const finalPD = findSpecValue(['finalPressureDrop', 'final pressure', 'final pd']);
  if (initPD || finalPD) {
    let pdStr = '';
    if (initPD && finalPD) pdStr = `Init ${initPD} / Final ${finalPD} mm WC`;
    else if (initPD) pdStr = `Init ${initPD} mm WC`;
    else if (finalPD) pdStr = `Final ${finalPD} mm WC`;
    specs.push({ label: 'Pressure Drop', value: pdStr });
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quotation, setQuotation] = useState(null);
  const [items, setItems] = useState([]);
  const [terms, setTerms] = useState([]);
  const [references, setReferences] = useState(null);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!quotationId) return;
      setLoading(true);
      setError('');
      try {
        const [detailRes, refRes] = await Promise.all([
          getQuotationById(quotationId),
          getQuotationReferences(quotationId).catch(() => ({ success: false })),
        ]);

        if (detailRes.success && detailRes.quotation) {
          setQuotation(detailRes.quotation);
          setItems(detailRes.items || []);
          setTerms(detailRes.terms || []);
        } else {
          setError('Quotation details not found');
        }

        if (refRes.success && refRes.references) {
          setReferences(refRes.references);
        }
      } catch (err) {
        console.error('Failed to fetch quotation details:', err);
        setError(err.response?.data?.message || 'Failed to load quotation details');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchDetail();
    }
  }, [isOpen, quotationId]);

  if (!isOpen) return null;

  const handleReleaseAction = async () => {
    if (!quotation) return;
    const confirmMsg = `Are you sure you want to RELEASE Quotation "${quotation.quotationNo}"? Once released, direct edits will be locked.`;
    if (!window.confirm(confirmMsg)) return;

    setReleasing(true);
    try {
      const res = await releaseQuotation(quotation._id);
      if (res.success) {
        setQuotation((prev) => ({ ...prev, status: 'released' }));
        if (onRelease) onRelease();
      }
    } catch (err) {
      console.error('Failed to release quotation:', err);
      setError(err.response?.data?.message || 'Failed to release quotation');
    } finally {
      setReleasing(false);
    }
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>Quotation Details</span>
          {quotation && (
            <span className="font-mono" style={{ color: 'var(--primary-700)', fontSize: '15px' }}>
              ({quotation.quotationNo})
            </span>
          )}
        </div>
      }
      maxWidth="850px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
            {quotation && `Created by ${quotation.createdBy?.username || 'System'} on ${formatDate(quotation.createdAt)}`}
          </div>

          <div className="flex gap-2">
            {quotation && (
              <Button
                variant="outline"
                onClick={() => printQuotationPdf(quotation._id)}
                title="Print Quotation PDF"
              >
                <Printer size={14} style={{ marginRight: '4px' }} /> Print Quotation
              </Button>
            )}

            <Button variant="outline" onClick={onClose}>
              Close
            </Button>

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
          {/* Header Summary Row */}
          <div
            style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'var(--gray-100)',
              borderRadius: '6px',
              marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                Quotation Status
              </div>
              <div style={{ marginTop: '2px' }}>
                <StatusBadge status={quotation.status} />
                {quotation.amendmentCount > 0 && (
                  <span
                    style={{
                      marginLeft: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--primary-700)',
                    }}
                  >
                    (Amendment #{quotation.amendmentCount})
                  </span>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                Quotation Date
              </div>
              <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                {formatDate(quotation.quotationDate)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                Type / Category
              </div>
              <div style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--gray-800)' }}>
                {quotation.quotationType} • {quotation.quotationCategory}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                Grand Total
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-700)' }}>
                ₹{(quotation.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                Valid Till: {formatDate(quotation.validTill)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '4px' }}>
                Currency: {quotation.currency || 'INR'}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '10px' }}>
              Quotation Line Items ({items.length})
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
                  {items.map((it, idx) => {
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
                <div><strong>Payment Terms:</strong> {quotation.paymentTerms || 'As per standard agreement'}</div>
                <div><strong>Delivery Terms:</strong> {quotation.deliveryTerms || 'FOB Ex-works'}</div>
                <div><strong>General Terms:</strong> {quotation.generalTerms || 'None specified'}</div>
                {quotation.remarks && <div><strong>Remarks:</strong> {quotation.remarks}</div>}
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
                <strong>₹{(quotation.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              {quotation.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--danger-700)' }}>
                  <span>Discount:</span>
                  <span>- ₹{quotation.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {quotation.pfAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>P&F Charges:</span>
                  <span>+ ₹{quotation.pfAmount.toFixed(2)}</span>
                </div>
              )}
              {quotation.freightAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Freight Charges:</span>
                  <span>+ ₹{quotation.freightAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', borderTop: '1px solid var(--gray-200)', paddingTop: '6px' }}>
                <span>Taxable Amount:</span>
                <strong>₹{(quotation.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--primary-700)' }}>
                <span>{quotation.taxName || 'Tax'} ({quotation.taxRate || 0}%):</span>
                <span>+ ₹{(quotation.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
                  ₹{(quotation.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                      <span>Next Follow-up: <strong style={{ color: 'var(--primary-700)' }}>{formatDate(fu.followUpDate)}</strong></span>
                      <span>Recorded on {formatDate(fu.createdAt)} {fu.followUpBy?.username ? `by ${fu.followUpBy.username}` : ''}</span>
                    </div>
                    <div style={{ color: 'var(--gray-900)' }}>{fu.remarks}</div>
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

          {/* References & Traceability Section */}
          {references && references.amendments && references.amendments.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--gray-200)', paddingTop: '12px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-800)', marginBottom: '8px' }}>
                Amendment History ({references.amendments.length})
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                {references.amendments.map((am) => (
                  <div key={am._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--gray-100)', borderRadius: '4px' }}>
                    <span className="font-mono" style={{ fontWeight: 600 }}>{am.amendmentNo}</span>
                    <span>Reason: {am.reason}</span>
                    <span style={{ color: 'var(--gray-500)' }}>{formatDate(am.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
};

export default QuotationDetailModal;
