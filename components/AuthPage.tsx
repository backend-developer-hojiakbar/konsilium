import React, { useState } from 'react';
import apiService from '../services/apiService';
import type { User } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import { useTranslation } from '../hooks/useTranslation';

interface AuthPageProps {
    onLoginSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
    const { t } = useTranslation();
    const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
    const [phone, setPhone] = useState('+998947430912');
    const [password, setPassword] = useState('19980912');
    const [name, setName] = useState('Standart Foydalanuvchi');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            if (mode === 'login') {
                const user = await apiService.auth.login(phone, password);
                onLoginSuccess(user);
            } else { // Register mode
                await apiService.auth.register(phone, name, password);
                setMessage("Ro'yxatdan o'tish muvaffaqiyatli yakunlandi. Endi tizimga kirishingiz mumkin.");
                setMode('login');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Noma\'lum xatolik yuz berdi.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');
        try {
            setMessage("Agar ushbu raqam uchun hisob mavjud bo'lsa, tiklash yo'riqnomasi yuborildi.");
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Noma\'lum xatolik yuz berdi.');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-bg-color flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full animate-fade-in-up">
                 <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-transparent bg-clip-text animated-gradient-text">
                        {t('appName')}
                    </h1>
                    <p className="mt-2 text-lg text-text-secondary max-w-sm mx-auto">
                       {t('auth_title')}
                    </p>
                </div>
                <div className="glass-panel p-8">
                    <h2 className="text-2xl font-bold text-text-primary text-center mb-2">
                        {mode === 'login' && t('auth_login_title')}
                        {mode === 'register' && t('auth_register_title')}
                        {mode === 'forgot' && t('auth_forgot_title')}
                    </h2>
                    <p className="text-center text-text-secondary text-sm mb-6">
                        {mode === 'login' && t('auth_login_subtitle')}
                        {mode === 'register' && t('auth_register_subtitle')}
                        {mode === 'forgot' && t('auth_forgot_subtitle')}
                    </p>

                    <form onSubmit={mode === 'forgot' ? handleResetRequest : handleAuthSubmit} className="space-y-6">
                        {mode === 'register' && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                                    {t('auth_fullname_label')}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full sm:text-sm common-input"
                                    required
                                    placeholder={t('auth_fullname_placeholder')}
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-2">
                                {t('auth_phone_label')}
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="block w-full sm:text-sm common-input"
                                required
                                placeholder={t('auth_phone_placeholder')}
                            />
                        </div>
                        {mode !== 'forgot' && (
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                                    {t('auth_password_label')}
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full sm:text-sm common-input"
                                    required
                                />
                            </div>
                        )}
                        
                        {mode === 'login' && (
                             <div className="text-right text-sm -mt-2">
                                <button
                                    type="button"
                                    onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                                    className="font-medium text-accent-color-blue hover:text-accent-color-cyan transition-colors"
                                >
                                    {t('auth_forgot_password_link')}
                                </button>
                            </div>
                        )}

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        {message && <p className="text-green-500 text-sm text-center">{message}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center gap-3 py-3 px-4 shadow-lg text-base font-bold animated-gradient-button focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-color focus:ring-accent-color-blue disabled:opacity-70 transition-all duration-300 transform hover:scale-105"
                            >
                                {isLoading ? (
                                    <>
                                        <SpinnerIcon className="w-5 h-5" />
                                        <span>
                                            {mode === 'login' && t('auth_logging_in')}
                                            {mode === 'register' && t('auth_creating_account')}
                                            {mode === 'forgot' && t('auth_sending_code')}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        {mode === 'login' && t('auth_login_button')}
                                        {mode === 'register' && t('auth_register_button')}
                                        {mode === 'forgot' && t('auth_reset_button')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                    <div className="text-center mt-6">
                       <button onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); setMessage(''); }} className={`text-sm font-medium text-accent-color-blue hover:text-accent-color-cyan transition-colors ${mode === 'forgot' && 'hidden'}`}>
                            {mode === 'login' ? t('auth_no_account_prompt') : t('auth_have_account_prompt')}
                        </button>
                         <button onClick={() => { setMode('login'); setError(''); setMessage(''); }} className={`text-sm font-medium text-accent-color-blue hover:text-accent-color-cyan transition-colors ${mode !== 'forgot' && 'hidden'}`}>
                            {t('auth_back_to_login')}
                        </button>
                    </div>
                </div>
                 <p className="text-center text-xs text-text-secondary mt-6 max-w-sm mx-auto">
                    {t('auth_disclaimer')}
                </p>
            </div>
        </div>
    );
};

export default AuthPage;