


import { GoogleGenAI, Type } from "@google/genai";
import type { PatientData, ProgressUpdate, AIModel, ChatMessage, FinalReport, ResearchReport, ResearchProgressUpdate, TreatmentStrategy } from '../types';
import { AIModel as AIModelEnum } from '../types';
import { AI_MODEL_CONFIG } from '../constants';

// This function simulates a delay, to make the debate feel more real.
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let ai: GoogleGenAI;
try {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
} catch (error) {
    console.error("Failed to initialize GoogleGenAI. Is API_KEY set?", error);
}

const createContentsWithImageCheck = (prompt: string, patientData: PatientData) => {
    if (patientData.image) {
        return {
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        data: patientData.image.base64Data,
                        mimeType: patientData.image.mimeType,
                    },
                },
            ],
        };
    }
    return prompt;
};

// --- PROMPT CREATION FUNCTIONS (CLINICAL ANALYSIS) ---

const createClarifyingQuestionsPrompt = (patientData: PatientData): string => `
Sen Konsilium Raisisan, tajribali bosh shifokor. Senga bemor haqida dastlabki ma'lumotlar berildi. Aniq tashxis qo'yish va to'liq tahlil o'tkazish uchun Senga qanday QO'SHIMCHA, ANCLASHTIRUVCHI ma'lumotlar kerak? Bemordan so'ralishi zarur bo'lgan 3-5 ta eng muhim savolni shakllantir. Savollar qisqa, aniq va tushunarli bo'lsin. Javobni FAQAT JSON formatida, {"questions": ["Savol 1?", "Savol 2?", ...]} ko'rinishida qaytar. Hech qanday boshqa matn qo'shma.
Bemor ma'lumotlari:
${JSON.stringify(patientData)}
`;

