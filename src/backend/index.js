/* eslint-disable no-undef */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Helper function to calculate approximate area in square kilometers
function calculateArea(coordinates) {
  if (coordinates.length < 4) return 0;

  // Simple approximation using shoelace formula
  let area = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [x1, y1] = coordinates[i];
    const [x2, y2] = coordinates[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  area = Math.abs(area / 2);

  // Convert to approximate square kilometers (rough estimate)
  // 1 degree ≈ 111 km at equator
  const areaInKm2 = area * 111 * 111;
  return areaInKm2.toFixed(2);
}

// Helper function to classify severity
function getSeverityLevel(magnitude) {
  if (magnitude < 3)
    return { level: "LOW", color: "green", description: "Minor incident" };
  if (magnitude < 5)
    return {
      level: "MODERATE",
      color: "yellow",
      description: "Notable concern",
    };
  if (magnitude < 7)
    return { level: "HIGH", color: "orange", description: "Serious threat" };
  if (magnitude < 9)
    return { level: "SEVERE", color: "red", description: "Major catastrophe" };
  return {
    level: "CRITICAL",
    color: "darkred",
    description: "Extreme disaster",
  };
}

// Analyze catastrophe area endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { coordinates, magnitude, center, placeName } = req.body;

    if (!coordinates || !magnitude) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Calculate additional metrics
    const areaSize = calculateArea(coordinates);
    const severity = getSeverityLevel(magnitude);
    const populationDensityEstimate =
      areaSize > 1 ? "Urban/Suburban area" : "Localized area";

    const prompt = `You are an emergency response analyst. Provide a rapid incident assessment in EXACTLY 250-300 words.

INCIDENT DATA:
Location: ${placeName || "Unspecified location"}
Coordinates: ${
      center
        ? `${center[1].toFixed(4)}°N, ${center[0].toFixed(4)}°E`
        : "Not provided"
    }
Area: ${areaSize} km²
Magnitude: ${magnitude.toFixed(1)}/10 (${severity.level})
Type: ${populationDensityEstimate}

FORMAT REQUIREMENTS:
- PLAIN TEXT ONLY - absolutely NO asterisks, NO markdown, NO special formatting
- Use specific percentages and numbers, not vague terms
- Combine related items into single lines
- Maximum 250-300 words total
- Short, scannable sentences

ANALYSIS STRUCTURE:

SEVERITY ASSESSMENT
Threat Level: ${severity.level}
Estimated Casualties: [Give specific range like 50-200 or 500-2000 based on magnitude and area]
Time Window: [State hours/days for critical response]
Infrastructure Damage: [Use percentages like 60-80% for power, water, transport combined]
Economic Impact: [Single dollar range estimate]

AFFECTED POPULATION
Total Impact: [Calculate realistic number from ${areaSize} km²]
Priority Groups: [Maximum 3 vulnerable categories in one line]
Shelter Required: [Specific number or percentage]
Immediate Hazards: [Top 3 combined in one line]

PRIORITY RESPONSE (48 Hours)
1. [Single most urgent action with specific metric]
2. [Second priority with clear deliverable]
3. [Third priority with resource number]

RESOURCE DEPLOYMENT
Teams Required: [Use ranges like 5-8 SAR teams, 10-15 medical units]
Critical Supplies: [Top 3-4 items only]
Coordination: [One sentence on command structure]

TIMELINE
Recovery Estimate: [Single realistic timeframe]

CRITICAL NOTES:
- Be hyper-specific with numbers
- No lists longer than 3 items
- Combine utilities/infrastructure into percentages
- One hazard type per mention only
- Ruthlessly eliminate repetition`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      analysis: text,
      metadata: {
        magnitude,
        severity: severity.level,
        severityDescription: severity.description,
        coordinates: coordinates.length - 1,
        location: placeName || "Unknown",
        areaSize: `${areaSize} km²`,
        estimatedImpact: severity.level,
      },
    });
  } catch (error) {
    console.error("Error generating AI analysis:", error);
    res.status(500).json({
      error: "Failed to generate analysis",
      message: error.message,
    });
  }
});

// Get disaster recommendations endpoint
app.post("/api/recommendations", async (req, res) => {
  try {
    const { disasterType, magnitude, location } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `As a disaster management expert, provide specific recommendations for:
- Disaster type: ${disasterType || "General catastrophe"}
- Magnitude: ${magnitude}/10
- Location: ${location || "Unspecified"}

Provide 5 actionable recommendations focusing on:
1. Immediate safety measures
2. Resource allocation priorities
3. Communication strategies
4. Evacuation considerations
5. Recovery planning

Format as a numbered list. Keep it practical and concise.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      recommendations: text,
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    res.status(500).json({
      error: "Failed to generate recommendations",
      message: error.message,
    });
  }
});

// General AI query endpoint
app.post("/api/query", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent(question);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      answer: text,
    });
  } catch (error) {
    console.error("Error processing query:", error);
    res.status(500).json({
      error: "Failed to process query",
      message: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - POST /api/analyze`);
  console.log(`   - POST /api/recommendations`);
  console.log(`   - POST /api/query`);
});
