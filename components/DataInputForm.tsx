
import React, { useState, useRef } from 'react';
import type { PatientData } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import UploadCloudIcon from './icons/UploadCloudIcon';

interface DataInputFormProps {
    isAnalyzing: boolean;
    onSubmit: (data: PatientData) => void;
}

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-text-secondary mb-2">
        {children}
    </label>
);

const commonInputClasses = "block w-full rounded-md sm:text-sm common-input focus:border-accent-color focus:ring focus:ring-blue-500/30 placeholder-slate-400 transition shadow-sm";

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className={`${commonInputClasses} px-3 py-2`} />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea {...props} rows={4} className={`${commonInputClasses} px-3 py-2`} />
);

const DataInputForm: React.FC<DataInputFormProps> = ({ isAnalyzing, onSubmit }) => {
    const [formData, setFormData] = useState<Omit<PatientData, 'image'>>({
        firstName: 'Alisher',
        lastName: 'Valiyev',
        age: '55',
        gender: 'male',
        complaints: "Oxirgi 3 kun ichida o'ng ko'krak qafasida sanchiqli og'riq, kuchli yo'tal, yashil rangli balg'am ajralishi, hansirash va yuqori tana harorati.",
        history: "10 kun oldin shamollagan. 30 yildan beri chekadi (kuniga 1 quti). Surunkali kasalliklari yo'q.",
        objectiveData: "Umumiy ahvoli o'rta og'ir. Tana harorati 38.9°C. Nafas olish soni minutiga 28. O'ng o'pkaning pastki qismida perkutor tovushning bo'g'iqlashishi va auskultatsiyada mayda pufakchali nam xirillashlar eshitiladi.",
        labResults: "Qon tahlili: Leykotsitlar - 18.0 x 10^9/l, neytrofillar - 85%. ECHT - 50 mm/soat. Ko'krak qafasi rentgeni: o'ng o'pkaning pastki bo'lagida intensiv infiltratsiya soyasi aniqlangan.",
        allergies: 'Penitsillinga allergiya mavjud.',
        currentMedications: 'Qon bosimiga qarshi Lisinopril qabul qiladi.',
        familyHistory: 'Otasi 60 yoshida miokard infarktidan vafot etgan.'
    });
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (selectedFile: File | null) => {
        if (!selectedFile) return;
        
        if (selectedFile.type.startsWith('image/')) {
            setImageFile(selectedFile);
            setFileError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setFileError("Iltimos, faqat rasm fayllarini (JPG, PNG) yuklang.");
            setImageFile(null);
            setImagePreview(null);
        }
    };
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileChange(e.target.files ? e.target.files[0] : null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        handleFileChange(e.dataTransfer.files ? e.dataTransfer.files[0] : null);
    };
    
    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let fullPatientData: PatientData = { ...formData };
        
        if (imagePreview && imageFile) {
            fullPatientData.image = {
                base64Data: imagePreview.split(',')[1],
                mimeType: imageFile.type,
            };
        }
        
        onSubmit(fullPatientData);
    };

    const handleEHRImport = () => {
        setFormData({
            firstName: 'Karima',
            lastName: 'Azizova',
            age: '68',
            gender: 'female',
            complaints: 'So\'nggi 3 hafta ichida kuchayib borayotgan hansirash va ko\'krakda og\'riq. Kechalari yostiq bilan uxlashga majbur.',
            history: '15 yillik gipertoniya kasalligi, qandli diabet 2-turi. 5 yil oldin miokard infarktini o\'tkazgan.',
            objectiveData: 'Oyoqlarida shishlar. O\'pkada nam xirillashlar eshitiladi. Yurak tonlari bo\'g\'iqlashgan.',
            labResults: 'EKG: Yurak chap qorinchasi gipertrofiyasi belgilari. Qonda NT-proBNP darajasi keskin oshgan.',
            allergies: '',
            currentMedications: 'Aspirin, Metformin, Atorvastatin',
            familyHistory: 'Onasida qandli diabet bo\'lgan.',
        });
        setImageFile(null);
        setImagePreview(null);
    };

    return (
        <div className="glass-panel animate-fade-in-up">
            <div className="p-6 md:p-8">
                <div className="text-center mb-6 border-b border-slate-200 pb-6">
                    <h3 className="text-lg font-semibold text-slate-700">Bemor ma'lumotlarini kiriting</h3>
                    <p className="text-sm text-slate-500 mt-1">Yoki mavjud tizimdan ma'lumotlarni avtomatik yuklang</p>
                    <button
                        type="button"
                        onClick={handleEHRImport}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-100/50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M4 12h16M4 20v-5h5" /></svg>
                        EHR/EMR'dan Import Qilish
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <Label htmlFor="firstName">Bemor ismi</Label>
                            <Input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleChange} required />
                        </div>
                         <div>
                            <Label htmlFor="lastName">Bemor familiyasi</Label>
                            <Input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleChange} required />
                        </div>
                        <div>
                            <Label htmlFor="age">Yoshi</Label>
                            <Input type="number" name="age" id="age" value={formData.age} onChange={handleChange} required />
                        </div>
                        <div>
                            <Label htmlFor="gender">Jinsi</Label>
                            <select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className={commonInputClasses}
                            >
                                <option value="">Tanlang...</option>
                                <option value="male">Erkak</option>
                                <option value="female">Ayol</option>
                                <option value="other">Boshqa</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="complaints">Shikoyatlar va Anamnez</Label>
                        <Textarea name="complaints" id="complaints" value={formData.complaints} onChange={handleChange} required />
                    </div>
                     <div>
                        <Label htmlFor="history">Kasallik tarixi</Label>
                        <Textarea name="history" id="history" value={formData.history} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="allergies">Allergiyalar</Label>
                        <Textarea name="allergies" id="allergies" value={formData.allergies} onChange={handleChange} placeholder="Mavjud bo'lsa kiriting..." />
                    </div>
                     <div>
                        <Label htmlFor="currentMedications">Qabul qilayotgan dorilar</Label>
                        <Textarea name="currentMedications" id="currentMedications" value={formData.currentMedications} onChange={handleChange} placeholder="Mavjud bo'lsa kiriting..." />
                    </div>
                     <div>
                        <Label htmlFor="familyHistory">Oilaviy anamnez</Label>
                        <Textarea name="familyHistory" id="familyHistory" value={formData.familyHistory} onChange={handleChange} placeholder="Mavjud bo'lsa kiriting..." />
                    </div>

                    <div>
                        <Label htmlFor="objectiveData">Ob'ektiv Ko'rik Ma'lumotlari</Label>
                        <Textarea name="objectiveData" id="objectiveData" value={formData.objectiveData} onChange={handleChange} />
                    </div>

                    <div>
                        <Label htmlFor="labResults">Laborator va Instrumental Tahlillar</Label>
                        <Textarea name="labResults" id="labResults" value={formData.labResults} onChange={handleChange} />
                    </div>

                    <div>
                        <Label htmlFor="imageUpload">Tibbiy hujjat tasviri (Ixtiyoriy)</Label>
                        {!imagePreview ? (
                            <div 
                                className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/png, image/jpeg"
                                    className="hidden"
                                />
                                <UploadCloudIcon className="mx-auto h-10 w-10 text-slate-400" />
                                <p className="mt-2 font-semibold text-blue-600">Faylni shu yerga tashlang yoki tanlang</p>
                                <p className="text-xs text-slate-400">PNG yoki JPG</p>
                            </div>
                        ) : (
                             <div className="relative group">
                                 <img src={imagePreview} alt="Tahlil natijasi" className="rounded-lg max-h-[40vh] w-auto mx-auto object-contain border border-slate-200" />
                                 <button 
                                    type="button" 
                                    onClick={handleRemoveImage}
                                    className="absolute top-2 right-2 bg-white/70 text-slate-800 rounded-full p-1.5 opacity-50 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                                    aria-label="Remove image"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                 </button>
                            </div>
                        )}
                        {fileError && <p className="text-red-600 text-sm mt-2">{fileError}</p>}
                    </div>
                    
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isAnalyzing}
                            className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-bold animated-gradient-button hover:saturate-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-color focus:ring-slate-500 disabled:opacity-70 transition-all duration-300 transform hover:scale-105"
                        >
                            {isAnalyzing ? (
                                <>
                                    <SpinnerIcon className="w-5 h-5" />
                                    Tahlil qilinmoqda...
                                </>
                            ) : (
                                "Tahlilni Boshlash"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DataInputForm;