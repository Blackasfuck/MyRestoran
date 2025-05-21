import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export function Chat() {
  const messages = useQuery(api.chat.listMessages, { botType: "ai" }) ?? [];
  const sendMessage = useMutation(api.chat.sendMessage);
  const [newMessage, setNewMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    await sendMessage({ message: newMessage, botType: "ai" });
    setNewMessage("");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Чат с рестораном</h2>
      <div className="border rounded-lg p-3 sm:p-4 h-[300px] sm:h-[400px] overflow-y-auto mb-4">
        {messages.slice().reverse().map((msg, i) => (
          <div
            key={i}
            className={`mb-3 sm:mb-4 ${
              msg.isBot ? "text-left" : "text-right"
            }`}
          >
            <div
              className={`inline-block p-2 sm:p-3 rounded-lg text-sm sm:text-base ${
                msg.isBot
                  ? "bg-gray-200"
                  : "bg-blue-500 text-white"
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Задайте вопрос..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm sm:text-base"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm sm:text-base"
        >
          Отправить
        </button>
      </form>
    </div>
  );
}
