import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    getMealPlans,
    saveMealPlans,
    MealItem,
    getUserPreferences
} from '../services/storage';
import { suggestMealPlan } from '../services/gemini';
import { getThemeByCategory } from '../services/theme';

const { width } = Dimensions.get('window');
const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function MealPlannerScreen() {
    const router = useRouter();
    const [selectedDay, setSelectedDay] = useState('Senin');
    const [plans, setPlans] = useState<Record<string, MealItem[]>>({});
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [userPrefs, setUserPrefs] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        const [storedPlans, prefs] = await Promise.all([
            getMealPlans(),
            getUserPreferences()
        ]);
        setPlans(storedPlans);
        setUserPrefs(prefs);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        const suggestion = await suggestMealPlan();

        if (suggestion && suggestion.days) {
            const newPlans: Record<string, MealItem[]> = {};
            suggestion.days.forEach((dayData: any) => {
                newPlans[dayData.day] = dayData.meals.map((m: any) => ({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    recipeId: '', // Ideally search for this later
                    recipeName: m.name,
                    mealType: m.type,
                    date: dayData.day, // Using day name for simplicity in this demo
                    category: m.category
                }));
            });

            setPlans(newPlans);
            await saveMealPlans(newPlans);
            Alert.alert('Sukses', 'Rencana makan mingguan Anda telah diperbarui oleh Chef AI! 🤖✨');
        } else {
            Alert.alert('Error', 'Chef AI gagal membuat rencana. Pastikan API Key Anda sudah benar di Pengaturan!');
        }
        setIsGenerating(false);
    };

    const handleRemoveMeal = async (day: string, id: string) => {
        const updatedPlans = { ...plans };
        updatedPlans[day] = updatedPlans[day].filter(m => m.id !== id);
        if (updatedPlans[day].length === 0) delete updatedPlans[day];

        setPlans(updatedPlans);
        await saveMealPlans(updatedPlans);
    };

    const renderMealCard = (meal: any) => {
        const theme = getThemeByCategory(meal.category || 'All');
        return (
            <View key={meal.id} style={styles.mealCard}>
                <View style={[styles.mealBadge, { backgroundColor: theme.secondary }]}>
                    <Text style={[styles.mealTypeText, { color: theme.text }]}>{meal.mealType}</Text>
                </View>
                <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{meal.recipeName}</Text>
                    <Text style={styles.mealCategory}>{meal.category}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => handleRemoveMeal(selectedDay, meal.id)}
                    style={styles.deleteBtn}
                >
                    <Ionicons name="close-circle-outline" size={22} color="#ccc" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Stack.Screen
                options={{
                    headerTitle: "Meal Planner AI 🗓️",
                    headerTransparent: false,
                    headerShadowVisible: false,
                }}
            />

            <View style={styles.header}>
                <View style={styles.prefsInfo}>
                    <Ionicons name="ribbon-outline" size={16} color="#ff7a18" />
                    <Text style={styles.prefsText} numberOfLines={1}>
                        Diet: {userPrefs || 'Normal'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.generateBtn}
                    onPress={handleGenerate}
                    disabled={isGenerating}
                >
                    <LinearGradient
                        colors={['#ff7a18', '#af002d']}
                        style={styles.generateGradient}
                    >
                        {isGenerating ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="sparkles" size={18} color="#fff" />
                                <Text style={styles.generateText}>Auto Planner</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <View style={styles.dayPicker}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {DAYS.map(day => (
                        <TouchableOpacity
                            key={day}
                            onPress={() => setSelectedDay(day)}
                            style={[
                                styles.dayChip,
                                selectedDay === day && styles.dayChipActive
                            ]}
                        >
                            <Text style={[
                                styles.dayText,
                                selectedDay === day && styles.dayTextActive
                            ]}>{day}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#ff7a18" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.dayTitle}>Menu Hari {selectedDay}</Text>

                    {plans[selectedDay] && plans[selectedDay].length > 0 ? (
                        plans[selectedDay].map(renderMealCard)
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={60} color="#eee" />
                            <Text style={styles.emptyText}>Belum ada rencana makan.</Text>
                            <Text style={styles.emptySub}>Klik "Auto Planner" untuk saran AI!</Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
    },
    prefsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff5ed',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        maxWidth: '50%',
    },
    prefsText: {
        fontSize: 12,
        color: '#ff7a18',
        fontWeight: 'bold',
        marginLeft: 6,
    },
    generateBtn: {
        width: 140,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
    },
    generateGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    generateText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 13,
    },
    dayPicker: {
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dayChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 8,
    },
    dayChipActive: {
        backgroundColor: '#ff7a18',
    },
    dayText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    dayTextActive: {
        color: '#fff',
    },
    content: {
        padding: 20,
    },
    dayTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    mealCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    mealBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        marginRight: 15,
    },
    mealTypeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    mealInfo: {
        flex: 1,
    },
    mealName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    mealCategory: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    deleteBtn: {
        padding: 5,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        fontWeight: 'bold',
        marginTop: 15,
    },
    emptySub: {
        fontSize: 13,
        color: '#ccc',
        marginTop: 5,
    },
});