const createInitialPrompt = (data: PatientData, professorName: string): string => `
SEN - ${professorName}, o'z sohasining cho'qqisiga chiqqan buyuk tabibsan.
Quyidagi bemor ma'lumotlarini chuqur tahlil qil.
VAZIFA: To'g'ridan-to'g'ri, hech qanday kirish so'zlarisiz, o'z dastlabki, batafsil diagnostik gipotezangni, uni qo'llab-quvvatlovchi asosiy dalillarni (klinik, laborator, instrumental) va differensial diagnostika uchun ko'rib chiqilishi kerak bo'lgan 2-3 ta muqobil kasallikni sanab o't. Fikringni ilmiy va qat'iy bayon et.

BEMOR MA'LUMOTLARI:
- Yoshi: ${data.age}
- Jinsi: ${data.gender}
- Shikoyatlar va Anamnez: ${data.complaints}
- Kasallik tarixi: ${data.history}
- Ob'ektiv Ko'rik: ${data.objectiveData}
- Laborator va Instrumental Tahlillar: ${data.labResults}
- Allergiya: ${data.allergies || "Ko'rsatilmagan"}
- Qabul qilayotgan dorilar: ${data.currentMedications || "Ko'rsatilmagan"}
- Oilaviy anamnez: ${data.familyHistory || "Ko'rsatilmagan"}
${data.additionalInfo ? `- Qo'shimcha ma'lumotlar: ${data.additionalInfo}` : ''}
${data.image ? `- DIQQAT: Tahlil uchun bemorning tibbiy tasviri ilova qilingan. Xulosalaringda undagi ma'lumotlarga tayan.` : ''}
`;

const createOrchestratorChallengePrompt = (history: string): string => `
Men Konsilium Raisiman va munozarani boshqaraman. Quyida professorlarning stenogrammasi keltirilgan:
---
${history}
---
VAZIFA: "IBLIS ADVOKATI" rolini o'yna. Stenogrammani o'qib, eng kuchli va ko'pchilik qo'llab-quvvatlayotgan gipotezani aniqla. So'ng, ushbu gipotezaga qasddan QARSHI CHIQ. Uning zaif tomonlarini top, unga mos kelmaydigan faktlarni (masalan, biror tahlil natijasi) ko'rsatib, tanqidiy savol ber. Maqsad - gipotezani har tomonlama sinovdan o'tkazish va "ko'r-ko'rona ishonish" (confirmation bias)ning oldini olish.
Javobingni O'Z NOMIMDAN, to'g'ridan-to'g'ri, keskin va bahsni qizdiradigan tarzda yoz.
Masalan: "Professor Ar-Roziy, sizning pnevmoniya gipotezangiz ko'pchilikka ma'qul kelayotganini ko'rib turibman, lekin bu bemorning oilaviy anamnezidagi yurak kasalligi xavfini e'tiborsiz qoldiryapti. Balki bu yurak yetishmovchiligining o'pka asorati emasligiga kim kafolat beradi? Kelinglar, bir tomonlama bo'lib qolmaylik."
`;

const createDebateResponsePrompt = (history: string, challenge: string, professorName: string): string => `
SEN - ${professorName}, buyuk tabibsan.
Quyida munozara stenogrammasi va Konsilium Raisining yangi savoli/fikri keltirilgan:
--- STENOGRAMMA ---
${history}
--- RAIS SAVOLI/FIKRI ---
"${challenge}"
---
VAZIFA: Hech qanday kirish so'zlarisiz, to'g'ridan-to'g'ri Raisning savoliga javob ber va boshqa professorlarning fikrlariga munosabat bildir. O'z gipotezangni yangi dalillar bilan himoya qil, tanqid qil yoki kerak bo'lsa o'zgartir. Javobing aniq, ilmiy va argumentlarga boy bo'lsin.
`;

const createSynthesisPrompt = (history: string): string => `
SEN - Professor Abu Ali ibn Sino, sintez va mantiq ustasisan.
Quyida professorlarning qizg'in munozarasi keltirilgan:
---
${history}
---
VAZIFA: Barcha bildirilgan fikrlar, dalillar va qarshi dalillarni sintez qilib, munozarani umumlashtir. Asosiy diagnostik gipoteza bo'yicha konsensusga kelingan nuqtalarni va hali ham munozarali bo'lib qolayotgan jihatlarni aniq ko'rsatib, yakuniy xulosaga o'xshash qisqa va aniq matn tuzib ber. To'g'ridan-to'g'ri matnga o't.
`;

const createFinalReportPrompt = (history: string, patientData: PatientData): string => `
Buyuk professorlar ishtirokidagi tibbiy konsilium yakunlandi. Quyida to'liq stenogramma va bemorning qabul qilayotgan dorilari ro'yxati keltirilgan:
--- STENOGRAMMA ---
${history}
--- BEMOR QABUL QILAYOTGAN DORILAR ---
${patientData.currentMedications || "Yo'q"}
---
Vazifa: Yuqoridagi munozarani va bemorning dori-darmonlari ro'yxatini umumlashtirib, yakuniy, konsensusga kelingan, har tomonlama asoslangan klinik xulosani tayyorla.

Xulosada quyidagi yangi bo'limlarga ALOHIDA e'tibor qarat:
1.  **pharmacologicalWarnings**: Tavsiya etilayotgan dori-darmonlarni bemorning hozirda qabul qilayotgan dorilari bilan solishtir. Potensial xavfli o'zaro ta'sirlarni aniqlab, ogohlantirishlar ro'yxatini shakllantir.
2.  **evidenceLevel**: Har bir yakuniy tashxis uchun uning dalillilik darajasini xalqaro standartlar bo'yicha belgilab ber (masalan, "A daraja: Yuqori sifatli RKI larga asoslangan", "B daraja: O'rtacha sifatli tadqiqotlar", "C daraja: Ekspertlar fikri").
3.  **unexpectedFindings**: Bemorning turli ma'lumotlari (masalan, rentgen tasviridagi arzimagan detal bilan qon tahlilidagi o'zgarish yoki oilaviy anamnezdagi holat) o'rtasidagi inson nigohi ilg'amaydigan, nostandart bog'liqlarni top va ularning potensial diagnostik ahamiyatini tahlil qilib ber. Bu bo'limda o'zingning chuqur tahliliy qobiliyatingni namoyon et.
4.  **recommendedTests**: Aniq xulosa qilish uchun qanday muhim ma'lumotlar (tahlillar, tekshiruvlar) yetishmayotganini aniq ko'rsatib, shifokor uchun keyingi qadamlarni belgilab ber.

