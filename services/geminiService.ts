import { GoogleGenAI } from "@google/genai";

// --- Configuration ---
// Set to true to use mock data for development and testing
const USE_MOCK_API = false;

// --- Mock Data ---
const mockNetworkAnalysis = `
# Mock AI Network Analysis

This is a **mock response** for development and testing purposes. The AI service is currently bypassed.

## Summary
The network appears to be in a \`healthy state\`, with no immediate critical issues detected.

### Recommendations
*   **Security:** Consider implementing VLANs to segment traffic between workstations and servers.
*   **Redundancy:** Add a redundant link between \`Core Switch 1\` and the \`Edge Router\` to prevent a single point of failure.
*   **IP Management:** The IP address \`192.168.1.101\` is assigned via DHCP but is very close to the static IP range. Consider adjusting the DHCP scope.
`;


// --- Gemini API Service ---
const getAiClient = () => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        console.warn("Gemini API key not found. AI features will be disabled.");
        return null;
    }
    return new GoogleGenAI({ apiKey: API_KEY });
}

export const getNetworkAnalysis = async (networkState: object): Promise<string> => {
    if (USE_MOCK_API) {
        console.log("Using MOCK API for getNetworkAnalysis");
        return new Promise(resolve => setTimeout(() => resolve(mockNetworkAnalysis), 1000));
    }

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
        // FIX: The response from the Gemini API includes a `text()` method to extract the string content. Accessing it as a property is incorrect and was causing a downstream error.
        return response.text();
    } catch (error) {
        console.error("Error fetching network analysis from Gemini:", error);
        return "An error occurred while analyzing the network. Please check the console for details.";
    }
};