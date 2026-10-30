import { apiSlice } from '../api/apiSlice';
import {
  getOpsDashboardSummary,
  getRecentSalesOrders,
  getActiveWorkOrders,
  getSalesPipelineData,
} from '../../services/dashboardService';

/**
 * Operations Dashboard RTK Query API Slice.
 * Manages dashboard summary metrics, recent sales orders, active work orders, and sales pipeline.
 */
export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query({
      queryFn: async () => {
        try {
          const data = await getOpsDashboardSummary();
          return { data };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error.message } };
        }
      },
      providesTags: [{ type: 'Dashboard', id: 'SUMMARY' }],
    }),
    getRecentSalesOrders: builder.query({
      queryFn: async () => {
        try {
          const data = await getRecentSalesOrders();
          return { data };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error.message } };
        }
      },
      providesTags: [{ type: 'Dashboard', id: 'RECENT_SO' }],
    }),
    getActiveWorkOrders: builder.query({
      queryFn: async () => {
        try {
          const data = await getActiveWorkOrders();
          return { data };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error.message } };
        }
      },
      providesTags: [{ type: 'Dashboard', id: 'ACTIVE_WO' }],
    }),
    getSalesPipeline: builder.query({
      queryFn: async () => {
        try {
          const data = await getSalesPipelineData();
          return { data };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error.message } };
        }
      },
      providesTags: [{ type: 'Dashboard', id: 'PIPELINE' }],
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetRecentSalesOrdersQuery,
  useGetActiveWorkOrdersQuery,
  useGetSalesPipelineQuery,
} = dashboardApi;
