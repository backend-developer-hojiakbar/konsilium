import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type {
    PatientData,
    Diagnosis,
    FinalReport,
    ProgressUpdate,
    ChatMessage,
    DrugInteraction,
    EcgReport,
    Icd10Code,
    GuidelineSearchResult,
    ResearchProgressUpdate,
    ResearchReport,
    PatientEducationTopic,
    AnalysisRecord,
    CMETopic,
    PediatricDose,
    RiskScore,
    CriticalFinding,
    PrognosisReport,
    RelatedResearch,
} from '../types';
import { AIModel } from "../constants/specialists";
import { AI_SPECIALISTS } from "../constants";
import { Language } from "../i18n/LanguageContext";

// --- INITIALIZATION ---

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
if (!GEMINI_API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY is not set. Please define it in frontend/.env");
}
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const langMap: Record<Language, string> = {
    'uz-L': 'Uzbek (in Latin script)',
    'uz-C': 'Uzbek (in Cyrillic script)',
    'ru': 'Russian',
    'en': 'English'
};

// --- HELPER FUNCTIONS ---

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const callGemini = async (
    prompt: string | { parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] },
    model: string = 'gemini-2.5-flash',
    responseSchema?: any,
    useSearch: boolean = false
) => {
    try {
        const config: any = {};
        if (responseSchema) {
            config.responseMimeType = "application/json";
            config.responseSchema = responseSchema;
        }
        if (useSearch) {
            config.tools = [{ googleSearch: {} }];
        }

        const result: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: Object.keys(config).length > 0 ? config : undefined,
        });

        const text = result.text;
        
        if (responseSchema) {
            const cleanedText = text.replace(/^```json\s*|```\s*$/g, '').trim();
            try {
                return JSON.parse(cleanedText);
            } catch (e) {
                console.error("Failed to parse JSON from Gemini:", cleanedText);
                throw new Error("Received invalid JSON from the API.");
            }
        }
        
        if (useSearch) {
            return result;
        }

        return text;
    } catch (error) {
        console.error(`Error calling Gemini API with model ${model}:`, error);
        throw new Error(`Gemini API call failed: ${error instanceof Error ? error.message : String(error)}`);
    }
};


// --- SERVICE IMPLEMENTATIONS ---

export const structureDictatedNotes = async (notes: string, language: Language): Promise<string> => {
    const prompt = `You are a medical scribe assistant. Take the following unstructured clinical notes, which are in Uzbek, and organize them into clear, standard medical sections: "Shikoyatlar" (Complaints), "Anamnez" (History of Present Illness), "Obyektiv ma'lumotlar" (Objective Data), "O'tkazgan kasalliklari" (Past Medical History). Correct any obvious transcription errors but preserve the original medical meaning. If a section is not present in the notes, omit its header. Notes: "${notes}". Your entire response must be in ${langMap[language]}.`;
    return callGemini(prompt) as Promise<string>;
};

export const getDynamicSuggestions = async (complaintText: string, language: Language): Promise<{ relatedSymptoms: string[], diagnosticQuestions: string[] }> => {
    if (complaintText.trim().length < 15) {
        return { relatedSymptoms: [], diagnosticQuestions: [] };
    }
    const prompt = `Based on the patient's complaints: "${complaintText}", suggest 3 related symptoms and 3 key diagnostic questions a doctor might ask. Return the result in JSON format { "relatedSymptoms": ["..."], "diagnosticQuestions": ["..."] }. The entire response, including JSON keys and values, must be strictly in the ${langMap[language]} language.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            relatedSymptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
            diagnosticQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        }
    };
    return callGemini(prompt, 'gemini-2.5-flash', schema);
};

export const generateClarifyingQuestions = async (data: PatientData, language: Language): Promise<string[]> => {
    const prompt = `Based on the following patient data, generate up to 5 important clarifying questions for the doctor to improve diagnostic accuracy. Return a JSON array of strings. Patient Data: ${JSON.stringify(data)}. Your entire response MUST be in ${langMap[language]}.`;
    const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
    const result = await callGemini(prompt, 'gemini-2.5-flash', schema) as string[];
    return result.length > 0 ? result : [];
};

export const recommendSpecialists = async (data: PatientData, language: Language): Promise<{ recommendations: { model: AIModel; reason: string }[] }> => {
    const availableSpecialists = Object.values(AIModel).filter(m => m !== AIModel.SYSTEM).join(', ');
    const prompt = `Based on the patient data, recommend the best 3-5 AI specialists from this list: [${availableSpecialists}]. Provide a short reason for each recommendation. Return in JSON format { "recommendations": [{ "model": "SpecialistName", "reason": "Reason..." }] }. Patient data: ${JSON.stringify(data)}. Your entire response, including the reasons, MUST be in ${langMap[language]}.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            recommendations: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        model: { type: Type.STRING, enum: Object.values(AIModel) },
                        reason: { type: Type.STRING },
                    },
                    required: ['model', 'reason'],
                },
            },
        },
        required: ['recommendations'],
    };
    return callGemini(prompt, 'gemini-2.5-flash', schema);
};

