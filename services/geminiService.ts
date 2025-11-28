import { GoogleGenAI } from "@google/genai";
import { UploadedFile, ProjectSettings, PyramidSettings, SYSTEM_INSTRUCTIONS, EstimationType } from "../types";

export const generateEstimationGemini = async (
  apiKey: string,
  modelName: string = "gemini-2.5-flash",
  detailedModelName: string = "gemini-3-pro-preview",
  files: UploadedFile[],
  userPrompt: string,
  projectSettings: ProjectSettings,
  pyramidSettings: PyramidSettings
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing for Google Gemini.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // 1. Select Model based on Estimation Type
  // High-level = Flash (Fast)
  // Detailed = Pro (Reasoning/Smarter)
  const selectedModel = projectSettings.estType === EstimationType.DETAILED 
    ? detailedModelName 
    : modelName;

  // 2. Prepare File Parts
  const fileParts = files
    .filter((f) => f.contentBase64)
    .map((f) => ({
      inlineData: {
        mimeType: f.file.type || 'application/octet-stream',
        data: f.contentBase64!,
      },
    }));

  // 3. Prepare Context Description (Pyramid & Settings)
  const pyramidDescription = pyramidSettings.defaultPyramid
    .map((r) => `- ${r.roleName}: ${r.percentage}%`)
    .join("\n");

  const settingsContext = `
---
**RUN CONFIGURATION**
**Dates:** ${projectSettings.startDate || "Not specified"} to ${projectSettings.endDate || "Not specified"}
**Estimation Type:** ${projectSettings.estType}
**Unit:** ${projectSettings.effortUnit}
**Output Format:** ${projectSettings.outputFormat}

**RESOURCE PYRAMID CONFIGURATION**
${pyramidDescription}
${pyramidSettings.useCustomPerPhase ? "(Note: User indicated custom pyramid per phase may be needed, please infer from methodology if specific phase pyramids are not explicitly detailed in prompt, otherwise use default)" : "(Apply this single pyramid across all phases)"}
---
`;

  // 4. Construct Final User Message
  const finalUserContent = [
    ...fileParts,
    {
      text: `
${settingsContext}

**USER INSTRUCTIONS**
${userPrompt}
      `.trim(),
    },
  ];

  try {
    const response = await ai.models.generateContent({
      model: selectedModel,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS,
      },
      contents: {
        role: 'user',
        parts: finalUserContent as any,
      },
    });

    return response.text || "No response generated.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate estimation.");
  }
};