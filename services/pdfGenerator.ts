

import { jsPDF } from "jspdf";
import type { FinalReport, PatientData } from '../types';

export const generatePdfReport = (
    report: FinalReport, 
    patientData: PatientData, 
    followUpHistory: { question: string, answer: string }[]
) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let y = margin;

    // --- Helper Functions ---
    const addHeader = (text: string) => {
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(text, margin, y);
        y += 8;
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
    };

    const addSectionTitle = (text: string) => {
        if (y > pageHeight - 40) {
            doc.addPage();
            y = margin;
        }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235); // blue-600
        doc.text(text, margin, y);
        y += 7;
    };

    const addText = (text: string, isListItem = false) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85); // slate-700
        
        const splitText = doc.splitTextToSize(text, pageWidth - margin * 2 - (isListItem ? 5 : 0));
        
        splitText.forEach((line: string, index: number) => {
            if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            let lineX = margin;
            if (isListItem) {
                lineX += 5;
                if (index === 0) {
                    doc.text('•', margin, y);
                }
            }
            doc.text(line, lineX, y);
            y += 6;
        });
        y += (isListItem ? 2 : 4);
    };
    
    const addKeyValue = (key: string, value: string) => {
        if (!value) return;
        doc.setFont('helvetica', 'bold');
        addText(`${key}:`, false);
        y -= 4; // move cursor back up
        doc.setFont('helvetica', 'normal');
        
        const valueX = margin + doc.getTextWidth(`${key}: `) + 2;
        const splitValue = doc.splitTextToSize(value, pageWidth - valueX - margin);

        doc.text(splitValue, valueX, y);
        y += 6 * splitValue.length;
        y += 2;
    };
    
    // --- Page 1: Title and Patient Info ---
    addHeader("KONSILIUM: Yakuniy Klinik Xulosa");

    addSectionTitle("Bemor Ma'lumotlari");
    addKeyValue("Bemor", `${patientData.firstName} ${patientData.lastName}`);
    addKeyValue("Yoshi", patientData.age);
    addKeyValue("Jinsi", patientData.gender === 'male' ? 'Erkak' : patientData.gender === 'female' ? 'Ayol' : 'Boshqa');
    y += 5;
    addKeyValue("Shikoyatlar va Anamnez", patientData.complaints);
    y += 5;
    addKeyValue("Kasallik Tarixi", patientData.history);
    y += 5;
    addKeyValue("Ob'ektiv Ko'rik", patientData.objectiveData);
    y += 5;
    addKeyValue("Laborator Tahlillar", patientData.labResults);
    
    // --- Main Report Sections ---
    doc.addPage();
    y = margin;
    addHeader("Konsilium Konsensusi");

    addSectionTitle("Eng Ehtimolli Tashxis(lar)");
    report.consensusDiagnosis.forEach(diag => {
        addKeyValue("Tashxis", `${diag.name} (${diag.probability}%)`);
        addKeyValue("Dalillilik Darajasi", diag.evidenceLevel || "N/A");
        addKeyValue("Asoslash", diag.justification);
        y += 5;
    });
    
    if (report.pharmacologicalWarnings && report.pharmacologicalWarnings.length > 0) {
        addSectionTitle("Farmakologik Ogohlantirishlar");
        report.pharmacologicalWarnings.forEach(warning => {
            addKeyValue("Dori juftligi/guruh", warning.name);
            addKeyValue("Ogohlantirish", warning.warning);
            y += 3;
        });
        y += 5;
    }

    addSectionTitle("Tavsiya Etilgan Davolash Rejasi");
    report.treatmentPlan.forEach(step => addText(step, true));
    
    y += 5;
    addSectionTitle("Dori-Darmonlar bo'yicha Tavsiyalar");
    report.medicationRecommendations.forEach(med => {
        addKeyValue("Nomi", med.name);
        addKeyValue("Doza", med.dosage);
        addKeyValue("Izoh", med.notes);
        y += 3;
    });

    if(report.unexpectedFindings) {
        y += 5;
        addSectionTitle("Kutilmagan Bog'liqliklar va Gipotezalar");
        addText(report.unexpectedFindings);
    }
    
    y += 5;
    addSectionTitle("Inkor Etilgan Gipotezalar");
    report.rejectedHypotheses.forEach(hyp => {
        addKeyValue("Gipoteza", hyp.name);
        addKeyValue("Rad etish sababi", hyp.reason);
        y+= 3;
    });

    y += 5;
    addSectionTitle("Tavsiya Etiladigan Qo'shimcha Tekshiruvlar");
    report.recommendedTests.forEach(test => addText(test, true));

    // --- Follow-up Q&A Section ---
    if (followUpHistory.length > 0) {
        if (y > pageHeight - 60) {
             doc.addPage();
             y = margin;
        } else {
            y += 10;
        }
        addHeader("Konsilium bilan Savol-Javob Sessiyasi");
        
        followUpHistory.forEach(item => {
            if (y > pageHeight - 40) {
                doc.addPage();
                y = margin;
            }
            addSectionTitle("Sizning savolingiz:");
            addText(item.question);
            y += 2;
            addSectionTitle("Konsilium Raisi javobi:");
            addText(item.answer);
            y += 10;
        });
    }

    // --- Footer ---
    const pageCount = doc.internal.pages.length;
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175); // gray-400
        const footerText = `Ushbu hisobot ilg'or raqamli tizim yordamida shakllantirilgan va faqat ma'lumot uchun mo'ljallangan. U professional tibbiy maslahat o'rnini bosa olmaydi.`;
        doc.text(footerText, margin, pageHeight - 10);
        doc.text(`Sahifa ${i} / ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // --- Save the PDF ---
    doc.save(`Tibbiy_Xulosa_${patientData.lastName}_${patientData.firstName}.pdf`);
};
