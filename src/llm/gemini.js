import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function callGemini(promptText) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: promptText }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  });

  const raw = response.text.trim();

  try {
    // First try direct parse
    return JSON.parse(raw);
  } catch {
    // Sometimes Gemini adds extra text, try to extract JSON manually
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        throw new Error("Gemini returned malformed JSON:\n" + raw);
      }
    } else {
      throw new Error("Gemini returned non-JSON:\n" + raw);
    }
  }
}
