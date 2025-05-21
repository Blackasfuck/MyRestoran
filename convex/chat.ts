import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import OpenAI from "openai";
import { api } from "./_generated/api";
import { MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

const simpleResponses = {
  "как заказать": "Чтобы сделать заказ, вы можете позвонить нам по телефону или оформить заказ онлайн через наш сайт. Мы работаем ежедневно с 10:00 до 22:00.",
  "где находится": "Наш ресторан находится по адресу: ул. Пушкина, д. 10. Мы расположены в центре города, рядом с центральным парком.",
  "режим работы": "Мы работаем ежедневно с 10:00 до 22:00.",
  "доставка": "Мы осуществляем доставку по всему городу. Минимальная сумма заказа - 1000 рублей. Доставка бесплатная при заказе от 2000 рублей.",
  "хайку": "Напишите хайку о чем угодно, и я помогу вам с этим через AI."
};

const TOKENS_PER_DAY = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function getOrCreateUserTokens(ctx: MutationCtx, userId: Id<"users">) {
  const userTokens = await ctx.db
    .query("userTokens")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

  if (!userTokens) {
    const newTokens = {
      userId,
      tokens: TOKENS_PER_DAY,
      lastRefill: Date.now()
    };
    const id = await ctx.db.insert("userTokens", newTokens);
    return { _id: id, ...newTokens };
  }

  // Check if we should refill tokens (once per day)
  const daysSinceRefill = Math.floor((Date.now() - userTokens.lastRefill) / MS_PER_DAY);
  if (daysSinceRefill >= 1) {
    const updatedTokens = {
      ...userTokens,
      tokens: TOKENS_PER_DAY,
      lastRefill: Date.now()
    };
    await ctx.db.patch(userTokens._id, {
      tokens: TOKENS_PER_DAY,
      lastRefill: Date.now()
    });
    return updatedTokens;
  }

  return userTokens;
}

export const sendMessage = mutation({
  args: { 
    message: v.string(),
    botType: v.string()
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    if (args.botType === "ai") {
      const userTokens = await getOrCreateUserTokens(ctx, userId);
      if (userTokens.tokens <= 0) {
        throw new Error("У вас закончились токены. Попробуйте завтра или используйте простого помощника.");
      }
    }

    await ctx.db.insert("chatMessages", {
      userId,
      message: args.message,
      isBot: false,
      botType: args.botType
    });

    await ctx.scheduler.runAfter(0, api.chat.generateBotResponse, { 
      userId, 
      message: args.message,
      botType: args.botType 
    });
  }
});

export const generateBotResponse = action({
  args: { 
    userId: v.id("users"), 
    message: v.string(),
    botType: v.string()
  },
  handler: async (ctx, args) => {
    let botMessage;

    if (args.botType === "simple") {
      const lowerMessage = args.message.toLowerCase();
      botMessage = Object.entries(simpleResponses).find(
        ([key]) => lowerMessage.includes(key)
      )?.[1] ?? "Извините, я не понял ваш вопрос. Попробуйте спросить о том, как сделать заказ, где мы находимся или о режиме работы.";
    } else {
      const userTokens = await ctx.runQuery(api.chat.getUserTokens, { userId: args.userId });
      if (!userTokens || userTokens.tokens <= 0) {
        botMessage = "У вас закончились токены. Попробуйте завтра или используйте простого помощника.";
      } else {
        let prompt = args.message;
        if (args.message.toLowerCase().includes("хайку")) {
          prompt = "Write a haiku about " + args.message.replace(/хайку/gi, "").trim();
        }

        const response = await openai.chat.completions.create({
          model: "gpt-4.1-nano",
          messages: [
            { 
              role: "system", 
              content: "You are a helpful Russian restaurant assistant. Help customers with menu recommendations, cooking methods, ingredients, and general inquiries about Russian cuisine. If asked about haiku, write one in Russian. Always respond in Russian."
            },
            { role: "user", content: prompt }
          ]
        });
        botMessage = response.choices[0].message.content;

        // Decrease token count after successful AI response
        await ctx.runMutation(api.chat.decreaseTokens, { userId: args.userId });
      }
    }
    
    await ctx.runMutation(api.chat.saveBotResponse, {
      userId: args.userId,
      message: botMessage ?? "Извините, произошла ошибка.",
      botType: args.botType
    });
  }
});

export const getUserTokens = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userTokens")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
  }
});

export const decreaseTokens = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userTokens = await ctx.db
      .query("userTokens")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (userTokens && userTokens.tokens > 0) {
      await ctx.db.patch(userTokens._id, { tokens: userTokens.tokens - 1 });
    }
  }
});

export const saveBotResponse = mutation({
  args: { 
    userId: v.id("users"), 
    message: v.string(),
    botType: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("chatMessages", {
      userId: args.userId,
      message: args.message,
      isBot: true,
      botType: args.botType
    });
  }
});

export const listMessages = query({
  args: { botType: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("botType"), args.botType))
      .order("desc")
      .take(10);
  }
});
