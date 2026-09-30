import { getSalesOrders } from './salesOrderService';
import { getQuotations } from './quotationService';
import { getWorkOrders } from './workOrderService';
import { getClients } from './clientService';
import { getItems } from './itemService';

export const getOpsDashboardSummary = async () => {
  const [soRes, qtRes, woRes, clientRes, itemRes] = await Promise.allSettled([
    getSalesOrders({ limit: 1, status: 'DRAFT' }),
    getQuotations({ limit: 1, status: 'DRAFT' }),
    getWorkOrders({ limit: 1, status: 'IN_PROGRESS' }),
    getClients({ limit: 1, status: 'active' }),
    getItems({ limit: 1, status: 'active' })
  ]);

  return {
    soPending: soRes.status === 'fulfilled' && soRes.value?.success ? (soRes.value.total || soRes.value.salesOrders?.length || 0) : 0,
    qtPending: qtRes.status === 'fulfilled' && qtRes.value?.success ? (qtRes.value.total || qtRes.value.quotations?.length || 0) : 0,
    woActive: woRes.status === 'fulfilled' && woRes.value?.success ? (woRes.value.total || woRes.value.workOrders?.length || 0) : 0,
    clientsActive: clientRes.status === 'fulfilled' && clientRes.value?.success ? (clientRes.value.total || clientRes.value.clients?.length || 0) : 0,
    itemsActive: itemRes.status === 'fulfilled' && (itemRes.value?.success || Array.isArray(itemRes.value)) ? (itemRes.value.total || itemRes.value.items?.length || itemRes.value.length || 0) : 0,
  };
};

export const getRecentSalesOrders = async () => {
  try {
    const res = await getSalesOrders({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
    return res?.salesOrders || [];
  } catch (error) {
    console.error("Error fetching recent sales orders:", error);
    return [];
  }
};

export const getActiveWorkOrders = async () => {
  try {
    const res = await getWorkOrders({ limit: 5, status: 'IN_PROGRESS', sortBy: 'createdAt', sortOrder: 'desc' });
    return res?.workOrders || [];
  } catch (error) {
    console.error("Error fetching active work orders:", error);
    return [];
  }
};

export const getSalesPipelineData = async () => {
  try {
    const [soRes, qtRes] = await Promise.allSettled([
      getSalesOrders({ limit: 30, sortBy: 'orderDate', sortOrder: 'desc' }),
      getQuotations({ limit: 30, sortBy: 'quotationDate', sortOrder: 'desc' })
    ]);

    const salesOrders = soRes.status === 'fulfilled' && soRes.value?.salesOrders ? soRes.value.salesOrders : [];
    const quotations = qtRes.status === 'fulfilled' && qtRes.value?.quotations ? qtRes.value.quotations : [];

    const dateMap = {};

    salesOrders.forEach(so => {
      const d = new Date(so.orderDate || so.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (!dateMap[d]) dateMap[d] = { sales: 0, quotations: 0 };
      dateMap[d].sales += (so.totalAmount || so.orderValue || 0);
    });

    quotations.forEach(qt => {
      const d = new Date(qt.quotationDate || qt.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (!dateMap[d]) dateMap[d] = { sales: 0, quotations: 0 };
      dateMap[d].quotations += (qt.totalAmount || qt.quotationValue || 0);
    });

    return Object.keys(dateMap).map(k => ({
      date: k,
      sales: dateMap[k].sales,
      quotations: dateMap[k].quotations
    })).reverse();
  } catch (error) {
    console.error("Error fetching pipeline data:", error);
    return [];
  }
};
