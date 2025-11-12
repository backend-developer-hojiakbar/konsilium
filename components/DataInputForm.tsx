import React, { useState, useRef, useEffect } from 'react';
import type { PatientData, EmergencyTemplate, VitalSigns } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import UploadCloudIcon from './icons/UploadCloudIcon';
import { emergencyTemplates } from '../constants/emergencyTemplates';
import DocumentTextIcon from './icons/DocumentTextIcon';
import RealTimePatientMonitor from './tools/RealTimePatientMonitor';
import * as deviceService from '../services/deviceIntegrationService';
import MicrophoneIcon from './icons/MicrophoneIcon';
import { useSpeechToText } from '../hooks/useSpeechToText';
import * as aiService from '../services/aiCouncilService';
import { useTranslation } from '../hooks/useTranslation';

interface DataInputFormProps {
    isAnalyzing: boolean;
    onSubmit: (data: PatientData) => void;
}

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-text-secondary mb-2">
        {children}
    </label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string }> = ({ id, label, ...props }) => (
    <div>
        <Label htmlFor={id}>{label}</Label>
        <input id={id} {...props} className="block w-full sm:text-sm common-input" />
    </div>
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; label: string }> = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; label: string }>(({ id, label, ...props }, ref) => (
     <div>
        <Label htmlFor={id}>{label}</Label>
        <textarea id={id} {...props} className="block w-full sm:text-sm common-input" ref={ref} />
    </div>
));

const DynamicSuggestions: React.FC<{
    suggestions: { relatedSymptoms: string[], diagnosticQuestions: string[] };
    onSelect: (text: string) => void;
}> = ({ suggestions, onSelect }) => {
    const { t } = useTranslation();
    const hasSuggestions = suggestions.relatedSymptoms.length > 0 || suggestions.diagnosticQuestions.length > 0;
    if (!hasSuggestions) return null;

    return (
        <div className="p-3 bg-slate-100/50 border border-border-color rounded-lg mt-2 space-y-3 animate-fade-in-up">
            <div>
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('data_input_suggestions_symptoms')}</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                    {suggestions.relatedSymptoms.map(s => (
                        <button key={s} onClick={() => onSelect(s)} className="text-xs bg-slate-200 hover:bg-slate-300 px-2.5 py-1 rounded-full">{s}</button>
                    ))}
                </div>
            </div>
            <div>
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('data_input_suggestions_questions')}</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                    {suggestions.diagnosticQuestions.map(q => (
                        <button key={q} onClick={() => onSelect(q)} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2.5 py-1 rounded-full">{q}</button>
                    ))}
                </div>
            </div>
        </div>
    );
};


type LabEntry = { id: number; test: string; value: string; unit: string };

