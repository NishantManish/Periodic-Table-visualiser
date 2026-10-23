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
 * Fast call to OpenRouter API using recursive/flint-v1.0:free (or OPENROUTER_MODEL env var)
 * when OPENROUTER_API_KEY is configured, or NVIDIA NIM API using meta/llama-3.2-11b-vision-instruct.
 */
async function callOpenRouter({
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
  const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("OpenRouter API key is not configured.");
  }

  const model = process.env.OPENROUTER_MODEL?.trim() || "recursive/flint-v1.0:free";
  const start = Date.now();

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
    throw new Error(`OpenRouter API HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || "";
  return { content: rawContent.trim(), latencyMs, model, provider: "openrouter" as const };
}

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
  // Prefer OpenRouter recursive/flint-v1.0:free if OPENROUTER_API_KEY is present
  if ((process.env.OPENROUTER_API_KEY || "").trim().length > 0) {
    return callOpenRouter({ messages, temperature, max_tokens, timeoutMs });
  }

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
  return { content: rawContent.trim(), latencyMs, model, provider: "nvidia-nim" as const };
}

// Resilient Gemini fallback if NIM/OpenRouter encounters a transient issue or is unconfigured
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
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const response = await ai.models.generateContent({
    model: modelName,
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: maxTokens,
    },
  });
  return {
    content: (response.text || "").trim(),
    latencyMs: Date.now() - start,
    model: modelName,
  };
}

// Check if OpenRouter or NVIDIA NIM is configured
function hasNvidiaNim(): boolean {
  const key = process.env.OPENROUTER_API_KEY || process.env.NVIDIA_API_KEY || process.env.NIM_API_KEY;
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

// API: Analyze Custom Molecule & Structural Isomers with 3D Coordinates
app.post("/api/ai/analyze-molecule", async (req, res) => {
  try {
    const { query } = req.body;
    const cleanQuery = String(query || "").trim();
    if (!cleanQuery) {
      return res.status(400).json({ error: "Molecule query is required." });
    }

    const cacheKey = `molecule-v3:${cleanQuery.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true, latencyMs: 2 });
    }

    const prompt = `You are a computational chemistry and crystallography engine.
Analyze the chemical molecule or formula: "${cleanQuery}".
If this formula has multiple structural or geometric isomers (same atoms, different connectivity/structure), also return 1 alternative structural isomer in "relatedIsomers" using the exact same MoleculeDossier schema.

Output strictly valid JSON matching this exact MoleculeDossier schema (no markdown blocks):
{
  "molecule": {
    "id": "ai-${Date.now()}",
    "name": "Common Name",
    "iupacName": "Official IUPAC Name",
    "commonNames": ["Synonym 1"],
    "casNumber": "CAS Number",
    "smiles": "SMILES string",
    "formula": "Unicode subscript Hill formula e.g. C₃H₈O",
    "condensedFormula": "Condensed formula e.g. CH₃CH₂CH₂OH",
    "isomerGroup": "ASCII formula without subscripts e.g. C3H8O",
    "isomerType": "Constitutional (Functional Group)",
    "isomerComparisonNote": "Why this isomer differs in structure, dipole moment, and boiling point from its isomers.",
    "category": "Organic",
    "molecularWeight": 60.096,
    "degreeOfUnsaturation": 0,
    "pointGroup": "Cs",
    "bondType": "Polar Covalent",
    "geometry": "Tetrahedral at C, Bent at O",
    "electronicGeometry": "Tetrahedral",
    "vseprNotation": "AX₄ / AX₂E₂",
    "stericNumber": 4,
    "bondAngle": "109.5° (C–C–C), 104.5° (C–O–H)",
    "hybridization": "sp³",
    "polarity": "Polar",
    "dipoleMomentDebye": 1.68,
    "description": "Detailed scientific description of the molecule.",
    "formationCriteria": {
      "octetRuleStatus": "All C and O atoms satisfy the 8-electron octet rule; H atoms satisfy the 2-electron duet rule.",
      "deltaEN": "ΔEN(O–H) = 1.24, ΔEN(C–O) = 0.89",
      "sigmaBonds": 11,
      "piBonds": 0,
      "lonePairsTotal": 2,
      "resonanceDescription": "Localized σ-framework with two non-bonding lone pairs on oxygen."
    },
    "thermodynamics": {
      "deltaHf": "−302.6 kJ/mol (liquid)",
      "deltaGf": "−170.8 kJ/mol",
      "entropyS": "192.8 J/(mol·K)",
      "bondEnergies": [
        {"bond": "C–C", "lengthAngstrom": 1.53, "energyKjMol": 348},
        {"bond": "C–O", "lengthAngstrom": 1.43, "energyKjMol": 358},
        {"bond": "O–H", "lengthAngstrom": 0.96, "energyKjMol": 463}
      ]
    },
    "synthesisMethods": {
      "industrial": {
        "processName": "Hydroformylation of Ethene followed by Hydrogenation",
        "equation": "C₂H₄ + CO + H₂ → CH₃CH₂CHO ; + H₂ → CH₃CH₂CH₂OH",
        "conditions": "100–150 °C, 20–40 bar",
        "catalyst": "Rhodium / triphenylphosphine catalyst",
        "mechanismSummary": "Oxo process hydroformylation yields propanal, which is catalytically hydrogenated to propan-1-ol."
      },
      "laboratory": {
        "methodName": "NaBH₄ Reduction of Propanal",
        "equation": "CH₃CH₂CHO + NaBH₄ + H₂O → CH₃CH₂CH₂OH",
        "reagents": "Propanal + Sodium borohydride in ethanol",
        "conditions": "25 °C",
        "procedureNotes": "Nucleophilic hydride transfer followed by aqueous workup."
      }
    },
    "physicalProperties": {
      "stateAtSTP": "Liquid",
      "appearance": "Clear colorless liquid",
      "meltingPointC": "−126.1 °C",
      "boilingPointC": "97.2 °C",
      "density": "0.803 g/cm³",
      "solubility": "Miscible with water and organic solvents",
      "pKa": "16.1",
      "intermolecularForces": ["Intermolecular O–H···O Hydrogen Bonding", "London Dispersion"]
    },
    "spectroscopy": {
      "irBands": [
        {"wavenumberCm": "3340 cm⁻¹ (broad, strong)", "assignment": "Hydrogen-bonded O–H stretch"},
        {"wavenumberCm": "1055 cm⁻¹ (strong)", "assignment": "Primary alcohol C–O stretch"}
      ],
      "nmrShifts": [
        {"nucleus": "¹H NMR", "shiftPpm": "δ 3.58 ppm (triplet, 2H)", "assignment": "–CH₂OH protons"}
      ]
    },
    "applications": {
      "industrial": ["Solvent for flexographic printing inks and coatings", "Precursor to propyl acetate"],
      "laboratory": ["Chromatography solvent and recrystallization medium"],
      "biologicalAndMedical": ["Topical antiseptic component"]
    },
    "safety": {
      "ghsHazards": ["H225: Highly flammable liquid and vapor", "H318: Causes serious eye damage"],
      "nfpa704": {"health": 1, "flammability": 3, "instability": 0},
      "handling": "Keep away from ignition sources; wear eye protection."
    },
    "atoms": [
      {"symbol": "C", "x": -1.25, "y": -0.25, "z": 0.0, "partialCharge": -0.12, "formalCharge": 0, "hybridization": "sp³", "lonePairs": 0},
      {"symbol": "C", "x": 0.0, "y": 0.55, "z": 0.0, "partialCharge": 0.14, "formalCharge": 0, "hybridization": "sp³", "lonePairs": 0},
      {"symbol": "O", "x": 1.18, "y": -0.22, "z": 0.0, "partialCharge": -0.64, "formalCharge": 0, "hybridization": "sp³", "lonePairs": 2},
      {"symbol": "H", "x": 1.95, "y": 0.36, "z": 0.0, "partialCharge": 0.40, "formalCharge": 0, "hybridization": "1s", "lonePairs": 0}
    ],
    "bonds": [
      {"source": 0, "target": 1, "order": 1, "lengthAngstrom": 1.53},
      {"source": 1, "target": 2, "order": 1, "lengthAngstrom": 1.43},
      {"source": 2, "target": 3, "order": 1, "lengthAngstrom": 0.96}
    ]
  },
  "relatedIsomers": []
}`;

    const systemPrompt = "You are an expert structural chemist and crystallographic 3D coordinate generator. Output strictly valid JSON only.";
    let resultPayload;

    if (hasNvidiaNim()) {
      try {
        const { content, latencyMs, model } = await callNvidiaNim({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 1800,
          timeoutMs: 15000,
        });
        const parsed = extractJson(content);
        resultPayload = { result: parsed, provider: "nvidia-nim", model, latencyMs };
      } catch (nimErr) {
        console.warn("NVIDIA NIM molecule analysis failed, falling back to Gemini:", nimErr);
        const { content, latencyMs, model } = await callGeminiFallback({
          systemPrompt,
          userPrompt: prompt,
          maxTokens: 1800,
        });
        const parsed = extractJson(content);
        resultPayload = { result: parsed, provider: "gemini", model, latencyMs };
      }
    } else {
      const { content, latencyMs, model } = await callGeminiFallback({
        systemPrompt,
        userPrompt: prompt,
        maxTokens: 1800,
      });
      const parsed = extractJson(content);
      resultPayload = { result: parsed, provider: "gemini", model, latencyMs };
    }

    setCached(cacheKey, resultPayload);
    return res.json(resultPayload);
  } catch (error: any) {
    console.error("Molecule analysis error:", error);
    res.status(500).json({ error: error?.message || "Failed to analyze molecule." });
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
