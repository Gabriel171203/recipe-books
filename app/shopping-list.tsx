import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Dimensions,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    getShoppingList,
    toggleShoppingItem,
    removeFromShoppingList,
    ShoppingItem,
    saveShoppingList
} from '../services/storage';

const { width, height } = Dimensions.get('window');

export default function ShoppingListScreen() {
    const router = useRouter();
    const [list, setList] = useState<ShoppingItem[]>([]);
    const [loading, setLoading] = useState(true);

    const loadList = useCallback(async () => {
        setLoading(true);
        const data = await getShoppingList();
        setList(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadList();
    }, [loadList]);

    const handleToggle = async (id: string) => {
        setList(prev => prev.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
        await toggleShoppingItem(id);
    };

    const handleDelete = async (id: string) => {
        setList(prev => prev.filter(item => item.id !== id));
        await removeFromShoppingList(id);
    };

    const handleClearCompleted = async () => {
        const remaining = list.filter(item => !item.completed);
        setList(remaining);
        await saveShoppingList(remaining);
        Alert.alert('Bersih!', 'Item yang sudah dibeli telah dihapus. ✨');
    };

    const renderItem = ({ item }: { item: ShoppingItem }) => (
        <View style={styles.itemCard}>
            <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleToggle(item.id)}
            >
                <View style={[
                    styles.checkbox,
                    item.completed && styles.checkboxChecked
                ]}>
                    {item.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
            </TouchableOpacity>

            <View style={styles.itemInfo}>
                <Text style={[
                    styles.itemName,
                    item.completed && styles.textCompleted
                ]}>
                    {item.name}
                </Text>
                <Text style={styles.itemMeasure}>{item.measure}</Text>
                <Text style={styles.recipeSource}>Source: {item.recipeName}</Text>
            </View>

            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
            >
                <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Stack.Screen
                options={{
                    headerTitle: "Daftar Belanja 🛒",
                    headerTransparent: false,
                    headerShadowVisible: false,
                    headerRight: () => (
                        <TouchableOpacity onPress={handleClearCompleted} style={styles.headerAction}>
                            <Ionicons name="sparkles-outline" size={22} color="#ff7a18" />
                        </TouchableOpacity>
                    )
                }}
            />

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#ff7a18" />
                </View>
            ) : list.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="cart-outline" size={80} color="#eee" />
                    <Text style={styles.emptyTitle}>Keranjang Kosong</Text>
                    <Text style={styles.emptySubtitle}>Pilih resep favoritmu dan tambahkan bahannya di sini!</Text>
                    <TouchableOpacity
                        style={styles.goBackBtn}
                        onPress={() => router.push('/')}
                    >
                        <LinearGradient
                            colors={['#ff7a18', '#af002d']}
                            style={styles.goBackGradient}
                        >
                            <Text style={styles.goBackText}>Cari Resep</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={list}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
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
        padding: 40,
    },
    listContent: {
        padding: 20,
    },
    headerAction: {
        marginRight: 10,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    checkboxContainer: {
        marginRight: 15,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#ff7a18',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#ff7a18',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    itemMeasure: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    recipeSource: {
        fontSize: 11,
        color: '#999',
        marginTop: 4,
        fontStyle: 'italic',
    },
    textCompleted: {
        textDecorationLine: 'line-through',
        color: '#aaa',
    },
    deleteBtn: {
        padding: 10,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#444',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20,
    },
    goBackBtn: {
        marginTop: 30,
        width: 200,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
    },
    goBackGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    goBackText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
