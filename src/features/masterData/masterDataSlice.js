import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedDepartmentId: null,
  selectedClientId: null,
  activeFilterGradeId: null,
};

export const masterDataSlice = createSlice({
  name: 'masterData',
  initialState,
  reducers: {
    setSelectedDepartmentId: (state, action) => {
      state.selectedDepartmentId = action.payload;
    },
    setSelectedClientId: (state, action) => {
      state.selectedClientId = action.payload;
    },
    setActiveFilterGradeId: (state, action) => {
      state.activeFilterGradeId = action.payload;
    },
    resetMasterDataState: () => initialState,
  },
});

export const {
  setSelectedDepartmentId,
  setSelectedClientId,
  setActiveFilterGradeId,
  resetMasterDataState,
} = masterDataSlice.actions;

export const selectSelectedDepartmentId = (state) => state.masterData.selectedDepartmentId;
export const selectSelectedClientId = (state) => state.masterData.selectedClientId;
export const selectActiveFilterGradeId = (state) => state.masterData.activeFilterGradeId;

export default masterDataSlice.reducer;
