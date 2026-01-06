
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getMotivationalQuote(context: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Give me a very short, powerful, and stoic motivational quote for someone trying to stay focused for ${context}. Max 15 words.`,
      config: {
        temperature: 0.8,
      }
    });
    return response.text?.trim() || "Stay focused. Stay disciplined.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The pain of discipline is far less than the pain of regret.";
  }
}

export async function getFocusAdvice(): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Provide 3 short tips for deep work focus during a locked phone session.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch {
    return ["Eliminate external noise", "Keep your workspace clean", "Breathe deeply"];
  }
}
