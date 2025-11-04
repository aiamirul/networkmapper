
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This will be handled by the execution environment.
  // We add a console warning for local development.
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const getAiClient = () => {
    if(!API_KEY) return null;
    return new GoogleGenAI({ apiKey: API_KEY });
}


export const getNetworkAnalysis = async (networkState: object): Promise<string> => {
  const ai = getAiClient();
  if (!ai) {
      return Promise.resolve("AI analysis is unavailable. Please ensure your API key is configured.");
  }

  const model = "gemini-2.5-flash";
  
  const prompt = `
    Act as a senior network engineer. Analyze the following network configuration provided in JSON format.
    Identify potential issues such as IP conflicts, security vulnerabilities, suboptimal topology, or misconfigurations.
    Provide a concise summary of the network's health and offer actionable recommendations for improvement.
    Format your response in clear, readable Markdown.

    Network Configuration:
    ${JSON.stringify(networkState, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching network analysis from Gemini:", error);
    return "An error occurred while analyzing the network. Please check the console for details.";
  }
};
