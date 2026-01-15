export interface Recipe {
    idMeal: string;
    strMeal: string;
    strMealThumb: string;
    strInstructions?: string;
    strCategory?: string;
    strArea?: string;
    [key: string]: any;
}
