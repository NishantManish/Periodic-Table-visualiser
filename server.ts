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

// Lightweight in-memory LRU-style cache to ensure instant sub-5ms responses for repeated queries
interface CacheEntry {
  data: any;
  timestamp: number;
}
const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCached(key: string) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: any) {
  // Keep cache size bounded
  if (responseCache.size > 250) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(key, { data, timestamp: Date.now() });
}

// Periodic table elements for entropy injection
const SAMPLE_ELEMENTS = [
  "Hydrogen", "Helium", "Lithium", "Beryllium", "Boron", "Carbon", "Nitrogen", "Oxygen", "Fluorine", "Neon",
  "Sodium", "Magnesium", "Aluminum", "Silicon", "Phosphorus", "Sulfur", "Chlorine", "Argon", "Potassium", "Calcium",
  "Scandium", "Titanium", "Vanadium", "Chromium", "Manganese", "Iron", "Cobalt", "Nickel", "Copper", "Zinc",
  "Gallium", "Germanium", "Arsenic", "Selenium", "Bromine", "Krypton", "Rubidium", "Strontium", "Yttrium", "Zirconium",
  "Niobium", "Molybdenum", "Technetium", "Ruthenium", "Rhodium", "Palladium", "Silver", "Cadmium", "Indium", "Tin",
  "Antimony", "Tellurium", "Iodine", "Xenon", "Cesium", "Barium", "Gold", "Platinum", "Uranium"
];

const QUESTION_ARCHETYPES = [
  "Tricky periodic trend exceptions (e.g. electron affinity anomalies, atomic radii)",
  "Surprising real-world materials in aerospace, medicine, and clean energy",
  "Unusual chemical reactions, flame test colors, and spectroscopic signatures",
  "Quantum number configurations, subshell shielding, and Hund rule edge cases",
  "Crystal lattices, allotropes (diamond, graphene, white phosphorus), and phase diagrams",
  "Coordination complexes, transition metal colors, and catalytic oxidation states"
];

// Helper to parse JSON reliably from LLM outputs
function extractJson(text: string) {
  const cleaned = text
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/```\s*$/m, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBracket = cleaned.indexOf("{");
    const firstSquare = cleaned.indexOf("[");
    let startIdx = -1;
    if (firstBracket !== -1 && firstSquare !== -1) {
      startIdx = Math.min(firstBracket, firstSquare);
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
    } else if (firstSquare !== -1) {
      startIdx = firstSquare;
    }

    if (startIdx !== -1) {
      const isObject = cleaned[startIdx] === "{";
      const endIdx = isObject ? cleaned.lastIndexOf("}") : cleaned.lastIndexOf("]");
      if (endIdx > startIdx) {
        return JSON.parse(cleaned.substring(startIdx, endIdx + 1));
      }
    }
    throw new Error("Unable to parse JSON from AI response: " + cleaned.slice(0, 100));
  }
}

/**
 * Fast call to NVIDIA NIM API using the active, ultra-fast model (meta/llama-3.2-11b-vision-instruct).
 * Supports configurable model via NVIDIA_NIM_MODEL env var.
 */
async function callNvidiaNim({
  messages,
  temperature = 0.3,
  max_tokens = 700,
  timeoutMs = 15000,
}: {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  max_tokens?: number;
  timeoutMs?: number;
}) {
  const apiKey = (process.env.NVIDIA_API_KEY || process.env.NIM_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("NVIDIA NIM API key is not configured.");
  }

  // Active, high-speed available NIM model: meta/llama-3.2-11b-vision-instruct
  const model = process.env.NVIDIA_NIM_MODEL?.trim() || "meta/llama-3.2-11b-vision-instruct";
  const start = Date.now();

  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const latencyMs = Date.now() - start;

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA NIM API HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || "";
  return { content: rawContent.trim(), latencyMs, model };
}

// Resilient Gemini fallback if NIM encounters a transient issue or is unconfigured
async function callGeminiFallback({
  systemPrompt,
  userPrompt,
  maxTokens = 600,
}: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}) {
  const ai = getAiClient();
  const start = Date.now();
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: maxTokens,
    },
  });
  return {
    content: (response.text || "").trim(),
    latencyMs: Date.now() - start,
    model: "gemini-3.6-flash",
  };
}

// Check if NVIDIA NIM is configured
function hasNvidiaNim(): boolean {
  const key = process.env.NVIDIA_API_KEY || process.env.NIM_API_KEY;
  return Boolean(key && key.trim().length > 0);
}

// API: AI Tutor / Element Explanation / Custom Query
app.post("/api/ai/explain", async (req, res) => {
  try {
    const { prompt, gradeLevel, mode } = req.body;
    const cacheKey = `explain:${gradeLevel || "Grade 10"}:${mode || "normal"}:${(prompt || "").trim().toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true, latencyMs: 2 });
    }

    let systemPrompt = `You are an engaging chemistry professor and AI tutor.
Target Curriculum: ${gradeLevel || "Grade 10"}.
Rules:
- Be direct, concise, and structured.
- Use markdown formatting with short headings, bullet points, and chemical symbols (e.g. H2O, [Ar] 4s1).
- Explain core mechanisms clearly without unnecessary fluff.`;

    if (mode === "mnemonic") {
      systemPrompt += "\nCreate 1-2 fun, memorable mnemonics, rhymes, or acronyms.";
    } else if (mode === "comparison") {
      systemPrompt += "\nCompare atomic radius, electronegativity, ionization energy, and reactivity in a concise side-by-side format.";
    } else if (mode === "simple") {
      systemPrompt += "\nExplain in 1 simple, intuitive everyday analogy suitable for beginners.";
    }

    let resultPayload;

    if (hasNvidiaNim()) {
      try {
        const { content, latencyMs, model } = await callNvidiaNim({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.35,
          max_tokens: 450,
        });

        resultPayload = {
          result: content,
          provider: "nvidia-nim",
          model,
          latencyMs,
        };
      } catch (nimErr) {
        console.warn("NVIDIA NIM call failed, falling back to Gemini:", nimErr);
        const { content, latencyMs, model } = await callGeminiFallback({
          systemPrompt,
          userPrompt: prompt,
          maxTokens: 450,
        });
        resultPayload = {
          result: content,
          provider: "gemini",
          model,
          latencyMs,
        };
      }
    } else {
      const { content, latencyMs, model } = await callGeminiFallback({
        systemPrompt,
        userPrompt: prompt,
        maxTokens: 450,
      });
      resultPayload = {
        result: content,
        provider: "gemini",
        model,
        latencyMs,
      };
    }

    setCached(cacheKey, resultPayload);
    return res.json(resultPayload);
  } catch (error: any) {
    console.error("AI Explain API Error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate AI response." });
  }
});

