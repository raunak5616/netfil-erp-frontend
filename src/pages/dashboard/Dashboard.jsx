import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getOpsDashboardSummary,
  getRecentSalesOrders,
  getActiveWorkOrders,
  getSalesPipelineData
} from '../../services/dashboardService';

import OpsDashboardMetric from './components/OpsDashboardMetric';
import RecentSalesOrdersTable from './components/RecentSalesOrdersTable';
import ActiveWorkOrdersTable from './components/ActiveWorkOrdersTable';
import SalesPipelineChart from './components/SalesPipelineChart';
import OpsQuickActions from './components/OpsQuickActions';

const Dashboard = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [data, setData] = useState({
    summary: null,
    recentSalesOrders: [],
    activeWorkOrders: [],
    pipeline: []
  });

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const canViewSO = hasPermission('SALES_ORDER_VIEW');
      const canViewWO = hasPermission('WORK_ORDER_VIEW');

      const [
        summaryRes,
        salesRes,
        woRes,
        pipelineRes
      ] = await Promise.allSettled([
        getOpsDashboardSummary(),
        canViewSO ? getRecentSalesOrders() : Promise.resolve([]),
        canViewWO ? getActiveWorkOrders() : Promise.resolve([]),
        canViewSO ? getSalesPipelineData() : Promise.resolve([])
      ]);

      setData({
        summary: summaryRes.status === 'fulfilled' ? summaryRes.value : {},
        recentSalesOrders: salesRes.status === 'fulfilled' ? salesRes.value : [],
        activeWorkOrders: woRes.status === 'fulfilled' ? woRes.value : [],
        pipeline: pipelineRes.status === 'fulfilled' ? pipelineRes.value : []
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        <span className="animate-pulse">Loading operations data...</span>
      </div>
    );
  }

  return (
    <div className="pb-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 m-0 leading-tight">Operations & Sales</h1>
          <p className="text-slate-500 text-[13px] mt-1">High-level overview of sales pipeline and production status</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          {refreshing ? (
            <svg className="animate-spin h-3.5 w-3.5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchData()} className="text-red-700 font-medium underline text-xs">Retry</button>
        </div>
      )}

      {/* KPI Section */}
      <div className="mb-6">
        <h2 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-3">Key Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <OpsDashboardMetric 
            label="Pending Quotations" 
            value={data.summary?.qtPending} 
            subtext="Needs follow-up" 
            link="/quotations?status=DRAFT" 
            hasPermission={hasPermission('QUOTATION_VIEW')} 
          />
          <OpsDashboardMetric 
            label="Pending Sales Orders" 
            value={data.summary?.soPending} 
            subtext="Awaiting fulfillment" 
            link="/sales-orders?status=DRAFT" 
            hasPermission={hasPermission('SALES_ORDER_VIEW')} 
          />
          <OpsDashboardMetric 
            label="Active Work Orders" 
            value={data.summary?.woActive} 
            subtext="Currently in progress" 
            link="/work-orders?status=IN_PROGRESS" 
            hasPermission={hasPermission('WORK_ORDER_VIEW')} 
          />
          <OpsDashboardMetric 
            label="Active Clients" 
            value={data.summary?.clientsActive} 
            subtext="Approved customers" 
            link="/clients?status=active" 
            hasPermission={hasPermission('CLIENT_VIEW')} 
          />
          <OpsDashboardMetric 
            label="Master Items" 
            value={data.summary?.itemsActive} 
            subtext="Active in inventory" 
            link="/items" 
            hasPermission={hasPermission('ITEM_VIEW')} 
          />
        </div>
      </div>

      {/* Sales Pipeline Chart & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {hasPermission('SALES_ORDER_VIEW') && (
          <div className="lg:col-span-8">
            <h2 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-3">Sales Pipeline (30 Days)</h2>
            <SalesPipelineChart data={data.pipeline} />
          </div>
        )}
        <div className={hasPermission('SALES_ORDER_VIEW') ? "lg:col-span-4" : "lg:col-span-12"}>
          <h2 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-3">Quick Actions</h2>
          <OpsQuickActions />
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {hasPermission('SALES_ORDER_VIEW') && (
          <div>
            <h2 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-3">Recent Sales Orders</h2>
            <RecentSalesOrdersTable orders={data.recentSalesOrders} />
          </div>
        )}
        {hasPermission('WORK_ORDER_VIEW') && (
          <div>
            <h2 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-3">Active Work Orders</h2>
            <ActiveWorkOrdersTable workOrders={data.activeWorkOrders} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