export const generateInitialDiagnoses = async (data: PatientData, language: Language): Promise<Diagnosis[]> => {
    const prompt = `Analyze the following patient data and generate a list of 3-5 most likely differential diagnoses. For each diagnosis, provide a probability (0-100), a short justification, and an evidence level ('High', 'Moderate', 'Low'). Return an array of JSON objects with keys "name", "probability", "justification", "evidenceLevel". Patient Data: ${JSON.stringify(data)}. Your entire response MUST be in ${langMap[language]}.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                probability: { type: Type.NUMBER },
                justification: { type: Type.STRING },
                evidenceLevel: { type: Type.STRING },
            },
            required: ['name', 'probability', 'justification', 'evidenceLevel'],
        },
    };
    return callGemini(prompt, 'gemini-2.5-pro', schema);
};

const generatePrognosisUpdate = async (debateHistory: ChatMessage[], patientData: PatientData, language: Language): Promise<PrognosisReport | null> => {
    const prompt = `Based on patient data and the current debate history, briefly update the patient's prognosis. Return in JSON format { "shortTermPrognosis": "...", "longTermPrognosis": "...", "keyFactors": ["..."], "confidenceScore": 0.0 }. Debate: ${JSON.stringify(debateHistory.slice(-5))}. Patient: ${JSON.stringify(patientData)}. Your entire response MUST be in ${langMap[language]}.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            shortTermPrognosis: { type: Type.STRING },
            longTermPrognosis: { type: Type.STRING },
            keyFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidenceScore: { type: Type.NUMBER }
        }
    };
    try {
        return await callGemini(prompt, 'gemini-2.5-flash', schema);
    } catch (e) {
        return null;
    }
};