Javobingni FAQAT so'ralgan JSON formatida, hech qanday qo'shimcha matn yoki markdown formatlash (\`\`\`json ... \`\`\`)larsiz qaytar. Schemaga qat'iy rioya qil.
`;

const finalReportSchema = {
    type: Type.OBJECT,
    properties: {
        consensusDiagnosis: {
            type: Type.ARRAY,
            description: "Konsiliumning umumiy kelishuvi natijasidagi eng ehtimolli tashxislar.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Tashxis nomi" },
                    probability: { type: Type.NUMBER, description: "Tashxis ehtimolligi (0-100)" },
                    justification: { type: Type.STRING, description: "Tashxisni qo'llab-quvvatlovchi asosiy simptomlar, belgilar va tahlillar." },
                    evidenceLevel: { type: Type.STRING, description: "Tashxisning dalillilik darajasi (masalan, A, B, C daraja)" }
                },
                required: ["name", "probability", "justification", "evidenceLevel"]
            }
        },
        rejectedHypotheses: {
            type: Type.ARRAY,
            description: "Munozara davomida ko'rib chiqilgan va rad etilgan gipotezalar.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Rad etilgan tashxis nomi" },
                    reason: { type: Type.STRING, description: "Rad etilishining qisqacha va aniq sababi" }
                },
                required: ["name", "reason"]
            }
        },
        recommendedTests: {
            type: Type.ARRAY,
            description: "Tashxisni tasdiqlash, aniqlashtirish yoki ma'lumotlardagi bo'shliqlarni to'ldirish uchun zarur bo'lgan keyingi tekshiruvlar ro'yxati.",
            items: { type: Type.STRING }
        },
        treatmentPlan: {
            type: Type.ARRAY,
            description: "Tashxisga asoslangan holda tavsiya etiladigan davolash rejasi bosqichlari (turmush tarzi o'zgarishlari, fizioterapiya va hokazo).",
            items: { type: Type.STRING }
        },
        medicationRecommendations: {
            type: Type.ARRAY,
            description: "Tavsiya etiladigan dori-darmonlar ro'yxati, dozasi va qo'shimcha izohlar bilan.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Dori vositasining nomi" },
                    dosage: { type: Type.STRING, description: "Dozasi va qabul qilish tartibi" },
                    notes: { type: Type.STRING, description: "Qo'shimcha muhim izohlar (masalan, ovqatdan keyin qabul qilish)" }
                },
                required: ["name", "dosage", "notes"]
            }
        },
        pharmacologicalWarnings: {
            type: Type.ARRAY,
            description: "Tavsiya etilgan va joriy dori-darmonlar o'rtasidagi potensial xavfli o'zaro ta'sirlar.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "O'zaro ta'sirga kirishuvchi dori juftligi yoki guruh nomi" },
                    warning: { type: Type.STRING, description: "Potensial o'zaro ta'sirning tavsifi va xavfi" }
                },
                required: ["name", "warning"]
            }
        },
        unexpectedFindings: {
            type: Type.STRING,
            description: "Bemor ma'lumotlari orasidagi kutilmagan, nostandart bog'liqliklar va ular asosida shakllangan gipotezalar."
        }
    },
    required: ["consensusDiagnosis", "rejectedHypotheses", "recommendedTests", "treatmentPlan", "medicationRecommendations", "pharmacologicalWarnings", "unexpectedFindings"]
};


// --- CORE AI CALL FUNCTION ---

