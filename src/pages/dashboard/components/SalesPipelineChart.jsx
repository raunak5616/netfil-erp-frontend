import React from 'react';

const SalesPipelineChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded h-[250px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[13px] font-medium text-slate-600">Not enough sales history yet</p>
          <p className="text-[11px] text-slate-400 mt-1">Requires recent sales orders and quotations</p>
        </div>
      </div>
    );
  }

  // Find max value to scale the chart
  const maxSales = Math.max(...data.map(d => d.sales || 0));
  const maxQuots = Math.max(...data.map(d => d.quotations || 0));
  const maxValue = Math.max(maxSales, maxQuots, 1);

  return (
    <div className="bg-white border border-slate-200 rounded h-[250px] p-4 flex flex-col">
      <div className="flex justify-end gap-4 mb-2 text-[10px] font-medium">
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span> Sales
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-200"></span> Quotations
        </div>
      </div>
      
      <div className="flex-1 flex items-end justify-between gap-1 mt-2 pt-2 border-b border-slate-100 pb-2">
        {data.map((item, idx) => {
          const salesPct = Math.max((item.sales / maxValue) * 100, 2);
          const quotPct = Math.max((item.quotations / maxValue) * 100, 2);
          
          return (
            <div key={idx} className="flex gap-[1px] items-end flex-1 group relative h-full">
              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                <div className="font-bold border-b border-slate-700 pb-0.5 mb-0.5">{item.date}</div>
                <div>Sales: ₹{item.sales.toLocaleString()}</div>
                <div>Quotations: ₹{item.quotations.toLocaleString()}</div>
              </div>
              
              {/* Bars */}
              <div className="w-1/2 bg-indigo-200 hover:bg-indigo-300 transition-colors rounded-t-sm" style={{ height: `${quotPct}%` }}></div>
              <div className="w-1/2 bg-indigo-500 hover:bg-indigo-600 transition-colors rounded-t-sm" style={{ height: `${salesPct}%` }}></div>
            </div>
          );
        })}
      </div>
      
      {/* X Axis labels */}
      <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium px-1">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
};

export default SalesPipelineChart;
