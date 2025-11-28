
import { UploadedFile, ProjectSettings, PyramidSettings, SYSTEM_INSTRUCTIONS, EstimationType } from "../types";

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<any>;
}

export const generateEstimationOpenAI = async (
  apiKey: string,
  modelName: string, // e.g., gpt-4o
  files: UploadedFile[],
  userPrompt: string,
  projectSettings: ProjectSettings,
  pyramidSettings: PyramidSettings
): Promise<string> => {
  
  if (!apiKey) throw new Error("OpenAI API Key is required.");

  // 1. Prepare Content Parts
  // OpenAI Chat API (gpt-4o) accepts text and images. 
  // It DOES NOT accept raw PDF/Doc/XLS base64 blobs in the 'messages' array directly.
  // We will iterate files:
  // - If Image: Send as image_url
  // - If Text-readable (csv, txt, md): Send as text
  // - If PDF/Binary: We can't easily parse client-side without heavy libs. We will skip or warn.
  
  const contentParts: any[] = [];

  // Add Settings Context as Text
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
${pyramidSettings.useCustomPerPhase ? "(Note: User indicated custom pyramid per phase may be needed)" : "(Apply this single pyramid across all phases)"}
---
`;

  contentParts.push({ type: "text", text: settingsContext + "\n\n**USER INSTRUCTIONS**\n" + userPrompt });

  // Process Files
  for (const f of files) {
    const isImage = f.file.type.startsWith("image/");
    const isText = f.file.type === "text/plain" || f.file.type === "text/markdown" || f.file.type === "text/csv" || f.file.name.endsWith(".json") || f.file.name.endsWith(".xml");
    
    if (isImage && f.contentBase64) {
      contentParts.push({
        type: "image_url",
        image_url: {
          url: `data:${f.file.type};base64,${f.contentBase64}`
        }
      });
    } else if (isText && f.textContent) {
       contentParts.push({
         type: "text",
         text: `\n--- START OF FILE: ${f.file.name} ---\n${f.textContent}\n--- END OF FILE ---\n`
       });
    } else {
       // For PDFs etc, if we haven't parsed them, we add a note.
       // In a real prod app, we'd use a parser. Here we rely on user pasting text or uploading images for OpenAI.
       contentParts.push({
         type: "text",
         text: `\n[System Note: File '${f.file.name}' (${f.file.type}) was uploaded but its binary content cannot be processed directly by this LLM provider without conversion. Please ensure critical content from this file is pasted in the 'Additional Inputs' box.]\n`
       });
    }
  }

  const messages: OpenAIMessage[] = [
    { role: "system", content: SYSTEM_INSTRUCTIONS },
    { role: "user", content: contentParts }
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName || "gpt-4o",
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000, 
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "OpenAI API Request Failed");
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response generated.";
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    throw new Error(error.message || "Failed to generate estimation with OpenAI.");
  }
};
