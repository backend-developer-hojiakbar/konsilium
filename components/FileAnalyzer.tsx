import React, { useState, useEffect } from 'react';
import SpinnerIcon from './icons/SpinnerIcon';

interface ClarificationStepProps {
    isGenerating: boolean;
    questions: string[] | null;
    onSubmit: (answers: string[]) => void;
    statusMessage: string;
    error: string | null;
}

const ClarificationStep: React.FC<ClarificationStepProps> = ({ isGenerating, questions, onSubmit, statusMessage, error }) => {
    const [answers, setAnswers] = useState<string[]>([]);

    useEffect(() => {
        if (questions) {
            // Test uchun javoblarni oldindan to'ldirish
            const defaultAnswers = [
                "Bemorning aytishicha, og'riq asosan harakatlanganda kuchayadi va tinch holatda kamayadi.",
                "Ha, so'nggi paytlarda stressli vaziyatlar ko'p bo'lgan va uyqusida ham bezovtalik bor.",
                "Yo'q, oilasida irsiy yurak kasalliklari qayd etilmagan.",
                "Ilgari bunaqa holat kuzatilmagan.",
                "Parhezga doim ham to'liq rioya qilavermaydi, ba'zida yog'li ovqatlarni iste'mol qiladi."
            ];
            // Savollar soniga mos ravishda javoblarni o'rnatish
            setAnswers(questions.map((_, i) => defaultAnswers[i] || ""));
        }
    }, [questions]);


    const handleAnswerChange = (index: number, value: string) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(answers);
    };
    
    if (isGenerating) {
        return (
             <div className="glass-panel animate-fade-in-up p-8 text-center">
                <SpinnerIcon className="w-10 h-10 mx-auto text-slate-600" />
                <p className="mt-4 font-semibold text-slate-700">{statusMessage || "Konsilium uchun qo'shimcha savollar tayyorlanmoqda..."}</p>
                <p className="text-sm text-slate-500">Iltimos, kuting.</p>
            </div>
        );
    }

    return (
        <div className="glass-panel animate-fade-in-up p-6 md:p-8">
            <div className="text-center mb-6 border-b border-slate-200 pb-6">
                 <h3 className="text-xl font-bold text-slate-800">Konsiliumning Aniqlashtiruvchi Savollari</h3>
                 <p className="text-sm text-slate-500 mt-1">Tahlilning aniqligini oshirish uchun quyidagi savollarga javob bering.</p>
            </div>

            {error && (
                <div className="p-4 mb-4 text-sm text-red-700 rounded-lg bg-red-100 border border-red-300" role="alert">
                  <span className="font-bold">Xatolik!</span> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {questions?.map((q, index) => (
                    <div key={index}>
                        <label htmlFor={`question-${index}`} className="block text-sm font-medium text-text-secondary mb-2">
                            {index + 1}. {q}
                        </label>
                        <textarea
                            id={`question-${index}`}
                            rows={3}
                            value={answers[index] || ''}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                            className="block w-full rounded-md sm:text-sm common-input focus:border-accent-color focus:ring focus:ring-blue-500/30 placeholder-slate-400 transition shadow-sm px-3 py-2"
                            placeholder="Javobingizni shu yerga yozing..."
                        />
                    </div>
                ))}

                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-bold animated-gradient-button hover:saturate-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-color focus:ring-slate-500 disabled:opacity-70 transition-all duration-300 transform hover:scale-105"
                    >
                        Konsiliumni Boshlash
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ClarificationStep;