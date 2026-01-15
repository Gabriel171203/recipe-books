import AsyncStorage from '@react-native-async-storage/async-storage';

const GEMINI_KEY_STORAGE = '@gemini_api_key';

export const saveUserGeminiKey = async (key: string) => {
    try {
        await AsyncStorage.setItem(GEMINI_KEY_STORAGE, key);
        return true;
    } catch (error) {
        console.error('Error saving Gemini Key:', error);
        return false;
    }
};

export const getUserGeminiKey = async () => {
    try {
        const key = await AsyncStorage.getItem(GEMINI_KEY_STORAGE);
        return key;
    } catch (error) {
        console.error('Error getting Gemini Key:', error);
        return null;
    }
};

export const removeUserGeminiKey = async () => {
    try {
        await AsyncStorage.removeItem(GEMINI_KEY_STORAGE);
        return true;
    } catch (error) {
        console.error('Error removing Gemini Key:', error);
        return false;
    }
};
