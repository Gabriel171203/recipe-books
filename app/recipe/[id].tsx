import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, StatusBar, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { getRecipeById } from '../../services/api';
import { Recipe } from '../../types/recipe';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeByCategory } from '../../services/theme';
import AIChatModal from '../../components/AIChatModal';

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

    useEffect(() => {
        if (id) {
            getRecipeById(id as string).then((data) => {
                setRecipe(data);
                setLoading(false);
            });
        }
    }, [id]);

    const theme = getThemeByCategory(recipe?.strCategory);

    const handleFinish = () => {
        setIsFinished(true);
        Alert.alert(
            "Masyarakat Kenyang! 🍽️",
            `Selamat! Anda baru saja menyelesaikan resep ${recipe?.strMeal}. Jangan lupa cuci piring ya! 😉`,
            [{ text: "Mantap!", style: "default" }]
        );
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
        };
    }, [timerInterval]);

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

                    <Text style={styles.sectionTitle}>Ingredients</Text>
                    <View style={styles.ingredientsList}>
                        {getIngredients().map((item, index) => (
                            <View key={index} style={styles.ingredientItem}>
                                <View style={[styles.ingredientDot, { backgroundColor: theme.primary }]} />
                                <Text style={styles.ingredientName}>{item.name}</Text>
                                <Text style={styles.ingredientMeasure}>{item.measure}</Text>
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
                                    {activeStep === index && step.toLowerCase().includes('min') && (
                                        <TouchableOpacity
                                            style={[
                                                styles.timerButton,
                                                { borderColor: theme.primary },
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
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    imageHeaderContent: {
        position: 'absolute',
        bottom: 35,
        left: 20,
        right: 20,
    },
    categoryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    categoryText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    metaText: {
        color: '#fff',
        fontSize: 14,
        marginLeft: 6,
        fontWeight: '500',
    },
    bottomCard: {
        marginTop: -30,
        backgroundColor: '#fff',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        padding: 25,
        minHeight: height * 0.6,
    },
    dragHandle: {
        width: 50,
        height: 6,
        backgroundColor: '#eee',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 25,
        padding: 20,
        marginBottom: 30,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        fontWeight: '500',
    },
    divider: {
        width: 1,
        height: 35,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 18,
    },
    ingredientsList: {
        marginBottom: 15,
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f9f9f9',
    },
    ingredientDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 15,
    },
    ingredientName: {
        flex: 1,
        fontSize: 16,
        color: '#444',
        fontWeight: '500',
    },
    ingredientMeasure: {
        fontSize: 14,
        color: '#888',
        fontWeight: '600',
    },
    timelineContainer: {
        marginTop: 10,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    timelineLeft: {
        alignItems: 'center',
        marginRight: 15,
        width: 30,
    },
    timelineDot: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    timelineDotText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    timelineLine: {
        flex: 1,
        width: 3,
        marginVertical: 4,
    },
    timelineContent: {
        flex: 1,
        paddingBottom: 30,
        paddingTop: 3,
    },
    instructionText: {
        fontSize: 16,
        color: '#555',
        lineHeight: 26,
        textAlign: 'justify',
    },
    timerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginTop: 15,
    },
    timerButtonText: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    cookButton: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        height: 65,
        borderRadius: 25,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    cookButtonFinished: {
        shadowColor: '#4CAF50',
    },
    cookButtonGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cookButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
    },
    aiFloatingButton: {
        position: 'absolute',
        bottom: 110,
        right: 20,
        height: 50,
        borderRadius: 25,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        overflow: 'hidden',
    },
    aiButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: '100%',
    },
    aiButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 14,
    },
});