export const runCouncilDebate = async (
    patientData: PatientData,
    diagnoses: Diagnosis[],
    specialists: AIModel[],
    onProgress: (update: ProgressUpdate) => void,
    getUserIntervention: () => string | null,
    language: Language
): Promise<void> => {
    onProgress({ type: 'status', message: 'Introducing Konsilium members...' });
    let debateHistory: ChatMessage[] = [];
    const specialistList = specialists.map(s_model => AI_SPECIALISTS[s_model].name).join(', ');

    const allCouncilMembers = [AIModel.SYSTEM, ...specialists];

    for (const model of allCouncilMembers) {
        const specialistInfo = AI_SPECIALISTS[model];
        const introContent = model === AIModel.SYSTEM
            ? `Hello, I am the Konsilium Chair. I will moderate today's discussion. Participants: ${specialistList}.`
            : `Hello, I am ${specialistInfo!.name}. I am ready to analyze the data.`;
        
        // This intro can be translated on the frontend or we can ask the AI to generate it
        const translatedIntro = await callGemini(`Translate this introduction to ${langMap[language]}: "${introContent}"`);
        
        const introMessage: ChatMessage = { id: `${model}-${Date.now()}`, author: model, content: translatedIntro, isSystemMessage: model === AIModel.SYSTEM };
        onProgress({ type: 'message', message: introMessage });
        debateHistory.push(introMessage);
        await sleep(700);
    }
    
    const DEBATE_ROUNDS = 3;
    let currentTopic = `Patient data and initial diagnoses have been presented: ${JSON.stringify(diagnoses)}. First round: I ask each specialist to briefly state their initial opinion, the most likely diagnosis, and its justification.`;

    for (let round = 1; round <= DEBATE_ROUNDS; round++) {
        onProgress({ type: 'status', message: `Starting debate round ${round}...` });
        
        if (currentTopic.startsWith("QUESTION FOR USER:")) {
            const question = currentTopic.replace("QUESTION FOR USER:", "").trim();
            const translatedQuestion = await callGemini(`Translate this question to ${langMap[language]}: "${question}"`);
            onProgress({ type: 'user_question', question: translatedQuestion });
            let userInput = null;
            while (!userInput) {
                await sleep(1000); 
                userInput = getUserIntervention();
            }
             onProgress({ type: 'status', message: 'Considering user input...' });
             const userMessageContent = `User response: "${userInput}"`;
             const translatedUserMessage = await callGemini(`Translate this to ${langMap[language]}: "${userMessageContent}"`);
             const userMessage = { id: `user-${Date.now()}`, author: AIModel.SYSTEM, content: translatedUserMessage, isUserIntervention: true, isSystemMessage: true };
             onProgress({ type: 'message', message: userMessage });
             debateHistory.push(userMessage);
        } else {
             const translatedTopic = await callGemini(`Translate this to ${langMap[language]}: "${currentTopic}"`);
             const orchestratorMessage: ChatMessage = { id: `sys-${Date.now()}-${round}`, author: AIModel.SYSTEM, content: translatedTopic, isSystemMessage: true };
             onProgress({ type: 'message', message: orchestratorMessage });
             debateHistory.push(orchestratorMessage);
        }
        
        await sleep(1500);

        for (const specialistModel of specialists) {
            onProgress({ type: 'thinking', model: specialistModel });
            const specialist = AI_SPECIALISTS[specialistModel];

            const specialistPrompt = `
                Your role: an expert in ${specialist.specialty}, your name is ${specialist.name}.
                Patient Data: ${JSON.stringify(patientData)}
                Full Debate History: ${JSON.stringify(debateHistory)}
                
                Current question/topic from the Chair: "${currentTopic}"
                
                Provide a concise response (3-4 sentences) strictly from your specialty's perspective. You can agree, disagree with previous points, or propose a new hypothesis. Justify with evidence.
                Your entire response MUST be in ${langMap[language]}.
            `;
            
            try {
                const responseText = await callGemini(specialistPrompt, 'gemini-2.5-pro') as string;
                const specialistMessage: ChatMessage = { id: `${specialistModel}-${Date.now()}`, author: specialistModel, content: responseText };
                onProgress({ type: 'message', message: specialistMessage });
                debateHistory.push(specialistMessage);
                await sleep(1000);
            } catch (e) {
                const errorMessage: ChatMessage = { id: `${specialistModel}-${Date.now()}`, author: specialistModel, content: `API connection error.` };
                onProgress({ type: 'message', message: errorMessage });
            }
        }
        
        const livePrognosis = await generatePrognosisUpdate(debateHistory, patientData, language);
        if (livePrognosis) {
            onProgress({ type: 'prognosis_update', data: livePrognosis });
        }
        
        if (round < DEBATE_ROUNDS) {
            const summarizationPrompt = `
                You are the Konsilium Chair. Summarize the following debate.
                Patient Data: ${JSON.stringify(patientData)}
                Debate History: ${JSON.stringify(debateHistory)}
                
                Task: Pose a sharp, specific question for the next round.
                - If there's a major conflict between specialists, direct a question to the human doctor to resolve it. Start the question with the prefix "QUESTION FOR USER:".
                - Otherwise, ask a general question for the AI specialists that moves the discussion forward.
                The question MUST be in English.
            `;
            currentTopic = await callGemini(summarizationPrompt, 'gemini-2.5-flash') as string;
        }
    }

    onProgress({ type: 'status', message: 'Reaching consensus and compiling the final report...' });
    await sleep(2000);

    const finalReportSchema = {
        type: Type.OBJECT,
        properties: {
            criticalFinding: {
                type: Type.OBJECT,
                properties: { finding: { type: Type.STRING }, implication: { type: Type.STRING }, urgency: { type: Type.STRING } },
            },
            consensusDiagnosis: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, probability: { type: Type.NUMBER }, justification: { type: Type.STRING }, evidenceLevel: { type: Type.STRING } } } },
            rejectedHypotheses: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, reason: { type: Type.STRING } }}},
            recommendedTests: { type: Type.ARRAY, items: { type: Type.STRING } },
            treatmentPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
            medicationRecommendations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, dosage: { type: Type.STRING }, notes: { type: Type.STRING } }}},
            unexpectedFindings: { type: Type.STRING }
        },
        required: ['consensusDiagnosis', 'rejectedHypotheses', 'recommendedTests', 'treatmentPlan', 'medicationRecommendations', 'unexpectedFindings']
    };

    const finalReportPrompt = `
        You are the Konsilium Chair. Based on the patient data and the full debate history, create the final clinical report.
        Patient Data: ${JSON.stringify(patientData)}
        Full Debate History: ${JSON.stringify(debateHistory)}
        Return the report strictly adhering to the provided JSON schema. Try to fill all fields. If a life-threatening condition is found, fill the 'criticalFinding' field.
        Your entire response MUST be in ${langMap[language]}.
    `;

    try {
        const finalReport = await callGemini(finalReportPrompt, 'gemini-2.5-pro', finalReportSchema) as FinalReport;
        
        if (finalReport.criticalFinding && finalReport.criticalFinding.finding) {
            onProgress({ type: 'critical_finding', data: finalReport.criticalFinding });
        }

        onProgress({ type: 'report', data: finalReport, detectedMedications: [] });
    } catch (e) {
        onProgress({ type: 'error', message: "Error generating final report: " + (e instanceof Error ? e.message : String(e)) });
    }
};