const callAI = async (prompt: string, patientData: PatientData | null, config: any = {}): Promise<string> => {
    if (!ai) throw new Error('AI client not initialized.');
    const contents = patientData ? createContentsWithImageCheck(prompt, patientData) : prompt;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config,
    });
    return response.text;
};

// --- CLINICAL ANALYSIS SERVICE ---

export const generateClarifyingQuestions = async (patientData: PatientData): Promise<string[]> => {
    if (!ai) throw new Error('AI client not initialized.');
    
    const prompt = createClarifyingQuestionsPrompt(patientData);
    const config = { responseMimeType: "application/json" };
    
    try {
        const responseText = await callAI(prompt, null, config);
        const parsed = JSON.parse(responseText.trim());
        if (parsed && Array.isArray(parsed.questions)) {
            return parsed.questions;
        }
        return [];
    } catch (e) {
        console.error("Could not parse clarifying questions:", e);
        // Fallback if JSON parsing fails
        return ["Tavsiya etilgan davolash rejasining qanday nojo'ya ta'sirlari bo'lishi mumkin?", "Ushbu tashxisning uzoq muddatli prognozi qanday?"];
    }
};

export const runAICouncilDebate = async (patientData: PatientData, onProgress: (update: ProgressUpdate) => void): Promise<void> => {
    if (!ai) {
        onProgress({ type: 'error', message: 'Tizim mijozi sozlanmagan. Iltimos, API kalitini tekshiring.' });
        return;
    }

    let debateHistory: ChatMessage[] = [];
    const professors = [AIModelEnum.GPT, AIModelEnum.CLAUDE, AIModelEnum.LLAMA, AIModelEnum.GROK, AIModelEnum.GEMINI];
    
    const addMessage = (author: AIModel, content: string, isThinking: boolean = false) => {
        const newMessage: ChatMessage = { id: Date.now().toString() + Math.random(), author, content, isThinking };
        if (isThinking && !content) return;
        
        const thinkingIndex = debateHistory.findIndex(m => m.author === author && m.isThinking);
        const newHistory = [...debateHistory];

        if (thinkingIndex > -1) {
            newHistory[thinkingIndex] = newMessage;
        } else {
            newHistory.push(newMessage);
        }
        debateHistory = newHistory;
        onProgress({ type: 'message', message: newMessage });
    };

    const startThinking = (model: AIModel, text: string = "Fikrlanmoqda...") => {
        const thinkingMessage: ChatMessage = { id: Date.now().toString() + Math.random(), author: model, content: text, isThinking: true };
        debateHistory.push(thinkingMessage);
        onProgress({ type: 'message', message: thinkingMessage });
    };

    const getHistoryAsString = () => debateHistory.map(msg => `${AI_MODEL_CONFIG[msg.author]?.name || msg.author}: ${msg.content}`).join('\n\n');

    try {
        onProgress({ type: 'status', message: "Konsilium boshlanmoqda..." });
        addMessage(AIModelEnum.SYSTEM, "Assalomu alaykum, hurmatli professorlar. Konsiliumimizni ochiq deb e'lon qilaman. Iltimos, bemor ma'lumotlari bilan tanishib chiqing.");
        await sleep(1500);

        // Round 1: Initial Hypotheses
        onProgress({ type: 'status', message: "Dastlabki gipotezalar shakllantirilmoqda..." });
        professors.forEach(model => startThinking(model, "Bemor ma'lumotlarini tahlil qilmoqda..."));
        
        const initialPromises = professors.map(async (model) => {
            const professorName = AI_MODEL_CONFIG[model].name;
            const prompt = createInitialPrompt(patientData, professorName);
            const response = await callAI(prompt, patientData);
            addMessage(model, response);
        });
        await Promise.all(initialPromises);
        
        // Debate Rounds
        for (let i = 1; i <= 2; i++) {
            onProgress({ type: 'status', message: `Munozara ${i}-raundi...` });
            await sleep(2000);

            const challengePrompt = createOrchestratorChallengePrompt(getHistoryAsString());
            const challenge = await callAI(challengePrompt, null);
            addMessage(AIModelEnum.SYSTEM, challenge);
            await sleep(2000);
            
            const respondingProfessors = [...professors].sort(() => 0.5 - Math.random()).slice(0, 3);
            
            respondingProfessors.forEach(model => startThinking(model));

            for (const model of respondingProfessors) {
                const professorName = AI_MODEL_CONFIG[model].name;
                const debatePrompt = createDebateResponsePrompt(getHistoryAsString(), challenge, professorName);
                const response = await callAI(debatePrompt, patientData);
                addMessage(model, response);
                await sleep(3000);
            }
        }

        // Synthesis Round
        onProgress({ type: 'status', message: "Konsensusga intilish: Dalillar sintezi..." });
        addMessage(AIModelEnum.SYSTEM, "Qimmatli fikrlar uchun barchaga rahmat. Munozara yakuniga yetmoqda. Professor Ibn Sino, marhamat, barcha dalillarni sintez qilib, umumiy xulosa qilib bersangiz.");
        await sleep(2000);
        startThinking(AIModelEnum.GEMINI, "Barcha fikrlarni umumlashtirmoqda...");
        const synthesisPrompt = createSynthesisPrompt(getHistoryAsString());
        const synthesis = await callAI(synthesisPrompt, patientData);
        addMessage(AIModelEnum.GEMINI, synthesis);
        await sleep(1000);

        // Final Report
        onProgress({ type: 'status', message: "Yakuniy hisobot tayyorlanmoqda..." });
        addMessage(AIModelEnum.SYSTEM, "Konsilium o'z ishini yakunladi. Barcha ma'lumotlar tahlil qilinib, yakuniy klinik xulosa tayyorlanmoqda. Iltimos, kuting.");
        await sleep(2000);
        startThinking(AIModelEnum.SYSTEM, "Yakuniy hisobotni shakllantirmoqda...");

        const finalReportPrompt = createFinalReportPrompt(getHistoryAsString(), patientData);
        const config = {
            responseMimeType: "application/json",
            responseSchema: finalReportSchema
        };
        const reportJsonString = await callAI(finalReportPrompt, patientData, config);
        
        let finalReport: FinalReport;
        try {
            finalReport = JSON.parse(reportJsonString.trim().replace(/```json|```/g, ''));
        } catch (e) {
             console.error("Final report JSON parsing error:", e);
             console.error("Received text:", reportJsonString);
             throw new Error("Yakuniy hisobotni tahlil qilishda xatolik yuz berdi. Qaytarilgan ma'lumot JSON formatida emas.");
        }
        
        addMessage(AIModelEnum.SYSTEM, "Yakuniy klinik xulosa tayyor. Quyida tanishishingiz mumkin.");
        onProgress({ type: 'report', data: finalReport });
        onProgress({ type: 'status', message: 'Tahlil yakunlandi.' });

    } catch (e: any) {
        console.error("Debate Error:", e);
        onProgress({ type: 'error', message: e.message || 'Munozara davomida noma\'lum xatolik yuz berdi.' });
    }
};

