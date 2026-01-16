import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, StatusBar, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { getRecipeById } from '../../services/api';
import { Recipe } from '../../types/recipe';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeByCategory } from '../../services/theme';
import AIChatModal from '../../components/AIChatModal';
import * as Speech from 'expo-speech';
import { addToShoppingList, markRecipeAsFinished, getFinishedRecipes } from '../../services/storage';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = height * 0.45;

export default function RecipeDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeStep, setActiveStep] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState<number>(0);
    const [timerActiveStep, setTimerActiveStep] = useState<number | null>(null);
    const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
    const [isAIChatVisible, setIsAIChatVisible] = useState(false);
    const [speakingStep, setSpeakingStep] = useState<number | null>(null);

    useEffect(() => {
        if (id) {
            getRecipeById(id as string).then((data) => {
                setRecipe(data);
                setLoading(false);
            });
            // Check if already finished
            getFinishedRecipes().then(finishedList => {
                if (finishedList.find(r => r.idMeal === id)) {
                    setIsFinished(true);
                }
            });
        }
    }, [id]);

    const theme = getThemeByCategory(recipe?.strCategory);

    const handleFinish = async () => {
        if (!recipe) return;
        const success = await markRecipeAsFinished(recipe);
        if (success) {
            setIsFinished(true);
            Alert.alert(
                "Masyarakat Kenyang! 🍽️",
                `Selamat! Anda baru saja menyelesaikan resep ${recipe.strMeal}. Jangan lupa cuci piring ya! 😉`,
                [{ text: "Mantap!", style: "default" }]
            );
        }
    };

    const extractMinutes = (text: string) => {
        const match = text.match(/(\d+)\s*(minute|min)/i);
        return match ? parseInt(match[1]) : 0;
    };

    const startTimer = (stepIndex: number, minutes: number) => {
        if (timerInterval) clearInterval(timerInterval);

        const totalSeconds = minutes * 60;
        setTimerSeconds(totalSeconds);
        setTimerActiveStep(stepIndex);

        const interval = setInterval(() => {
            setTimerSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setTimerActiveStep(null);
                    setTimerInterval(null);
                    Alert.alert("Waktu Habis! ⏰", "Langkah memasak Anda sudah selesai waktunya.");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        setTimerInterval(interval);
    };

    const stopTimer = () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
        }
        setTimerActiveStep(null);
        setTimerSeconds(0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        return () => {
            if (timerInterval) clearInterval(timerInterval);
            Speech.stop();
        };
    }, [timerInterval]);

    const detectLanguage = (text: string): string => {
        const idKeywords = [
            'saya', 'anda', 'bisa', 'apa', 'bagaimana', 'resep', 'bahan', 'langkah',
            'masak', 'panaskan', 'tambahkan', 'siapkan', 'dan', 'yang', 'dengan'
        ];
        const lowerText = text.toLowerCase();
        const isIndonesian = idKeywords.some(word => lowerText.includes(word));
        return isIndonesian ? 'id-ID' : 'en-US';
    };

    const handleSpeak = async (text: string, index: number) => {
        const isCurrentlySpeaking = await Speech.isSpeakingAsync();

        if (speakingStep === index && isCurrentlySpeaking) {
            Speech.stop();
            setSpeakingStep(null);
            return;
        }

        setSpeakingStep(index);
        const lang = detectLanguage(text);

        Speech.speak(text, {
            language: lang,
            onDone: () => setSpeakingStep(null),
            onStopped: () => setSpeakingStep(null),
            onError: () => setSpeakingStep(null),
            pitch: 0.9,
            rate: 0.9,
        });
    };

    const handleAddIngredient = async (name: string, measure: string) => {
        if (!recipe) return;
        const success = await addToShoppingList({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name,
            measure,
            recipeId: recipe.idMeal,
            recipeName: recipe.strMeal
        });
        if (success) {
            Alert.alert('Sukses', `${name} ditambahkan ke daftar belanja! 🛒`);
        }
    };

    const handleAddAllIngredients = async () => {
        if (!recipe) return;
        const ingredients = getIngredients();
        let addedCount = 0;

        for (const item of ingredients) {
            const success = await addToShoppingList({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: item.name,
                measure: item.measure,
                recipeId: recipe.idMeal,
                recipeName: recipe.strMeal
            });
            if (success) addedCount++;
        }

        if (addedCount > 0) {
            Alert.alert('Sukses', `${addedCount} bahan ditambahkan ke daftar belanja! 🛒📦`);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff7a18" />
            </View>
        );
    }

    if (!recipe) {
        return (
            <View style={styles.container}>
                <Text>Recipe not found.</Text>
            </View>
        );
    }

    const getIngredients = () => {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = recipe[`strIngredient${i}` as keyof Recipe];
            const measure = recipe[`strMeasure${i}` as keyof Recipe];
            if (ingredient && ingredient.trim()) {
                ingredients.push({ name: ingredient, measure: measure });
            }
        }
        return ingredients;
    };

    const getSteps = () => {
        if (!recipe.strInstructions) return [];
        let steps = recipe.strInstructions
            .split(/\r?\n/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        if (steps.length === 1) {
            steps = steps[0].split(/\.\s+/).filter(s => s.trim().length > 0);
        }

        const cleanedSteps = steps.map(step => {
            return step.replace(/^(\d+[\.\)\-\s]*|step\s*\d+[\.\:\-\s]*)/i, '').trim();
        });

        return cleanedSteps.filter(step => step.length > 2 && !/^\d+$/.test(step));
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.imageContainer}>
                    <View style={styles.imageWrapper}>
                        <Image source={{ uri: recipe.strMealThumb }} style={styles.image} />
                        <LinearGradient
                            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.7)']}
                            style={styles.gradient}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.imageHeaderContent}>
                        <View style={[styles.categoryBadge, { backgroundColor: theme.primary }]}>
                            <Text style={styles.categoryText}>{recipe.strCategory}</Text>
                        </View>
                        <Text style={styles.title}>{recipe.strMeal}</Text>
                        <View style={styles.metaContainer}>
                            <View style={styles.metaItem}>
                                <Ionicons name="earth" size={16} color="#fff" />
                                <Text style={styles.metaText}>{recipe.strArea}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="time" size={16} color="#fff" />
                                <Text style={styles.metaText}>45 min</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.bottomCard}>
                    <View style={styles.dragHandle} />

                    <View style={[styles.statsContainer, { backgroundColor: theme.secondary }]}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.text }]}>{getIngredients().length}</Text>
                            <Text style={styles.statLabel}>Ingredients</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.text }]}>350</Text>
                            <Text style={styles.statLabel}>Calories</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.text }]}>Hard</Text>
                            <Text style={styles.statLabel}>Difficulty</Text>
                        </View>
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Ingredients</Text>
                        <TouchableOpacity
                            style={[styles.addAllBtn, { backgroundColor: theme.secondary }]}
                            onPress={handleAddAllIngredients}
                        >
                            <Ionicons name="cart-outline" size={16} color={theme.text} />
                            <Text style={[styles.addAllText, { color: theme.text }]}>Add All</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.ingredientsList}>
                        {getIngredients().map((item, index) => (
                            <View key={index} style={styles.ingredientItem}>
                                <View style={[styles.ingredientDot, { backgroundColor: theme.primary }]} />
                                <Text style={styles.ingredientName}>{item.name}</Text>
                                <Text style={styles.ingredientMeasure}>{item.measure}</Text>
                                <TouchableOpacity
                                    style={styles.addSingleBtn}
                                    onPress={() => handleAddIngredient(item.name, item.measure)}
                                >
                                    <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>Cooking Steps (Tap to Focus)</Text>
                    <View style={styles.timelineContainer}>
                        {getSteps().map((step, index, array) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.8}
                                onPress={() => setActiveStep(activeStep === index ? null : index)}
                                style={[
                                    styles.timelineItem,
                                    activeStep !== null && activeStep !== index && { opacity: 0.3 }
                                ]}
                            >
                                <View style={styles.timelineLeft}>
                                    <LinearGradient
                                        colors={theme.gradient as any}
                                        style={styles.timelineDot}
                                    >
                                        <Text style={styles.timelineDotText}>{index + 1}</Text>
                                    </LinearGradient>
                                    {index !== array.length - 1 && (
                                        <View style={[styles.timelineLine, { backgroundColor: theme.secondary }]} />
                                    )}
                                </View>

                                <View style={styles.timelineContent}>
                                    <Text style={[
                                        styles.instructionText,
                                        activeStep === index && { fontWeight: 'bold', fontSize: 17, color: '#000' }
                                    ]}>{step}</Text>

                                    <View style={styles.stepActions}>
                                        <TouchableOpacity
                                            style={[styles.actionIcon, speakingStep === index && { backgroundColor: theme.primary }]}
                                            onPress={() => handleSpeak(step, index)}
                                        >
                                            <Ionicons
                                                name={speakingStep === index ? "stop-circle" : "volume-high-outline"}
                                                size={18}
                                                color={speakingStep === index ? "#fff" : theme.primary}
                                            />
                                        </TouchableOpacity>

                                        {activeStep === index && step.toLowerCase().includes('min') && (
                                            <TouchableOpacity
                                                style={[
                                                    styles.timerButton,
                                                    { borderColor: theme.primary, marginTop: 0 },
                                                    timerActiveStep === index && { backgroundColor: theme.primary }
                                                ]}
                                                onPress={() => {
                                                    if (timerActiveStep === index) {
                                                        stopTimer();
                                                    } else {
                                                        const mins = extractMinutes(step);
                                                        if (mins > 0) startTimer(index, mins);
                                                    }
                                                }}
                                            >
                                                <Ionicons
                                                    name={timerActiveStep === index ? "stop-circle-outline" : "timer-outline"}
                                                    size={16}
                                                    color={timerActiveStep === index ? "#fff" : theme.primary}
                                                />
                                                <Text style={[
                                                    styles.timerButtonText,
                                                    { color: timerActiveStep === index ? "#fff" : theme.primary }
                                                ]}>
                                                    {timerActiveStep === index ? `Stop (${formatTime(timerSeconds)})` : 'Start Timer'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={{ height: 120 }} />
                </View>
            </ScrollView>

            <TouchableOpacity
                style={[styles.cookButton, isFinished && styles.cookButtonFinished]}
                onPress={handleFinish}
                disabled={isFinished}
            >
                <LinearGradient
                    colors={isFinished ? ['#4CAF50', '#2E7D32'] : theme.gradient as any}
                    style={styles.cookButtonGradient}
                >
                    <Text style={styles.cookButtonText}>
                        {isFinished ? 'Recipe Completed!' : 'Mark as Finished'}
                    </Text>
                    <Ionicons
                        name={isFinished ? "checkmark-circle" : "checkmark-circle-outline"}
                        size={20}
                        color="#fff"
                    />
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.aiFloatingButton}
                onPress={() => setIsAIChatVisible(true)}
            >
                <LinearGradient
                    colors={theme.gradient as any}
                    style={styles.aiButtonGradient}
                >
                    <Ionicons name="chatbubbles" size={24} color="#fff" />
                    <Text style={styles.aiButtonText}>Chat Chef</Text>
                </LinearGradient>
            </TouchableOpacity>

            <AIChatModal
                isVisible={isAIChatVisible}
                onClose={() => setIsAIChatVisible(false)}
                recipe={recipe}
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fcfcfc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    imageContainer: {
        height: HEADER_HEIGHT,
        width: width,
        overflow: 'hidden',
    },
    imageWrapper: {
        width: '100%',
        height: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    backButton: {
        position: 'absolute',
        top: 55,
        left: 25,
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    imageHeaderContent: {
        position: 'absolute',
        bottom: 45,
        left: 25,
        right: 25,
    },
    categoryBadge: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    categoryText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 25,
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    metaText: {
        color: '#fff',
        fontSize: 14,
        marginLeft: 6,
        fontWeight: '600',
    },
    bottomCard: {
        marginTop: -35,
        backgroundColor: '#fcfcfc',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 25,
        minHeight: height * 0.6,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#e5e5e5',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 25,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 28,
        padding: 22,
        marginBottom: 35,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
        marginTop: 5,
        fontWeight: '600',
    },
    divider: {
        width: 1,
        height: 35,
        backgroundColor: '#e0e0e0',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 0,
    },
    addAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    addAllText: {
        fontSize: 13,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    ingredientsList: {
        marginBottom: 25,
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#f5f5f5',
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f8f8',
    },
    ingredientDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 18,
    },
    ingredientName: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    ingredientMeasure: {
        fontSize: 14,
        color: '#888',
        fontWeight: '700',
        marginRight: 12,
    },
    addSingleBtn: {
        padding: 5,
    },
    timelineContainer: {
        marginTop: 15,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    timelineLeft: {
        alignItems: 'center',
        marginRight: 20,
        width: 32,
    },
    timelineDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    timelineDotText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    timelineLine: {
        flex: 1,
        width: 3,
        marginVertical: 6,
        borderRadius: 1.5,
    },
    timelineContent: {
        flex: 1,
        paddingBottom: 35,
        paddingTop: 4,
    },
    instructionText: {
        fontSize: 16,
        color: '#444',
        lineHeight: 26,
        textAlign: 'justify',
        marginBottom: 12,
    },
    stepActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 5,
    },
    actionIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        backgroundColor: '#fff',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    timerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        alignSelf: 'flex-start',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 18,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    timerButtonText: {
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 8,
    },
    cookButton: {
        position: 'absolute',
        bottom: 35,
        left: 25,
        right: 25,
        height: 68,
        borderRadius: 28,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 15,
    },
    cookButtonFinished: {
        shadowColor: '#4CAF50',
    },
    cookButtonGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cookButtonText: {
        color: '#fff',
        fontSize: 19,
        fontWeight: 'bold',
        marginRight: 12,
    },
    aiFloatingButton: {
        position: 'absolute',
        bottom: 120,
        right: 25,
        height: 56,
        borderRadius: 28,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        overflow: 'hidden',
    },
    aiButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 22,
        height: '100%',
    },
    aiButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 10,
        fontSize: 15,
    },
});
