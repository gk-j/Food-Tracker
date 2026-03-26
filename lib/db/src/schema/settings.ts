import { pgTable, serial, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  dailyCalorieGoal: numeric("daily_calorie_goal", { precision: 10, scale: 2 }).notNull().default("2000"),
  dailyProteinGoal: numeric("daily_protein_goal", { precision: 10, scale: 2 }).notNull().default("150"),
  dailyCarbGoal: numeric("daily_carb_goal", { precision: 10, scale: 2 }).notNull().default("250"),
  dailyFatGoal: numeric("daily_fat_goal", { precision: 10, scale: 2 }).notNull().default("65"),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