export const askFollowUpQuestion = async (history: ChatMessage[], question: string): Promise<string> => {
    if (!ai) throw new Error('AI client not initialized.');
    const historyString = history.map(msg => `${AI_MODEL_CONFIG[msg.author]?.name || msg.author}: ${msg.content}`).join('\n\n');
    
    const prompt = `
        Sen Konsilium Raisisan va munozara yakunlandi. Foydalanuvchi yakuniy xulosa bo'yicha aniqlashtiruvchi savol bermoqda.
        Quyida munozara stenogrammasi keltirilgan:
        ---
        ${historyString}
        ---
        Foydalanuvchi savoli: "${question}"
        ---
        VAZIFA: Stenogrammaga asoslanib, foydalanuvchining savoliga qisqa, aniq va lutf bilan javob ber. Javobni to'g'ridan-to'g'ri yoz.
    `;
    return await callAI(prompt, null);
};


// --- RESEARCH CENTER SERVICE ---

const createResearchInitialPrompt = (disease: string, professorName: string): string => `
SEN - ${professorName}, o'z sohasangda dunyo miqyosida tan olingan, innovatsion fikrlovchi olimsan.
MAVZU: "${disease}" kasalligini davolash uchun eng ilg'or, nostandart va eksperimental yondashuvlar.
VAZIFA: Mavjud davolash standartlaridan tashqariga chiq. O'z sohangdagi (gen terapiyasi, immunoterapiya, molekulyar targetlar, ilg'or hisoblash usullari yordamida dori yaratish va hk.) eng so'nggi yutuqlarga asoslanib, "${disease}" kasalligi uchun 1-2 ta INQILOBIY davolash strategiyasi g'oyasini taklif qil. Har bir g'oya uchun uning ilmiy asosini qisqacha tushuntir. Javobingni to'g'ridan-to'g'ri, kirish so'zlarisiz boshla.
`;

