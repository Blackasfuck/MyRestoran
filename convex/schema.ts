import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const applicationTables = {
  menuItems: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.string(),
    image: v.optional(v.string())
  }).index("by_category", ["category"]),
  
  chatMessages: defineTable({
    userId: v.id("users"),
    message: v.string(),
    isBot: v.boolean(),
    botType: v.string(), // "simple" or "ai"
  }).index("by_user", ["userId"]),

  userTokens: defineTable({
    userId: v.id("users"),
    tokens: v.number(),
    lastRefill: v.number(),
  }).index("by_user", ["userId"]),

  reviews: defineTable({
    menuItemId: v.id("menuItems"),
    userId: v.id("users"),
    rating: v.number(), // 1-5
    comment: v.optional(v.string()),
  })
  .index("by_menuItem", ["menuItemId"])
  .index("by_user_and_menuItem", ["userId", "menuItemId"]),

  orders: defineTable({
    userId: v.id("users"),
    menuItemId: v.id("menuItems"),
    menuItemName: v.string(), // Store name at time of order
    menuItemPrice: v.number(), // Store price at time of order
    quantity: v.number(),
    totalPrice: v.number(),
    orderType: v.union(v.literal("delivery"), v.literal("booking")),
    address: v.optional(v.string()), // For delivery
    bookingDate: v.optional(v.string()), // For booking
    bookingTime: v.optional(v.string()), // For booking
    cardDetailsPlaceholder: v.object({ // Placeholder, not for real use
      cardNumber: v.string(),
      expiryDate: v.string(),
      cvv: v.string(),
    }),
    status: v.string(), // e.g., "pending", "confirmed", "completed", "cancelled"
  })
  .index("by_user", ["userId"])
  .index("by_menuItem", ["menuItemId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
