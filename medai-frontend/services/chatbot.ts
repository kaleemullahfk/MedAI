import api, { toApiError } from "./api";

export const askChatbot = async (question: string) => {
  try {
    const response = await api.post("/chatbot/ask", { question });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getChatHistory = async () => {
  try {
    const response = await api.get("/chatbot/history");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};
