import { Doc } from "../convex/_generated/dataModel";

interface ProfileProps {
  user: Doc<"users">;
}

export function Profile({ user }: ProfileProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Профиль пользователя</h2>
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center text-xl sm:text-2xl text-blue-500">
            {user.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-semibold">{user.name ?? "Пользователь"}</h3>
            <p className="text-gray-600 text-sm sm:text-base">{user.email ?? "Email не указан"}</p>
          </div>
        </div>
        <div className="border-t pt-3 sm:pt-4">
          <h4 className="font-semibold mb-2 text-sm sm:text-base">Информация об аккаунте</h4>
          <p className="text-gray-600 text-sm sm:text-base">Дата регистрации: {new Date(user._creationTime).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
