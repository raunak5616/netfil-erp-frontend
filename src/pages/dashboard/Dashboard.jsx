import React, { useState, useEffect } from 'react';
import PendingActions from './components/PendingActions';
import RecentPurchaseOrders from './components/RecentPurchaseOrders';
import RecentGoodsReceipts from './components/RecentGoodsReceipts';
import SupplierOverview from './components/SupplierOverview';
import QuickActions from './components/QuickActions';

import { getPurchaseRequisitions } from '../../services/purchaseRequisitionService';
import { getPurchaseEnquiries } from '../../services/purchaseEnquiryService';
import { getPurchaseOrders } from '../../services/purchaseOrderService';
import { getGoodsReceipts } from '../../services/goodsReceiptService';
import { getSuppliers } from '../../services/supplierService';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    kpis: { prPending: 0, pePending: 0, poPending: 0, grnPending: 0, qiPending: 0, supActive: 0, supInactive: 0, supRecent: [] },
    pendingActions: [],
    recentPOs: [],
    recentGRNs: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        prPendingRes,
        pePendingRes,
        poPendingRes,
        grnPendingRes,
        supRes,
        supInactiveRes,
        poRecentRes,
        grnRecentRes,
        supRecentRes
      ] = await Promise.allSettled([
        getPurchaseRequisitions({ limit: 10, status: 'UNDER_REVIEW' }),
        getPurchaseEnquiries({ limit: 10, status: 'SUBMITTED' }),
        getPurchaseOrders({ limit: 10, status: 'DRAFT' }),
        getGoodsReceipts({ limit: 10, status: 'DRAFT' }),
        getSuppliers({ limit: 1, status: 'active' }),
        getSuppliers({ limit: 1, status: 'inactive' }),
        getPurchaseOrders({ limit: 5 }),
        getGoodsReceipts({ limit: 5 }),
        getSuppliers({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
      ]);

      const data = {
        kpis: {
          prPending: prPendingRes.value?.pagination?.totalCount || 0,
          pePending: pePendingRes.value?.pagination?.totalCount || 0,
          poPending: poPendingRes.value?.pagination?.totalCount || 0,
          grnPending: grnPendingRes.value?.pagination?.totalCount || 0,
          qiPending: 0,
          supActive: supRes.value?.pagination?.totalCount || 0,
          supInactive: supInactiveRes.value?.pagination?.totalCount || 0,
          supRecent: supRecentRes.value?.suppliers || []
        },
        recentPOs: poRecentRes.value?.purchaseOrders || [],
        recentGRNs: grnRecentRes.value?.goodsReceipts || [],
        pendingActions: []
      };

      const actions = [];
      if (prPendingRes.value?.purchaseRequisitions) {
        prPendingRes.value.purchaseRequisitions.forEach(pr => {
          actions.push({
            module: 'Purchase Requisition',
            referenceNumber: pr.prNumber,
            supplier: pr.department?.departmentName || '—',
            date: new Date(pr.prDate).toLocaleDateString(),
            status: pr.status,
            path: `/purchase-requisitions/${pr._id}`
          });
        });
      }
      if (pePendingRes.value?.purchaseEnquiries) {
        pePendingRes.value.purchaseEnquiries.forEach(pe => {
          actions.push({
            module: 'Purchase Enquiry',
            referenceNumber: pe.enquiryNumber,
            supplier: pe.supplier?.supplierName || pe.supplierNameSnapshot || '—',
            date: new Date(pe.enquiryDate).toLocaleDateString(),
            status: pe.status,
            path: `/purchase-enquiries/${pe._id}`
          });
        });
      }
      if (poPendingRes.value?.purchaseOrders) {
        poPendingRes.value.purchaseOrders.forEach(po => {
          actions.push({
            module: 'Purchase Order',
            referenceNumber: po.poNumber,
            supplier: po.supplier?.supplierName || po.supplierNameSnapshot || '—',
            date: new Date(po.poDate).toLocaleDateString(),
            status: po.status,
            path: `/purchase-orders/${po._id}`
          });
        });
      }
      if (grnPendingRes.value?.goodsReceipts) {
        grnPendingRes.value.goodsReceipts.forEach(grn => {
          actions.push({
            module: 'Goods Receipt',
            referenceNumber: grn.grnNumber,
            supplier: grn.supplierNameSnapshot || '—',
            date: new Date(grn.grnDate).toLocaleDateString(),
            status: grn.status,
            path: `/goods-receipts/${grn._id}`
          });
        });
      }

      data.pendingActions = actions.slice(0, 10);

      setDashboardData(data);
    } catch (err) {
      console.error("Dashboard fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const SummaryMetric = ({ label, value, loading }) => (
    <div className="flex justify-between items-center py-2 px-3 bg-white border border-slate-200 rounded-sm">
      <span className="text-[11px] text-slate-700 font-medium">{label}</span>
      {loading ? (
        <div className="h-4 bg-slate-200 rounded w-6 animate-pulse"></div>
      ) : (
        <span className="text-[13px] font-bold text-slate-900">{value}</span>
      )}
    </div>
  );

  return (
    <div className="pb-8">
      {/* Top Header */}
      <div className="mb-4">
        <h1 className="text-[19px] font-bold text-slate-900 m-0 leading-tight">Dashboard</h1>
        <p className="text-slate-500 text-[12px] mt-0.5">
          Procurement and operations overview
        </p>
      </div>

      {/* Today's Overview */}
      <div className="mb-6">
        <h2 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Today's Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <SummaryMetric label="PR Pending Approval" value={dashboardData.kpis.prPending} loading={loading} />
          <SummaryMetric label="PE Pending Response" value={dashboardData.kpis.pePending} loading={loading} />
          <SummaryMetric label="PO Pending Release" value={dashboardData.kpis.poPending} loading={loading} />
          <SummaryMetric label="GRN Pending Posting" value={dashboardData.kpis.grnPending} loading={loading} />
          <SummaryMetric label="QI Pending Inspection" value={dashboardData.kpis.qiPending} loading={loading} />
          <SummaryMetric label="Active Suppliers" value={dashboardData.kpis.supActive} loading={loading} />
        </div>
      </div>

      {/* Pending Work */}
      <div className="mb-6">
        <h2 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Pending Work</h2>
        <PendingActions actions={dashboardData.pendingActions} loading={loading} />
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Recent Purchase Orders</h2>
          <RecentPurchaseOrders orders={dashboardData.recentPOs} loading={loading} />
        </div>
        <div>
          <h2 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Recent Goods Receipts</h2>
          <RecentGoodsReceipts grns={dashboardData.recentGRNs} loading={loading} />
        </div>
      </div>

      {/* Bottom Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Quick Actions</h2>
          <QuickActions />
        </div>
        <div>
          <h2 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Supplier Summary</h2>
          <SupplierOverview kpis={dashboardData.kpis} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
