import { UPDATEPROFILE, SELF, DELETEACCOUNT } from "../types/index";
import { AccountInterface } from "../../interface/accountInterface";
import { accountServices } from "../../services/index";
import { createAsyncThunk } from '@reduxjs/toolkit';





export const selfData = createAsyncThunk(SELF, async () => {
  const response = await accountServices.selfData();
  if (response.status == 200) {
    return response?.data;
  } else {
    return 'Error';
  }
});

export const updateProfile = createAsyncThunk(UPDATEPROFILE, async data => {
  const response = await accountServices.updateProfile(data.data);
  if (response.status == 200) {
    data.dispatch(selfData());
    return response?.data;
  } else {
    return 'Error';
  }
});


export const accountDelete = createAsyncThunk(DELETEACCOUNT, async () => {
  const response = await accountServices.accountDelete();
  if (response.status == 200) {
    return response?.data;
  } else {
    return 'Error';
  }
});