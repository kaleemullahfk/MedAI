import api, { toApiError } from "./api";

export const getDoctorDashboard = async () => {
  try {
    const response = await api.get("/dashboard/doctor");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getPatientDashboard = async () => {
  try {
    const response = await api.get("/dashboard/patient");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getAdminDashboard = async () => {
  try {
    const response = await api.get("/dashboard/admin");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};
