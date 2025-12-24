
import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from "../types";

export class GeminiImageService {
  private static instance: GeminiImageService;
  
  private constructor() {}

  static getInstance() {
    if (!GeminiImageService.instance) {
      GeminiImageService.instance = new GeminiImageService();
    }
    return GeminiImageService.instance;
  }

  async generateImage(prompt: string, aspectRatio: AspectRatio = "1:1"): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: "1K"
          }
        },
      });

      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("Empty response from AI engine");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }

      throw new Error("No pixel data found in response");
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        throw new Error("API_KEY_INVALID");
      }
      throw error;
    }
  }
}
