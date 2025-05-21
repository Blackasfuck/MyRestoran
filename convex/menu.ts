import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listMenuItems = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await ctx.db.query("menuItems").collect();
  }
});

export const addMenuItem = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.string(),
    image: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("menuItems", args);
  }
});

export const initializeMenu = mutation({
  args: {},
  handler: async (ctx) => {
    const menuItems = [
      {
        name: "Борщ",
        description: "Традиционный суп со свеклой, капустой и говядиной",
        price: 8.99,
        category: "Супы",
        image: "https://images.unsplash.com/photo-1550367363-ea12860cc124?w=500"
      },
      {
        name: "Пельмени",
        description: "Домашние пельмени с мясом, подаются со сметаной",
        price: 12.99,
        category: "Основные блюда",
        image: "https://images.unsplash.com/photo-1556716916-e08232095ac8?w=500"
      },
      {
        name: "Оливье",
        description: "Классический салат с курицей, овощами и майонезом",
        price: 7.99,
        category: "Салаты",
        image: "https://images.unsplash.com/photo-1611599538835-b52c9f289f4a?w=500"
      },
      {
        name: "Бефстроганов",
        description: "Нежная говядина в сливочном соусе с грибами",
        price: 16.99,
        category: "Основные блюда",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500"
      },
      {
        name: "Блины",
        description: "Тонкие блины с различными начинками на выбор",
        price: 9.99,
        category: "Десерты",
        image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500"
      },
      {
        name: "Шашлык",
        description: "Маринованное мясо на углях с овощами и соусом",
        price: 18.99,
        category: "Основные блюда",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500"
      },
      {
        name: "Селёдка под шубой",
        description: "Слоеный салат с сельдью, овощами и майонезом",
        price: 8.99,
        category: "Салаты",
        image: "https://images.unsplash.com/photo-1614777986387-015c2a89b696?w=500"
      },
      {
        name: "Медовик",
        description: "Многослойный медовый торт со сметанным кремом",
        price: 6.99,
        category: "Десерты",
        image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500"
      }
    ];

    for (const item of menuItems) {
      await ctx.db.insert("menuItems", item);
    }
  }
});
