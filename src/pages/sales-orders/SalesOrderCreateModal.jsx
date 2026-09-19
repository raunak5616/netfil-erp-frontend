import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Input, Select, Textarea, FormField } from '../../components/ui/FormField';
import { getQuotations, getQuotationById } from '../../services/quotationService';
import { createSalesOrder } from '../../services/salesOrderService';
import { Search, Calculator, Calendar, FileText, CheckCircle2, ChevronRight, AlertCircle, ShoppingBag } from 'lucide-react';

const SalesOrderCreateModal = ({ isOpen, onClose, onSuccess }) => {
  const [loadingEligible, setLoadingEligible] = useState(true);
  const [eligibleQuotations, setEligibleQuotations] = useState([]);
  const [quotationSearch, setQuotationSearch] = useState('');

  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  const [selectedQuotationDetails, setSelectedQuotationDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form Fields
  const [customerPoNumber, setCustomerPoNumber] = useState('');
  const [customerPoDate, setCustomerPoDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [remarks, setRemarks] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch eligible quotations (status: accepted or released)
  useEffect(() => {
    if (!isOpen) return;

    const fetchEligible = async () => {
      setLoadingEligible(true);
      setError('');
      try {
        const [acceptedRes, releasedRes] = await Promise.all([
          getQuotations({ status: 'accepted' }),
          getQuotations({ status: 'released' })
        ]);

        let combined = [];
        if (acceptedRes.success && Array.isArray(acceptedRes.quotations)) {
          combined = [...combined, ...acceptedRes.quotations];
        }
        if (releasedRes.success && Array.isArray(releasedRes.quotations)) {
          combined = [...combined, ...releasedRes.quotations];
        }

        // De-duplicate by _id
        const unique = Array.from(new Map(combined.map(q => [q._id, q])).values());
        setEligibleQuotations(unique);
      } catch (err) {
        console.error("Failed to load eligible quotations:", err);
        setError("Failed to load eligible quotations from server.");
      } finally {
        setLoadingEligible(false);
      }
    };

    fetchEligible();
  }, [isOpen]);

  // Load detailed quotation when selected
  const handleSelectQuotation = async (qId) => {
    setSelectedQuotationId(qId);
    if (!qId) {
      setSelectedQuotationDetails(null);
      return;
    }

    setLoadingDetails(true);
    setError('');
    try {
      const res = await getQuotationById(qId);
      if (res.success && res.quotation) {
        const qDoc = res.quotation;
        setSelectedQuotationDetails({
          header: qDoc,
          items: res.items || []
        });

        // Pre-fill terms & dates from quotation
        if (qDoc.paymentTerms) setPaymentTerms(qDoc.paymentTerms);
        if (qDoc.deliveryTerms) setDeliveryTerms(qDoc.deliveryTerms);
        if (qDoc.remarks) setRemarks(qDoc.remarks);
        if (qDoc.validTill) {
          setExpectedDeliveryDate(new Date(qDoc.validTill).toISOString().split('T')[0]);
        }
      } else {
        setError("Could not load selected quotation details.");
      }
    } catch (err) {
      console.error("Failed to load quotation details:", err);
      setError(err.response?.data?.message || "Error fetching quotation details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredQuotations = eligibleQuotations.filter(q => {
    if (!quotationSearch.trim()) return true;
    const term = quotationSearch.toLowerCase();
    const qNo = q.quotationNo ? q.quotationNo.toLowerCase() : '';
    const partyName = q.client?.companyName ? q.client.companyName.toLowerCase() : '';
    return qNo.includes(term) || partyName.includes(term);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedQuotationId) {
      setError("Please select an eligible accepted or released quotation.");
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        quotation: selectedQuotationId,
        customerPoNumber: customerPoNumber.trim(),
        customerPoDate: customerPoDate || null,
        expectedDeliveryDate: expectedDeliveryDate || null,
        paymentTerms: paymentTerms.trim(),
        deliveryTerms: deliveryTerms.trim(),
        remarks: remarks.trim()
      };

      const res = await createSalesOrder(payload);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.message || "Failed to create Sales Order");
      }
    } catch (err) {
      console.error("Create Sales Order error:", err);
      setError(err.response?.data?.message || "Server error while creating Sales Order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Sales Order from Quotation"
      size="lg"
    >
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Step 1: Quotation Selector */}
          <div className="card" style={{ padding: '16px', background: 'var(--neutral-50)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--neutral-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={16} color="var(--primary-600)" />
              Step 1: Select Eligible Quotation
            </h4>

            {loadingEligible ? (
              <div style={{ padding: '12px', color: 'var(--neutral-500)', fontSize: '13px' }}>
                Loading eligible accepted/released quotations...
              </div>
            ) : eligibleQuotations.length === 0 ? (
              <div style={{ padding: '12px', background: 'var(--warning-50)', border: '1px solid var(--warning-200)', borderRadius: '6px', color: 'var(--warning-800)', fontSize: '13px' }}>
                No accepted or released quotations found. Sales Orders can only be generated from quotations in <strong>accepted</strong> or <strong>released</strong> status.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div className="search-input-wrap" style={{ flex: 1 }}>
                    <Search size={14} />
                    <Input
                      placeholder="Search eligible quotation by No or Party..."
                      value={quotationSearch}
                      onChange={(e) => setQuotationSearch(e.target.value)}
                    />
                  </div>

                  <Select
                    value={selectedQuotationId}
                    onChange={(e) => handleSelectQuotation(e.target.value)}
                    style={{ flex: 1.5 }}
                    required
                  >
                    <option value="">-- Select Quotation --</option>
                    {filteredQuotations.map(q => (
                      <option key={q._id} value={q._id}>
                        {q.quotationNo} — {q.client?.companyName || 'N/A'} (₹{(q.grandTotal || 0).toLocaleString('en-IN')}) [{q.status.toUpperCase()}]
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Quotation Snapshot Preview Card */}
          {loadingDetails && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--neutral-500)', fontSize: '13px' }}>
              Fetching quotation details & commercial breakdown...
            </div>
          )}

          {selectedQuotationDetails && (
            <div className="card" style={{ padding: '16px', borderColor: 'var(--primary-200)', background: '#f8fafc' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--primary-800)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="var(--primary-600)" />
                  Step 2: Quotation Commercial Snapshot
                </span>
                <span className="badge badge-success" style={{ textTransform: 'uppercase', fontSize: '11px' }}>
                  {selectedQuotationDetails.header.status}
                </span>
              </h4>

              {/* Quotation Header Meta Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '14px', background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid var(--neutral-200)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Quotation No</div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary-700)' }} className="font-mono">
                    {selectedQuotationDetails.header.quotationNo}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Party / Client</div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--neutral-900)' }}>
                    {selectedQuotationDetails.header.client?.companyName || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Order Category</div>
                  <div style={{ fontSize: '12px', textTransform: 'capitalize', color: 'var(--neutral-800)' }}>
                    {selectedQuotationDetails.header.quotationType} / {selectedQuotationDetails.header.quotationCategory}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Quotation Grand Total</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--success-700)' }}>
                    ₹{(selectedQuotationDetails.header.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Items Preview Table */}
              <div style={{ background: 'white', borderRadius: '6px', border: '1px solid var(--neutral-200)', overflow: 'hidden', marginBottom: '14px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'var(--neutral-100)', textTransform: 'uppercase', fontSize: '10.5px', color: 'var(--neutral-600)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>#</th>
                      <th style={{ padding: '8px 12px' }}>Description</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: '8px 12px' }}>UOM</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Rate (₹)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Line Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuotationDetails.items.map((item, idx) => (
                      <tr key={item._id || idx} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--neutral-500)' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--neutral-900)', fontWeight: 500 }}>
                          {item.description}
                          {item.item?.itemCode && (
                            <span style={{ fontSize: '11px', color: 'var(--neutral-500)', marginLeft: '6px' }} className="font-mono">
                              ({item.item.itemCode})
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{item.quantity}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--neutral-600)' }}>
                          {typeof item.uom === 'object' ? item.uom?.uomCode || item.uom?.uomName || item.uom?.unitSymbol || item.uom?.unitName : 'Units'}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          ₹{(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--neutral-900)' }}>
                          ₹{(item.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Commercial Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid var(--neutral-200)', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--neutral-500)' }}>Subtotal: </span>
                  <strong>₹{(selectedQuotationDetails.header.subtotal || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--neutral-500)' }}>P&F: </span>
                  <strong>₹{(selectedQuotationDetails.header.pfAmount || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--neutral-500)' }}>Freight: </span>
                  <strong>₹{(selectedQuotationDetails.header.freightAmount || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--neutral-500)' }}>Discount: </span>
                  <strong>₹{(selectedQuotationDetails.header.discountAmount || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--neutral-500)' }}>Taxable: </span>
                  <strong>₹{(selectedQuotationDetails.header.taxableAmount || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--neutral-500)' }}>Tax ({selectedQuotationDetails.header.taxName || 'GST'} {selectedQuotationDetails.header.taxRate || 0}%): </span>
                  <strong>₹{(selectedQuotationDetails.header.taxAmount || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
                  <span style={{ color: 'var(--neutral-700)', fontWeight: 600 }}>Grand Total: </span>
                  <strong style={{ fontSize: '14px', color: 'var(--success-700)' }}>
                    ₹{(selectedQuotationDetails.header.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Customer PO & Order Details */}
          {selectedQuotationDetails && (
            <div className="card" style={{ padding: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--neutral-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={16} color="var(--primary-600)" />
                Step 3: Customer Purchase Order & Delivery Terms
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <FormField label="Customer PO Number" helpText="Buyer's purchase order reference">
                  <Input
                    placeholder="e.g. PO-2026-9901"
                    value={customerPoNumber}
                    onChange={(e) => setCustomerPoNumber(e.target.value)}
                  />
                </FormField>

                <FormField label="Customer PO Date">
                  <Input
                    type="date"
                    value={customerPoDate}
                    onChange={(e) => setCustomerPoDate(e.target.value)}
                  />
                </FormField>

                <FormField label="Expected Delivery Date">
                  <Input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  />
                </FormField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <FormField label="Payment Terms">
                  <Input
                    placeholder="e.g. 50% advance, 50% against PI before dispatch"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                  />
                </FormField>

                <FormField label="Delivery Terms">
                  <Input
                    placeholder="e.g. Ex-Works / Door Delivery within 3 weeks"
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Sales Order Remarks / Instructions">
                <Textarea
                  rows={2}
                  placeholder="Additional order instructions or internal notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </FormField>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--neutral-200)' }}>
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedQuotationId || submitting || loadingDetails}
            >
              {submitting ? 'Generating Sales Order...' : 'Confirm & Create Sales Order'}
            </Button>
          </div>

        </div>
      </form>
    </Modal>
  );
};

export default SalesOrderCreateModal;
