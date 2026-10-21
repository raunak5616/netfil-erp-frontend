import React, { useState, useMemo } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { 
  AlertTriangle, 
  ArrowRight, 
  Eye, 
  CheckCircle2, 
  X, 
  Layers, 
  Sliders, 
  Calculator, 
  FileText, 
  Building2, 
  Search,
  Tag
} from 'lucide-react';

const CATEGORY_CONFIG = {
  'Customer / Order Details': {
    icon: Building2,
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    barColor: 'bg-indigo-500'
  },
  'Line Items': {
    icon: Layers,
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    barColor: 'bg-blue-500'
  },
  'Dimensions and Technical Specifications': {
    icon: Sliders,
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    barColor: 'bg-purple-500'
  },
  'Commercial Charges and Tax': {
    icon: Calculator,
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    barColor: 'bg-emerald-500'
  },
  'Payment and Delivery Terms': {
    icon: FileText,
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    barColor: 'bg-amber-500'
  },
  'Other Changes': {
    icon: Tag,
    badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
    barColor: 'bg-slate-500'
  }
};

const STANDARD_CATEGORIES = [
  'Customer / Order Details',
  'Line Items',
  'Dimensions and Technical Specifications',
  'Commercial Charges and Tax',
  'Payment and Delivery Terms',
  'Other Changes'
];

