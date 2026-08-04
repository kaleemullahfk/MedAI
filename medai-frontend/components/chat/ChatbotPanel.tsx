"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, SendHorizonal } from "lucide-react";

import { askChatbot, getChatHistory } from "@/services/chatbot";

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

/**
 * Reusable AI medical chatbot. Used by both the patient and doctor areas.
 */
export default function ChatbotPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getChatHistory()
      .then((history: { question: string; answer: string }[]) => {
        const formatted: ChatMessage[] = [];
        history.forEach((chat) => {
          formatted.push({ sender: "user", text: chat.question });
          formatted.push({ sender: "ai", text: chat.answer });
        });
        setMessages(formatted);
      })
      .catch(() => {
        // History is best-effort; the chat still works.
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!question.trim() || loading) return;

    const currentQuestion = question;
    setMessages((prev) => [...prev, { sender: "user", text: currentQuestion }]);
    setQuestion("");
    setLoading(true);
    inputRef.current?.focus();

    try {
      const response = await askChatbot(currentQuestion);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: response.answer },
      ]);
    } catch {
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

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl bg-card p-6 shadow ring-1 ring-foreground/10">
        {messages.length === 0 && (
          <div className="mt-16 text-center text-muted-foreground">
            👋 Welcome to <strong>MEDAI</strong>.
            <br />
            Ask any health-related question.
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-5 py-3 shadow ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-muted text-foreground"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-5 py-3 shadow">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-3">
        <textarea
          ref={inputRef}
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Ask MEDAI anything…"
          className="flex-1 resize-none rounded-xl border bg-background p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          <SendHorizonal className="h-5 w-5" />
          Send
        </button>
      </div>
    </div>
  );
}
