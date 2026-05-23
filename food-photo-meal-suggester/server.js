import express from "express";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const client = new Anthropic();

app.use(express.static(path.join(__dirname, "public")));

const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const SYSTEM_PROMPT = `You are a friendly home-cooking assistant. The user will send a photo of food items — ingredients in a fridge, on a counter, in a grocery bag, on a plate, etc.

Your job:
1. Identify the food items visible in the photo.
2. Suggest 3-5 meals the user could make primarily from those items.

For each meal, prefer recipes that use the visible ingredients with at most a few common pantry staples (salt, oil, basic spices, rice/pasta, eggs). Note any extra ingredients clearly.

If the photo doesn't show food, return an empty ingredients list and explain in the description of a single "meal" entry that no food was visible.`;

const MEAL_SCHEMA = {
  type: "object",
  properties: {
    ingredients: {
      type: "array",
      description: "Food items visible in the photo.",
      items: { type: "string" },
    },
    meals: {
      type: "array",
      description: "Meal ideas the user could make from those ingredients.",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the dish." },
          description: {
            type: "string",
            description: "A short description of how to make it (2-4 sentences).",
          },
          ingredients_used: {
            type: "array",
            description: "Ingredients from the photo that this meal uses.",
            items: { type: "string" },
          },
          additional_ingredients: {
            type: "array",
            description: "Common pantry items needed beyond what's in the photo.",
            items: { type: "string" },
          },
          time_minutes: {
            type: "integer",
            description: "Rough total time to make, in minutes.",
          },
        },
        required: [
          "name",
          "description",
          "ingredients_used",
          "additional_ingredients",
          "time_minutes",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["ingredients", "meals"],
  additionalProperties: false,
};

app.post("/analyze", upload.single("photo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No photo uploaded." });
  }
  if (!SUPPORTED_TYPES.has(req.file.mimetype)) {
    return res.status(400).json({
      error: `Unsupported image type: ${req.file.mimetype}. Use JPEG, PNG, WebP, or GIF.`,
    });
  }

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      output_config: {
        format: { type: "json_schema", schema: MEAL_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: req.file.mimetype,
                data: req.file.buffer.toString("base64"),
              },
            },
            {
              type: "text",
              text: "Here's a photo of what I have. What meals can I make?",
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock) {
      return res.status(502).json({ error: "Model returned no text content." });
    }

    const parsed = JSON.parse(textBlock.text);
    res.json(parsed);
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${err.status}:`, err.message);
      return res.status(502).json({ error: `Model API error: ${err.message}` });
    }
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Something went wrong analyzing the photo." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Food photo meal suggester listening on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("Warning: ANTHROPIC_API_KEY is not set. Requests to /analyze will fail.");
  }
});
