import { Recipe } from '../types/recipe';

const API_URL = 'https://www.themealdb.com/api/json/v1/1';

export const getRecipes = async (): Promise<Recipe[]> => {
    try {
        const response = await fetch(`${API_URL}/search.php?s=`);
        const data = await response.json();
        return data.meals || [];
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return [];
    }
};

export const getRecipeById = async (id: string): Promise<Recipe | null> => {
    try {
        const response = await fetch(`${API_URL}/lookup.php?i=${id}`);
        const data = await response.json();
        return data.meals ? data.meals[0] : null;
    } catch (error) {
        console.error('Error fetching recipe detail:', error);
        return null;
    }
};

export const searchRecipes = async (query: string): Promise<Recipe[]> => {
    try {
        const response = await fetch(`${API_URL}/search.php?s=${query}`);
        const data = await response.json();
        return data.meals || [];
    } catch (error) {
        console.error('Error searching recipes:', error);
        return [];
    }
};

export const getRecipesByCategory = async (category: string): Promise<Recipe[]> => {
    try {
        const response = await fetch(`${API_URL}/filter.php?c=${category}`);
        const data = await response.json();
        return data.meals || [];
    } catch (error) {
        console.error('Error fetching recipes by category:', error);
        return [];
    }
};


