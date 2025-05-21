import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

interface ChatBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  botType: "simple" | "ai";
}

export function ChatBotModal({ isOpen, onClose, botType }: ChatBotModalProps) {
  const messages = useQuery(api.chat.listMessages, { botType }) ?? [];
  const sendMessage = useMutation(api.chat.sendMessage);
  const userId = useQuery(api.auth.loggedInUser)?._id;
  const userTokens = useQuery(api.chat.getUserTokens, userId ? { userId } : "skip");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      await sendMessage({ message: newMessage, botType });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="fixed bottom-20 right-4 w-80 bg-white rounded-lg shadow-xl overflow-hidden"
      >
        <div className="p-3 bg-blue-500 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 text-xl"
            >
              ←
            </button>
            <div>
              <h3 className="font-semibold">
                {botType === "simple" ? "Простой помощник" : "AI Ассистент"}
              </h3>
              {botType === "ai" && userTokens && (
                <p className="text-xs opacity-75">
                  Осталось токенов: {userTokens.tokens}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            ✕
          </button>
        </div>
        
        <div className="h-96 flex flex-col">
          <div className="flex-1 overflow-y-auto p-3">
            {messages.slice().reverse().map((msg, i) => (
              <div
                key={i}
                className={`mb-2 ${msg.isBot ? "text-left" : "text-right"}`}
              >
                <div
                  className={`inline-block p-2 rounded-lg text-sm max-w-[80%] ${
                    msg.isBot
                      ? "bg-gray-100"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSubmit} className="p-3 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Введите сообщение..."
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
