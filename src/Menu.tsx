import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc, Id } from "../convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { OrderModal } from "./OrderModal"; // Import OrderModal

// Helper component for displaying stars
const StarRatingDisplay = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`} className="text-yellow-400">★</span>)}
      {halfStar && <span className="text-yellow-400">☆</span>} {/* Or a proper half star icon */}
      {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`} className="text-gray-300">★</span>)}
    </div>
  );
};


interface ReviewFormProps {
  menuItemId: Id<"menuItems">;
  loggedInUserId: Id<"users"> | null | undefined;
}

function ReviewForm({ menuItemId, loggedInUserId }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const submitReview = useMutation(api.reviews.submitReview);
  const existingReview = useQuery(api.reviews.getUserReviewForMenuItem, loggedInUserId ? { menuItemId } : "skip");

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment ?? "");
    } else {
      setRating(0);
      setComment("");
    }
  }, [existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUserId) {
      toast.error("Пожалуйста, войдите, чтобы оставить отзыв.");
      return;
    }
    if (rating === 0) {
      toast.error("Пожалуйста, выберите оценку.");
      return;
    }
    try {
      await submitReview({ menuItemId, rating, comment });
      toast.success(existingReview ? "Отзыв обновлен!" : "Отзыв добавлен!");
    } catch (error: any) {
      toast.error(error.message || "Не удалось отправить отзыв.");
      console.error(error);
    }
  };

  if (!loggedInUserId) {
    return <p className="text-sm text-gray-600 mt-2">Войдите, чтобы оставить отзыв.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-3 border rounded-md bg-gray-50">
      <h4 className="text-md font-semibold mb-2">Ваш отзыв:</h4>
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700">Оценка:</label>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              className={`text-2xl ${ (hoverRating || rating) >= star ? "text-yellow-400" : "text-gray-300"}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div className="mb-2">
        <label htmlFor={`comment-${menuItemId}`} className="block text-sm font-medium text-gray-700">Комментарий (необязательно):</label>
        <textarea
          id={`comment-${menuItemId}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
          placeholder="Ваши впечатления..."
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600"
      >
        {existingReview ? "Обновить отзыв" : "Отправить отзыв"}
      </button>
    </form>
  );
}

interface MenuItemReviewsProps {
  menuItemId: Id<"menuItems">;
}

function MenuItemReviews({ menuItemId }: MenuItemReviewsProps) {
  const reviews = useQuery(api.reviews.getReviewsByMenuItem, { menuItemId }) ?? [];

  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return { average: 0, count: 0 };
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return {
      average: parseFloat((totalRating / reviews.length).toFixed(1)),
      count: reviews.length,
    };
  };

  const { average, count } = calculateAverageRating();

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2">
        {count > 0 ? (
          <>
            <StarRatingDisplay rating={average} />
            <span className="text-sm text-gray-600">({average.toFixed(1)} из 5, {count} {count === 1 ? "отзыв" : count > 1 && count < 5 ? "отзыва" : "отзывов"})</span>
          </>
        ) : (
          <p className="text-sm text-gray-500">Отзывов пока нет.</p>
        )}
      </div>
      {reviews.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
          {reviews.map((review) => (
            <div key={review._id} className="text-xs p-2 border-b last:border-b-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{review.userName}</span>
                <StarRatingDisplay rating={review.rating} />
              </div>
              {review.comment && <p className="text-gray-600 mt-0.5">{review.comment}</p>}
              <p className="text-gray-400 text-right text-[10px]">{new Date(review._creationTime).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export function Menu() {
  const menuItems = useQuery(api.menu.listMenuItems, { category: undefined }) ?? [];
  const initializeMenu = useMutation(api.menu.initializeMenu);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedMenuItemForOrder, setSelectedMenuItemForOrder] = useState<Doc<"menuItems"> | null>(null);

  const handleOrderClick = (item: Doc<"menuItems">) => {
    if (!loggedInUser) {
      toast.error("Пожалуйста, войдите, чтобы сделать заказ.");
      // Optionally, trigger auth modal here:
      // find a way to call handleAuthClick("signin") from App.tsx or pass it down
      return;
    }
    setSelectedMenuItemForOrder(item);
    setIsOrderModalOpen(true);
  };
  
  return (
    <>
      <div className="py-4 sm:py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold">Наше Меню</h2>
          {menuItems.length === 0 && (
            <button
              onClick={() => initializeMenu()}
              className="bg-blue-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded text-sm sm:text-base hover:bg-blue-600"
            >
              Загрузить меню
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {menuItems.map((item) => (
            <div key={item._id} className="border rounded-lg p-3 sm:p-4 shadow-sm flex flex-col">
              {item.image && (
                <img src={item.image} alt={item.name} className="w-full h-40 sm:h-48 object-cover rounded-md mb-3 sm:mb-4" />
              )}
              <h3 className="text-lg sm:text-xl font-semibold">{item.name}</h3>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base flex-grow">{item.description}</p>
              <div className="mt-2">
                <p className="text-base sm:text-lg font-bold">${item.price.toFixed(2)}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{item.category}</p>
              </div>
              
              <button
                onClick={() => handleOrderClick(item)}
                className="mt-3 bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600 w-full"
              >
                Заказать
              </button>

              <div className="mt-auto pt-3 border-t border-gray-200">
                <MenuItemReviews menuItemId={item._id} />
                <ReviewForm menuItemId={item._id} loggedInUserId={loggedInUser?._id} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <OrderModal 
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        menuItem={selectedMenuItemForOrder}
      />
    </>
  );
}