export const runScenarioAnalysis = async (
    patientData: PatientData,
    debateHistory: ChatMessage[],
    scenario: string,
    language: Language
): Promise<FinalReport> => {
    const prompt = `
        You are the Konsilium Chair. Given the original debate and patient data.
        Now consider the "What if..." scenario: "${scenario}".
        
        Analyze how this new condition would change parts of the final conclusion (diagnosis, treatment plan, medications) and generate an updated final report.
        Use the same JSON schema as the original report.
        
        Original Patient Data: ${JSON.stringify(patientData)}
        Original Debate History: ${JSON.stringify(debateHistory)}
        Your entire response MUST be in ${langMap[language]}.
    `;

     const finalReportSchema = {
        type: Type.OBJECT,
        properties: {
            consensusDiagnosis: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, probability: { type: Type.NUMBER }, justification: { type: Type.STRING }, evidenceLevel: { type: Type.STRING } } } },
            treatmentPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
            medicationRecommendations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, dosage: { type: Type.STRING }, notes: { type: Type.STRING } } } },
            rejectedHypotheses: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, reason: { type: Type.STRING } }}},
            recommendedTests: { type: Type.ARRAY, items: { type: Type.STRING } },
            unexpectedFindings: { type: Type.STRING },
        },
    };

    return callGemini(prompt, 'gemini-2.5-pro', finalReportSchema) as Promise<FinalReport>;
};

export const explainRationale = async (message: ChatMessage, patientData: PatientData, debateHistory: ChatMessage[], language: Language): Promise<string> => {
    const prompt = `Considering the patient data and debate history, explain the logic behind this message from ${message.author}: "${message.content}". Focus on which clinical data or previous arguments led to this conclusion. Patient Data: ${JSON.stringify(patientData)}. Debate History: ${JSON.stringify(debateHistory)}. Your entire response MUST be in ${langMap[language]}.`;
    return callGemini(prompt, 'gemini-2.5-pro') as Promise<string>;
};

