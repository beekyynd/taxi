import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { paymentsData, paymentVerify } from '../actions/paymentAction';
import { PaymentMethodInterface } from '../../interface/paymentInterface';

const initialState: PaymentMethodInterface = {
  paymentMethodData: [],
  paymentVerifyData: [],
  token: '',
  loading: false,
  success: false,
  fcmToken: '',
  statusCode: null,
};

const paymentTypeSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(paymentsData.pending, (state) => {
        state.loading = true;
        state.success = false;
      })
 
      .addCase(
        paymentsData.fulfilled,
        (state, action: PayloadAction<{ data: any[]; status: number, state, action }>) => {
          state.loading = false;
          state.paymentMethodData = action.payload.data;
          state.statusCode = action.payload.status;
          state.success = true;
        })
      .addCase(paymentsData.rejected, (state) => {
        state.loading = false;
        state.success = false;
      })



      .addCase(paymentVerify.pending, (state) => {
        state.loading = true;
        state.success = false;
      })
      .addCase(paymentVerify.fulfilled, (state, action) => {
        state.paymentVerifyData
          = action.payload;
        state.loading = false;
        state.success = true;
      })
      .addCase(paymentVerify.rejected, (state) => {
        state.loading = false;
        state.success = false;
      });
  },
});

export default paymentTypeSlice.reducer;
