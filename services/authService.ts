import type { User, AnalysisRecord } from '../types';

const USERS_KEY = 'tibiy_kengash_users_v2'; // Updated key for new structure
const ANALYSES_KEY = 'tibiy_kengash_analyses';
const CURRENT_USER_KEY = 'tibiy_kengash_current_user_phone'; // Storing only phone

type UserStore = Record<string, { password: string; name: string }>;

// --- User Management ---

const getUsers = (): UserStore => {
    try {
        const usersJSON = localStorage.getItem(USERS_KEY);
        const users = usersJSON ? JSON.parse(usersJSON) : {};

        // If no users exist, create the default user
        if (Object.keys(users).length === 0) {
            const defaultUser: UserStore = {
                '+998947430912': {
                    password: '19980912',
                    name: 'Standart Foydalanuvchi'
                }
            };
            saveUsers(defaultUser);
            return defaultUser;
        }

        return users;
    } catch (e) {
        return {};
    }
};

const saveUsers = (users: UserStore) => {
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
    if (!user.name || user.name.trim().length < 3) {
        return { success: false, message: "To'liq ism kiritilishi shart." };
    }
    // In a real app, hash the password.
    users[user.phone] = { password: user.password, name: user.name.trim() };
    saveUsers(users);
    return { success: true, message: "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi." };
};

export const login = (user: User): { success: boolean, message: string } => {
    const users = getUsers();
    const storedUser = users[user.phone];
    if (!storedUser) {
        return { success: false, message: "Bu telefon raqami topilmadi." };
    }
    if (storedUser.password !== user.password) {
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
    if (!phone) {
        return null;
    }
    const users = getUsers();
    const storedUser = users[phone];
    if (!storedUser) {
        // This case can happen if user data is cleared but current user key remains
        logout();
        return null;
    }
    return { phone, name: storedUser.name };
};

export const getUserCount = (): number => {
    const users = getUsers();
    return Object.keys(users).length;
};

export const requestPasswordReset = (phone: string): { success: boolean, message: string } => {
    const users = getUsers();
    // To prevent user enumeration, always return the same success-like message
    // regardless of whether the user exists or not.
    // The actual sending logic would happen here in a real app.
    console.log(`Password reset requested for ${phone}. In a real app, an SMS would be sent.`);
    return { 
        success: true, 
        message: "Agar ushbu raqam uchun hisob mavjud bo'lsa, tiklash yo'riqnomasi yuborildi." 
    };
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

export const updateAnalysis = (phone: string, recordToUpdate: AnalysisRecord) => {
    const allAnalyses = getAllAnalyses();
    if (!allAnalyses[phone]) {
        return;
    }
    const recordIndex = allAnalyses[phone].findIndex(r => r.id === recordToUpdate.id);
    if (recordIndex > -1) {
        allAnalyses[phone][recordIndex] = recordToUpdate;
        saveAllAnalyses(allAnalyses);
    } else {
        console.warn('Yangilanishi kerak bo\'lgan yozuv topilmadi:', recordToUpdate.id);
    }
};

export const getAnalyses = (phone: string): AnalysisRecord[] => {
    const allAnalyses = getAllAnalyses();
    return allAnalyses[phone] || [];
};