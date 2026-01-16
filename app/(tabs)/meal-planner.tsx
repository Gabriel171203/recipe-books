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
    Alert,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    getMealPlans,
    saveMealPlans,
    MealItem,
    getUserPreferences
} from '../../services/storage';
import { suggestMealPlan } from '../../services/gemini';
import { getThemeByCategory } from '../../services/theme';

const { width } = Dimensions.get('window');
const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

import { useFocusEffect } from 'expo-router';

export default function MealPlannerScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selectedDay, setSelectedDay] = useState('Senin');
    const [plans, setPlans] = useState<Record<string, MealItem[]>>({});
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [userPrefs, setUserPrefs] = useState('');

    const loadData = useCallback(async () => {
        if (Object.keys(plans).length === 0) setLoading(true);
        const [storedPlans, prefs] = await Promise.all([
            getMealPlans(),
            getUserPreferences()
        ]);
        setPlans(storedPlans);
        setUserPrefs(prefs);
        setLoading(false);
    }, [plans]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

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
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ height: insets.top, backgroundColor: '#fff' }} />
            <View style={styles.mainHeader}>
                <View style={styles.headerTextGroup}>
                    <Text style={styles.headerTitle}>Meal Planner 🗓️</Text>
                    <View style={styles.prefsBadge}>
                        <Ionicons name="ribbon" size={12} color="#ff7a18" />
                        <Text style={styles.prefsText} numberOfLines={1}>
                            {userPrefs || 'Normal Diet'}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.generateBtn}
                    onPress={handleGenerate}
                    disabled={isGenerating}
                >
                    <LinearGradient
                        colors={['#ff7a18', '#ff4d00']}
                        style={styles.generateGradient}
                    >
                        {isGenerating ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="sparkles" size={20} color="#fff" />
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <View style={styles.dayPickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPickerScroll} contentContainerStyle={styles.dayPickerList}>
                    {DAYS.map((day, index) => {
                        const isActive = selectedDay === day;
                        const dateNum = index + 16;
                        return (
                            <TouchableOpacity
                                key={day}
                                onPress={() => setSelectedDay(day)}
                                activeOpacity={0.8}
                                style={[
                                    styles.dayChip,
                                    isActive && styles.dayChipActive
                                ]}
                            >
                                <Text style={[styles.dayName, isActive && styles.dayNameActive]}>
                                    {day.substring(0, 3).toUpperCase()}
                                </Text>
                                <Text style={[styles.dayDate, isActive && styles.dayDateActive]}>
                                    {dateNum}
                                </Text>
                                {isActive && <View style={styles.activeDot} />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#ff7a18" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.dayTitleRow}>
                        <View>
                            <Text style={styles.dayTitle}>{selectedDay}'s Menu</Text>
                            <Text style={styles.dateSubtitle}>January {DAYS.indexOf(selectedDay) + 16}, 2026</Text>
                        </View>
                        <View style={styles.itemCount}>
                            <Text style={styles.itemCountText}>
                                {(plans[selectedDay] || []).length} Menu
                            </Text>
                        </View>
                    </View>

                    {plans[selectedDay] && plans[selectedDay].length > 0 ? (
                        plans[selectedDay].map(renderMealCard)
                    ) : (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="calendar-clear-outline" size={50} color="#ff7a18" opacity={0.3} />
                            </View>
                            <Text style={styles.emptyTitleText}>No meals planned yet</Text>
                            <Text style={styles.emptySub}>Tap the AI sparkles to get a personalized plan!</Text>
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
        backgroundColor: '#fcfcfc',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    mainHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    headerTextGroup: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    prefsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff5ed',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        marginTop: 6,
        alignSelf: 'flex-start',
    },
    prefsText: {
        fontSize: 11,
        color: '#ff7a18',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    generateBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#ff7a18',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    generateGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayPickerContainer: {
        backgroundColor: '#fff',
        paddingVertical: 15,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        zIndex: 5,
    },
    dayPickerScroll: {
        marginLeft: -10,
        marginRight: -10,
    },
    dayPickerList: {
        paddingHorizontal: 25,
        paddingBottom: 5,
    },
    dayChip: {
        width: 60,
        height: 85,
        borderRadius: 22,
        backgroundColor: '#f9f9f9',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    dayChipActive: {
        backgroundColor: '#ff7a18',
        borderColor: '#ff7a18',
        elevation: 10,
        shadowColor: '#ff7a18',
        shadowOpacity: 0.3,
        shadowRadius: 15,
        transform: [{ scale: 1.05 }],
    },
    dayName: {
        fontSize: 11,
        color: '#888',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    dayNameActive: {
        color: 'rgba(255,255,255,0.8)',
    },
    dayDate: {
        fontSize: 20,
        color: '#333',
        fontWeight: '900',
    },
    dayDateActive: {
        color: '#fff',
    },
    activeDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#fff',
        marginTop: 6,
    },
    textWhite: {
        color: '#fff',
    },
    dayCircleActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dayCircleActiveOverlay: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayDateText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    dayDateTextActive: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        padding: 25,
        paddingTop: 35,
        paddingBottom: 130, // Account for tab bar
    },
    dayTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 30,
    },
    dayTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    dateSubtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 4,
    },
    itemCount: {
        backgroundColor: '#fff5ed',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    itemCountText: {
        fontSize: 12,
        color: '#ff7a18',
        fontWeight: 'bold',
    },
    mealCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 18,
        marginBottom: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: '#f5f5f5',
    },
    mealBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginRight: 18,
        minWidth: 80,
        alignItems: 'center',
    },
    mealTypeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    mealInfo: {
        flex: 1,
    },
    mealName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        lineHeight: 22,
    },
    mealCategory: {
        fontSize: 12,
        color: '#ff7a18',
        marginTop: 6,
        fontWeight: '700',
    },
    deleteBtn: {
        padding: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff5ed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
    },
    emptyTitleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    emptySub: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 22,
        paddingHorizontal: 40,
    },
});
