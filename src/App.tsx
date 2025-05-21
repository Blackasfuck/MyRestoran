import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignOutButton } from "./SignOutButton";
import { Toaster, toast } from "sonner"; // Import toast
import { Menu } from "./Menu";
import { Chat } from "./Chat";
import { Profile } from "./Profile";
import { useState, useCallback } from "react";
import { AuthModal } from "./AuthModal";
import { ChatBotModal } from "./ChatBotModal";
// OrderModal is now managed within Menu.tsx, so no need to import/manage here unless global state is preferred.

export default function App() {
  const [currentPage, setCurrentPage] = useState<"menu" | "chat" | "profile">("menu");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [activeBotType, setActiveBotType] = useState<"simple" | "ai">("simple");
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const handlePageChange = useCallback((page: "menu" | "chat" | "profile") => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  }, []);

  const handleAuthClick = useCallback((mode: "signin" | "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setMobileMenuOpen(false);
  }, []);

  const handleChatbotClick = (type: "simple" | "ai") => {
    if (!loggedInUser) {
      toast.error("Пожалуйста, войдите, чтобы использовать чат-бота.");
      handleAuthClick("signin");
      return;
    }
    setActiveBotType(type);
    setChatbotOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
            <h1 className="text-2xl font-bold accent-text">Русская Кухня</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden text-gray-600 hover:text-gray-900"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        <nav className={`${
          mobileMenuOpen ? "flex" : "hidden"
        } sm:flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto mt-4 sm:mt-0`}>
          <button
            onClick={() => handlePageChange("menu")}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              currentPage === "menu"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Меню
          </button>
          
          {loggedInUser ? (
            <>
              <button
                onClick={() => handlePageChange("chat")}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  currentPage === "chat"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Чат
              </button>
              <button
                onClick={() => handlePageChange("profile")}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  currentPage === "profile"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Профиль
              </button>
              <SignOutButton />
            </>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleAuthClick("signin")}
                className="px-3 py-1.5 rounded-lg text-sm text-white bg-blue-500 hover:bg-blue-600"
              >
                Вход
              </button>
              <button
                onClick={() => handleAuthClick("signup")}
                className="px-3 py-1.5 rounded-lg text-sm border border-blue-500 text-blue-500 hover:bg-blue-50"
              >
                Регистрация
              </button>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          {currentPage === "menu" && <Menu />}
          {currentPage === "chat" && loggedInUser && <Chat />}
          {currentPage === "profile" && loggedInUser && <Profile user={loggedInUser} />}
        </div>
      </main>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        mode={authMode}
        onToggleMode={() => setAuthMode(mode => mode === "signin" ? "signup" : "signin")}
      />

      {/* Chatbot buttons and modal */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 items-end z-20">
        {chatbotOpen && loggedInUser ? (
          <ChatBotModal 
            isOpen={chatbotOpen}
            onClose={() => setChatbotOpen(false)}
            botType={activeBotType}
          />
        ) : (
          <>
            <button
              onClick={() => handleChatbotClick("ai")}
              className="bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 text-sm w-32"
              title="AI Ассистент"
            >
              AI Ассистент
            </button>
            <button
              onClick={() => handleChatbotClick("simple")}
              className="bg-green-500 text-white p-2 rounded-full shadow-lg hover:bg-green-600 text-sm w-32"
              title="Простой помощник"
            >
              Простой Помощник
            </button>
          </>
        )}
      </div>
      
      <Toaster position="top-center" richColors />
    </div>
  );
}
