import {
  editProfile,
  userSelf,
  deleteAccount,
} from "../endpoints/accountEndPoint";
import {GET_API, PUT_API, DELETE_API} from "../methods";

export const selfData = async () => {
  return GET_API(userSelf)
    .then(res => {
      return res;
    })
    .catch(e => {
      return e?.response;
    });
};

export const updateProfile = async data => {
  return PUT_API(editProfile, data)
    .then(res => {
      return res;
    })
    .catch(e => {
      return e?.response;
    });
};

export const accountDelete = async () => {
  return DELETE_API(deleteAccount)
    .then(res => {
      return res;
    })
    .catch(e => {
      return e?.response;
    });
};

const accountServices = {
  selfData,
  updateProfile,
  accountDelete,
};
export default accountServices;