// API: Reaction Predictor
app.post("/api/ai/predict-reaction", async (req, res) => {
  try {
    const { reactants, conditions } = req.body;
    const temp = conditions?.temp ?? req.body.temperature ?? 25;
    const pressure = conditions?.pressure ?? req.body.pressure ?? 1;
    const catalyst = conditions?.catalyst ?? req.body.catalyst ?? "None";

    const reactantsText = Array.isArray(reactants) ? reactants.join(" + ") : String(reactants || "");
    const cacheKey = `reaction:${reactantsText}:${temp}:${pressure}:${catalyst}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true, latencyMs: 2 });
    }

    const prompt = `You are a physical chemistry simulation engine.
Predict the chemical reaction for: "${reactantsText}".
Conditions: Temp ${temp}°C, Pressure ${pressure} atm, Catalyst: ${catalyst}.

Output strictly valid JSON (no markdown formatting, only JSON) matching:
{
  "id": "rxn-${Date.now()}",
  "title": "Chemical Reaction Name",
  "reactants": ["Reactant1", "Reactant2"],
  "products": ["Product1", "Product2"],
  "balancedEquation": "Balanced stoichiometric equation (e.g. 2Na + 2H2O -> 2NaOH + H2)",
  "energyChange": "-368 kJ/mol (Exothermic)",
  "deltaH": -368,
  "activationEnergy": 45,
  "entropyChange": 120,
  "reactionType": "Synthesis / Decomposition / Single Replacement / Double Replacement / Combustion / Redox",
  "equilibriumType": "Reversible or Irreversible",
  "phaseState": "Gas Phase / Aqueous Solution / Heterogeneous / Solid-Liquid",
  "description": "Clear explanation of the chemical transformation and electron/bond redistribution.",
  "industrialApplication": "Key industrial, energy, biological, or laboratory application.",
  "safetyNotes": ["Safety note 1", "Safety note 2"],
  "stepsExplanation": [
    {"step": 1, "title": "Initiation", "detail": "Atomic-level description"},
    {"step": 2, "title": "Transition State", "detail": "Activation barrier"},
    {"step": 3, "title": "Bond Cleavage", "detail": "Intermediate rearrangement"},
    {"step": 4, "title": "Product Formation", "detail": "Enthalpy dissipation"}
  ],
  "requiredConditions": {
    "temp": ${temp},
    "pressure": ${pressure},
    "catalyst": "${catalyst}"
  }
}`;

    const systemPrompt = "You are an expert chemical reaction simulation engine. You output valid parseable JSON only without code blocks.";
    let resultPayload;

    if (hasNvidiaNim()) {
      try {
        const { content, latencyMs, model } = await callNvidiaNim({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 500,
          timeoutMs: 8000,
        });

        const parsed = extractJson(content);
        resultPayload = {
          result: parsed,
          provider: "nvidia-nim",
          model,
          latencyMs,
        };
      } catch (nimErr) {
        console.warn("NVIDIA NIM reaction call failed, falling back to Gemini:", nimErr);
        const { content, latencyMs, model } = await callGeminiFallback({
          systemPrompt,
          userPrompt: prompt,
          maxTokens: 500,
        });
        const parsed = extractJson(content);
        resultPayload = {
          result: parsed,
          provider: "gemini",
          model,
          latencyMs,
        };
      }
    } else {
      const { content, latencyMs, model } = await callGeminiFallback({
        systemPrompt,
        userPrompt: prompt,
        maxTokens: 500,
      });
      const parsed = extractJson(content);
      resultPayload = {
        result: parsed,
        provider: "gemini",
        model,
        latencyMs,
      };
    }

    setCached(cacheKey, resultPayload);
    return res.json(resultPayload);
  } catch (error: any) {
    console.error("Reaction prediction error:", error);
    res.status(500).json({ error: error?.message || "Failed to predict reaction." });
  }
});

// API: Generate Custom Quiz Question using NVIDIA NIM API with fallback
app.post("/api/ai/generate-quiz", async (req, res) => {
  try {
    const { topic, difficulty, count = 1 } = req.body;
    
    // Check if it's a request for a random question to skip cache entirely
    const isRandomRequest = (topic || "").toLowerCase().includes("random");
    const cacheKey = `quiz:${(topic || "").toLowerCase().trim()}:${difficulty || "Grade 10"}`;
    
    if (!isRandomRequest) {
      const cachedData = getCached(cacheKey);
      if (cachedData && Math.random() > 0.4) {
        return res.json({ ...cachedData, cached: true, latencyMs: 2 });
      }
    }

    // Pick 3 random elements and a random archetype to ensure high entropy
    const shuffledElements = [...SAMPLE_ELEMENTS].sort(() => 0.5 - Math.random());
    const randomElements = shuffledElements.slice(0, 3);
    const randomArchetype = QUESTION_ARCHETYPES[Math.floor(Math.random() * QUESTION_ARCHETYPES.length)];

    const prompt = `Create exactly ${count} multiple-choice chemistry question.
Level: "${difficulty || "Grade 10"}".
Topic: "${topic || "Periodic Table"}".
Anchor: ${randomElements.join(", ")} (${randomArchetype}).

Output ONLY a parseable JSON array of objects:
[
  {
    "id": "q1",
    "question": "Engaging, precise question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of the correct answer.",
    "category": "Periodic Trends"
  }
]
Important: "correctIndex" must be integer (0, 1, 2, or 3).`;

    const systemPrompt = "You are an expert chemistry professor. You output ONLY valid parseable JSON array with no surrounding text.";
    let resultPayload;

    if (hasNvidiaNim()) {
      try {
        const { content, latencyMs, model } = await callNvidiaNim({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 380,
          timeoutMs: 8000,
        });

        const parsed = extractJson(content);
        const questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);

        resultPayload = {
          questions,
          provider: "nvidia-nim",
          model,
          latencyMs,
          archetype: randomArchetype,
        };
      } catch (nimErr) {
        console.warn("NVIDIA NIM quiz generation failed, falling back to Gemini:", nimErr);
        const { content, latencyMs, model } = await callGeminiFallback({
          systemPrompt,
          userPrompt: prompt,
          maxTokens: 380,
        });
        const parsed = extractJson(content);
        const questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
        resultPayload = {
          questions,
          provider: "gemini",
          model,
          latencyMs,
          archetype: randomArchetype,
        };
      }
    } else {
      const { content, latencyMs, model } = await callGeminiFallback({
        systemPrompt,
        userPrompt: prompt,
        maxTokens: 380,
      });
      const parsed = extractJson(content);
      const questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
      resultPayload = {
        questions,
        provider: "gemini",
        model,
        latencyMs,
        archetype: randomArchetype,
      };
    }

    if (!isRandomRequest) {
      setCached(cacheKey, resultPayload);
    }
    return res.json(resultPayload);
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
