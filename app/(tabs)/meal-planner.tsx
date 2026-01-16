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
            <StatusBar barStyle="dark-content" />
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            <View style={styles.headerSpacer} />

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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayPickerScroll}>
                    {DAYS.map((day, index) => {
                        const isActive = selectedDay === day;
                        return (
                            <TouchableOpacity
                                key={day}
                                onPress={() => setSelectedDay(day)}
                                activeOpacity={0.7}
                                style={[
                                    styles.dayChip,
                                    isActive && styles.dayChipActive
                                ]}
                            >
                                <Text style={[styles.dayInitial, isActive && styles.textWhite]}>
                                    {day.substring(0, 3)}
                                </Text>
                                <View style={[styles.dayCircle, isActive && styles.dayCircleActive]}>
                                    <Text style={[styles.dayDateText, isActive && styles.textWhite]}>
                                        {index + 16}
                                    </Text>
                                </View>
                                {isActive && (
                                    <LinearGradient
                                        colors={['#ff7a18', '#ff4d00']}
                                        style={StyleSheet.absoluteFill}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 0, y: 1 }}
                                        border-radius={25}
                                    />
                                )}
                                {/* Re-render content over gradient if active */}
                                {isActive && (
                                    <View style={styles.chipContentOverlay}>
                                        <Text style={styles.dayInitialActive}>{day.substring(0, 3)}</Text>
                                        <View style={styles.dayCircleActiveOverlay}>
                                            <Text style={styles.dayDateTextActive}>{index + 16}</Text>
                                        </View>
                                    </View>
                                )}
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
    headerSpacer: {
        height: Platform.OS === 'ios' ? 50 : 40,
        backgroundColor: '#fff',
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
        paddingBottom: 25,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        zIndex: 10,
    },
    dayPickerScroll: {
        paddingHorizontal: 20,
    },
    dayChip: {
        width: 65,
        height: 95,
        borderRadius: 25,
        backgroundColor: '#fafafa',
        marginHorizontal: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        overflow: 'hidden',
    },
    dayChipActive: {
        borderWidth: 0,
        elevation: 8,
        shadowColor: '#ff7a18',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    chipContentOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    dayInitial: {
        fontSize: 12,
        color: '#999',
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    dayInitialActive: {
        fontSize: 12,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
        opacity: 0.8,
    },
    dayCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
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
    textWhite: {
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
