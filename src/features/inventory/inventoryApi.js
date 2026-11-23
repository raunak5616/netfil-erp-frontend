import { apiSlice } from '../api/apiSlice';

/**
 * RTK Query API Slice for Inventory Management
 * Handles live stock levels, stock movement transactions, transfers, adjustments, and receipts.
 */
export const inventoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInventoryStocks: builder.query({
      query: (params = {}) => ({
        url: '/inventory/stock',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.stocks
          ? [
              ...result.stocks.map(({ _id }) => ({ type: 'Inventory', id: _id })),
              { type: 'Inventory', id: 'STOCK_LIST' },
            ]
          : [{ type: 'Inventory', id: 'STOCK_LIST' }],
    }),

    getInventoryStockById: builder.query({
      query: (stockId) => ({
        url: `/inventory/stock/${stockId}`,
        method: 'get',
      }),
      providesTags: (result, error, stockId) => [{ type: 'Inventory', id: stockId }],
    }),

    getStockTransactions: builder.query({
      query: (params = {}) => ({
        url: '/inventory/transactions',
        method: 'get',
        params,
      }),
      providesTags: (result) =>
        result?.transactions
          ? [
              ...result.transactions.map(({ _id }) => ({ type: 'Inventory', id: _id })),
              { type: 'Inventory', id: 'TXN_LIST' },
            ]
          : [{ type: 'Inventory', id: 'TXN_LIST' }],
    }),

    createOpeningStock: builder.mutation({
      query: (data) => ({
        url: '/inventory/opening-stock',
        method: 'post',
        data,
      }),
      invalidatesTags: [
        { type: 'Inventory', id: 'STOCK_LIST' },
        { type: 'Inventory', id: 'TXN_LIST' },
      ],
    }),

    receiveStock: builder.mutation({
      query: (data) => ({
        url: '/inventory/receipt',
        method: 'post',
        data,
      }),
      invalidatesTags: [
        { type: 'Inventory', id: 'STOCK_LIST' },
        { type: 'Inventory', id: 'TXN_LIST' },
      ],
    }),

    issueStock: builder.mutation({
      query: (data) => ({
        url: '/inventory/issue',
        method: 'post',
        data,
      }),
      invalidatesTags: [
        { type: 'Inventory', id: 'STOCK_LIST' },
        { type: 'Inventory', id: 'TXN_LIST' },
      ],
    }),

    transferStock: builder.mutation({
      query: (data) => ({
        url: '/inventory/transfer',
        method: 'post',
        data,
      }),
      invalidatesTags: [
        { type: 'Inventory', id: 'STOCK_LIST' },
        { type: 'Inventory', id: 'TXN_LIST' },
      ],
    }),

    adjustStock: builder.mutation({
      query: (data) => ({
        url: '/inventory/adjustment',
        method: 'post',
        data,
      }),
      invalidatesTags: [
        { type: 'Inventory', id: 'STOCK_LIST' },
        { type: 'Inventory', id: 'TXN_LIST' },
      ],
    }),
  }),
});

export const {
  useGetInventoryStocksQuery,
  useGetInventoryStockByIdQuery,
  useGetStockTransactionsQuery,
  useCreateOpeningStockMutation,
  useReceiveStockMutation,
  useIssueStockMutation,
  useTransferStockMutation,
  useAdjustStockMutation,
} = inventoryApi;
