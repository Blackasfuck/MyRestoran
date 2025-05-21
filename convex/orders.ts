import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id, Doc } from "./_generated/dataModel";

export const createOrder = mutation({
  args: {
    menuItemId: v.id("menuItems"),
    quantity: v.number(),
    orderType: v.union(v.literal("delivery"), v.literal("booking")),
    address: v.optional(v.string()),
    bookingDate: v.optional(v.string()),
    bookingTime: v.optional(v.string()),
    cardDetailsPlaceholder: v.object({
      cardNumber: v.string(),
      expiryDate: v.string(),
      cvv: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated. Please log in to place an order.");
    }

    if (args.quantity <= 0) {
      throw new Error("Quantity must be greater than 0.");
    }

    const menuItem = await ctx.db.get(args.menuItemId);
    if (!menuItem) {
      throw new Error("Menu item not found.");
    }

    if (args.orderType === "delivery" && !args.address) {
      throw new Error("Address is required for delivery orders.");
    }
    if (args.orderType === "booking" && (!args.bookingDate || !args.bookingTime)) {
      throw new Error("Booking date and time are required for table reservations.");
    }
    
    // Basic validation for placeholder card details
    if (!args.cardDetailsPlaceholder.cardNumber || !args.cardDetailsPlaceholder.expiryDate || !args.cardDetailsPlaceholder.cvv) {
        throw new Error("Пожалуйста, заполните все поля банковской карты (для демонстрации).");
    }
    if (args.cardDetailsPlaceholder.cardNumber.replace(/\s/g, '').length !== 16 || !/^\d+$/.test(args.cardDetailsPlaceholder.cardNumber.replace(/\s/g, ''))) {
        throw new Error("Номер карты должен состоять из 16 цифр (для демонстрации).");
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(args.cardDetailsPlaceholder.expiryDate)) {
        throw new Error("Срок действия карты должен быть в формате ММ/ГГ (для демонстрации).");
    }
    if (args.cardDetailsPlaceholder.cvv.length !== 3 || !/^\d+$/.test(args.cardDetailsPlaceholder.cvv)) {
        throw new Error("CVV должен состоять из 3 цифр (для демонстрации).");
    }


    const totalPrice = menuItem.price * args.quantity;

    const orderId = await ctx.db.insert("orders", {
      userId,
      menuItemId: args.menuItemId,
      menuItemName: menuItem.name,
      menuItemPrice: menuItem.price,
      quantity: args.quantity,
      totalPrice,
      orderType: args.orderType,
      address: args.address,
      bookingDate: args.bookingDate,
      bookingTime: args.bookingTime,
      cardDetailsPlaceholder: args.cardDetailsPlaceholder, // Storing placeholder
      status: "pending", // Initial status
    });

    return orderId;
  },
});

export const listUserOrders = query({
  handler: async (ctx): Promise<Doc<"orders">[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return []; // Or throw new Error("User not authenticated");
    }
    return await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc") // Show newest orders first
      .collect();
  },
});
