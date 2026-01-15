import { View, FlatList, ActivityIndicator, StyleSheet, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useEffect, useState, useCallback, memo } from 'react';
import { getRecipes, searchRecipes, getRecipesByCategory } from '../services/api';
import RecipeCard from '../components/RecipeCard';
import { Recipe } from '../types/recipe';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SettingsModal from '../components/SettingsModal';

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
                <TouchableOpacity style={styles.profileButton} onPress={onOpenSettings}>
                    <Ionicons name="person-circle-outline" size={40} color="#ff7a18" />
                </TouchableOpacity>
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
                        triggerSearch={triggerSearch}
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
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        color: '#ff7a18',
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: 20,
    },
    headerContainer: {
        padding: 20,
        paddingTop: 10,
    },
    welcomeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitleText: {
        fontSize: 14,
        color: '#888',
        marginTop: 2,
    },
    profileButton: {
        padding: 4,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 55,
        marginRight: 10,
    },
    searchButton: {
        width: 55,
        height: 55,
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#ff7a18',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    searchButtonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    categorySection: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    categoryList: {
        marginLeft: -5,
    },
    categoryChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        backgroundColor: '#f5f5f5',
        marginHorizontal: 5,
    },
    categoryChipActive: {
        backgroundColor: '#ff7a18',
    },
    categoryText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    categoryTextActive: {
        color: '#fff',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20,
    },
    resetButton: {
        marginTop: 25,
        backgroundColor: '#ff7a18',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 20,
    },
    resetButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});