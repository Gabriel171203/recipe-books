import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Dimensions,
    StatusBar,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    getFinishedRecipes,
    getAchievements,
    FinishedRecipe
} from '../services/storage';

const { width } = Dimensions.get('window');

export default function CookingDiaryScreen() {
    const router = useRouter();
    const [recipes, setRecipes] = useState<FinishedRecipe[]>([]);
    const [achievements, setAchievements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'Diary' | 'Badges'>('Diary');

    const loadData = useCallback(async () => {
        setLoading(true);
        const [finished, badges] = await Promise.all([
            getFinishedRecipes(),
            getAchievements()
        ]);
        setRecipes(finished);
        setAchievements(badges);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const renderRecipeItem = ({ item }: { item: FinishedRecipe }) => (
        <TouchableOpacity
            style={styles.recipeCard}
            onPress={() => router.push(`/recipe/${item.idMeal}`)}
        >
            <Image source={{ uri: item.strMealThumb }} style={styles.recipeImage} />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.recipeGradient}
            />
            <View style={styles.recipeInfo}>
                <Text style={styles.recipeName} numberOfLines={1}>{item.strMeal}</Text>
                <Text style={styles.recipeDate}>
                    {new Date(item.finishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderAchievement = (badge: any) => (
        <View key={badge.id} style={[styles.badgeCard, !badge.unlocked && styles.badgeLocked]}>
            <View style={[styles.badgeIconBg, !badge.unlocked && styles.badgeIconLocked]}>
                <Ionicons
                    name={badge.unlocked ? badge.icon : 'lock-closed'}
                    size={30}
                    color={badge.unlocked ? '#ff7a18' : '#ccc'}
                />
            </View>
            <View style={styles.badgeTextContent}>
                <Text style={[styles.badgeTitle, !badge.unlocked && styles.badgeTitleLocked]}>
                    {badge.title}
                </Text>
                <Text style={styles.badgeDesc}>{badge.desc}</Text>
            </View>
            {badge.unlocked && (
                <View style={styles.unlockedTag}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Stack.Screen
                options={{
                    headerTitle: "Cooking Diary 🏆",
                    headerTransparent: false,
                    headerShadowVisible: false,
                }}
            />

            <View style={styles.tabBar}>
                <TouchableOpacity
                    onPress={() => setActiveTab('Diary')}
                    style={[styles.tab, activeTab === 'Diary' && styles.activeTab]}
                >
                    <Text style={[styles.tabText, activeTab === 'Diary' && styles.activeTabText]}>Masakan Saya</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('Badges')}
                    style={[styles.tab, activeTab === 'Badges' && styles.activeTab]}
                >
                    <Text style={[styles.tabText, activeTab === 'Badges' && styles.activeTabText]}>Achievements</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#ff7a18" />
                </View>
            ) : activeTab === 'Diary' ? (
                <FlatList
                    data={recipes}
                    renderItem={renderRecipeItem}
                    keyExtractor={item => item.idMeal}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="restaurant-outline" size={80} color="#eee" />
                            <Text style={styles.emptyText}>Masakan Belum Ada</Text>
                            <Text style={styles.emptySub}>Selesaikan resep pertamamu untuk memulai diary!</Text>
                        </View>
                    }
                />
            ) : (
                <ScrollView contentContainerStyle={styles.badgeContent}>
                    <View style={styles.statsOverview}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNum}>{recipes.length}</Text>
                            <Text style={styles.statLabel}>Total Masak</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statNum}>{achievements.filter(a => a.unlocked).length}</Text>
                            <Text style={styles.statLabel}>Badges</Text>
                        </View>
                    </View>
                    {achievements.map(renderAchievement)}
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
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginRight: 15,
        borderRadius: 20,
    },
    activeTab: {
        backgroundColor: '#fff5ed',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
    },
    activeTabText: {
        color: '#ff7a18',
    },
    listContent: {
        padding: 15,
    },
    recipeCard: {
        width: (width - 45) / 2,
        height: 200,
        margin: 5,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    recipeImage: {
        width: '100%',
        height: '100%',
    },
    recipeGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
    },
    recipeInfo: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
    },
    recipeName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    recipeDate: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        marginTop: 4,
    },
    badgeContent: {
        padding: 20,
    },
    statsOverview: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 25,
        padding: 20,
        marginBottom: 25,
        alignItems: 'center',
        elevation: 2,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statNum: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#eee',
    },
    badgeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    badgeLocked: {
        opacity: 0.6,
        backgroundColor: '#f5f5f5',
    },
    badgeIconBg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff5ed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    badgeIconLocked: {
        backgroundColor: '#eee',
    },
    badgeTextContent: {
        flex: 1,
    },
    badgeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    badgeTitleLocked: {
        color: '#888',
    },
    badgeDesc: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    unlockedTag: {
        padding: 5,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    emptySub: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20,
    },
});