export const suggestCmeTopics = async (history: AnalysisRecord[], language: Language): Promise<CMETopic[]> => {
    if (!Array.isArray(history) || history.length === 0) return [];
    const names = history
        .map(r => r?.finalReport?.consensusDiagnosis?.[0]?.name)
        .filter((n): n is string => typeof n === 'string' && n.length > 0);
    if (names.length === 0) return [];
    const prompt = `Based on this user's case history, suggest 2-3 personalized Continuing Medical Education (CME) topics. For each topic, provide a brief note of relevance. Return an array of JSON objects with keys "topic" and "relevance". History: ${JSON.stringify(names)}. Your entire response MUST be in ${langMap[language]}.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                topic: { type: Type.STRING },
                relevance: { type: Type.STRING },
            },
            required: ['topic', 'relevance'],
        },
    };
    return callGemini(prompt, 'gemini-2.5-flash', schema);
};

export const checkDrugInteractions = async (drugList: string, language: Language): Promise<DrugInteraction[]> => {
    const prompt = `Analyze potential interactions for the following list of drugs. For each significant interaction, describe it, its severity ('High', 'Medium', 'Low'), mechanism, and management recommendation. Return an array of JSON objects with keys "interaction" (e.g., "Aspirin and Warfarin"), "severity", "mechanism", "management". Drug List:\n${drugList}. Your entire response MUST be in ${langMap[language]}.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                interaction: { type: Type.STRING },
                severity: { type: Type.STRING },
                mechanism: { type: Type.STRING },
                management: { type: Type.STRING },
            },
            required: ['interaction', 'severity', 'mechanism', 'management'],
        }
    };
    return callGemini(prompt, 'gemini-2.5-pro', schema);
};

export const analyzeEcgImage = async (image: { base64Data: string, mimeType: string }, language: Language): Promise<EcgReport> => {
    const textPart = { text: `Analyze this ECG image and provide a structured report. Return a single JSON object with the following keys: "rhythm", "heartRate", "prInterval", "qrsDuration", "qtInterval", "axis", "morphology", "interpretation". Your entire response MUST be in ${langMap[language]}.` };
    const imagePart = { inlineData: { data: image.base64Data, mimeType: image.mimeType } };
    const prompt = { parts: [textPart, imagePart] };

    const schema = {
        type: Type.OBJECT,
        properties: {
            rhythm: { type: Type.STRING },
            heartRate: { type: Type.STRING },
            prInterval: { type: Type.STRING },
            qrsDuration: { type: Type.STRING },
            qtInterval: { type: Type.STRING },
            axis: { type: Type.STRING },
            morphology: { type: Type.STRING },
            interpretation: { type: Type.STRING },
        },
        required: ['rhythm', 'heartRate', 'prInterval', 'qrsDuration', 'qtInterval', 'axis', 'morphology', 'interpretation']
    };
    
    return callGemini(prompt, 'gemini-2.5-flash', schema);
};

