import AsyncStorage from '@react-native-async-storage/async-storage';

const GEMINI_KEY_STORAGE = '@gemini_api_key';
const USER_PREFERENCES_STORAGE = '@user_preferences';
const CHAT_HISTORY_PREFIX = '@chat_history_';
const SHOPPING_LIST_STORAGE = '@shopping_list';
const MEAL_PLAN_STORAGE = '@meal_plan';
const FINISHED_RECIPES_STORAGE = '@finished_recipes';

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

export const saveUserPreferences = async (prefs: string) => {
    try {
        await AsyncStorage.setItem(USER_PREFERENCES_STORAGE, prefs);
        return true;
    } catch (error) {
        console.error('Error saving User Preferences:', error);
        return false;
    }
};

export const getUserPreferences = async () => {
    try {
        const prefs = await AsyncStorage.getItem(USER_PREFERENCES_STORAGE);
        return prefs || '';
    } catch (error) {
        console.error('Error getting User Preferences:', error);
        return '';
    }
};

export const saveChatHistory = async (recipeId: string, messages: any[]) => {
    try {
        await AsyncStorage.setItem(`${CHAT_HISTORY_PREFIX}${recipeId}`, JSON.stringify(messages));
        return true;
    } catch (error) {
        console.error('Error saving Chat History:', error);
        return false;
    }
};

export const getChatHistory = async (recipeId: string) => {
    try {
        const history = await AsyncStorage.getItem(`${CHAT_HISTORY_PREFIX}${recipeId}`);
        return history ? JSON.parse(history) : null;
    } catch (error) {
        console.error('Error getting Chat History:', error);
        return null;
    }
};

export interface ShoppingItem {
    id: string;
    name: string;
    measure: string;
    recipeId: string;
    recipeName: string;
    completed: boolean;
}

export const getShoppingList = async (): Promise<ShoppingItem[]> => {
    try {
        const list = await AsyncStorage.getItem(SHOPPING_LIST_STORAGE);
        return list ? JSON.parse(list) : [];
    } catch (error) {
        console.error('Error getting Shopping List:', error);
        return [];
    }
};

export const saveShoppingList = async (list: ShoppingItem[]) => {
    try {
        await AsyncStorage.setItem(SHOPPING_LIST_STORAGE, JSON.stringify(list));
        return true;
    } catch (error) {
        console.error('Error saving Shopping List:', error);
        return false;
    }
};

export const addToShoppingList = async (item: Omit<ShoppingItem, 'completed'>) => {
    try {
        const currentList = await getShoppingList();
        // Avoid duplicates
        const exists = currentList.find(i => i.name === item.name && i.recipeId === item.recipeId);
        if (exists) return true;

        const updatedList = [...currentList, { ...item, completed: false }];
        return await saveShoppingList(updatedList);
    } catch (error) {
        console.error('Error adding to Shopping List:', error);
        return false;
    }
};

export const toggleShoppingItem = async (itemId: string) => {
    try {
        const currentList = await getShoppingList();
        const updatedList = currentList.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        return await saveShoppingList(updatedList);
    } catch (error) {
        console.error('Error toggling Shopping Item:', error);
        return false;
    }
};

export const removeFromShoppingList = async (itemId: string) => {
    try {
        const currentList = await getShoppingList();
        const updatedList = currentList.filter(item => item.id !== itemId);
        return await saveShoppingList(updatedList);
    } catch (error) {
        console.error('Error removing from Shopping List:', error);
        return false;
    }
};

export interface MealItem {
    id: string;
    recipeId: string;
    recipeName: string;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    date: string; // YYYY-MM-DD
}

export const getMealPlans = async (): Promise<Record<string, MealItem[]>> => {
    try {
        const plans = await AsyncStorage.getItem(MEAL_PLAN_STORAGE);
        return plans ? JSON.parse(plans) : {};
    } catch (error) {
        console.error('Error getting Meal Plans:', error);
        return {};
    }
};

export const saveMealPlans = async (plans: Record<string, MealItem[]>) => {
    try {
        await AsyncStorage.setItem(MEAL_PLAN_STORAGE, JSON.stringify(plans));
        return true;
    } catch (error) {
        console.error('Error saving Meal Plans:', error);
        return false;
    }
};

export const addToMealPlan = async (item: MealItem) => {
    try {
        const plans = await getMealPlans();
        const datePlans = plans[item.date] || [];

        // Avoid duplicate recipes on the same day/mealtype
        const exists = datePlans.find(i => i.recipeId === item.recipeId && i.mealType === item.mealType);
        if (exists) return true;

        plans[item.date] = [...datePlans, item];
        return await saveMealPlans(plans);
    } catch (error) {
        console.error('Error adding to Meal Plan:', error);
        return false;
    }
};

export const removeFromMealPlan = async (date: string, itemId: string) => {
    try {
        const plans = await getMealPlans();
        if (!plans[date]) return true;

        plans[date] = plans[date].filter(item => item.id !== itemId);
        if (plans[date].length === 0) delete plans[date];

        return await saveMealPlans(plans);
    } catch (error) {
        console.error('Error removing from Meal Plan:', error);
        return false;
    }
};

export interface FinishedRecipe {
    idMeal: string;
    strMeal: string;
    strMealThumb: string;
    strCategory: string;
    finishedAt: string;
}

export const getFinishedRecipes = async (): Promise<FinishedRecipe[]> => {
    try {
        const data = await AsyncStorage.getItem(FINISHED_RECIPES_STORAGE);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting Finished Recipes:', error);
        return [];
    }
};

export const markRecipeAsFinished = async (recipe: any) => {
    try {
        const finishedList = await getFinishedRecipes();
        // Avoid duplicate entries for the same recipe
        if (finishedList.find(r => r.idMeal === recipe.idMeal)) return true;

        const newEntry: FinishedRecipe = {
            idMeal: recipe.idMeal,
            strMeal: recipe.strMeal,
            strMealThumb: recipe.strMealThumb,
            strCategory: recipe.strCategory,
            finishedAt: new Date().toISOString()
        };

        const updatedList = [newEntry, ...finishedList];
        await AsyncStorage.setItem(FINISHED_RECIPES_STORAGE, JSON.stringify(updatedList));
        return true;
    } catch (error) {
        console.error('Error marking recipe as finished:', error);
        return false;
    }
};

export const getAchievements = async () => {
    const finishedList = await getFinishedRecipes();
    const count = finishedList.length;

    const achievements = [
        {
            id: 'junior_chef',
            title: 'Junior Chef',
            desc: 'Selesaikan 1 resep',
            icon: 'star',
            unlocked: count >= 1
        },
        {
            id: 'steady_cook',
            title: 'Steady Cook',
            desc: 'Selesaikan 5 resep',
            icon: 'flame',
            unlocked: count >= 5
        },
        {
            id: 'master_chef',
            title: 'Seafood Master',
            desc: 'Selesaikan 3 resep Seafood',
            icon: 'water',
            unlocked: finishedList.filter(r => r.strCategory === 'Seafood').length >= 3
        },
        {
            id: 'veggie_warrior',
            title: 'Vegetarian Warrior',
            desc: 'Selesaikan 3 resep Vegetarian',
            icon: 'leaf',
            unlocked: finishedList.filter(r => r.strCategory === 'Vegetarian').length >= 3
        },
        {
            id: 'sweet_tooth',
            title: 'Dessert King',
            desc: 'Selesaikan 3 resep Dessert',
            icon: 'ice-cream',
            unlocked: finishedList.filter(r => r.strCategory === 'Dessert').length >= 3
        }
    ];

    return achievements;
};
