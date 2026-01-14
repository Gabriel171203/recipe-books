import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Recipe } from '../types/recipe';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface RecipeCardProps {
    recipe: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
    const router = useRouter();

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={() => router.push(`/recipe/${recipe.idMeal}`)}
        >
            <Image source={{ uri: recipe.strMealThumb }} style={styles.image} />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
            />

            <View style={styles.content}>
                <View style={styles.categoryBadge}>
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
        height: 220,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 25,
        backgroundColor: '#fff',
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
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
        height: '70%',
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 15,
    },
    categoryBadge: {
        backgroundColor: 'rgba(255, 122, 24, 0.9)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        marginBottom: 8,
    },
    categoryText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    infoText: {
        color: '#fff',
        fontSize: 12,
        marginLeft: 4,
        fontWeight: '500',
    },
});

export default RecipeCard;

