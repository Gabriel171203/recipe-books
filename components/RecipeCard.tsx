import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Recipe } from '../types/recipe';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getThemeByCategory } from '../services/theme';

const { width } = Dimensions.get('window');

interface RecipeCardProps {
    recipe: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
    const router = useRouter();
    const theme = getThemeByCategory(recipe.strCategory);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={() => router.push(`/recipe/${recipe.idMeal}`)}
        >
            <Image source={{ uri: recipe.strMealThumb }} style={styles.image} />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.gradient}
            />

            <View style={styles.content}>
                <View style={[styles.categoryBadge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.categoryText}>{recipe.strCategory || 'General'}</Text>
                </View>

                <Text style={styles.title} numberOfLines={2}>
                    {recipe.strMeal}
                </Text>

                <View style={styles.footer}>
                    <View style={styles.infoItem}>
                        <Ionicons name="time-outline" size={14} color="#fff" />
                        <Text style={styles.infoText}>25 min</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.infoText}>4.8</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        height: 240,
        marginHorizontal: 25,
        marginBottom: 25,
        borderRadius: 28,
        backgroundColor: '#fff',
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    image: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '75%',
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 20,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
        marginBottom: 10,
    },
    categoryText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
        lineHeight: 26,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    infoText: {
        color: '#fff',
        fontSize: 12,
        marginLeft: 4,
        fontWeight: '600',
    },
});

export default RecipeCard;

