import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { mealsTable, foodItemSchema } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { z } from "zod";

const router: IRouter = Router();

const logMealBodySchema = z.object({
  date: z.string(),
  time: z.string(),
  imageUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  foodItems: z.array(foodItemSchema),
  totalCalories: z.number(),
  totalProtein: z.number(),
  totalCarbs: z.number(),
  totalFats: z.number(),
  healthScore: z.number().nullable().optional(),
});

const analyzeBodySchema = z.object({
  imageBase64: z.string(),
});

router.post("/meals/analyze", async (req, res) => {
  const parsed = analyzeBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { imageBase64 } = parsed.data;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `You are a professional nutritionist and food recognition AI. When given an image of food, you must:
1. Identify all food items visible in the image
2. Estimate realistic portion sizes 
3. Calculate accurate nutritional information for each item
4. Return a JSON object with the exact structure specified

Be accurate and realistic with your estimates. Use standard nutritional databases as reference.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: "text",
              text: `Analyze this food image and return ONLY valid JSON in this exact format:
{
  "description": "Brief description of the meal",
  "healthScore": <number 1-10>,
  "foodItems": [
    {
      "name": "<food name>",
      "portion": "<portion size e.g. '1 cup', '200g', '1 slice'>",
      "calories": <number>,
      "protein": <grams as number>,
      "carbs": <grams as number>,
      "fats": <grams as number>,
      "fiber": <grams as number>,
      "sugar": <grams as number>
    }
  ],
  "totalCalories": <sum of all calories>,
  "totalProtein": <sum of all protein grams>,
  "totalCarbs": <sum of all carb grams>,
  "totalFats": <sum of all fat grams>
}`,
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    const result = JSON.parse(jsonMatch[0]);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to analyze image");
    res.status(500).json({ error: "Failed to analyze food image" });
  }
});

router.get("/meals", async (req, res) => {
  const { date } = req.query;
  if (!date || typeof date !== "string") {
    res.status(400).json({ error: "date query param required" });
    return;
  }

  try {
    const meals = await db
      .select()
      .from(mealsTable)
      .where(eq(mealsTable.date, date))
      .orderBy(mealsTable.createdAt);

    res.json(
      meals.map((m) => ({
        ...m,
        totalCalories: Number(m.totalCalories),
        totalProtein: Number(m.totalProtein),
        totalCarbs: Number(m.totalCarbs),
        totalFats: Number(m.totalFats),
        healthScore: m.healthScore ? Number(m.healthScore) : null,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get meals");
    res.status(500).json({ error: "Failed to get meals" });
  }
});

router.post("/meals", async (req, res) => {
  const parsed = logMealBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error });
    return;
  }

  const data = parsed.data;

  try {
    const [meal] = await db
      .insert(mealsTable)
      .values({
        date: data.date,
        time: data.time,
        imageUrl: data.imageUrl ?? null,
        notes: data.notes ?? null,
        foodItems: data.foodItems,
        totalCalories: String(data.totalCalories),
        totalProtein: String(data.totalProtein),
        totalCarbs: String(data.totalCarbs),
        totalFats: String(data.totalFats),
        healthScore: data.healthScore != null ? String(data.healthScore) : null,
      })
      .returning();

    res.status(201).json({
      ...meal,
      totalCalories: Number(meal.totalCalories),
      totalProtein: Number(meal.totalProtein),
      totalCarbs: Number(meal.totalCarbs),
      totalFats: Number(meal.totalFats),
      healthScore: meal.healthScore ? Number(meal.healthScore) : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to log meal");
    res.status(500).json({ error: "Failed to log meal" });
  }
});

router.delete("/meals/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid meal id" });
    return;
  }

  try {
    await db.delete(mealsTable).where(eq(mealsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete meal");
    res.status(500).json({ error: "Failed to delete meal" });
  }
});

export default router;