export const getIcd10Codes = async (diagnosis: string, language: Language): Promise<Icd10Code[]> => {
    const prompt = `Provide the most relevant ICD-10 codes for the diagnosis "${diagnosis}". Return an array of JSON objects with keys "code" and "description". Your entire response MUST be in ${langMap[language]}.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                code: { type: Type.STRING },
                description: { type: Type.STRING },
            },
            required: ['code', 'description'],
        }
    };
    return callGemini(prompt, 'gemini-2.5-flash', schema);
};

export const searchClinicalGuidelines = async (query: string, language: Language): Promise<GuidelineSearchResult> => {
    const prompt = `Summarize the latest clinical guidelines for "${query}" based on web search results. Provide a concise summary and a list of source URLs. Your entire response MUST be in ${langMap[language]}.`;
    const result = await callGemini(prompt, 'gemini-2.5-flash', undefined, true) as GenerateContentResponse;
    
    const sources = result.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web.title || chunk.web.uri,
        uri: chunk.web.uri
    })) || [];
    
    return {
        summary: result.text,
        sources: sources,
    };
};

export const interpretLabValue = async (labValue: string, language: Language): Promise<string> => {
    const prompt = `Provide a clinical interpretation for the lab value "${labValue}". Explain its significance, potential causes for abnormal values, and next steps. Your entire response MUST be in ${langMap[language]}.`;
    return callGemini(prompt, 'gemini-2.5-pro') as Promise<string>;
};

export const generatePatientExplanation = async (clinicalText: string, language: Language): Promise<string> => {
    const prompt = `Translate the following clinical text into simple, understandable language for a patient. The output language MUST be ${langMap[language]}. Clinical text: "${clinicalText}"`;
    return callGemini(prompt) as Promise<string>;
};

export const expandAbbreviation = async (abbreviation: string, language: Language): Promise<string> => {
    const prompt = `What does the medical abbreviation "${abbreviation}" stand for and what is its meaning? Provide a short explanation. Your entire response MUST be in ${langMap[language]}.`;
    return callGemini(prompt) as Promise<string>;
};

export const generateDischargeSummary = async (patientData: PatientData, finalReport: FinalReport, language: Language): Promise<string> => {
    const prompt = `Generate a hospital discharge summary for the following patient. Patient: ${JSON.stringify(patientData)}, Final Report: ${JSON.stringify(finalReport)}. Your entire response MUST be in ${langMap[language]}.`;
    return callGemini(prompt) as Promise<string>;
};

export const generateInsurancePreAuth = async (patientData: PatientData, finalReport: FinalReport, procedure: string, language: Language): Promise<string> => {
    const prompt = `Write a letter of medical necessity for an insurance pre-authorization for the procedure "${procedure}". Use the provided patient data and final report to justify the request. Patient: ${JSON.stringify(patientData)}, Final Report: ${JSON.stringify(finalReport)}. Your entire response MUST be in ${langMap[language]}.`;
    return callGemini(prompt) as Promise<string>;
};

export const calculatePediatricDose = async (drugName: string, weightKg: number, language: Language): Promise<PediatricDose> => {
    const prompt = `Calculate the pediatric dose for ${drugName} for a child weighing ${weightKg} kg. Provide the recommended dose, the calculation formula, and any important warnings. Return a JSON object with keys "drugName", "dose", "calculation", and "warnings" (as an array of strings). Your entire response MUST be in ${langMap[language]}.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            drugName: { type: Type.STRING },
            dose: { type: Type.STRING },
            calculation: { type: Type.STRING },
            warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['drugName', 'dose', 'calculation', 'warnings'],
    };
    return callGemini(prompt, 'gemini-2.5-pro', schema);
};

