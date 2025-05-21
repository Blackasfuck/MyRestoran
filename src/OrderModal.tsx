import { useState, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc, Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: Doc<"menuItems"> | null;
}

export function OrderModal({ isOpen, onClose, menuItem }: OrderModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<"delivery" | "booking">("delivery");
  const [address, setAddress] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createOrder = useMutation(api.orders.createOrder);

  useEffect(() => {
    if (menuItem) {
      // Reset form when modal opens or menuItem changes
      setQuantity(1);
      setOrderType("delivery");
      setAddress("");
      setBookingDate("");
      setBookingTime("");
      setCardNumber("");
      setExpiryDate("");
      setCvv("");
    }
  }, [isOpen, menuItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuItem) return;
    setIsSubmitting(true);

    try {
      await createOrder({
        menuItemId: menuItem._id,
        quantity,
        orderType,
        address: orderType === "delivery" ? address : undefined,
        bookingDate: orderType === "booking" ? bookingDate : undefined,
        bookingTime: orderType === "booking" ? bookingTime : undefined,
        cardDetailsPlaceholder: { cardNumber, expiryDate, cvv },
      });
      toast.success(`Заказ на "${menuItem.name}" успешно оформлен!`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Не удалось оформить заказ.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 16) value = value.slice(0, 16); // Max 16 digits
    // Add spaces for readability
    value = value.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(value);
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    setExpiryDate(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCvv(value.slice(0, 3));
  };


  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen || !menuItem) return null;

  const totalPrice = (menuItem.price * quantity).toFixed(2);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">Оформление заказа: {menuItem.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Количество порций:</label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Тип заказа:</label>
            <div className="mt-1 flex gap-4">
              <label className="flex items-center">
                <input type="radio" name="orderType" value="delivery" checked={orderType === "delivery"} onChange={() => setOrderType("delivery")} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"/>
                <span className="ml-2 text-sm text-gray-700">Доставка на дом</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="orderType" value="booking" checked={orderType === "booking"} onChange={() => setOrderType("booking")} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"/>
                <span className="ml-2 text-sm text-gray-700">Забронировать столик</span>
              </label>
            </div>
          </div>

          {orderType === "delivery" && (
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Адрес доставки:</label>
              <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2" required={orderType === "delivery"} placeholder="Улица, дом, квартира"/>
            </div>
          )}

          {orderType === "booking" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-700">Дата бронирования:</label>
                <input type="date" id="bookingDate" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2" required={orderType === "booking"} min={new Date().toISOString().split('T')[0]}/>
              </div>
              <div>
                <label htmlFor="bookingTime" className="block text-sm font-medium text-gray-700">Время бронирования:</label>
                <input type="time" id="bookingTime" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2" required={orderType === "booking"}/>
              </div>
            </div>
          )}
          
          <div className="border-t pt-4">
            <h3 className="text-md font-semibold mb-2 text-gray-700">Данные карты (для демонстрации)</h3>
            <p className="text-xs text-orange-600 mb-2">Внимание: Не вводите реальные данные карты. Эта форма предназначена только для демонстрации.</p>
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">Номер карты:</label>
              <input type="text" id="cardNumber" value={cardNumber} onChange={handleCardNumberChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2" placeholder="0000 0000 0000 0000" required/>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">Срок действия (ММ/ГГ):</label>
                <input type="text" id="expiryDate" value={expiryDate} onChange={handleExpiryDateChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2" placeholder="ММ/ГГ" required/>
              </div>
              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">CVV:</label>
                <input type="text" id="cvv" value={cvv} onChange={handleCvvChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2" placeholder="000" required/>
              </div>
            </div>
          </div>

          <div className="mt-6 text-right">
            <p className="text-lg font-semibold mb-2">Итого: ${totalPrice}</p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {isSubmitting ? "Обработка..." : "Подтвердить заказ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