const createResearchDebatePrompt = (history: string, challenge: string, professorName: string): string => `
SEN - ${professorName}, ilmiy munozaralar ustasisan.
Quyida kasallikni davolash bo'yicha munozara stenogrammasi va Kengash Raisining yangi savoli/fikri keltirilgan:
--- STENOGRAMMA ---
${history}
--- RAIS SAVOLI/FIKRI ---
"${challenge}"
---
VAZIFA: Raisning fikriga javob ber. Boshqa olimlarning g'oyalarini tanqidiy tahlil qil. O'z strategiyangni yangi argumentlar bilan kuchaytir yoki boshqa g'oyalarni rivojlantir. Maqsad - eng istiqbolli va mantiqiy yondashuvni topish. Javobing ilmiy, dalillarga asoslangan va qisqa bo'lsin.
`;

const createResearchFinalReportPrompt = (diseaseName: string, history: string): string => `
Ilmiy Konsiliumning "${diseaseName}" kasalligiga bag'ishlangan munozarasi yakunlandi.
Stenogramma:
---
${history}
---
Vazifa: Ushbu munozara asosida Google Qidiruvdan foydalanib, eng so'nggi ilmiy maqolalar, klinik sinovlar va yangiliklarni top. Topilgan ma'lumotlarni sintez qilib, quyidagi savollarga javob beradigan batafsil, ilmiy tahliliy hisobot tayyorla:
1.  **Umumiy xulosa:** "${diseaseName}" kasalligini davolashdagi hozirgi holat va eng katta muammolar nimalardan iborat?
2.  **Potensial Davolash Strategiyalari:** Munozarada tilga olingan va sen topgan eng istiqbolli 2-3 ta strategiyani batafsil yoritib ber. Har biri uchun ta'sir mexanizmi, dalillar darajasi (masalan, "Klinik sinovlar (Faza II)"), afzalliklari va kamchiliklarini aniq ko'rsat.
3.  **Keyingi Qadamlar:** Ushbu tadqiqotni amaliyotga joriy etish uchun qanday keyingi ilmiy-tadqiqot ishlari olib borilishi kerak?

Javobingni ilmiy maqola uslubida, aniq va batafsil yoz. Hech qanday JSON formatlashsiz, to'g'ridan-to'g'ri matn ko'rinishida qaytar.
`;

const parseSourcesFromGroundingMetadata = (response: any): { title: string; uri: string }[] => {
    try {
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        if (!groundingMetadata?.groundingChunks) {
            return [];
        }
        const sources = groundingMetadata.groundingChunks
            .map((chunk: any) => chunk.web)
            .filter((web: any): web is { title: string; uri: string } => web && web.uri && web.title);

        return Array.from(new Map<string, { title: string; uri: string }>(sources.map(item => [item.uri, item])).values());
    } catch (e) {
        console.error("Error parsing sources:", e);
        return [];
    }
};

