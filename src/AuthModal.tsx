import { useCallback } from "react";
import { SignInForm } from "./SignInForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "signin" | "signup";
  onToggleMode: () => void;
}

export function AuthModal({ isOpen, onClose, mode, onToggleMode }: AuthModalProps) {
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">
            {mode === "signin" ? "Вход" : "Регистрация"}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <SignInForm />

        <div className="mt-4 text-center">
          <button
            onClick={onToggleMode}
            className="text-blue-500 hover:text-blue-600 text-sm sm:text-base"
          >
            {mode === "signin" 
              ? "Нет аккаунта? Зарегистрируйтесь" 
              : "Уже есть аккаунт? Войдите"}
          </button>
        </div>
      </div>
    </div>
  );
}
