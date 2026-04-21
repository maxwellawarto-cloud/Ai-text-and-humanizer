import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface DetectionResult {
  score: number; // 0 to 100
  label: "Likely Human" | "Mixed" | "Likely AI";
  analysis: {
    sentence: string;
    isAI: boolean;
    confidence: number;
  }[];
}

export interface HumanizeResult {
  text: string;
}

export type Tone = "Casual" | "Professional" | "Simple English";

export async function detectAI(text: string): Promise<DetectionResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following text for AI-generated patterns. 
    Provide an overall AI probability score (0-100) and a sentence-by-sentence analysis.
    For the sentence analysis, identify if the sentence feels AI-generated and provide a confidence score for that specific sentence.
    
    Text: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "Overall AI probability score from 0-100" },
          label: { type: Type.STRING, enum: ["Likely Human", "Mixed", "Likely AI"] },
          analysis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sentence: { type: Type.STRING },
                isAI: { type: Type.BOOLEAN },
                confidence: { type: Type.NUMBER }
              },
              required: ["sentence", "isAI", "confidence"]
            }
          }
        },
        required: ["score", "label", "analysis"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse detection result", e);
    throw new Error("Invalid response from AI");
  }
}

export async function humanizeText(text: string, tone: Tone): Promise<HumanizeResult> {
  const toneInstructions = {
    "Casual": "Write in a relaxed, conversational style. Use approachable language appropriate for a casual conversation.",
    "Professional": "Use formal, sophisticated language suitable for business or academic contexts.",
    "Simple English": "Use clear, basic vocabulary and short sentences. Avoid jargon and complex structures."
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `IMPORTANT: You MUST maintain the original language of the input text. Do NOT translate it.
    
    Humanize the following text to make it sound more natural and less like AI, while staying in the SAME language as the source.
    Maintain the original meaning exactly but improve the flow, rhythm, and word choice.
    
    Tone: ${tone}
    Tone Instructions: ${toneInstructions[tone]}
    
    Text: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The humanized version of the text" }
        },
        required: ["text"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse humanize result", e);
    throw new Error("Invalid response from AI");
  }
}
