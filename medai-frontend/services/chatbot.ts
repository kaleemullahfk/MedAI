import api from "./api";

export const askChatbot = async (question: string) => {
  const response = await api.post("/chatbot/ask", {
    question,
  });

  return response.data;
};

export const getChatHistory = async () => {
  const response = await api.get("/chatbot/history");

  return response.data;
};