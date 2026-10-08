import React, { useState } from 'react';
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
  Tag,
  Maximize2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const RequirementDetailModal = ({ requirement, isOpen, onClose, onEdit, onCreateQuotation, canEdit }) => {
  if (!isOpen || !requirement) return null;

  const party = typeof requirement.client === 'object' ? requirement.client : null;
  const salesPerson = typeof requirement.salesPerson === 'object' ? requirement.salesPerson : null;
  const createdBy = typeof requirement.createdBy === 'object' ? requirement.createdBy : null;
  const updatedBy = typeof requirement.updatedBy === 'object' ? requirement.updatedBy : null;

  // Track expanded state for items in detail view
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = (idx) => {
    setExpandedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
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

  // Normalize items array
  const itemList = Array.isArray(requirement.items) && requirement.items.length > 0
    ? requirement.items
    : [{
        itemCategory: requirement.itemCategory,
        item: requirement.item,
        quantity: requirement.quantity,
        uom: requirement.uom,
        constructionType: requirement.constructionType,
        flangeDesign: requirement.flangeDesign,
        flangeDesignSnapshot: requirement.flangeDesignSnapshot,
        dimensions: requirement.dimensions,
        specifications: requirement.specifications,
        remarks: requirement.remarks,
      }];

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
      maxWidth="780px"
      footer={
        <>
          {onCreateQuotation && (
            <Button
              variant="primary"
              icon={FileText}
              onClick={() => {
                onClose();
                onCreateQuotation(requirement);
              }}
            >
              Create Quotation
            </Button>
          )}
          {canEdit && (
            <Button
              variant="secondary"
              icon={Edit}
              onClick={() => {
                onClose();
                onEdit(requirement);
              }}
            >
              Edit Requirement
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
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
              {requirement.type || 'Product'} Enquiry ({itemList.length} {itemList.length === 1 ? 'Item' : 'Items'})
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

        {/* SECTION 2: PRODUCT & TECHNICAL SPECIFICATIONS (MULTIPLE ITEMS SUPPORT) */}
        {requirement.type === 'product' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={14} /> Enquiry Items ({itemList.length})
            </div>

            {itemList.map((reqItem, idx) => {
              const itemObj = typeof reqItem.item === 'object' ? reqItem.item : null;
              const catObj = typeof reqItem.itemCategory === 'object' ? reqItem.itemCategory : null;
              const uomObj = typeof reqItem.uom === 'object' ? reqItem.uom : null;
              const flangeObj = typeof reqItem.flangeDesign === 'object' ? reqItem.flangeDesign : null;
              const isCollapsed = expandedItems[idx] === false;

              let summaryTitle = itemObj ? itemObj.itemName : `Filter Requirement ${idx + 1}`;
              const constTypeStr = (reqItem.constructionType || reqItem.dimensions?.constructionType || 'FLANGE').toUpperCase();
              const dimsStr = reqItem.dimensions?.bodyWidth ? `${reqItem.dimensions.bodyWidth}×${reqItem.dimensions.bodyHeight}×${reqItem.dimensions.depth || '0'}mm` : '';

              return (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--neutral-300)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff',
                  }}
                >
                  {/* ITEM CARD ACCORDION HEADER */}
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#f8fafc',
                      borderBottom: !isCollapsed ? '1px solid var(--neutral-200)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleExpand(idx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>
                        Item #{idx + 1}
                      </span>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--neutral-900)' }}>
                        {summaryTitle}
                      </span>
                      {dimsStr && (
                        <span style={{ fontSize: '11.5px', color: 'var(--neutral-600)', fontFamily: 'monospace' }}>
                          ({dimsStr})
                        </span>
                      )}
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: constTypeStr === 'FLANGE' ? '#e0f2fe' : '#f3e8ff', color: constTypeStr === 'FLANGE' ? '#0369a1' : '#6b21a8' }}>
                        {constTypeStr}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-800)' }}>
                        Qty: {reqItem.quantity !== null && reqItem.quantity !== undefined ? reqItem.quantity : '—'} {uomObj ? uomObj.uomCode : ''}
                      </span>
                      {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </div>
                  </div>

                  {/* ITEM CARD EXPANDED DETAILS */}
                  {!isCollapsed && (
                    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* CATALOG ITEM DETAILS */}
                      {itemObj && (
                        <div style={{ border: '1px solid var(--primary-200)', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--primary-50)' }}>
                          <div style={{ backgroundColor: '#eff6ff', padding: '6px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--primary-900)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--primary-200)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Package size={13} className="text-blue-700" />
                              <span>CATALOG ITEM REFERENCE</span>
                            </div>
                            <span className="font-mono text-[10px]">Item Master</span>
                          </div>

                          <div style={{ padding: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#ffffff', fontSize: '12px' }}>
                            <div>
                              <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>Item Name & Code</span>
                              <strong style={{ color: 'var(--neutral-900)' }}>{itemObj.itemName}</strong> <span className="font-mono text-blue-700">({itemObj.itemCode})</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>Category & UOM</span>
                              <span>{catObj?.categoryName || itemObj.itemCategory?.categoryName || '—'} | {uomObj?.uomName || itemObj.salesUom?.uomName || '—'}</span>
                            </div>

                            {itemObj.filterGrade && (
                              <div style={{ gridColumn: 'span 2', paddingTop: '6px', borderTop: '1px dashed var(--neutral-200)' }}>
                                <span style={{ color: 'var(--neutral-500)', fontSize: '11px' }}>Filter Grade: </span>
                                <strong>{typeof itemObj.filterGrade === 'object' ? itemObj.filterGrade.filterGrade : itemObj.filterGrade}</strong>
                                {typeof itemObj.filterGrade === 'object' && itemObj.filterGrade.eurovent ? ` (${itemObj.filterGrade.eurovent})` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* TECHNICAL & ENGINEERING DIMENSION SPECIFICATIONS */}
                      <div style={{ padding: '10px', backgroundColor: 'var(--neutral-50)', borderRadius: '6px', border: '1px solid var(--neutral-200)' }}>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Maximize2 size={14} /> ENGINEERING DIMENSION SPECIFICATION
                          </span>
                          <span style={{ fontSize: '10.5px', fontFamily: 'monospace', color: 'var(--neutral-500)' }}>Unit: mm</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px', backgroundColor: '#ffffff', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
                          <div>
                            <span style={{ color: 'var(--neutral-500)', fontSize: '11px', display: 'block' }}>A. Filter Body Dimensions</span>
                            <strong style={{ color: 'var(--neutral-900)' }}>
                              {reqItem.dimensions?.bodyWidth || reqItem.dimensions?.width || '—'} × {reqItem.dimensions?.bodyHeight || reqItem.dimensions?.height || '—'} × {reqItem.dimensions?.depth || reqItem.dimensions?.length || '—'} mm
                            </strong>
                          </div>

                          {constTypeStr === 'FLANGE' && (
                            <div>
                              <span style={{ color: 'var(--primary-700)', fontSize: '11px', display: 'block' }}>B. Overall Flange Dimensions</span>
                              <strong style={{ color: 'var(--primary-800)' }}>
                                {reqItem.dimensions?.overallFlangeWidth || reqItem.dimensions?.flangeWidth || '—'} × {reqItem.dimensions?.overallFlangeHeight || reqItem.dimensions?.flangeHeight || '—'} mm
                              </strong>
                            </div>
                          )}
                        </div>

                        {/* Flange Design & Reference Preview */}
                        {constTypeStr === 'FLANGE' && (
                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--neutral-200)' }}>
                            <div style={{ fontSize: '11.5px', color: 'var(--neutral-700)', marginBottom: '4px' }}>
                              Flange Design Master: <strong style={{ color: 'var(--neutral-900)' }}>
                                {reqItem.flangeDesignSnapshot?.designCode || flangeObj?.designCode || 'FLG-001'} — {reqItem.flangeDesignSnapshot?.designName || flangeObj?.designName || 'Flange Design'}
                              </strong>
                            </div>
                            {(reqItem.flangeDesignSnapshot?.referenceImage || flangeObj?.referenceImage) && (
                              <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#ffffff', padding: '8px', borderRadius: '4px', border: '1px solid var(--neutral-200)', marginTop: '4px' }}>
                                <img
                                  src={reqItem.flangeDesignSnapshot?.referenceImage || flangeObj?.referenceImage}
                                  alt="Reference Design Preview"
                                  style={{ maxHeight: '140px', objectFit: 'contain' }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Item Specifications */}
                      {Array.isArray(reqItem.specifications) && reqItem.specifications.length > 0 && (
                        <div>
                          <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--neutral-700)', marginBottom: '4px' }}>
                            Item Custom Specifications:
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
                              {reqItem.specifications.map((spec, specIdx) => {
                                const key = typeof spec === 'object' ? (spec.key || spec.name || 'Spec') : 'Spec';
                                const val = typeof spec === 'object' ? (spec.value || spec.val || '') : String(spec);
                                return (
                                  <tr key={specIdx} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                                    <td style={{ padding: '5px 10px', fontWeight: 600, color: 'var(--neutral-800)' }}>{key}</td>
                                    <td style={{ padding: '5px 10px', color: 'var(--neutral-700)' }}>{val}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {reqItem.remarks && (
                        <div style={{ fontSize: '12px', color: 'var(--neutral-800)', fontStyle: 'italic', backgroundColor: 'var(--neutral-50)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
                          Item Remarks: "{reqItem.remarks}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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

        {/* OVERALL REMARKS IF PRODUCT TYPE */}
        {requirement.type === 'product' && requirement.remarks && (
          <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '6px', padding: '10px', backgroundColor: 'var(--neutral-50)' }}>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 600 }}>Overall Customer Remarks / Instructions</div>
            <div style={{ fontSize: '12.5px', color: 'var(--neutral-800)', fontStyle: 'italic', marginTop: '2px' }}>
              "{requirement.remarks}"
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
