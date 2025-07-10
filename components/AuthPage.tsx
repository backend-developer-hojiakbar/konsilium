
import React, { useState } from 'react';
import * as authService from '../services/authService';
import type { User } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';

interface AuthPageProps {
    onLoginSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [phone, setPhone] = useState('+998901234567');
    const [password, setPassword] = useState('password123');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            if (isLoginView) {
                const result = authService.login({ phone, password });
                if (result.success) {
                    onLoginSuccess({ phone });
                } else {
                    setError(result.message);
                }
            } else {
                const result = authService.register({ phone, password });
                 if (result.success) {
                    setMessage(result.message + " Endi tizimga kirishingiz mumkin.");
                    setIsLoginView(true); // Switch to login view after successful registration
                } else {
                    setError(result.message);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Noma\'lum xatolik yuz berdi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full animate-fade-in-up">
                 <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-transparent bg-clip-text animated-gradient-text">
                        KONSILIUM
                    </h1>
                    <p className="mt-2 text-lg text-text-secondary max-w-sm mx-auto">
                        Ilg'or raqamli texnologiyalar asosidagi tibbiy ekspertiza platformasi.
                    </p>
                </div>
                <div className="glass-panel p-8">
                    <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">
                        {isLoginView ? 'Tizimga Kirish' : 'Ro\'yxatdan O\'tish'}
                    </h2>
                    <p className="text-center text-slate-500 text-sm mb-6">
                        {isLoginView ? 'Hisobingizga kiring yoki yangi hisob oching.' : 'Yangi hisob yaratish uchun ma\'lumotlarni to\'ldiring.'}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-2">
                                Telefon Raqam
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="block w-full rounded-md sm:text-sm common-input focus:border-accent-color focus:ring focus:ring-blue-500/30 placeholder-slate-400 transition shadow-sm px-3 py-2"
                                required
                                placeholder="+998 XX XXX XX XX"
                            />
                        </div>
                        <div>
                             <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                                Parol
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-md sm:text-sm common-input focus:border-accent-color focus:ring focus:ring-blue-500/30 placeholder-slate-400 transition shadow-sm px-3 py-2"
                                required
                            />
                        </div>

                        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
                        {message && <p className="text-green-600 text-sm text-center">{message}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-bold animated-gradient-button hover:saturate-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-color focus:ring-slate-500 disabled:opacity-70 transition-all duration-300 transform hover:scale-105"
                            >
                                {isLoading ? (
                                    <>
                                        <SpinnerIcon className="w-5 h-5" />
                                        {isLoginView ? 'Kirilmoqda...' : 'Yaratilmoqda...'}
                                    </>
                                ) : (
                                    isLoginView ? 'Kirish' : 'Ro\'yxatdan O\'tish'
                                )}
                            </button>
                        </div>
                    </form>
                    <div className="text-center mt-6">
                        <button onClick={() => { setIsLoginView(!isLoginView); setError(''); setMessage(''); }} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                            {isLoginView ? 'Hisobingiz yo\'qmi? Ro\'yxatdan o\'ting' : 'Hisobingiz bormi? Tizimga kiring'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
