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

        {/* SECTION 2: REQUIREMENT SPECIFICATIONS */}
        <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ backgroundColor: 'var(--neutral-100)', padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: 'var(--neutral-800)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Package size={14} color="var(--primary-700)" /> REQUIREMENT & TECHNICAL DETAILS
          </div>

          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {requirement.type === 'product' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Catalog Item</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-900)' }}>
                      {item ? item.itemName : '— (Custom Filter)'}
                    </div>
                    {item?.itemCode && (
                      <div className="font-mono" style={{ fontSize: '11.5px', color: 'var(--primary-700)' }}>
                        Code: {item.itemCode}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Item Category</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--neutral-800)' }}>
                      {category ? `${category.categoryName} (${category.categoryCode})` : '—'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Quantity & UOM</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--neutral-900)' }}>
                      {requirement.quantity !== null ? requirement.quantity : '—'}{' '}
                      <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--neutral-600)' }}>
                        {uom ? `${uom.uomName} (${uom.uomCode})` : ''}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Physical Dimensions</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--neutral-800)' }}>
                      {requirement.dimensions && (requirement.dimensions.length || requirement.dimensions.width || requirement.dimensions.height) ? (
                        <span>
                          {requirement.dimensions.length || '—'} × {requirement.dimensions.width || '—'} × {requirement.dimensions.height || '—'}{' '}
                          {requirement.dimensions.unit || 'mm'}
                        </span>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Service Description / Scope</div>
                <div style={{ fontSize: '13px', color: 'var(--neutral-800)', whiteSpace: 'pre-wrap', backgroundColor: 'var(--neutral-50)', padding: '8px 10px', borderRadius: '4px', marginTop: '4px' }}>
                  {requirement.serviceDescription || '—'}
                </div>
              </div>
            )}

            {/* Specifications Table */}
            {Array.isArray(requirement.specifications) && requirement.specifications.length > 0 && (
              <div style={{ marginTop: '6px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--neutral-700)', marginBottom: '4px' }}>
                  Technical Specifications:
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
                <div style={{ fontSize: '11px', color: 'var(--neutral-500)', marginTop: '4px' }}>Remarks / Internal Notes</div>
                <div style={{ fontSize: '12.5px', color: 'var(--neutral-800)', fontStyle: 'italic', backgroundColor: 'var(--neutral-50)', padding: '6px 10px', borderRadius: '4px' }}>
                  "{requirement.remarks}"
                </div>
              </div>
            )}
          </div>
        </div>

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
