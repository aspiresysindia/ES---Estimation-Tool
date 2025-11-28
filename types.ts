
export enum FileCategory {
  RFP = 'RFP / Scope Document',
  PREVIOUS_EST = 'Previous Estimation',
  EST_DEF = 'Estimation Definition',
  METHODOLOGY = 'Implementation Methodology',
  REFERENCE = 'Reference Document',
}

export interface UploadedFile {
  id: string;
  file: File;
  category: FileCategory;
  contentBase64?: string;
  textContent?: string;
}

export interface RoleConfig {
  id: string;
  roleName: string;
  percentage: number;
}

export enum EstimationType {
  HIGH_LEVEL = 'High-level',
  DETAILED = 'Detailed',
}

export enum EffortUnit {
  PERSON_DAYS = 'Person-days',
  PERSON_HOURS = 'Person-hours',
  STORY_POINTS = 'Story Points',
}

export enum OutputFormat {
  TABLES = 'Tables & Text',
  JSON = 'JSON Structure',
  BULLETS = 'Bullet Points',
}

export enum LLMProvider {
  GEMINI = 'Google Gemini',
  OPENAI = 'OpenAI',
}

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  modelName?: string;
  thinkingModelName?: string;
}

export interface PyramidSettings {
  useCustomPerPhase: boolean;
  defaultPyramid: RoleConfig[];
}

export interface ProjectSettings {
  startDate: string;
  endDate: string;
  estType: EstimationType;
  effortUnit: EffortUnit;
  outputFormat: OutputFormat;
}

export interface SavedVersion {
  id: string;
  name: string;
  timestamp: number;
  files: UploadedFile[];
  roles: RoleConfig[];
  projectSettings: ProjectSettings;
  pyramidSettings: PyramidSettings;
  userPrompt: string;
  result: string | null;
}

export const SYSTEM_INSTRUCTIONS = `Role and scope
You are an AI Estimation and Resource Planning Assistant for presales. Your goal is to produce "Presales Ready" content.

Task: Generate a detailed technical effort estimation and resource plan.

CRITICAL: SIZING LOGIC & DEFINITIONS
1.  **Look for "Estimation Definition" files**: These contain the Rules (e.g., Simple=5 days, Med=10 days).
2.  **Look for "RFP / Scope" files**: These contain the Scope (e.g., "Build 5 reports").
3.  **EXECUTION**: You MUST apply the Rules to the Scope. Do not invent effort numbers if a definition file exists.
    - If Definition says "1 Report = 3 days", and RFP says "10 Reports", the effort is 30 days.
4.  **Previous Estimations**: Use these only for pattern matching if definitions are ambiguous.

Presales Inputs & Clarifications
- The user will provide "Additional Inputs". This text often contains **Compliance Matrix** constraints or **Client Clarifications** that override the RFP document. Treat these as high-priority constraints.

Risk Assessment
- Analyze the RFP + Plan.
- List Technical, Commercial, and Resource risks with Likelihood/Impact and Mitigation.

Output Structure (Presales Ready)
1. **Executive Summary**: Approach and key stats.
2. **Estimation Standard Used**: Explicitly name the Definition file used.
3. **Phase-wise Work Breakdown**: Detailed table.
4. **Resource Loading Plan**: Phase x Role x FTE.
5. **Risk Assessment Matrix**.
6. **Assumptions & Exclusions**: (Crucial for contracts).
7. **Open Questions**.

Guardrails
- NO PRICING/COSTING. Only Effort (Days/Hours) and FTEs.
- If "Estimation Definition" is missing, state clearly that "Industry Standard" sizing was used.
`;

export const DEFAULT_USER_PROMPT = `**Presales Inputs**

Compliance Matrix Items:
- 

Client Clarifications (Emails/Q&A):
- 

Specific Overrides:
- `;
