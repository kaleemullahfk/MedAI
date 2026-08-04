import api, { toApiError } from "./api";

export const getDoctorAppointments = async () => {
  try {
    const response = await api.get("/appointment/doctor");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const acceptAppointment = async (id: number) => {
  try {
    const response = await api.put(`/appointment/${id}/accept`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const rejectAppointment = async (id: number) => {
  try {
    const response = await api.put(`/appointment/${id}/reject`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const completeAppointment = async (id: number) => {
  try {
    const response = await api.put(`/appointment/${id}/complete`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};
