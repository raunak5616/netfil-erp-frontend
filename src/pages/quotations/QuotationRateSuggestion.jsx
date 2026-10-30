import React, { useState } from 'react';
import { useGetQuotationSuggestionsQuery } from '../../features/quotations/quotationsApi';
import Button from '../../components/ui/Button';
import { Lightbulb, History, Check } from 'lucide-react';

const QuotationRateSuggestion = ({ customerId, itemId, onSelectRate }) => {
  const [showAll, setShowAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const { data: suggestionsData, isLoading: loading, error: queryError } = useGetQuotationSuggestionsQuery(
    { customerId, itemId },
    { skip: !customerId || !itemId }
  );

  const suggestions = (suggestionsData?.success && Array.isArray(suggestionsData?.data))
    ? suggestionsData.data
    : (Array.isArray(suggestionsData?.data) ? suggestionsData.data : (Array.isArray(suggestionsData) ? suggestionsData : []));

  const error = queryError ? 'Could not load suggestions.' : null;

  if (!customerId || !itemId) return null;

  const handleUseRate = (rateOrItem, index) => {
    let rateToApply = rateOrItem;
    // If an object was passed instead of primitive rate
    if (typeof rateOrItem === 'object' && rateOrItem !== null) {
      rateToApply = rateOrItem.unitRate ?? rateOrItem.unitPrice ?? rateOrItem.rate;
    }
    // Clean currency formatting if any (e.g. ₹ or commas or non-numeric characters)
    if (typeof rateToApply === 'string') {
      rateToApply = rateToApply.replace(/[^0-9.-]/g, '');
    }
    const numericRate = Number(rateToApply);
    const finalRate = (!isNaN(numericRate) && isFinite(numericRate)) ? numericRate : 0;

    onSelectRate(finalRate);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    });
  };

  if (loading) {
    return <div className="text-[10px] text-slate-400 mt-1 italic animate-pulse">Loading suggestions...</div>;
  }

  if (error) {
    return <div className="text-[10px] text-red-400 mt-1 italic">{error}</div>;
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-[10px] text-slate-400 mt-1 italic flex items-center">
        <Lightbulb size={12} className="mr-1" />
        No previous quotation found for this customer and item.
      </div>
    );
  }

  const latest = suggestions[0];
  const hasMultiple = suggestions.length > 1;

  return (
    <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-md p-2">
      <div className="flex items-center text-[11px] font-bold text-indigo-800 mb-1">
        <Lightbulb size={12} className="mr-1 text-amber-500" />
        Previous Quotations
      </div>
      
      <div className="text-[10px] text-slate-700 space-y-1">
        {!showAll ? (
          <div>
            <div className="flex justify-between items-start">
              <div>
                <span className="font-semibold text-slate-900">Latest:</span><br/>
                {latest.quotationNumber} &middot; {formatDate(latest.quotationDate)}<br/>
                <span className="font-bold text-slate-900">{formatCurrency(latest.unitRate)}</span> / piece &middot; Qty {latest.quantity}
                {latest.lineTotal > 0 && latest.quantity > 1 && (
                  <span className="text-slate-500 text-[9px] block">
                    (Line Total: {formatCurrency(latest.lineTotal)})
                  </span>
                )}
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="xs" 
                className="text-[10px] py-0.5 px-2 h-auto"
                onClick={() => handleUseRate(latest.unitRate, 0)}
              >
                {copiedIndex === 0 ? <Check size={12} className="text-green-600" /> : 'Use This Rate'}
              </Button>
            </div>
            {hasMultiple && (
              <button 
                type="button"
                className="text-indigo-600 hover:text-indigo-800 hover:underline mt-1 flex items-center"
                onClick={() => setShowAll(true)}
              >
                <History size={10} className="mr-1" /> View all {suggestions.length} previous quotations
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
            {suggestions.map((s, idx) => (
              <div key={s.quotationId || idx} className="flex justify-between items-start border-b border-indigo-100 pb-1 last:border-0 last:pb-0">
                <div>
                  {s.quotationNumber} &middot; {formatDate(s.quotationDate)}<br/>
                  <span className="font-bold text-slate-900">{formatCurrency(s.unitRate)}</span> / piece &middot; Qty {s.quantity}
                  {s.lineTotal > 0 && s.quantity > 1 && (
                    <span className="text-slate-500 text-[9px] block">
                      (Line Total: {formatCurrency(s.lineTotal)})
                    </span>
                  )}
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="xs" 
                  className="text-[10px] py-0.5 px-2 h-auto shrink-0 ml-2"
                  onClick={() => handleUseRate(s.unitRate, idx)}
                >
                  {copiedIndex === idx ? <Check size={12} className="text-green-600" /> : 'Use Rate'}
                </Button>
              </div>
            ))}
            <button 
              type="button"
              className="text-indigo-600 hover:text-indigo-800 hover:underline mt-1 w-full text-left"
              onClick={() => setShowAll(false)}
            >
              Show latest only
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationRateSuggestion;