const DataInputForm: React.FC<DataInputFormProps> = ({ isAnalyzing, onSubmit }) => {
    const { t, language } = useTranslation();
    const [formData, setFormData] = useState<Partial<PatientData>>({
        firstName: 'Gulnora',
        lastName: 'Ahmedova',
        age: '71',
        gender: 'female',
        complaints: 'Taxminan 1 soat oldin to\'satdan nutqi buzilgan, o\'ng qo\'li va oyog\'ida zaiflik paydo bo\'lgan. Og\'zining o\'ng burchagi osilib qolgan. Savollarga javob berishga qiynalyapti. Bosh og\'rig\'i va qusish yo\'q.',
        history: 'Atrial fibrilatsiya, antikoagulyantlarni nomuntazam qabul qiladi. Gipertoniya.',
    });
    const [attachments, setAttachments] = useState<File[]>([]);
    const [structuredLabs, setStructuredLabs] = useState<LabEntry[]>([{ id: 1, test: '', value: '', unit: '' }]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isListening, transcript, startListening, stopListening } = useSpeechToText();
    const [isStructuring, setIsStructuring] = useState(false);
    const complaintsRef = useRef<HTMLTextAreaElement>(null);
    const objectiveDataRef = useRef<HTMLTextAreaElement>(null);
    const [activeDictationField, setActiveDictationField] = useState<'complaints' | 'objectiveData' | null>(null);
    const [suggestions, setSuggestions] = useState<{ relatedSymptoms: string[], diagnosticQuestions: string[] }>({ relatedSymptoms: [], diagnosticQuestions: [] });
    const suggestionTimeoutRef = useRef<number | null>(null);
    const initialTextRef = useRef('');

    useEffect(() => {
        if (isListening && activeDictationField) {
            const newText = (initialTextRef.current ? initialTextRef.current + ' ' : '') + transcript;
            handleChange(activeDictationField, newText);
        }
    }, [transcript, isListening, activeDictationField]);
    
    const handleDictate = (field: 'complaints' | 'objectiveData') => {
        if (isListening) {
            stopListening();
            setActiveDictationField(null);
        } else {
            setActiveDictationField(field);
            initialTextRef.current = formData[field] || '';
            startListening();
        }
    };
    
    const handleStructureNotes = async (field: 'complaints' | 'objectiveData') => {
        const textToStructure = formData[field];
        if (!textToStructure) return;
        setIsStructuring(true);
        try {
            const structured = await aiService.structureDictatedNotes(textToStructure, language);
            handleChange(field, structured);
        } catch (error) {
            console.error(error);
        } finally {
            setIsStructuring(false);
        }
    };

    const handleChange = (field: keyof PatientData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        if (field === 'complaints') {
            if (suggestionTimeoutRef.current) {
                clearTimeout(suggestionTimeoutRef.current);
            }
            suggestionTimeoutRef.current = window.setTimeout(() => {
                aiService.getDynamicSuggestions(value, language).then(setSuggestions);
            }, 700); // Debounce API call
        }
    };
    
    const handleSuggestionSelect = (text: string) => {
        const currentComplaints = formData.complaints || '';
        handleChange('complaints', `${currentComplaints}\n- ${text}`);
    };

     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeAttachment = (fileName: string) => {
        setAttachments(prev => prev.filter(f => f.name !== fileName));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const labResultsString = [
            formData.labResults || '',
            ...structuredLabs
                .filter(l => l.test && l.value)
                .map(l => `${l.test}: ${l.value} ${l.unit}`)
        ].join('\n').trim();

        let attachmentData: PatientData['attachments'] = [];
        if (attachments.length > 0) {
            attachmentData = await Promise.all(
                attachments.map(file => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const base64Data = (event.target?.result as string).split(',')[1];
                        resolve({ name: file.name, base64Data, mimeType: file.type });
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                }))
            );
        }

        const fullPatientData: PatientData = { 
            firstName: formData.firstName || '',
            lastName: formData.lastName || '',
            age: formData.age || '',
            gender: formData.gender || '',
            complaints: formData.complaints || '',
            ...formData,
            labResults: labResultsString,
            attachments: attachmentData,
        };
        
        onSubmit(fullPatientData);
    };
    
    const handleLabChange = (id: number, field: keyof Omit<LabEntry, 'id'>, value: string) => {
        setStructuredLabs(labs => labs.map(lab => lab.id === id ? { ...lab, [field]: value } : lab));
    };

    const addLabEntry = () => {
        setStructuredLabs(labs => [...labs, { id: Date.now(), test: '', value: '', unit: '' }]);
    };

    const removeLabEntry = (id: number) => {
        setStructuredLabs(labs => labs.filter(lab => lab.id !== id));
    };
    
     const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateName = e.target.value;
        const template = emergencyTemplates.find(t => t.name === templateName);
        if (template) {
            setFormData(template.data);
            setStructuredLabs([{ id: 1, test: '', value: '', unit: '' }]);
            if (template.data.complaints) {
                aiService.getDynamicSuggestions(template.data.complaints, language).then(setSuggestions);
            }
        }
    };

    return (
        <div className="glass-panel animate-fade-in-up">
            <div className="p-6 md:p-8">
                <div className="text-left mb-8">
                    <h3 className="text-xl font-semibold text-text-primary">{t('data_input_title')}</h3>
                    <p className="text-sm text-text-secondary mt-1">{t('data_input_subtitle')}</p>
                </div>
                
                 <div className="mb-6">
                    <Label htmlFor="template-select">{t('data_input_template_label')}</Label>
                    <select id="template-select" onChange={handleTemplateSelect} className="w-full common-input custom-select">
                        <option value="">{t('data_input_template_select')}</option>
                        {emergencyTemplates.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input id="firstName" label={t('data_input_patient_name')} type="text" value={formData.firstName || ''} onChange={e => handleChange('firstName', e.target.value)} required />
                        <Input id="lastName" label={t('data_input_patient_lastname')} type="text" value={formData.lastName || ''} onChange={e => handleChange('lastName', e.target.value)} required />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input id="age" label={t('data_input_age')} type="number" value={formData.age || ''} onChange={e => handleChange('age', e.target.value)} required />
                        <div>
                             <Label htmlFor="gender">{t('data_input_gender')}</Label>
                             <select id="gender" value={formData.gender || ''} onChange={e => handleChange('gender', e.target.value)} required className="w-full common-input custom-select">
                                <option value="">{t('data_input_gender_select')}</option>
                                <option value="male">{t('data_input_gender_male')}</option>
                                <option value="female">{t('data_input_gender_female')}</option>
                                <option value="other">{t('data_input_gender_other')}</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Textarea id="complaints" label={t('data_input_complaints_label')} placeholder={t('data_input_complaints_placeholder')} value={formData.complaints || ''} onChange={e => handleChange('complaints', e.target.value)} rows={5} required ref={complaintsRef} />
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => handleDictate('complaints')} className={`flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${isListening && activeDictationField === 'complaints' ? 'bg-red-100 text-red-600' : 'bg-slate-200/50 hover:bg-slate-200'}`}>
                                    <MicrophoneIcon className="w-4 h-4" /> {isListening && activeDictationField === 'complaints' ? t('data_input_stop_dictate') : t('data_input_dictate')}
                                </button>
                                <button type="button" onClick={() => handleStructureNotes('complaints')} disabled={isStructuring} className="flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg bg-slate-200/50 hover:bg-slate-200 transition-colors disabled:opacity-50">
                                    {isStructuring ? <SpinnerIcon className="w-4 h-4"/> : <DocumentTextIcon className="w-4 h-4 text-accent-color-blue"/> }
                                    {t('data_input_structure_notes')}
                                </button>
                                {isListening && activeDictationField === 'complaints' && (
                                    <div className="listening-indicator ml-2">
                                        <span></span><span></span><span></span><span></span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <DynamicSuggestions suggestions={suggestions} onSelect={handleSuggestionSelect} />
                    </div>

                    <Textarea id="history" label={t('data_input_history_label')} placeholder={t('data_input_history_placeholder')} value={formData.history || ''} onChange={e => handleChange('history', e.target.value)} rows={3} />
                    
                    <div className="space-y-2">
                        <Textarea id="objectiveData" label={t('data_input_objective_label')} placeholder={t('data_input_objective_placeholder')} value={formData.objectiveData || ''} onChange={e => handleChange('objectiveData', e.target.value)} rows={4} ref={objectiveDataRef}/>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => handleDictate('objectiveData')} className={`flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${isListening && activeDictationField === 'objectiveData' ? 'bg-red-100 text-red-600' : 'bg-slate-200/50 hover:bg-slate-200'}`}>
                                    <MicrophoneIcon className="w-4 h-4" /> {isListening && activeDictationField === 'objectiveData' ? t('data_input_stop_dictate') : t('data_input_dictate')}
                                </button>
                                {isListening && activeDictationField === 'objectiveData' && (
                                    <div className="listening-indicator ml-2">
                                        <span></span><span></span><span></span><span></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                     <div className="p-4 bg-slate-100/50 rounded-2xl border border-border-color space-y-4">
                        <h4 className="text-base font-semibold text-text-primary text-center">{t('data_input_labs_structured_title')}</h4>
                         {structuredLabs.map((lab) => (
                            <div key={lab.id} className="grid grid-cols-12 gap-2 items-center">
                                <input type="text" placeholder={t('data_input_labs_test_name')} value={lab.test} onChange={e => handleLabChange(lab.id, 'test', e.target.value)} className="col-span-5 common-input text-sm p-2" />
                                <input type="text" placeholder={t('data_input_labs_result')} value={lab.value} onChange={e => handleLabChange(lab.id, 'value', e.target.value)} className="col-span-3 common-input text-sm p-2" />
                                <input type="text" placeholder={t('data_input_labs_unit')} value={lab.unit} onChange={e => handleLabChange(lab.id, 'unit', e.target.value)} className="col-span-3 common-input text-sm p-2" />
                                <button type="button" onClick={() => removeLabEntry(lab.id)} className="col-span-1 text-red-500 hover:text-red-700 disabled:opacity-50 text-2xl font-bold" disabled={structuredLabs.length <= 1}>
                                    &times;
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={addLabEntry} className="text-sm font-semibold text-accent-color-blue hover:underline mt-2">
                            {t('data_input_labs_add')}
                        </button>
                    </div>

                    <Textarea id="labResults" label={t('data_input_labs_text_label')} placeholder={t('data_input_labs_text_placeholder')} value={formData.labResults || ''} onChange={e => handleChange('labResults', e.target.value)} rows={4} />
                    <Textarea id="pharmacogenomicsReport" label={t('data_input_pharmaco_label')} placeholder={t('data_input_pharmaco_placeholder')} value={formData.pharmacogenomicsReport || ''} onChange={e => handleChange('pharmacogenomicsReport', e.target.value)} rows={4}/>

                    <div>
                        <Label htmlFor="attachments">{t('data_input_attachments_label')}</Label>
                        <div onClick={() => fileInputRef.current?.click()} className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border-color border-dashed rounded-xl cursor-pointer hover:bg-slate-100/50">
                            <div className="space-y-1 text-center">
                                <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400"/>
                                <div className="flex text-sm text-gray-600">
                                    <p className="pl-1">{t('data_input_attachments_prompt')}</p>
                                </div>
                                <p className="text-xs text-gray-500">{t('data_input_attachments_info')}</p>
                            </div>
                        </div>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" ref={fileInputRef} onChange={handleFileChange} multiple />
                        {attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {attachments.map(file => (
                                    <div key={file.name} className="flex justify-between items-center bg-slate-100 p-2 rounded-md">
                                        <span className="text-sm">{file.name}</span>
                                        <button onClick={() => removeAttachment(file.name)} className="text-red-500 text-xl">&times;</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-4">
                       <button type="submit" disabled={isAnalyzing} className="w-full flex justify-center items-center gap-3 py-3 px-4 text-base font-bold animated-gradient-button focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-color focus:ring-accent-color-blue disabled:opacity-70 transition-all duration-300 transform hover:scale-105">
                            {isAnalyzing ? (
                                <>
                                    <SpinnerIcon className="w-5 h-5" />
                                    <span>{t('data_input_analyzing')}</span>
                                </>
                            ) : (
                                t('next_step')
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DataInputForm;