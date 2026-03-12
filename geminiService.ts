import { GoogleGenAI, Type } from "@google/genai";
import { Reading, AIInsight, CitizenReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getPollutionInsights(readings: Reading[], reports: CitizenReport[]): Promise<AIInsight> {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Act as a Smart City Environmental Scientist. Analyze this hyperlocal data:
    
    SENSORS: ${JSON.stringify(readings)}
    CITIZEN REPORTS: ${JSON.stringify(reports)}
    
    TASKS:
    1. Identify pollution hotspots.
    2. Predict AQI spikes for the next 6 hours.
    3. SOURCE DETECTION: For each high-pollution ward, classify the probable source (Construction Dust, Traffic, Waste Burning, Industrial, Road Dust) based on PM2.5/PM10 ratios, CO2 levels, and wind patterns.
    4. EMERGENCY ALERTS: Trigger alerts if AQI is predicted > 300.
    5. RECOMMENDATIONS: Specific mitigation actions for municipal authorities.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hotspots: { type: Type.ARRAY, items: { type: Type.STRING } },
            prediction: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskLevel: { type: Type.STRING, enum: ["low", "moderate", "high", "critical"] },
            sourceAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ward: { type: Type.STRING },
                  sources: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING },
                        probability: { type: Type.NUMBER }
                      }
                    }
                  }
                }
              }
            },
            alerts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ward: { type: Type.STRING },
                  level: { type: Type.STRING },
                  predictedAQI: { type: Type.NUMBER },
                  timeframe: { type: Type.STRING },
                  actions: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          },
          required: ["hotspots", "prediction", "recommendations", "riskLevel", "sourceAnalysis", "alerts"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Insight Error:", error);
    return {
      hotspots: [],
      prediction: "Analysis offline",
      recommendations: [],
      riskLevel: "moderate",
      sourceAnalysis: [],
      alerts: []
    };
  }
}