const QuotationChangesModal = ({
  isOpen,
  changes = [],
  quotationNo = '',
  onReview,
  onConfirm,
  onCancel,
  submitting = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // Group changes by category
  const groupedChanges = useMemo(() => {
    const map = new Map();
    STANDARD_CATEGORIES.forEach((cat) => map.set(cat, []));

    changes.forEach((ch) => {
      // Normalize category matching
      let cat = ch.category;
      if (!cat) cat = 'Other Changes';
      if (cat === 'Dimensions & Technical Specifications') cat = 'Dimensions and Technical Specifications';
      if (cat === 'Commercial Charges & Tax') cat = 'Commercial Charges and Tax';
      if (cat === 'Payment, Delivery & Other Terms') cat = 'Payment and Delivery Terms';

      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat).push(ch);
    });

    return map;
  }, [changes]);

  // Filtered list based on active tab and search query
  const filteredChanges = useMemo(() => {
    let list = changes;

    if (selectedCategory !== 'ALL') {
      list = groupedChanges.get(selectedCategory) || [];
    }

    if (searchFilter.trim()) {
      const term = searchFilter.toLowerCase().trim();
      list = list.filter((ch) => {
        const label = (ch.label || '').toLowerCase();
        const field = (ch.field || '').toLowerCase();
        const desc = (ch.itemDescription || '').toLowerCase();
        const qVal = String(ch.quotationValue || '').toLowerCase();
        const soVal = String(ch.salesOrderValue || '').toLowerCase();
        return label.includes(term) || field.includes(term) || desc.includes(term) || qVal.includes(term) || soVal.includes(term);
      });
    }

    return list;
  }, [changes, selectedCategory, searchFilter, groupedChanges]);

  // Categories that have at least one change
  const activeCategories = useMemo(() => {
    return STANDARD_CATEGORIES.filter((cat) => (groupedChanges.get(cat) || []).length > 0);
  }, [groupedChanges]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Quotation vs Sales Order Differences Detected"
      size="xl"
    >
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700 flex-shrink-0 mt-0.5">
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-amber-950 text-sm">
              {changes.length} Modified {changes.length === 1 ? 'Value' : 'Values'} From Approved Quotation
            </div>
            <div className="text-amber-800/90 mt-1 leading-relaxed">
              Values in this proposed Sales Order differ from approved source quotation{' '}
              <strong className="font-mono text-amber-950 px-1 py-0.5 bg-amber-100/70 rounded">
                {quotationNo || 'Quotation'}
              </strong>
              . Every changed quotation-derived field is categorized below for your review. Confirming will create the Sales Order with your chosen values and log an authoritative audit record.
            </div>
          </div>
        </div>

        {/* Filter Bar: Category Tabs & Search Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                selectedCategory === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>All Differences</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === 'ALL' ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {changes.length}
              </span>
            </button>

            {activeCategories.map((cat) => {
              const count = (groupedChanges.get(cat) || []).length;
              const isSelected = selectedCategory === cat;
              const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['Other Changes'];
              const Icon = config.icon;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={13} className={isSelected ? 'text-white' : 'text-slate-500'} />
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative flex-shrink-0 sm:w-60">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter differences..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Changes List Display */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
          <div className="bg-slate-50/90 px-4 py-2.5 border-b border-slate-200 text-xs font-semibold text-slate-700 flex justify-between items-center">
            <span>
              Showing {filteredChanges.length} of {changes.length} detected differences
            </span>
            <span className="text-[11px] text-slate-500 font-normal hidden sm:inline">
              Original Quotation (Amber) → Proposed Sales Order (Blue)
            </span>
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar p-1">
            {filteredChanges.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No differences found matching your current filter.
              </div>
            ) : (
              filteredChanges.map((ch, idx) => {
                let cat = ch.category || 'Other Changes';
                if (cat === 'Dimensions & Technical Specifications') cat = 'Dimensions and Technical Specifications';
                if (cat === 'Commercial Charges & Tax') cat = 'Commercial Charges and Tax';
                if (cat === 'Payment, Delivery & Other Terms') cat = 'Payment and Delivery Terms';

                const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['Other Changes'];
                const Icon = config.icon;

                return (
                  <div key={ch.field || idx} className="p-3.5 hover:bg-slate-50/80 transition-colors rounded-lg">
                    {/* Header: Field Label & Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {ch.label}
                        </span>
                        {ch.itemDescription && (
                          <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[280px]">
                            {ch.itemIndex !== undefined ? `Item #${ch.itemIndex + 1}: ` : ''}{ch.itemDescription}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${config.badgeBg}`}>
                          <Icon size={11} />
                          {cat}
                        </span>
                      </div>
                    </div>

                    {/* Comparison Values: Original vs Proposed */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                      {/* Original Quotation Box */}
                      <div className="bg-amber-50/70 border border-amber-200/90 rounded-lg p-2.5 flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800">
                            Original Quotation
                          </span>
                          <span className="font-mono font-bold text-amber-950 text-xs sm:text-[13px] mt-0.5 break-all">
                            {String(ch.quotationValue || '(Empty)')}
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-700 font-medium px-1.5 py-0.5 bg-amber-100/70 rounded flex-shrink-0">
                          Source
                        </span>
                      </div>

                      {/* Proposed Sales Order Box */}
                      <div className="bg-blue-50/80 border border-blue-200/90 rounded-lg p-2.5 flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-800 flex items-center gap-1">
                            <ArrowRight size={11} className="text-blue-600" />
                            Proposed Sales Order
                          </span>
                          <span className="font-mono font-bold text-blue-950 text-xs sm:text-[13px] mt-0.5 break-all">
                            {String(ch.salesOrderValue || '(Empty)')}
                          </span>
                        </div>
                        <span className="text-[10px] text-blue-700 font-semibold px-1.5 py-0.5 bg-blue-100/70 rounded flex-shrink-0">
                          Modified
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Informational Audit Notice */}
        <div className="text-[11.5px] text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
          <span>
            These changes will be permanently tracked in the Sales Order audit log and linked to Quotation{' '}
            <strong className="font-mono text-slate-800">{quotationNo || 'Quotation'}</strong>.
          </span>
        </div>

        {/* Modal Action Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            <X size={14} className="mr-1.5 text-slate-500" />
            Cancel
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onReview}
            disabled={submitting}
            className="w-full sm:w-auto border-slate-300 hover:bg-slate-100"
          >
            <Eye size={14} className="mr-1.5 text-slate-600" />
            Review Changes
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            disabled={submitting}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 font-bold"
          >
            <CheckCircle2 size={14} className="mr-1.5 text-white" />
            {submitting ? 'Creating Sales Order...' : 'Continue & Create Sales Order'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuotationChangesModal;
