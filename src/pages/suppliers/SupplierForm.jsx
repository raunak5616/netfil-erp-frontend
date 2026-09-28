import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getSupplierById,
  createSupplier,
  updateSupplier
} from '../../services/supplierService';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import {
  ArrowLeft,
  Save,
  Building2,
  UserCheck,
  CreditCard,
  Building,
  FileText,
  Truck
} from 'lucide-react';

const SupplierForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [supplierCode, setSupplierCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [creditDays, setCreditDays] = useState(0);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [status, setStatus] = useState('active');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchSupplier = async () => {
      setInitialLoading(true);
      setError('');
      try {
        const res = await getSupplierById(id);
        if (res.success && res.supplier) {
          const s = res.supplier;
          setSupplierCode(s.supplierCode || '');
          setSupplierName(s.supplierName || '');
          setLegalName(s.legalName || '');
          setContactPerson(s.contactPerson || '');
          setEmail(s.email || '');
          setPhone(s.phone || '');
          setAlternatePhone(s.alternatePhone || '');
          setAddress(s.address || '');
          setCity(s.city || '');
          setState(s.state || '');
          setCountry(s.country || 'India');
          setPincode(s.pincode || '');
          setGstin(s.gstin || '');
          setPan(s.pan || '');
          setPaymentTerms(s.paymentTerms || '');
          setCreditDays(s.creditDays || 0);
          setBankName(s.bankName || '');
          setAccountNumber(s.accountNumber || '');
          setIfsc(s.ifsc || '');
          setStatus(s.status || 'active');
          setRemarks(s.remarks || '');
        } else {
          setError('Supplier document not found');
        }
      } catch (err) {
        console.error('Failed to load supplier details:', err);
        setError(err.response?.data?.message || 'Error loading supplier data');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchSupplier();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!supplierName.trim()) {
      setError('Supplier Name is required.');
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    const payload = {
      supplierCode: supplierCode.trim() || undefined,
      supplierName: supplierName.trim(),
      legalName: legalName.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim() || 'India',
      pincode: pincode.trim(),
      gstin: gstin.trim().toUpperCase(),
      pan: pan.trim().toUpperCase(),
      paymentTerms: paymentTerms.trim(),
      creditDays: Number(creditDays) || 0,
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifsc: ifsc.trim().toUpperCase(),
      status,
      remarks: remarks.trim()
    };

    setLoading(true);
    try {
      let res;
      if (isEditMode) {
        res = await updateSupplier(id, payload);
      } else {
        res = await createSupplier(payload);
      }

      if (res.success && res.supplier) {
        setSuccess(res.message || 'Supplier record saved successfully.');
        setTimeout(() => {
          navigate(`/suppliers/${res.supplier._id}`);
        }, 600);
      } else {
        setError(res.message || 'Failed to save supplier record.');
      }
    } catch (err) {
      console.error('Save supplier error:', err);
      setError(err.response?.data?.message || 'Error saving supplier. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-xs font-semibold">Loading supplier details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditMode ? `Edit Supplier (${supplierCode})` : 'Register New Supplier'}
        subtitle={isEditMode ? 'Update master contact, compliance, tax and bank details for this procurement vendor.' : 'Create a dedicated procurement supplier master for purchase orders and material receipts.'}
        actions={
          <Button variant="secondary" size="sm" onClick={() => navigate('/suppliers')}>
            <ArrowLeft size={14} className="mr-1.5" />
            Back to Suppliers
          </Button>
        }
      />

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: PRIMARY IDENTIFICATION */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" />
            Basic Supplier Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isEditMode && (
              <FormField label="Supplier Code">
                <Input
                  type="text"
                  value={supplierCode}
                  onChange={(e) => setSupplierCode(e.target.value)}
                  placeholder="Auto-generated (e.g. SUP-000001)"
                  className="font-mono bg-slate-50"
                  disabled
                />
              </FormField>
            )}

            <FormField label="Supplier Name (Display Name)" required className={isEditMode ? '' : 'md:col-span-2'}>
              <Input
                type="text"
                placeholder="e.g. Zenith Industrial Supplies Pvt Ltd"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Legal Registered Name">
              <Input
                type="text"
                placeholder="Full registered company name"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
              />
            </FormField>

            <FormField label="Primary Contact Person">
              <Input
                type="text"
                placeholder="e.g. Rajiv Malhotra"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </FormField>

            <FormField label="Primary Phone Number">
              <Input
                type="text"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>

            <FormField label="Alternate Phone Number">
              <Input
                type="text"
                placeholder="e.g. 020-27483920"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
              />
            </FormField>

            <FormField label="Email Address">
              <Input
                type="email"
                placeholder="sales@supplier.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>

            <FormField label="Account Status" required>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="active">Active (Selectable in PO)</option>
                <option value="inactive">Inactive (Disabled)</option>
              </Select>
            </FormField>
          </div>
        </div>

        {/* SECTION 2: ADDRESS & LOCATION */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <Building size={16} className="text-blue-600" />
            Address & Location Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField label="Street Address" className="md:col-span-2">
              <Input
                type="text"
                placeholder="Plot no, Factory address, Street name..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </FormField>

            <FormField label="City">
              <Input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </FormField>

            <FormField label="State">
              <Input
                type="text"
                placeholder="State / Region"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </FormField>

            <FormField label="Country">
              <Input
                type="text"
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </FormField>

            <FormField label="Postal Code (Pincode)">
              <Input
                type="text"
                placeholder="Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
            </FormField>
          </div>
        </div>

        {/* SECTION 3: TAXATION & FINANCIAL TERMS */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <CreditCard size={16} className="text-blue-600" />
            Taxation, Compliance & Payment Terms
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField label="GSTIN Number">
              <Input
                type="text"
                placeholder="27AAACA1234A1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="font-mono uppercase"
              />
            </FormField>

            <FormField label="PAN Number">
              <Input
                type="text"
                placeholder="AAACA1234A"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                className="font-mono uppercase"
              />
            </FormField>

            <FormField label="Default Payment Terms">
              <Input
                type="text"
                placeholder="e.g. Net 30 Days from GRN"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              />
            </FormField>

            <FormField label="Credit Period (Days)">
              <Input
                type="number"
                min="0"
                placeholder="30"
                value={creditDays}
                onChange={(e) => setCreditDays(e.target.value)}
              />
            </FormField>

            <FormField label="Bank Name">
              <Input
                type="text"
                placeholder="Bank Name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </FormField>

            <FormField label="Bank Account Number">
              <Input
                type="text"
                placeholder="Account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="font-mono"
              />
            </FormField>

            <FormField label="IFSC Code">
              <Input
                type="text"
                placeholder="HDFC0001234"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                className="font-mono uppercase"
              />
            </FormField>

            <FormField label="General Notes / Remarks" className="lg:col-span-4">
              <Textarea
                placeholder="Quality certifications, ISO standards, vendor ratings..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
              />
            </FormField>
          </div>
        </div>

        {/* SUBMIT BUTTONS */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/suppliers')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            <Save size={14} className="mr-1.5" />
            {isEditMode ? 'Update Supplier' : 'Save Supplier Master'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
