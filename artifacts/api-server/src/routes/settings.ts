import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db/schema";
import { z } from "zod";

const router: IRouter = Router();

const updateSettingsSchema = z.object({
  dailyCalorieGoal: z.number(),
  dailyProteinGoal: z.number(),
  dailyCarbGoal: z.number(),
  dailyFatGoal: z.number(),
});

router.get("/settings", async (req, res) => {
  try {
    let settings = await db.query.settingsTable.findFirst();

    if (!settings) {
      const [newSettings] = await db
        .insert(settingsTable)
        .values({
          dailyCalorieGoal: "2000",
          dailyProteinGoal: "150",
          dailyCarbGoal: "250",
          dailyFatGoal: "65",
        })
        .returning();
      settings = newSettings;
    }

    res.json({
      id: settings.id,
      dailyCalorieGoal: Number(settings.dailyCalorieGoal),
      dailyProteinGoal: Number(settings.dailyProteinGoal),
      dailyCarbGoal: Number(settings.dailyCarbGoal),
      dailyFatGoal: Number(settings.dailyFatGoal),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get settings");
    res.status(500).json({ error: "Failed to get settings" });
  }
});

router.put("/settings", async (req, res) => {
  const parsed = updateSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const data = parsed.data;

  try {
    let settings = await db.query.settingsTable.findFirst();

    if (!settings) {
      const [newSettings] = await db
        .insert(settingsTable)
        .values({
          dailyCalorieGoal: String(data.dailyCalorieGoal),
          dailyProteinGoal: String(data.dailyProteinGoal),
          dailyCarbGoal: String(data.dailyCarbGoal),
          dailyFatGoal: String(data.dailyFatGoal),
        })
        .returning();
      settings = newSettings;
    } else {
      const { eq } = await import("drizzle-orm");
      const [updated] = await db
        .update(settingsTable)
        .set({
          dailyCalorieGoal: String(data.dailyCalorieGoal),
          dailyProteinGoal: String(data.dailyProteinGoal),
          dailyCarbGoal: String(data.dailyCarbGoal),
          dailyFatGoal: String(data.dailyFatGoal),
        })
        .where(eq(settingsTable.id, settings.id))
        .returning();
      settings = updated;
    }

    res.json({
      id: settings.id,
      dailyCalorieGoal: Number(settings.dailyCalorieGoal),
      dailyProteinGoal: Number(settings.dailyProteinGoal),
      dailyCarbGoal: Number(settings.dailyCarbGoal),
      dailyFatGoal: Number(settings.dailyFatGoal),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
