import type { User, AnalysisRecord } from '../types';

const USERS_KEY = 'tibiy_kengash_users';
const ANALYSES_KEY = 'tibiy_kengash_analyses';
const CURRENT_USER_KEY = 'tibiy_kengash_current_user';

// --- User Management ---

const getUsers = (): Record<string, string> => {
    try {
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : {};
    } catch (e) {
        return {};
    }
};

const saveUsers = (users: Record<string, string>) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const register = (user: User): { success: boolean, message: string } => {
    const users = getUsers();
    if (users[user.phone]) {
        return { success: false, message: "Bu telefon raqami allaqachon ro'yxatdan o'tgan." };
    }
    if (!user.password) {
        return { success: false, message: "Parol kiritilishi shart." };
    }
    // In a real app, hash the password. Here we store it as is for simulation.
    users[user.phone] = user.password;
    saveUsers(users);
    return { success: true, message: "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi." };
};

export const login = (user: User): { success: boolean, message: string } => {
    const users = getUsers();
    if (!users[user.phone]) {
        return { success: false, message: "Bu telefon raqami topilmadi." };
    }
    if (users[user.phone] !== user.password) {
        return { success: false, message: "Parol noto'g'ri." };
    }
    localStorage.setItem(CURRENT_USER_KEY, user.phone);
    return { success: true, message: "Tizimga muvaffaqiyatli kirdingiz." };
};

export const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
    const phone = localStorage.getItem(CURRENT_USER_KEY);
    return phone ? { phone } : null;
};

export const getUserCount = (): number => {
    const users = getUsers();
    return Object.keys(users).length;
};


// --- Analysis Management ---

const getAllAnalyses = (): Record<string, AnalysisRecord[]> => {
    try {
        const analyses = localStorage.getItem(ANALYSES_KEY);
        return analyses ? JSON.parse(analyses) : {};
    } catch (e) {
        return {};
    }
};

const saveAllAnalyses = (analyses: Record<string, AnalysisRecord[]>) => {
    localStorage.setItem(ANALYSES_KEY, JSON.stringify(analyses));
};

export const saveAnalysis = (phone: string, record: AnalysisRecord) => {
    const allAnalyses = getAllAnalyses();
    if (!allAnalyses[phone]) {
        allAnalyses[phone] = [];
    }
    allAnalyses[phone].unshift(record); // Add to the beginning of the list
    saveAllAnalyses(allAnalyses);
};

export const getAnalyses = (phone: string): AnalysisRecord[] => {
    const allAnalyses = getAllAnalyses();
    return allAnalyses[phone] || [];
};