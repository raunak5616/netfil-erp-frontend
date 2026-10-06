import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Select, FormField } from '../../components/ui/FormField';
import { getFlangeDesigns } from '../../services/flangeDesignService';
import api from '../../services/api';
import { Printer, Eye, Layers, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

const TechnicalDrawingModal = ({ isOpen, salesOrderId, item, onClose }) => {
  const [constructionType, setConstructionType] = useState('FLANGE');
  const [flangeDesigns, setFlangeDesigns] = useState([]);
  const [flangeDesignId, setFlangeDesignId] = useState('');
  const [loadingDesigns, setLoadingDesigns] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchActiveDesigns = async () => {
      setLoadingDesigns(true);
      setError('');
      try {
        const res = await getFlangeDesigns({ status: 'active' });
        if (res.success && Array.isArray(res.flangeDesigns)) {
          setFlangeDesigns(res.flangeDesigns);
          
          // Pre-select item's saved flangeDesign or default to FLG-001
          const savedDesignId = item?.flangeDesign?._id || item?.flangeDesign;
          const initialConstruction = item?.constructionType || 'FLANGE';
          setConstructionType(initialConstruction);

          if (savedDesignId && res.flangeDesigns.some(d => d._id === savedDesignId)) {
            setFlangeDesignId(savedDesignId);
          } else {
            const defaultFlange = res.flangeDesigns.find(d => d.constructionType === 'FLANGE' && d.designCode === 'FLG-001');
            if (defaultFlange) {
              setFlangeDesignId(defaultFlange._id);
            } else if (res.flangeDesigns.length > 0) {
              setFlangeDesignId(res.flangeDesigns[0]._id);
            }
          }
        } else {
          setError('Failed to fetch Flange Design master records');
        }
      } catch (err) {
        console.error('Error loading flange designs:', err);
        setError('Failed to connect to Flange Design service');
      } finally {
        setLoadingDesigns(false);
      }
    };

    fetchActiveDesigns();
  }, [isOpen, item]);

  const selectedDesignDoc = flangeDesigns.find(d => d._id === flangeDesignId);

  const filteredDesigns = flangeDesigns.filter(d => d.constructionType === constructionType);

  const handleConstructionTypeChange = (newType) => {
    setConstructionType(newType);
    const firstMatching = flangeDesigns.find(d => d.constructionType === newType);
    if (firstMatching) {
      setFlangeDesignId(firstMatching._id);
    } else {
      setFlangeDesignId('');
    }
  };

  const handleGeneratePdf = async () => {
    if (constructionType === 'FLANGE' && !flangeDesignId) {
      setError('Please select a Flange Design for Flange construction type.');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const params = { constructionType };
      if (constructionType === 'FLANGE' && flangeDesignId && flangeDesignId.trim()) {
        params.flangeDesignId = flangeDesignId.trim();
      }

      const response = await api.get(`/sales-orders/${salesOrderId}/items/${item._id}/drawing`, {
        params,
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

  if (!isOpen || !item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Generate Technical Drawing — ${item.description || 'Line Item'}`}
      size="lg"
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="space-y-4">
        {/* Item Summary Card */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-medium">Item Description: </span>
            <strong className="text-slate-900 font-semibold">{item.description}</strong>
          </div>
          <div className="flex gap-3">
            <span>Qty: <strong>{item.quantity}</strong></span>
            <span>Size: <strong>{item.dimensions?.width}x{item.dimensions?.height}x{item.dimensions?.length || item.dimensions?.depth} mm</strong></span>
          </div>
        </div>

        {/* Selection Form Controls */}
        <div className="grid grid-cols-2 gap-4">
          {/* Construction Type Selector */}
          <FormField label="Construction Type" required helpText="Select filter body construction">
            <Select
              value={constructionType}
              onChange={(e) => handleConstructionTypeChange(e.target.value)}
              required
            >
              <option value="FLANGE">FLANGE</option>
              <option value="BOX">BOX</option>
            </Select>
          </FormField>

          {/* Flange Design Selector (Only when FLANGE) */}
          {constructionType === 'FLANGE' ? (
            <FormField label="Flange Design" required helpText="Select exact flange slot & hole geometry">
              {loadingDesigns ? (
                <div className="text-xs text-slate-500 py-2">Loading active flange designs...</div>
              ) : (
                <Select
                  value={flangeDesignId}
                  onChange={(e) => setFlangeDesignId(e.target.value)}
                  required
                >
                  <option value="">-- Select Flange Design --</option>
                  {filteredDesigns.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.designCode} — {d.designName}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 flex items-center">
              <span>Standard Box Filter design (no flange design required).</span>
            </div>
          )}
        </div>

        {/* Dynamic Image / Drawing Reference Preview */}
        {constructionType === 'FLANGE' && selectedDesignDoc ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon size={15} className="text-blue-600" />
                Reference Drawing Preview — {selectedDesignDoc.designCode} ({selectedDesignDoc.designName})
              </span>
              <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                Template: {selectedDesignDoc.drawingTemplate}
              </span>
            </div>

            {selectedDesignDoc.description && (
              <p className="text-[11.5px] text-slate-600 italic">{selectedDesignDoc.description}</p>
            )}

            {selectedDesignDoc.referenceImage ? (
              <div className="flex justify-center bg-white p-3 rounded-lg border border-slate-300 shadow-2xs">
                <img
                  key={selectedDesignDoc._id}
                  src={selectedDesignDoc.referenceImage}
                  alt={selectedDesignDoc.designName}
                  className="max-h-[320px] object-contain rounded animate-fadeIn"
                />
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded border border-dashed border-slate-300">
                No reference preview image available for this design
              </div>
            )}
          </div>
        ) : constructionType === 'BOX' ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon size={15} className="text-purple-600" />
                Reference Drawing Preview — Box Filter Standard
              </span>
              <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                Template: BOX_FILTER
              </span>
            </div>
            <div className="flex justify-center bg-white p-3 rounded-lg border border-slate-300 shadow-2xs">
              <img
                src="/flange-designs/box-design-001.svg"
                alt="Box Filter Standard"
                className="max-h-[320px] object-contain rounded animate-fadeIn"
              />
            </div>
          </div>
        ) : null}

        {/* Modal Actions */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
          <Button variant="secondary" onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleGeneratePdf}
            disabled={generating || (constructionType === 'FLANGE' && !flangeDesignId)}
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