// This is a simplified parser. A more robust implementation might use another LLM call to structure the text into JSON.
const parseTextToResearchReport = (text: string, diseaseName: string, sources: {title: string, uri: string}[]): ResearchReport => {
    const summaryMatch = text.match(/(?:Umumiy xulosa|Xulosa):([\s\S]*?)(?:Potensial Davolash Strategiyalari|Strategiyalar):/i);
    const strategiesMatch = text.match(/(?:Potensial Davolash Strategiyalari|Strategiyalar):([\s\S]*?)(?:Keyingi Qadamlar):/i);
    const nextStepsMatch = text.match(/(?:Keyingi Qadamlar):([\s\S]*)/i);

    const summary = summaryMatch ? summaryMatch[1].trim() : "Xulosa topilmadi. Hisobotni to'liq o'qib chiqing.";
    const strategiesText = strategiesMatch ? strategiesMatch[1].trim() : text;
    const nextSteps = nextStepsMatch ? nextStepsMatch[1].trim().split(/\n-|\n\*/).map(s => s.trim()).filter(Boolean) : [];

    const potentialStrategies: TreatmentStrategy[] = [];
    // Split strategies by headings like "1. Strategy Name" or "**Strategy Name**"
    const strategyBlocks = strategiesText.split(/\n\s*(?:\d+\.|\*\*|###)\s*/).filter(s => s.trim().length > 10);

    strategyBlocks.forEach(block => {
        const lines = block.split('\n');
        const name = lines[0].replace(/\*+/g, '').trim();
        const blockText = lines.slice(1).join('\n');
        
        const mechanismMatch = blockText.match(/(?:Ta'sir Mexanizmi|Mexanizm):([\s\S]*?)(?:Dalillar|Afzalliklari)/i);
        const evidenceMatch = blockText.match(/(?:Dalillar darajasi|Dalillar):([\s\S]*?)(?:Afzalliklari|Kamchiliklari)/i);
        const prosMatch = blockText.match(/(?:Afzalliklari):([\s\S]*?)(?:Kamchiliklari|Keyingi Qadamlar|$)/i);
        const consMatch = blockText.match(/(?:Kamchiliklari):([\s\S]*?)(?:Keyingi Qadamlar|$)/i);

        if (name) {
             potentialStrategies.push({
                name: name,
                mechanism: mechanismMatch ? mechanismMatch[1].trim() : "Batafsil ma'lumot hisobotda.",
                evidence: evidenceMatch ? evidenceMatch[1].trim() : "Noma'lum",
                pros: prosMatch ? prosMatch[1].trim().split(/\n-|\n\*/).map(s => s.trim()).filter(Boolean) : [],
                cons: consMatch ? consMatch[1].trim().split(/\n-|\n\*/).map(s => s.trim()).filter(Boolean) : [],
            });
        }
    });

    return {
        diseaseName,
        summary,
        potentialStrategies,
        nextSteps,
        sources
    };
};

export const runResearchCouncilDebate = async (diseaseName: string, onProgress: (update: ResearchProgressUpdate) => void): Promise<void> => {
    if (!ai) {
        onProgress({ type: 'error', message: 'Tizim mijozi sozlanmagan. Iltimos, API kalitini tekshiring.' });
        return;
    }

    let debateHistory: ChatMessage[] = [];
    const professors = [AIModelEnum.GEMINI, AIModelEnum.GPT, AIModelEnum.GROK, AIModelEnum.CLAUDE];
    
    const addMessage = (author: AIModel, content: string, isThinking: boolean = false) => {
        const newMessage: ChatMessage = { id: Date.now().toString() + Math.random(), author, content, isThinking };
        if (isThinking && !content) return;
        
        const thinkingIndex = debateHistory.findIndex(m => m.author === author && m.isThinking);
        const newHistory = [...debateHistory];

        if (thinkingIndex > -1) {
            newHistory[thinkingIndex] = newMessage;
        } else {
            newHistory.push(newMessage);
        }
        debateHistory = newHistory;
        onProgress({ type: 'message', message: newMessage });
    };

    const startThinking = (model: AIModel, text: string = "G'oyalarni shakllantirmoqda...") => {
        const thinkingMessage: ChatMessage = { id: Date.now().toString() + Math.random(), author: model, content: text, isThinking: true };
        debateHistory.push(thinkingMessage);
        onProgress({ type: 'message', message: thinkingMessage });
    };

    const getHistoryAsString = () => debateHistory.map(msg => `${AI_MODEL_CONFIG[msg.author]?.name || msg.author}: ${msg.content}`).join('\n\n');

    try {
        onProgress({ type: 'status', message: `"${diseaseName}" bo'yicha ilmiy konsilium boshlanmoqda...` });
        addMessage(AIModelEnum.SYSTEM, `Assalomu alaykum, hurmatli olimlar. Bugungi mavzu: "${diseaseName}" kasalligi uchun inqilobiy davo choralarini topish. Marhamat, dastlabki g'oyalaringizni taqdim eting.`);
        await sleep(1500);

        // Round 1: Initial Ideas
        onProgress({ type: 'status', message: "Dastlabki g'oyalar to'planmoqda..." });
        professors.forEach(model => startThinking(model));
        
        const initialPromises = professors.map(async (model) => {
            const professorName = AI_MODEL_CONFIG[model].name;
            const prompt = createResearchInitialPrompt(diseaseName, professorName);
            const response = await callAI(prompt, null);
            addMessage(model, response);
        });
        await Promise.all(initialPromises);
        
        // Debate Round
        onProgress({ type: 'status', message: "G'oyalar muhokamasi..." });
        await sleep(2000);

        const challengePrompt = createOrchestratorChallengePrompt(getHistoryAsString());
        const challenge = await callAI(challengePrompt, null);
        addMessage(AIModelEnum.SYSTEM, challenge);
        await sleep(2000);
        
        professors.forEach(model => startThinking(model, "Qarshi fikr bildirmoqda..."));

        const debatePromises = professors.map(async (model) => {
            const professorName = AI_MODEL_CONFIG[model].name;
            const debatePrompt = createResearchDebatePrompt(getHistoryAsString(), challenge, professorName);
            const response = await callAI(debatePrompt, null);
            addMessage(model, response);
        });
        await Promise.all(debatePromises);

        // Final Report with Google Search
        onProgress({ type: 'status', message: "Yakuniy hisobot uchun Google Qidiruv orqali ma'lumotlar to'planmoqda..." });
        addMessage(AIModelEnum.SYSTEM, "Ajoyib munozara! Endi barcha g'oyalarni sintez qilib, eng so'nggi ilmiy adabiyotlar bilan solishtirib, yakuniy hisobotni tayyorlaymiz.");
        await sleep(2000);
        startThinking(AIModelEnum.SYSTEM, "Internetdan ilmiy manbalarni qidirmoqda va hisobotni shakllantirmoqda...");

        const finalReportPrompt = createResearchFinalReportPrompt(diseaseName, getHistoryAsString());
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: finalReportPrompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        
        const sources = parseSourcesFromGroundingMetadata(response);
        const reportText = response.text;
        
        if (!reportText) {
            throw new Error("Google Qidiruvdan ma'lumot olishda xatolik yuz berdi yoki bo'sh javob qaytdi.");
        }
        
        const finalReport = parseTextToResearchReport(reportText, diseaseName, sources);
        
        addMessage(AIModelEnum.SYSTEM, "Ilmiy-tadqiqot hisoboti tayyor. Quyida tanishishingiz mumkin.");
        onProgress({ type: 'report', data: finalReport });
        onProgress({ type: 'status', message: 'Tadqiqot yakunlandi.' });

    } catch (e: any) {
        console.error("Research Debate Error:", e);
        onProgress({ type: 'error', message: e.message || 'Tadqiqot davomida noma\'lum xatolik yuz berdi.' });
    }
};
