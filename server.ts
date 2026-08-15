import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Server-side Gemini AI Client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API: AI Tutor / Element Explanation / Custom Query
app.post("/api/ai/explain", async (req, res) => {
  try {
    const { prompt, gradeLevel, mode } = req.body;
    const ai = getAiClient();

    let systemInstruction = `You are a world-class chemistry teacher and AI tutor for students learning chemistry.
Tailor your response to the target education level: ${gradeLevel || "High School"}.
Keep explanations visually structured using markdown headings, bullet points, and chemical formulas.
Be engaging, mathematically sound, accurate, and educational.`;

    if (mode === "mnemonic") {
      systemInstruction += "\nFocus on creating fun, memorable mnemonics, rhymes, or acronyms.";
    } else if (mode === "comparison") {
      systemInstruction += "\nFocus on comparing atomic structure, periodic trends, reactivity, and real-world uses.";
    } else if (mode === "simple") {
      systemInstruction += "\nExplain in simple, intuitive real-world analogies suitable for young students or beginners.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate AI response." });
  }
});

// API: Reaction Predictor
app.post("/api/ai/predict-reaction", async (req, res) => {
  try {
    const { reactants, temperature, pressure, catalyst } = req.body;
    const ai = getAiClient();

    const prompt = `Predict the chemical reaction between: ${reactants.join(" + ")}.
Conditions: Temperature ${temperature}°C, Pressure ${pressure} atm${catalyst ? `, Catalyst: ${catalyst}` : ""}.
Return a JSON object with:
- balancedEquation (string)
- products (array of strings)
- energyChange (string: e.g. "-184 kJ/mol (Exothermic)")
- reactionType (string: e.g. "Synthesis", "Combustion", "Redox")
- explanation (string explanation of what happens at the atomic/electron level)
- realWorldApplications (array of strings)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are an expert chemical reaction simulator engine.",
      },
    });

    res.json({ result: JSON.parse(response.text || "{}") });
  } catch (error: any) {
    console.error("Reaction prediction error:", error);
    res.status(500).json({ error: error?.message || "Failed to predict reaction." });
  }
});

// API: Generate Custom Quiz Question
app.post("/api/ai/generate-quiz", async (req, res) => {
  try {
    const { topic, difficulty, count = 3 } = req.body;
    const ai = getAiClient();

    const prompt = `Generate ${count} chemistry quiz questions for topic: "${topic || "Periodic Table & Trends"}" at difficulty level "${difficulty || "Grade 10"}".
Return JSON array of objects, where each question has:
- id (string)
- question (string)
- options (array of 4 string choices)
- correctIndex (number 0-3)
- explanation (string concise explanation of the correct answer)
- category (string e.g. "Periodic Trends", "Electron Configuration", "Valence")`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    res.json({ questions: JSON.parse(response.text || "[]") });
  } catch (error: any) {
    console.error("Quiz generation error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate quiz." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Periodic Table Explorer running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
