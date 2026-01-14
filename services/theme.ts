export const getThemeByCategory = (category: string = 'All') => {
    switch (category) {
        case 'Vegetarian':
        case 'Vegan':
        case 'Starter':
            return {
                primary: '#4CAF50',
                secondary: '#E8F5E9',
                text: '#1B5E20',
                gradient: ['#4CAF50', '#2E7D32']
            };
        case 'Seafood':
            return {
                primary: '#00BCD4',
                secondary: '#E0F7FA',
                text: '#006064',
                gradient: ['#00BCD4', '#0097A7']
            };
        case 'Dessert':
        case 'Sweet':
            return {
                primary: '#E91E63',
                secondary: '#FCE4EC',
                text: '#880E4F',
                gradient: ['#E91E63', '#C2185B']
            };
        case 'Beef':
        case 'Lamb':
        case 'Pork':
        case 'Goat':
            return {
                primary: '#D32F2F',
                secondary: '#FFEBEE',
                text: '#B71C1C',
                gradient: ['#D32F2F', '#C62828']
            };
        case 'Chicken':
            return {
                primary: '#FF9800',
                secondary: '#FFF3E0',
                text: '#E65100',
                gradient: ['#FF9800', '#F57C00']
            };
        case 'Pasta':
        case 'Breakfast':
            return {
                primary: '#FBC02D',
                secondary: '#FFFDE7',
                text: '#F57F17',
                gradient: ['#FBC02D', '#F9A825']
            };
        default:
            return {
                primary: '#ff7a18',
                secondary: '#fdeee3',
                text: '#bf5c12',
                gradient: ['#ff7a18', '#ff4d00']
            };
    }
};
