"use client";

import ChatbotPanel from "@/components/chat/ChatbotPanel";

export default function DoctorChatbotPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">AI Medical Chatbot</h1>
      <ChatbotPanel />
    </div>
  );
}
