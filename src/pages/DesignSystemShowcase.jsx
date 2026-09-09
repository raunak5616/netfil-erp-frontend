import React, { useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { FormField, Input, Select, Textarea } from '../components/ui/FormField';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import Tabs from '../components/ui/Tabs';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Layers, 
  CheckCircle, 
  HelpCircle, 
  Filter, 
  Eye 
} from 'lucide-react';

const DesignSystemShowcase = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Modal & Overlay States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: 'SPEC-001',
    name: 'Standard Stainless Filter Mesh',
    type: 'Raw Material',
    notes: 'Specification notes for quality assurance...',
    status: 'active',
  });

  // Table Sample Data
  const sampleColumns = [
    { key: 'code', header: 'Item Code', width: '120px', render: (val) => <span className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{val}</span> },
    { key: 'name', header: 'Item Name', width: '220px', render: (val) => <strong style={{ color: 'var(--neutral-900)' }}>{val}</strong> },
    { key: 'category', header: 'Category', width: '140px' },
    { key: 'stock', header: 'Stock Level', width: '100px', align: 'right', render: (val) => `${val} NOS` },
    { key: 'status', header: 'Status', width: '120px', render: (val) => <StatusBadge status={val} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '140px',
      render: (_, row) => (
        <div style={{ display: 'inline-flex', gap: '4px' }}>
          <Button variant="ghost" size="sm" icon={Eye} onClick={() => setIsDrawerOpen(true)}>
            View
          </Button>
          <Button variant="ghost" size="sm" icon={Edit} onClick={() => setIsModalOpen(true)}>
            Edit
          </Button>
        </div>
      ),
    },
  ];

  const sampleData = [
    { _id: '1', code: 'ITM-1001', name: 'Pleated Filter Cartridge 10"', category: 'Finished Goods', stock: 450, status: 'active' },
    { _id: '2', code: 'ITM-1002', name: 'Stainless Steel Wire Mesh 304', category: 'Raw Material', stock: 1200, status: 'approved' },
    { _id: '3', code: 'ITM-1003', name: 'High Temp Gasket Ring Ø50', category: 'Components', stock: 85, status: 'pending' },
    { _id: '4', code: 'ITM-1004', name: 'Polypropylene Core Tube', category: 'Raw Material', stock: 0, status: 'inactive' },
    { _id: '5', code: 'ITM-1005', name: 'Custom Hydraulic Filter Assembly', category: 'Assemblies', stock: 12, status: 'in-progress' },
  ];

  const handleConfirmAction = () => {
    setConfirmLoading(true);
    setTimeout(() => {
      setConfirmLoading(false);
      setIsConfirmOpen(false);
    }, 1000);
  };

  return (
    <div>
      <PageHeader
        title="UI/UX Design System Foundation"
        description="Restrained, high-density enterprise ERP components and design patterns."
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'System' },
          { label: 'UI Design System' },
        ]}
        actions={
          <>
            <Button variant="secondary" icon={HelpCircle}>
              Documentation
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
              Test Modal Dialog
            </Button>
          </>
        }
      />

      {/* Tabs Navigation */}
      <Tabs
        tabs={[
          { key: 'overview', label: 'Component Showcase', icon: Layers },
          { key: 'table-demo', label: 'Data Table & Pagination', count: sampleData.length },
          { key: 'forms-demo', label: 'Form Controls & Inputs' },
          { key: 'overlays-demo', label: 'Modals & Drawers' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB 1: OVERVIEW SHOWCASE */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Alert Banners */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">1. Notification & Alert Banners</h3>
            </div>
            <Alert type="info" title="ERP System Status" message="Restrained enterprise design system initialized. No decorative bloat or heavy animations." />
            <Alert type="success" title="Success State" message="Employee module and design tokens loaded successfully." />
            <Alert type="warning" title="Warning" message="Please review form inputs before saving critical inventory adjustments." />
            <Alert type="danger" title="Validation Error" message="Database contract check complete. Backend logic untouched." />
          </div>

          {/* Button Variants */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">2. Button Variants & Sizes</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Button variant="primary">Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="outline">Outline Variant</Button>
                <Button variant="danger" icon={Trash2}>Delete Record</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="primary" loading>Saving...</Button>
                <Button variant="secondary" disabled>Disabled State</Button>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="text-muted" style={{ fontSize: '12px', width: '80px' }}>Sizes:</span>
                <Button variant="primary" size="sm">Small (28px)</Button>
                <Button variant="primary" size="md">Medium (34px)</Button>
                <Button variant="primary" size="lg">Large (40px)</Button>
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">3. Status Indicators & Badges</h3>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <StatusBadge status="active" />
              <StatusBadge status="approved" />
              <StatusBadge status="completed" />
              <StatusBadge status="pending" />
              <StatusBadge status="draft" />
              <StatusBadge status="in-progress" />
              <StatusBadge status="inactive" />
              <StatusBadge status="rejected" />
              <StatusBadge status="cancelled" />
              <StatusBadge status="neutral" label="Custom Label" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATA TABLE DEMO */}
      {activeTab === 'table-demo' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Enterprise Data Table Pattern</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" size="sm" icon={Filter}>Filter</Button>
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsConfirmOpen(true)}>
                Test Confirm Prompt
              </Button>
            </div>
          </div>

          <div className="toolbar">
            <div className="search-input-wrap">
              <Search size={16} />
              <Input placeholder="Quick search table records..." />
            </div>
            <Select style={{ width: '180px' }}>
              <option value="all">All Categories</option>
              <option value="raw">Raw Material</option>
              <option value="finished">Finished Goods</option>
            </Select>
          </div>

          <DataTable
            columns={sampleColumns}
            data={sampleData}
            pagination={{
              currentPage: 1,
              totalPages: 5,
              totalRecords: 48,
              onPageChange: (p) => console.log('Page change:', p),
            }}
          />
        </div>
      )}

      {/* TAB 3: FORM CONTROLS */}
      {activeTab === 'forms-demo' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Office ERP Form Controls</h3>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="form-grid">
            <FormField label="Specification Code" required helperText="Unique code identifier">
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </FormField>

            <FormField label="Item Full Name" required>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>

            <FormField label="Classification Type" required>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Raw Material">Raw Material</option>
                <option value="Finished Goods">Finished Goods</option>
                <option value="Assemblies">Assemblies</option>
              </Select>
            </FormField>

            <FormField label="Record Status" required>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>

            <FormField label="Field Validation Error Example" error="This field is required by ERP business rules." fullWidth>
              <Input hasError value="Invalid entry text" readOnly />
            </FormField>

            <FormField label="Internal Technical Specification Notes" fullWidth>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </FormField>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <Button variant="secondary">Reset Defaults</Button>
              <Button variant="primary" icon={CheckCircle}>Save Specification</Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: OVERLAYS */}
      {activeTab === 'overlays-demo' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-header">
            <h3 className="card-title">Modal, Drawer, & Confirm Dialog Overlays</h3>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Open Test Modal
            </Button>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>
              Open Test Side Drawer
            </Button>
            <Button variant="danger" icon={Trash2} onClick={() => setIsConfirmOpen(true)}>
              Open Confirmation Prompt
            </Button>
          </div>
        </div>
      )}

      {/* REUSABLE TEST MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Test ERP Modal Window"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>Save Changes</Button>
          </>
        }
      >
        <p style={{ marginBottom: '14px', fontSize: '13px' }}>
          This modal component is designed for lightweight form input and detail views with restrained borders and clean footers.
        </p>
        <FormField label="Sample Input Inside Modal" required>
          <Input placeholder="Type sample text..." />
        </FormField>
      </Modal>

      {/* REUSABLE TEST DRAWER */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Item Record Overview (Side Drawer)"
        footer={<Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>Close Drawer</Button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Alert type="info" message="Side Drawers allow office staff to inspect master record details without losing context." />
          <div style={{ background: 'var(--neutral-50)', padding: '12px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>Item Code</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-700)', fontFamily: 'var(--font-mono)' }}>ITM-1001</div>
          </div>
          <div style={{ background: 'var(--neutral-50)', padding: '12px', borderRadius: '4px', border: '1px solid var(--neutral-200)' }}>
            <div style={{ fontSize: '11px', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>Description</div>
            <div style={{ fontSize: '13.5px', fontWeight: 500 }}>Pleated Filter Cartridge 10" Stainless High Efficiency</div>
          </div>
        </div>
      </Drawer>

      {/* REUSABLE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        title="Deactivate Master Record?"
        message="Are you sure you want to deactivate this item record? Inactive items cannot be referenced in new Quotations or Sales Orders."
        confirmLabel="Deactivate Record"
        loading={confirmLoading}
      />
    </div>
  );
};

export default DesignSystemShowcase;
