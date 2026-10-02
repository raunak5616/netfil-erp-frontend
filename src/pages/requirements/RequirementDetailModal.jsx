import React from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { 
  Building2, 
  Calendar, 
  User, 
  Package, 
  FileText, 
  Clock, 
  Edit, 
  Phone, 
  Mail, 
  MapPin,
  Tag
} from 'lucide-react';

const RequirementDetailModal = ({ requirement, isOpen, onClose, onEdit, canEdit }) => {
  if (!isOpen || !requirement) return null;

  const party = typeof requirement.client === 'object' ? requirement.client : null;
  const item = typeof requirement.item === 'object' ? requirement.item : null;
  const category = typeof requirement.itemCategory === 'object' ? requirement.itemCategory : null;
  const uom = typeof requirement.uom === 'object' ? requirement.uom : null;
  const salesPerson = typeof requirement.salesPerson === 'object' ? requirement.salesPerson : null;
  const createdBy = typeof requirement.createdBy === 'object' ? requirement.createdBy : null;
  const updatedBy = typeof requirement.updatedBy === 'object' ? requirement.updatedBy : null;

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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  // Map backend status enum to label and Badge variant
  const getStatusDisplay = (st) => {
    switch (st) {
      case 'draft':
        return { label: 'Draft', badgeStatus: 'draft' };
      case 'quotation_pending':
        return { label: 'Quotation Pending', badgeStatus: 'pending' };
      case 'quoted':
        return { label: 'Quoted', badgeStatus: 'info' };
      case 'follow_up':
        return { label: 'Follow Up', badgeStatus: 'warning' };
      case 'won':
        return { label: 'Won', badgeStatus: 'active' };
      case 'lost':
        return { label: 'Lost', badgeStatus: 'inactive' };
      case 'cancelled':
        return { label: 'Cancelled', badgeStatus: 'cancelled' };
      default:
        return { label: st || 'Unknown', badgeStatus: 'neutral' };
    }
  };

  const statusInfo = getStatusDisplay(requirement.status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>Requirement Details</span>
          <span className="font-mono" style={{ color: 'var(--primary-700)', fontSize: '15px' }}>
            ({requirement.requirementNo})
          </span>
        </div>
      }
      maxWidth="720px"
      footer={
        <>
          {canEdit && (
            <Button
              variant="primary"
              icon={Edit}
              onClick={() => {
                onClose();
                onEdit(requirement);
              }}
            >
              Edit Requirement
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* SUMMARY BAR */}
        <div
          style={{
            backgroundColor: 'var(--neutral-50)',
            padding: '12px 16px',
            borderRadius: '6px',
            border: '1px solid var(--neutral-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 600 }}>
              Enquiry No & Date
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--neutral-900)' }}>
              {requirement.requirementNo}{' '}
              <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--neutral-600)' }}>
                ({formatDate(requirement.requirementDate)})
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 600, marginBottom: '2px' }}>
              Workflow Status
            </div>
            <StatusBadge status={statusInfo.badgeStatus} label={statusInfo.label} />
          </div>

          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 600 }}>
              Enquiry Type
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-800)', textTransform: 'capitalize' }}>
              {requirement.type || 'Product'} Enquiry
            </div>
          </div>
        </div>

        {/* SECTION 1: PARTY / CLIENT INFORMATION */}
        <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ backgroundColor: 'var(--neutral-100)', padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: 'var(--neutral-800)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={14} color="var(--primary-700)" /> PARTY / CUSTOMER INFORMATION
          </div>

          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Party Name / Company</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-900)' }}>
                {party ? party.companyName : '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Party Code</div>
              <div className="font-mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-700)' }}>
                {party ? party.clientCode : '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Contact Person</div>
              <div style={{ fontSize: '12.5px', color: 'var(--neutral-800)' }}>
                {party?.contactPerson || '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Mobile / Email</div>
              <div style={{ fontSize: '12.5px', color: 'var(--neutral-800)', display: 'flex', flexDirection: 'column' }}>
                {party?.mobile && <span>Ph: {party.mobile}</span>}
                {party?.email && <span>Email: {party.email}</span>}
                {!party?.mobile && !party?.email && '—'}
              </div>
            </div>

            {(party?.address || party?.city || party?.state) && (
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Address / Location</div>
                <div style={{ fontSize: '12.5px', color: 'var(--neutral-800)' }}>
                  {[party.address, party.city, party.state, party.pincode].filter(Boolean).join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: PRODUCT & TECHNICAL SPECIFICATIONS */}
        {requirement.type === 'product' ? (
          <>
            {/* CATALOG ITEM MASTER DATA (If Catalog Item selected) */}
            {item && (
              <div style={{ border: '1px solid var(--primary-200)', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--primary-50)' }}>
                <div style={{ backgroundColor: '#eff6ff', padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: 'var(--primary-900)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--primary-200)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Package size={14} className="text-blue-700" />
                    <span>CATALOG PRODUCT / ITEM DETAILS</span>
                  </div>
                  <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 font-bold">
                    ITEM MASTER REFERENCE
                  </span>
                </div>

                <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#ffffff' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 600 }}>Item Name</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--neutral-900)' }}>
                      {item.itemName}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 600 }}>Item Code</div>
                    <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-700)' }}>
                      {item.itemCode}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 600 }}>Standard Category</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--neutral-800)' }}>
                      {item.itemCategory?.categoryName || category?.categoryName ? (
                        `${item.itemCategory?.categoryName || category?.categoryName} (${item.itemCategory?.categoryCode || category?.categoryCode || ''})`
                      ) : '—'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 600 }}>Standard Unit of Measure (UOM)</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--neutral-800)' }}>
                      {item.salesUom?.uomName || item.inventoryUom?.uomName || uom?.uomName ? (
                        `${item.salesUom?.uomName || item.inventoryUom?.uomName || uom?.uomName} (${item.salesUom?.uomCode || item.inventoryUom?.uomCode || uom?.uomCode || ''})`
                      ) : '—'}
                    </div>
                  </div>

                  {/* Filter Grade Section if present on item */}
                  {item.filterGrade && (
                    <div style={{ gridColumn: 'span 2', marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed var(--neutral-200)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Tag size={13} /> Filter Grade Master Specification
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', backgroundColor: 'var(--neutral-50)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--neutral-200)', fontSize: '12px' }}>
                        <div>
                          <span style={{ color: 'var(--neutral-500)' }}>Grade: </span>
                          <strong style={{ color: 'var(--neutral-900)' }}>{item.filterGrade.filterGrade || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--neutral-500)' }}>EUROVENT: </span>
                          <strong style={{ color: 'var(--primary-700)' }}>{item.filterGrade.eurovent || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--neutral-500)' }}>ISO 16890: </span>
                          <strong style={{ color: 'var(--primary-700)' }}>{item.filterGrade.iso || '—'}</strong>
                        </div>
                      </div>

                      {/* Grade Variants specs if available */}
                      {Array.isArray(item.filterGrade.variants) && item.filterGrade.variants.length > 0 && (
                        <div style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--neutral-700)' }}>
                          <span style={{ fontWeight: 600, color: 'var(--neutral-800)' }}>Technical Parameters: </span>
                          {item.filterGrade.variants.map((v, i) => (
                            <span key={i} className="mr-3">
                              {v.filterClass ? `Class: ${v.filterClass}` : ''} 
                              {v.efficiency ? ` | Eff: ${v.efficiency}` : ''}
                              {v.initialPressureDrop ? ` | Initial PD: ${v.initialPressureDrop}` : ''}
                              {v.finalPressureDrop ? ` | Final PD: ${v.finalPressureDrop}` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CUSTOMER REQUIREMENT SECTION */}
            <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: 'var(--neutral-100)', padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: 'var(--neutral-800)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} color="var(--primary-700)" /> CUSTOMER-SPECIFIC REQUIREMENT
              </div>

              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Requested Quantity</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--neutral-900)' }}>
                      {requirement.quantity !== null ? requirement.quantity : '—'}{' '}
                      <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--neutral-600)' }}>
                        {uom ? `${uom.uomName} (${uom.uomCode})` : ''}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Customer Dimensions</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-800)' }}>
                      {requirement.dimensions && (requirement.dimensions.length || requirement.dimensions.width || requirement.dimensions.height) ? (
                        <span>
                          {requirement.dimensions.length || '—'} × {requirement.dimensions.width || '—'} × {requirement.dimensions.height || '—'}{' '}
                          {requirement.dimensions.unit || 'mm'}
                        </span>
                      ) : (
                        '— (Standard Dimensions)'
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Specifications */}
                {Array.isArray(requirement.specifications) && requirement.specifications.length > 0 && (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--neutral-700)', marginBottom: '4px' }}>
                      Additional Customer Specifications:
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid var(--neutral-200)' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--neutral-50)' }}>
                          <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid var(--neutral-200)', width: '40%' }}>
                            Parameter / Feature
                          </th>
                          <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid var(--neutral-200)' }}>
                            Target Requirement
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {requirement.specifications.map((spec, idx) => {
                          const key = typeof spec === 'object' ? (spec.key || spec.name || 'Spec') : 'Spec';
                          const val = typeof spec === 'object' ? (spec.value || spec.val || '') : String(spec);
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                              <td style={{ padding: '6px 10px', fontWeight: 600, color: 'var(--neutral-800)' }}>{key}</td>
                              <td style={{ padding: '6px 10px', color: 'var(--neutral-700)' }}>{val}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {requirement.remarks && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--neutral-500)', marginTop: '4px' }}>Customer Remarks / Special Instructions</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--neutral-800)', fontStyle: 'italic', backgroundColor: 'var(--neutral-50)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
                      "{requirement.remarks}"
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: 'var(--neutral-100)', padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: 'var(--neutral-800)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={14} color="var(--primary-700)" /> SERVICE ENQUIRY DETAILS
            </div>

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Service Description / Scope</div>
                <div style={{ fontSize: '13px', color: 'var(--neutral-800)', whiteSpace: 'pre-wrap', backgroundColor: 'var(--neutral-50)', padding: '8px 10px', borderRadius: '4px', marginTop: '4px', border: '1px solid var(--neutral-200)' }}>
                  {requirement.serviceDescription || '—'}
                </div>
              </div>

              {requirement.remarks && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--neutral-500)', marginTop: '4px' }}>Remarks / Internal Notes</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--neutral-800)', fontStyle: 'italic', backgroundColor: 'var(--neutral-50)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
                    "{requirement.remarks}"
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 3: ASSIGNMENT & SYSTEM AUDIT */}
        <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ backgroundColor: 'var(--neutral-100)', padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: 'var(--neutral-800)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} color="var(--primary-700)" /> ASSIGNMENT & AUDIT METADATA
          </div>

          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
            <div>
              <span style={{ color: 'var(--neutral-500)' }}>Sales Person: </span>
              <strong style={{ color: 'var(--neutral-900)' }}>
                {salesPerson ? `${salesPerson.fullName} (${salesPerson.employeeCode})` : 'Unassigned'}
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--neutral-500)' }}>Follow-up Target Date: </span>
              <strong style={{ color: 'var(--neutral-900)' }}>{formatDate(requirement.followUpDate)}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--neutral-500)' }}>Created By: </span>
              <span>{createdBy ? (createdBy.username || createdBy.email) : 'System'} ({formatDateTime(requirement.createdAt)})</span>
            </div>

            <div>
              <span style={{ color: 'var(--neutral-500)' }}>Last Updated: </span>
              <span>{updatedBy ? (updatedBy.username || updatedBy.email) : 'System'} ({formatDateTime(requirement.updatedAt)})</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RequirementDetailModal;
