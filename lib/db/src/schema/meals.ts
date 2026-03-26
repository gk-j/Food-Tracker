import { pgTable, serial, text, numeric, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const foodItemSchema = z.object({
  name: z.string(),
  portion: z.string().optional(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fats: z.number(),
  fiber: z.number().optional(),
  sugar: z.number().optional(),
});

export type FoodItemData = z.infer<typeof foodItemSchema>;

export const mealsTable = pgTable("meals", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  imageUrl: text("image_url"),
  notes: text("notes"),
  foodItems: jsonb("food_items").notNull().$type<FoodItemData[]>(),
  totalCalories: numeric("total_calories", { precision: 10, scale: 2 }).notNull(),
  totalProtein: numeric("total_protein", { precision: 10, scale: 2 }).notNull(),
  totalCarbs: numeric("total_carbs", { precision: 10, scale: 2 }).notNull(),
  totalFats: numeric("total_fats", { precision: 10, scale: 2 }).notNull(),
  healthScore: numeric("health_score", { precision: 4, scale: 1 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMealSchema = createInsertSchema(mealsTable).omit({ id: true, createdAt: true });
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Meal = typeof mealsTable.$inferSelect;
