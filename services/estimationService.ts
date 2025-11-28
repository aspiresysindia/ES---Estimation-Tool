
import { 
  UploadedFile, 
  ProjectSettings, 
  PyramidSettings, 
  LLMConfig, 
  LLMProvider 
} from "../types";
import { generateEstimationGemini } from "./geminiService";
import { generateEstimationOpenAI } from "./openaiService";

interface GenerateEstimationParams {
  files: UploadedFile[];
  userPrompt: string;
  projectSettings: ProjectSettings;
  pyramidSettings: PyramidSettings;
  llmConfig: LLMConfig;
}

export const generateEstimation = async ({
  files,
  userPrompt,
  projectSettings,
  pyramidSettings,
  llmConfig
}: GenerateEstimationParams): Promise<string> => {
  
  if (llmConfig.provider === LLMProvider.OPENAI) {
    return generateEstimationOpenAI(
      llmConfig.apiKey,
      llmConfig.modelName || 'gpt-4o',
      files,
      userPrompt,
      projectSettings,
      pyramidSettings
    );
  } else {
    // Default to Gemini
    return generateEstimationGemini(
      llmConfig.apiKey,
      llmConfig.modelName || 'gemini-2.5-flash',
      llmConfig.thinkingModelName || 'gemini-3-pro-preview',
      files,
      userPrompt,
      projectSettings,
      pyramidSettings
    );
  }
};
