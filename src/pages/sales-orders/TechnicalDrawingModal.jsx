import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import api from '../../services/api';
import { Printer, Image as ImageIcon, Box, Maximize2, ShieldCheck } from 'lucide-react';

const TechnicalDrawingModal = ({ isOpen, salesOrderId, item, onClose }) => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !item) return null;

  const dims = item.dimensions || {};
  const constructionType = (item.constructionType || dims.constructionType || item.flangeDesignSnapshot?.constructionType || 'FLANGE').toUpperCase();
  const snapshot = item.flangeDesignSnapshot || (typeof item.flangeDesign === 'object' ? item.flangeDesign : {}) || {};

  const designCode = snapshot.designCode || (typeof item.flangeDesign === 'object' ? item.flangeDesign?.designCode : (constructionType === 'BOX' ? 'BOX-001' : ''));
  const designName = snapshot.designName || (typeof item.flangeDesign === 'object' ? item.flangeDesign?.designName : (constructionType === 'BOX' ? 'Box Filter Standard' : ''));
  const referenceImage = snapshot.referenceImage || (typeof item.flangeDesign === 'object' ? item.flangeDesign?.referenceImage : '') || (designCode === 'FLG-002' ? '/flange-designs/flange-design-002.svg' : designCode === 'FLG-003' ? '/flange-designs/flange-design-003.svg' : designCode === 'BOX-001' ? '/flange-designs/box-design-001.svg' : '/flange-designs/flange-design-001.svg');

  const bodyWidth = dims.bodyWidth || dims.width;
  const bodyHeight = dims.bodyHeight || dims.height;
  const depth = dims.depth || dims.length;

  const overallFlangeWidth = dims.overallFlangeWidth || dims.flangeWidth;
  const overallFlangeHeight = dims.overallFlangeHeight || dims.flangeHeight;

  // Validation check on stored values
  let missingError = '';
  if (!bodyWidth || !bodyHeight || !depth || Number(bodyWidth) <= 0 || Number(bodyHeight) <= 0 || Number(depth) <= 0) {
    missingError = 'Engineering dimensions are missing for this Sales Order Item. Please update the source Enquiry/requirement.';
  } else if (constructionType === 'FLANGE') {
    if (!designCode) {
      missingError = 'Engineering dimensions are missing for this Sales Order Item. Please update the source Enquiry/requirement.';
    } else if (!overallFlangeWidth || !overallFlangeHeight || Number(overallFlangeWidth) <= 0 || Number(overallFlangeHeight) <= 0) {
      missingError = 'Engineering dimensions are missing for this Sales Order Item. Please update the source Enquiry/requirement.';
    }
  }

  const activeError = error || missingError;

  const handleGeneratePdf = async () => {
    if (missingError) return;

    setGenerating(true);
    setError('');

    try {
      const response = await api.get(`/sales-orders/${salesOrderId}/items/${item._id}/drawing`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      onClose();
    } catch (err) {
      console.error('Generate PDF error:', err);
      setError(err.response?.data?.message || 'Failed to generate technical drawing PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Technical Drawing Configuration — ${item.description || 'Line Item'}`}
      size="xl"
    >
      {activeError && <Alert type="error" message={activeError} onClose={error ? () => setError('') : undefined} />}

      <div className="space-y-4">
        {/* Top Header Card */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-medium">SO Item: </span>
            <strong className="text-slate-900 font-semibold">{item.description}</strong>
          </div>
          <div className="flex gap-4 text-slate-600">
            <span>Qty: <strong className="text-slate-900">{item.quantity}</strong></span>
            <span>UOM: <strong className="text-slate-900">{item.uom?.uomCode || 'NOS'}</strong></span>
          </div>
        </div>

        {/* Read-Only Construction Header */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-xs text-slate-500 block">Filter Construction:</span>
            <strong className="text-sm text-slate-900 font-bold">{constructionType} Construction</strong>
          </div>

          {constructionType === 'FLANGE' ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-xs text-blue-700 block">Flange Design (From Requirement):</span>
              <strong className="text-sm text-blue-900 font-bold">{designCode} — {designName}</strong>
            </div>
          ) : (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800 flex items-center gap-2">
              <Box size={18} className="text-purple-600 shrink-0" />
              <span><strong>Box Construction:</strong> Standard Box Filter (No Flange).</span>
            </div>
          )}
        </div>

        {/* Read-Only Engineering Dimensions Card */}
        <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Maximize2 size={14} className="text-blue-600" />
              Engineering Dimensions
            </h4>
            <span className="text-[11px] text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Source: Customer Enquiry
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px] font-medium mb-1">Filter Body:</span>
              <div className="text-sm font-bold text-slate-900">
                {bodyWidth ? `${bodyWidth} × ${bodyHeight} × ${depth} mm` : '—'}
              </div>
            </div>

            {constructionType === 'FLANGE' && (
              <div>
                <span className="text-blue-600 block text-[11px] font-medium mb-1">Overall Flange:</span>
                <div className="text-sm font-bold text-blue-900">
                  {overallFlangeWidth ? `${overallFlangeWidth} × ${overallFlangeHeight} mm` : '—'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reference Design Preview */}
        {referenceImage ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon size={15} className="text-blue-600" />
                Reference Design Preview — {designCode} {designName ? `(${designName})` : ''}
              </span>
            </div>

            <div className="flex justify-center bg-white p-3 rounded-lg border border-slate-300">
              <img
                src={referenceImage}
                alt={designName || 'Flange Design'}
                className="max-h-[260px] object-contain rounded"
              />
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            No reference preview image available for this design
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
          <Button variant="secondary" onClick={onClose} disabled={generating}>
            Close
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleGeneratePdf}
            disabled={generating || !!missingError}
          >
            <Printer size={15} className="mr-1.5" />
            {generating ? 'Generating PDF...' : 'Generate Technical Drawing PDF'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TechnicalDrawingModal;