export const calculateRiskScore = async (scoreType: string, patientData: PatientData, language: Language): Promise<RiskScore> => {
    const prompt = `Calculate the ${scoreType} score for a patient with the following data: ${JSON.stringify(patientData)}. Provide the final score and its clinical interpretation. Return a JSON object with keys "name", "score", "interpretation". Your entire response MUST be in ${langMap[language]}.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            score: { type: Type.STRING },
            interpretation: { type: Type.STRING },
        },
        required: ['name', 'score', 'interpretation'],
    };
    return callGemini(prompt, 'gemini-2.5-pro', schema);
};

export const generatePatientEducationContent = async (report: FinalReport, language: Language): Promise<PatientEducationTopic[]> => {
    const prompt = `Based on the final report, create 3-4 educational topics for the patient in simple ${langMap[language]} language. For each topic, provide a title and content. Return an array of JSON objects with keys "title" and "content". Report: ${JSON.stringify(report)}`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                language: { type: Type.STRING },
            },
            required: ['title', 'content'],
        }
    };
    return callGemini(prompt, 'gemini-2.5-flash', schema);
};

export const runResearchCouncilDebate = async (
    diseaseName: string,
    onProgress: (update: ResearchProgressUpdate) => void,
    language: Language
): Promise<void> => {
    onProgress({ type: 'status', message: `Research topic: "${diseaseName}". Gathering data...` });
    await sleep(2000);

    const specialists = [AIModel.GPT, AIModel.LLAMA, AIModel.CLAUDE];
    for (const model of specialists) {
        const translatedIntro = await callGemini(`Translate to ${langMap[language]}: "I am ${model}, ready to analyze the latest research on ${diseaseName}."`);
        onProgress({ type: 'message', message: { id: `${model}-${Date.now()}`, author: model, content: translatedIntro, isThinking: false } });
        await sleep(500);
    }
    
    onProgress({ type: 'status', message: 'Discussing innovative strategies...' });
    await sleep(2000);
    
    const prompt = `Provide a highly detailed research report on innovative and experimental treatment strategies for "${diseaseName}". Use web search to find the latest data. Return a comprehensive JSON object that strictly adheres to the ResearchReport interface from the application's types. Ensure all fields are filled with detailed, scientifically-backed information. Your entire response, including all text and data within the JSON, MUST be in ${langMap[language]}.`;

    const researchReportSchema = {
      type: Type.OBJECT,
      properties: {
        diseaseName: { type: Type.STRING },
        summary: { type: Type.STRING },
        epidemiology: {
          type: Type.OBJECT,
          properties: {
            prevalence: { type: Type.STRING },
            incidence: { type: Type.STRING },
            keyRiskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
        pathophysiology: { type: Type.STRING },
        emergingBiomarkers: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING },
              description: { type: Type.STRING },
            },
          },
        },
        clinicalGuidelines: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    guidelineTitle: { type: Type.STRING },
                    source: { type: Type.STRING },
                    recommendations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                category: { type: Type.STRING },
                                details: { type: Type.ARRAY, items: { type: Type.STRING } },
                            }
                        }
                    }
                }
            }
        },
        potentialStrategies: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              mechanism: { type: Type.STRING },
              evidence: { type: Type.STRING },
              pros: { type: Type.ARRAY, items: { type: Type.STRING } },
              cons: { type: Type.ARRAY, items: { type: Type.STRING } },
              riskBenefit: {
                type: Type.OBJECT,
                properties: {
                  risk: { type: Type.STRING },
                  benefit: { type: Type.STRING },
                },
              },
              developmentRoadmap: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        stage: { type: Type.STRING },
                        duration: { type: Type.STRING },
                        cost: { type: Type.STRING },
                    }
                }
              },
              molecularTarget: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    pdbId: { type: Type.STRING }
                }
              },
              ethicalConsiderations: { type: Type.ARRAY, items: { type: Type.STRING } },
              requiredCollaborations: { type: Type.ARRAY, items: { type: Type.STRING } },
              companionDiagnosticNeeded: { type: Type.STRING },
            },
          },
        },
        pharmacogenomics: {
            type: Type.OBJECT,
            properties: {
                relevantGenes: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            gene: { type: Type.STRING },
                            mutation: { type: Type.STRING },
                            impact: { type: Type.STRING },
                        }
                    }
                },
                targetSubgroup: { type: Type.STRING },
            }
        },
        patentLandscape: {
            type: Type.OBJECT,
            properties: {
                competingPatents: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            patentId: { type: Type.STRING },
                            title: { type: Type.STRING },
                            assignee: { type: Type.STRING },
                        }
                    }
                },
                whitespaceOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        },
        relatedClinicalTrials: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    trialId: { type: Type.STRING },
                    title: { type: Type.STRING },
                    status: { type: Type.STRING },
                    url: { type: Type.STRING },
                }
            }
        },
        strategicConclusion: { type: Type.STRING },
        sources: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    uri: { type: Type.STRING },
                }
            }
        }
      },
    };

    try {
        const result = await callGemini(prompt, 'gemini-2.5-pro', researchReportSchema, true) as GenerateContentResponse;
        
        const reportData: ResearchReport = JSON.parse(result.text.replace(/^```json\s*|```\s*$/g, '').trim());

        reportData.sources = result.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
            title: chunk.web.title || chunk.web.uri,
            uri: chunk.web.uri
        })).filter((v:any) => v.uri) || [];

        onProgress({ type: 'report', data: reportData });
    } catch (e) {
        console.error(e);
        onProgress({ type: 'error', message: e instanceof Error ? e.message : 'Failed to generate research report.' });
    }
};