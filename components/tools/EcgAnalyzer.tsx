import React, { useState, useRef } from 'react';
import { analyzeEcgImage } from '../../services/aiCouncilService';
import type { EcgReport } from '../../types';
import SpinnerIcon from '../icons/SpinnerIcon';
import UploadCloudIcon from '../icons/UploadCloudIcon';
import { useTranslation } from '../../hooks/useTranslation';

const EcgAnalyzer: React.FC = () => {
    const { language, t } = useTranslation();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [report, setReport] = useState<EcgReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (selectedFile: File | null) => {
        if (!selectedFile) return;

        if (selectedFile.type.startsWith('image/')) {
            setImageFile(selectedFile);
            setError(null);
            setReport(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setError(t('tool_ecg_error_only_images'));
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const handleAnalyze = async () => {
        if (!imageFile || !imagePreview) {
            setError(t('tool_ecg_error_no_image'));
            return;
        }
        setIsLoading(true);
        setError(null);
        setReport(null);
        try {
            const base64Data = imagePreview.split(',')[1];
            // FIX: Added missing 'language' argument.
            const result = await analyzeEcgImage({ base64Data, mimeType: imageFile.type }, language);
            setReport(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('tool_common_unknown_error'));
        } finally {
            setIsLoading(false);
        }
    };

    const ReportItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
        <div className="py-3 px-4 bg-slate-50 rounded-lg flex justify-between items-center border border-border-color">
            <dt className="text-sm font-medium text-text-secondary">{label}</dt>
            <dd className="text-sm font-bold text-text-primary text-right">{value || 'N/A'}</dd>
        </div>
    );

    return (
        <div className="glass-panel p-6 md:p-8">
            <h3 className="text-xl font-bold text-text-primary">{t('tool_ecg_title')}</h3>
            <p className="text-sm text-text-secondary mt-1 mb-6">{t('tool_ecg_subtitle')}</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    {!imagePreview ? (
                        <div
                            className="border-2 border-dashed border-border-color rounded-2xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all h-full flex flex-col justify-center"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                                accept="image/png, image/jpeg"
                                className="hidden"
                            />
                            <UploadCloudIcon className="mx-auto h-12 w-12 text-text-secondary" />
                            <p className="mt-2 font-semibold text-accent-color-blue">{t('view')}</p>
                            <p className="text-xs text-text-secondary">PNG / JPG</p>
                        </div>
                    ) : (
                        <div className="relative group">
                            <img src={imagePreview} alt="EKG tasviri" className="rounded-xl w-full h-auto object-contain border border-border-color" />
                            <button
                                type="button"
                                onClick={() => { setImageFile(null); setImagePreview(null); setReport(null); }}
                                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 opacity-50 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                                aria-label="Remove image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    )}
                     <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !imageFile}
                        className="w-full flex justify-center items-center gap-3 py-3 px-4 shadow-lg text-base font-bold animated-gradient-button focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-color focus:ring-accent-color-blue disabled:opacity-70 transition-all"
                    >
                        {isLoading ? (
                            <>
                                <SpinnerIcon className="w-5 h-5" />
                                {t('tool_ecg_loading')}
                            </>
                        ) : t('tool_ecg_button')}
                    </button>
                     {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </div>

                <div className="space-y-3">
                    {report ? (
                        <>
                            <dl className="space-y-2">
                                <ReportItem label={t('tool_ecg_item_rhythm')} value={report.rhythm} />
                                <ReportItem label={t('tool_ecg_item_hr')} value={report.heartRate} />
                                <ReportItem label={t('tool_ecg_item_pr')} value={report.prInterval} />
                                <ReportItem label={t('tool_ecg_item_qrs')} value={report.qrsDuration} />
                                <ReportItem label={t('tool_ecg_item_qt')} value={report.qtInterval} />
                                <ReportItem label={t('tool_ecg_item_axis')} value={report.axis} />
                            </dl>
                            <div className="p-4 bg-slate-100 rounded-lg border border-border-color">
                                <h4 className="font-semibold text-text-primary">{t('tool_ecg_morphology_title')}</h4>
                                <p className="text-sm text-text-secondary whitespace-pre-wrap">{report.morphology}</p>
                            </div>
                            <div className="p-4 bg-blue-100 rounded-lg border border-blue-200">
                                <h4 className="font-bold text-accent-color-blue">{t('tool_ecg_conclusion_title')}</h4>
                                <p className="font-semibold text-text-primary whitespace-pre-wrap">{report.interpretation}</p>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-center text-text-secondary bg-slate-50 rounded-xl border border-border-color p-4">
                            <p>{t('tool_ecg_empty_panel')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EcgAnalyzer;