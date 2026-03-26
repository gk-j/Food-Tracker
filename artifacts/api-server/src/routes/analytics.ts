import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { mealsTable } from "@workspace/db/schema";
import { eq, and, gte, lte, like } from "drizzle-orm";

const router: IRouter = Router();

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function getDayTotals(date: string) {
  const meals = await db
    .select()
    .from(mealsTable)
    .where(eq(mealsTable.date, date));

  return {
    date,
    calories: meals.reduce((sum, m) => sum + Number(m.totalCalories), 0),
    protein: meals.reduce((sum, m) => sum + Number(m.totalProtein), 0),
    carbs: meals.reduce((sum, m) => sum + Number(m.totalCarbs), 0),
    fats: meals.reduce((sum, m) => sum + Number(m.totalFats), 0),
    meals,
  };
}

router.get("/analytics/daily", async (req, res) => {
  const { date } = req.query;
  if (!date || typeof date !== "string") {
    res.status(400).json({ error: "date query param required" });
    return;
  }

  try {
    const [{ meals, ...totals }, settingsRows] = await Promise.all([
      getDayTotals(date),
      db.query.settingsTable.findFirst(),
    ]);

    const settings = settingsRows ?? {
      dailyCalorieGoal: "2000",
      dailyProteinGoal: "150",
      dailyCarbGoal: "250",
      dailyFatGoal: "65",
    };

    res.json({
      date,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFats: totals.fats,
      meals: meals.map((m) => ({
        ...m,
        totalCalories: Number(m.totalCalories),
        totalProtein: Number(m.totalProtein),
        totalCarbs: Number(m.totalCarbs),
        totalFats: Number(m.totalFats),
        healthScore: m.healthScore ? Number(m.healthScore) : null,
      })),
      calorieGoal: Number(settings.dailyCalorieGoal),
      proteinGoal: Number(settings.dailyProteinGoal),
      carbGoal: Number(settings.dailyCarbGoal),
      fatGoal: Number(settings.dailyFatGoal),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get daily summary");
    res.status(500).json({ error: "Failed to get daily summary" });
  }
});

router.get("/analytics/weekly", async (req, res) => {
  const { startDate } = req.query;
  if (!startDate || typeof startDate !== "string") {
    res.status(400).json({ error: "startDate query param required" });
    return;
  }

  try {
    const start = new Date(startDate);
    const days = [];

    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i);
      const dateStr = formatDate(d);
      const dayData = await getDayTotals(dateStr);
      days.push({
        date: dateStr,
        calories: dayData.calories,
        protein: dayData.protein,
        carbs: dayData.carbs,
        fats: dayData.fats,
      });
    }

    const endDate = formatDate(addDays(start, 6));
    const nonZeroDays = days.filter((d) => d.calories > 0);
    const count = nonZeroDays.length || 1;

    res.json({
      startDate,
      endDate,
      days,
      averageCalories: nonZeroDays.reduce((s, d) => s + d.calories, 0) / count,
      averageProtein: nonZeroDays.reduce((s, d) => s + d.protein, 0) / count,
      averageCarbs: nonZeroDays.reduce((s, d) => s + d.carbs, 0) / count,
      averageFats: nonZeroDays.reduce((s, d) => s + d.fats, 0) / count,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get weekly summary");
    res.status(500).json({ error: "Failed to get weekly summary" });
  }
});

router.get("/analytics/monthly", async (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) {
    res.status(400).json({ error: "year and month query params required" });
    return;
  }

  const y = parseInt(year as string, 10);
  const m = parseInt(month as string, 10);

  try {
    const daysInMonth = new Date(y, m, 0).getDate();
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayData = await getDayTotals(dateStr);
      days.push({
        date: dateStr,
        calories: dayData.calories,
        protein: dayData.protein,
        carbs: dayData.carbs,
        fats: dayData.fats,
      });
    }

    const nonZeroDays = days.filter((d) => d.calories > 0);
    const count = nonZeroDays.length || 1;

    res.json({
      year: y,
      month: m,
      days,
      averageCalories: nonZeroDays.reduce((s, d) => s + d.calories, 0) / count,
      averageProtein: nonZeroDays.reduce((s, d) => s + d.protein, 0) / count,
      averageCarbs: nonZeroDays.reduce((s, d) => s + d.carbs, 0) / count,
      averageFats: nonZeroDays.reduce((s, d) => s + d.fats, 0) / count,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get monthly summary");
    res.status(500).json({ error: "Failed to get monthly summary" });
  }
});

export default router;
