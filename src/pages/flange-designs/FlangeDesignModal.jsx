import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input, Select, Textarea, FormField } from '../../components/ui/FormField';
import { createFlangeDesign, updateFlangeDesign } from '../../services/flangeDesignService';

const FlangeDesignModal = ({ isOpen, flangeDesign, onClose, onSuccess }) => {
  const isEditing = Boolean(flangeDesign);

  const [designCode, setDesignCode] = useState('');
  const [designName, setDesignName] = useState('');
  const [constructionType, setConstructionType] = useState('FLANGE');
  const [description, setDescription] = useState('');
  const [referenceImage, setReferenceImage] = useState('');
  const [referenceDrawing, setReferenceDrawing] = useState('');
  const [drawingTemplate, setDrawingTemplate] = useState('FLANGE_TEMPLATE_001');
  const [status, setStatus] = useState('active');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (flangeDesign && isOpen) {
      setDesignCode(flangeDesign.designCode || '');
      setDesignName(flangeDesign.designName || '');
      setConstructionType(flangeDesign.constructionType || 'FLANGE');
      setDescription(flangeDesign.description || '');
      setReferenceImage(flangeDesign.referenceImage || '');
      setReferenceDrawing(flangeDesign.referenceDrawing || '');
      setDrawingTemplate(flangeDesign.drawingTemplate || 'FLANGE_TEMPLATE_001');
      setStatus(flangeDesign.status || 'active');
    } else {
      setDesignCode('');
      setDesignName('');
      setConstructionType('FLANGE');
      setDescription('');
      setReferenceImage('');
      setReferenceDrawing('');
      setDrawingTemplate('FLANGE_TEMPLATE_001');
      setStatus('active');
    }
  }, [flangeDesign, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!designCode.trim()) {
      setError('Design Code is required');
      return;
    }
    if (!designName.trim()) {
      setError('Design Name is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        designCode: designCode.trim().toUpperCase(),
        designName: designName.trim(),
        constructionType,
        description: description.trim(),
        referenceImage: referenceImage.trim(),
        referenceDrawing: referenceDrawing.trim() || referenceImage.trim(),
        drawingTemplate: drawingTemplate.trim(),
        status
      };

      let res;
      if (isEditing) {
        res = await updateFlangeDesign(flangeDesign._id, payload);
      } else {
        res = await createFlangeDesign(payload);
      }

      if (res.success) {
        onSuccess();
      } else {
        setError(res.message || 'Failed to save Flange Design');
      }
    } catch (err) {
      console.error('Save Flange Design error:', err);
      setError(err.response?.data?.message || 'Server error saving Flange Design');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Flange Design — ${flangeDesign?.designCode}` : 'Add New Flange Design'}
      size="md"
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Design Code" required helpText="e.g. FLG-001, FLG-002">
            <Input
              placeholder="e.g. FLG-001"
              value={designCode}
              onChange={(e) => setDesignCode(e.target.value)}
              disabled={isEditing}
              required
            />
          </FormField>

          <FormField label="Construction Type" required>
            <Select
              value={constructionType}
              onChange={(e) => {
                const val = e.target.value;
                setConstructionType(val);
                if (val === 'BOX') {
                  setDrawingTemplate('BOX_FILTER');
                } else if (drawingTemplate === 'BOX_FILTER') {
                  setDrawingTemplate('FLANGE_TEMPLATE_001');
                }
              }}
            >
              <option value="FLANGE">FLANGE</option>
              <option value="BOX">BOX</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Design Name" required>
          <Input
            placeholder="e.g. Flange Design 1 (No Holes)"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Description">
          <Textarea
            rows={2}
            placeholder="Technical details of flange construction, slot size, hole layout..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Reference Image URL / Path">
            <Input
              placeholder="e.g. /flange-designs/flange-design-001.png"
              value={referenceImage}
              onChange={(e) => setReferenceImage(e.target.value)}
            />
          </FormField>

          <FormField label="Drawing Template Key">
            <Select
              value={drawingTemplate}
              onChange={(e) => setDrawingTemplate(e.target.value)}
            >
              <option value="FLANGE_TEMPLATE_001">FLANGE_TEMPLATE_001 (No Holes)</option>
              <option value="FLANGE_TEMPLATE_002">FLANGE_TEMPLATE_002 (4 Slots Centre)</option>
              <option value="FLANGE_TEMPLATE_003">FLANGE_TEMPLATE_003 (4 Slots + Tabs)</option>
              <option value="BOX_FILTER">BOX_FILTER (Standard Box)</option>
            </Select>
          </FormField>
        </div>

        {referenceImage && (
          <div className="p-2 border border-slate-200 rounded bg-slate-50">
            <span className="block text-[11px] font-semibold text-slate-500 mb-1">Image Preview:</span>
            <img
              src={referenceImage}
              alt="Design Preview"
              className="max-h-36 object-contain rounded border border-slate-300 bg-white mx-auto"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}

        <FormField label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FormField>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Flange Design'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FlangeDesignModal;
