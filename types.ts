
export enum AIModel {
  GEMINI = 'Gemini',
  CLAUDE = 'Claude',
  GPT = 'GPT-4o',
  LLAMA = 'Llama 3',
  GROK = 'Grok',
  SYSTEM = 'Orkestrator'
}

export interface User {
  phone: string;
  password?: string; // Only used for registration, not stored on client
}

export interface AnalysisRecord {
  id: string;
  date: string;
  patientData: PatientData;
  debateHistory: ChatMessage[];
  finalReport: FinalReport;
  followUpHistory: { question: string; answer: string }[];
}


export interface PatientData {
  firstName: string;
  lastName: string;
  age: string;
  gender: 'male' | 'female' | 'other' | '';
  complaints: string;
  history: string;
  objectiveData: string;
  labResults: string;
  allergies: string;
  currentMedications: string;
  familyHistory: string;
  additionalInfo?: string;
  image?: {
    base64Data: string;
    mimeType: string;
  };
}

export interface ChatMessage {
  id: string;
  author: AIModel;
  content: string;
  isThinking?: boolean;
}

export interface Diagnosis {
  name: string;
  probability: number;
  justification: string;
  evidenceLevel: string; // New
}

export interface FinalReport {
  consensusDiagnosis: Diagnosis[];
  rejectedHypotheses: {
    name:string;
    reason: string;
  }[];
  recommendedTests: string[];
  treatmentPlan: string[];
  medicationRecommendations: {
    name: string;
    dosage: string;
    notes: string;
  }[];
  unexpectedFindings: string;
  pharmacologicalWarnings: { // New
    name: string;
    warning: string;
  }[];
}

export type ProgressUpdate =
  | { type: 'status'; message: string }
  | { type: 'thinking'; model: AIModel }
  | { type: 'message'; message: ChatMessage }
  | { type: 'report'; data: FinalReport }
  | { type: 'error'; message: string };

// --- New Types for Research Center ---

export interface TreatmentStrategy {
    name: string;
    mechanism: string;
    evidence: string; // e.g., "Klinik sinovlar (Faza II)", "Hayvonlarda tadqiqot", "Gipotetik"
    pros: string[];
    cons: string[];
}

export interface ResearchReport {
    diseaseName: string;
    summary: string;
    potentialStrategies: TreatmentStrategy[];
    nextSteps: string[];
    sources: {
      title: string;
      uri: string;
    }[];
}

export type ResearchProgressUpdate =
  | { type: 'status'; message: string }
  | { type: 'message'; message: ChatMessage }
  | { type: 'report'; data: ResearchReport }
  | { type: 'error'; message: string };