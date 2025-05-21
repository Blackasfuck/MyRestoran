import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export const submitReview = mutation({
  args: {
    menuItemId: v.id("menuItems"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated. Please log in to submit a review.");
    }

    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5.");
    }
    // Ensure rating is an integer if desired, or allow floats
    const rating = Math.round(args.rating);


    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_user_and_menuItem", (q) =>
        q.eq("userId", userId).eq("menuItemId", args.menuItemId)
      )
      .unique();

    if (existingReview) {
      await ctx.db.patch(existingReview._id, {
        rating: rating,
        comment: args.comment,
      });
    } else {
      await ctx.db.insert("reviews", {
        menuItemId: args.menuItemId,
        userId,
        rating: rating,
        comment: args.comment,
      });
    }
    return true;
  },
});

export const getReviewsByMenuItem = query({
  args: { menuItemId: v.id("menuItems") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_menuItem", (q) => q.eq("menuItemId", args.menuItemId))
      .order("desc") // Show newest reviews first
      .collect();

    const reviewsWithUserNames = await Promise.all(
      reviews.map(async (review) => {
        const user = await ctx.db.get(review.userId);
        return {
          ...review,
          userName: user?.name ?? "Anonymous",
        };
      })
    );
    return reviewsWithUserNames;
  },
});

export const getUserReviewForMenuItem = query({
  args: { menuItemId: v.id("menuItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db
      .query("reviews")
      .withIndex("by_user_and_menuItem", (q) =>
        q.eq("userId", userId).eq("menuItemId", args.menuItemId)
      )
      .unique();
  },
});
