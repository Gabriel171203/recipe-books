import { View, FlatList, ActivityIndicator, StyleSheet, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback, memo } from 'react';
import { getRecipes, searchRecipes, getRecipesByCategory } from '../../services/api';
import RecipeCard from '../../components/RecipeCard';
import { Recipe } from '../../types/recipe';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SettingsModal from '../../components/SettingsModal';

const CATEGORIES = ['All', 'Breakfast', 'Chicken', 'Dessert', 'Seafood', 'Vegetarian'];

// Separate Header component to prevent keyboard from closing on re-render
const HomeHeader = memo(({
    searchQuery,
    handleSearch,
    triggerSearch,
    selectedCategory,
    handleCategoryPress,
    onOpenSettings
}: any) => {
    return (
        <View style={styles.headerContainer}>
            <View style={styles.welcomeContainer}>
                <View>
                    <Text style={styles.welcomeText}>Hello, Chef! 👋</Text>
                    <Text style={styles.subtitleText}>What do you want to cook today?</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.profileButton} onPress={onOpenSettings}>
                        <Ionicons name="person-circle" size={40} color="#ff7a18" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search your favorite recipes..."
                        style={styles.searchInput}
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={handleSearch}
                        onSubmitEditing={triggerSearch}
                        returnKeyType="search"
                    />
                </View>
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={triggerSearch}
                    activeOpacity={0.7}
                >
                    <LinearGradient
                        colors={['#ff7a18', '#ff4d00']}
                        style={styles.searchButtonGradient}
                    >
                        <Ionicons name="search" size={22} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <View style={styles.categorySection}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => handleCategoryPress(cat)}
                            style={[
                                styles.categoryChip,
                                selectedCategory === cat && !searchQuery && styles.categoryChipActive
                            ]}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === cat && !searchQuery && styles.categoryTextActive
                            ]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <Text style={styles.sectionTitle}>
                {searchQuery ? `Results for "${searchQuery}"` :
                    selectedCategory === 'All' ? 'Popular Recipes' : `${selectedCategory} Recipes`}
            </Text>
        </View>
    );
});

export default function Home() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const router = useRouter();

    const fetchRecipes = useCallback(async (category: string, query: string) => {
        setLoading(true);
        let data: Recipe[] = [];

        try {
            if (query.trim()) {
                data = await searchRecipes(query);
            } else if (category === 'All') {
                data = await getRecipes();
            } else {
                data = await getRecipesByCategory(category);
            }
            setRecipes(data);
        } catch (error) {
            console.error('Failed to fetch recipes:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecipes('All', '');
    }, [fetchRecipes]);

    const handleCategoryPress = useCallback((category: string) => {
        setSelectedCategory(category);
        setSearchQuery(''); // Reset search when category changes
        fetchRecipes(category, '');
    }, [fetchRecipes]);

    const handleSearch = useCallback((text: string) => {
        setSearchQuery(text);
    }, []);

    const triggerSearch = useCallback(() => {
        fetchRecipes(selectedCategory, searchQuery);
    }, [fetchRecipes, selectedCategory, searchQuery]);

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={80} color="#eee" />
            <Text style={styles.emptyTitle}>No Recipes Found</Text>
            <Text style={styles.emptySubtitle}>Try searching for something else or explore other categories.</Text>
            <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    fetchRecipes('All', '');
                }}
            >
                <Text style={styles.resetButtonText}>Reset Search</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading && recipes.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff7a18" />
                <Text style={styles.loadingText}>Preparing delicious recipes...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={recipes}
                keyExtractor={(item) => item.idMeal}
                renderItem={({ item, index }) => (
                    <View>
                        <RecipeCard recipe={item} />
                    </View>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <HomeHeader
                        searchQuery={searchQuery}
                        handleSearch={handleSearch}
                        triggerSearch={() => fetchRecipes(selectedCategory, searchQuery)}
                        selectedCategory={selectedCategory}
                        handleCategoryPress={handleCategoryPress}
                        onOpenSettings={() => setIsSettingsVisible(true)}
                    />
                }
                ListEmptyComponent={!loading ? renderEmpty : null}
                refreshing={loading}
                onRefresh={() => fetchRecipes(selectedCategory, searchQuery)}
            />
            <SettingsModal
                isVisible={isSettingsVisible}
                onClose={() => setIsSettingsVisible(false)}
            />
        </View>
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
    loadingText: {
        marginTop: 15,
        color: '#ff7a18',
        fontWeight: '700',
        fontSize: 16,
    },
    listContent: {
        paddingBottom: 100, // Account for floating tab bar
    },
    headerContainer: {
        padding: 25,
        paddingTop: 15,
    },
    welcomeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileButton: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#f5f5f5',
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    subtitleText: {
        fontSize: 15,
        color: '#777',
        marginTop: 4,
        fontWeight: '500',
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 22,
        paddingHorizontal: 20,
        height: 62,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    searchButton: {
        width: 62,
        height: 62,
        borderRadius: 22,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#ff7a18',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },
    searchButtonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1a1a1a',
        fontWeight: '500',
    },
    categorySection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 18,
    },
    categoryList: {
        marginLeft: -10,
    },
    categoryChip: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 20,
        backgroundColor: '#fff',
        marginHorizontal: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#f5f5f5',
    },
    categoryChipActive: {
        backgroundColor: '#ff7a18',
        borderColor: '#ff7a18',
        elevation: 8,
        shadowColor: '#ff7a18',
        shadowOpacity: 0.2,
    },
    categoryText: {
        fontSize: 15,
        color: '#666',
        fontWeight: '700',
    },
    categoryTextActive: {
        color: '#fff',
    },
    emptyContainer: {
        padding: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginTop: 25,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#888',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
    },
    resetButton: {
        marginTop: 30,
        backgroundColor: '#ff7a18',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 22,
        elevation: 6,
        shadowColor: '#ff7a18',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    resetButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});