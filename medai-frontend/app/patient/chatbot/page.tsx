"use client";

import { useEffect, useRef, useState } from "react";
import {
  askChatbot,
  getChatHistory,
} from "@/services/chatbot";

interface ChatHistory {
  id: number;
  user_id: number;
  question: string;
  answer: string;
}

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function loadHistory() {
    try {
      const history: ChatHistory[] = await getChatHistory();

      const formatted: ChatMessage[] = [];

      history.forEach((chat) => {
        formatted.push({
          sender: "user",
          text: chat.question,
        });

        formatted.push({
          sender: "ai",
          text: chat.answer,
        });
      });

      setMessages(formatted);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    const fetchHistory = async () => {
        try {
             const history: ChatHistory[] = await getChatHistory();
             const formatted: ChatMessage[] = [];
             history.forEach((chat) => {
                formatted.push({
                    sender: "user",
                    text: chat.question,
                });

                formatted.push({
                    sender: "ai",
                    text: chat.answer,
                });
            });

            setMessages(formatted);
        } catch (error) {
            console.error(error);
        }
    };
    
    fetchHistory();
}, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async () => {
    if (!question.trim()) return;

    const currentQuestion = question;

    const userMessage: ChatMessage = {
      sender: "user",
      text: currentQuestion,
    };

    setMessages((prev) => [...prev, userMessage]);

    setQuestion("");
    setLoading(true);

    inputRef.current?.focus();

    try {
      const response = await askChatbot(currentQuestion);

      const aiMessage: ChatMessage = {
        sender: "ai",
        text: response.answer,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">

      <h1 className="text-3xl font-bold mb-6">
        AI Medical Chatbot
      </h1>

      <div className="flex-1 bg-white rounded-xl shadow p-6 overflow-y-auto space-y-4">

        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            👋 Welcome to <strong>MEDAI</strong>.
            <br />
            Ask any health-related question.
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.sender === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-5 py-3 whitespace-pre-wrap shadow ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-5 py-3 shadow animate-pulse">
              🤖 MEDAI is typing...
            </div>
          </div>
        )}

        <div ref={bottomRef} />

      </div>

      <div className="mt-5 flex gap-4">

        <textarea
          ref={inputRef}
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask MEDAI anything..."
          className="flex-1 border rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 rounded-xl font-semibold transition"
        >
          {loading ? "Sending..." : "Send"}
        </button>

      </div>

    </div>
  );
}