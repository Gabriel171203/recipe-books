import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Dimensions,
    StatusBar,
    ActivityIndicator,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    getShoppingList,
    toggleShoppingItem,
    removeFromShoppingList,
    ShoppingItem,
    saveShoppingList
} from '../../services/storage';

const { width } = Dimensions.get('window');

import { useFocusEffect } from 'expo-router';

export default function ShoppingListScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [list, setList] = useState<ShoppingItem[]>([]);
    const [loading, setLoading] = useState(true);

    const loadList = useCallback(async () => {
        // Only show full loader if it's the first time
        if (list.length === 0) setLoading(true);
        const data = await getShoppingList();
        setList(data || []);
        setLoading(false);
    }, [list.length]);

    useFocusEffect(
        useCallback(() => {
            loadList();
        }, [loadList])
    );

    const completedCount = useMemo(() => list.filter(item => item.completed).length, [list]);
    const progress = useMemo(() => list.length > 0 ? completedCount / list.length : 0, [list.length, completedCount]);

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
        if (remaining.length === list.length) {
            Alert.alert('Info', 'Belum ada item yang selesai dibeli.');
            return;
        }
        setList(remaining);
        await saveShoppingList(remaining);
        Alert.alert('Bersih!', 'Item yang sudah dibeli telah dihapus. ✨');
    };

    const renderItem = ({ item }: { item: ShoppingItem }) => (
        <View style={[styles.itemCard, item.completed && styles.itemCardCompleted]}>
            <TouchableOpacity
                style={styles.checkboxWrapper}
                onPress={() => handleToggle(item.id)}
                activeOpacity={0.7}
            >
                <View style={[
                    styles.circularCheckbox,
                    item.completed && styles.checkboxActive
                ]}>
                    {item.completed && <Ionicons name="checkmark-sharp" size={16} color="#fff" />}
                </View>
            </TouchableOpacity>

            <View style={styles.itemInfo}>
                <Text style={[
                    styles.itemName,
                    item.completed && styles.textCompleted
                ]}>
                    {item.name}
                </Text>
                <View style={styles.itemMeta}>
                    <Text style={styles.itemMeasure}>{item.measure}</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.recipeSource} numberOfLines={1}>{item.recipeName}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
            >
                <Ionicons name="trash-bin-outline" size={20} color={item.completed ? "#ccc" : "#ff4d4d"} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ height: insets.top, backgroundColor: '#fff' }} />

            <View style={styles.headerCard}>
                <View style={styles.headerMain}>
                    <View>
                        <Text style={styles.headerTitle}>Shopping List 🛒</Text>
                        <Text style={styles.headerSubtitle}>
                            {list.length === 0 ? 'Belum ada rencana belanja' : `${completedCount} dari ${list.length} item terbeli`}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={handleClearCompleted} style={styles.actionIcon}>
                        <Ionicons name="sparkles-sharp" size={22} color="#ff7a18" />
                    </TouchableOpacity>
                </View>

                {list.length > 0 && (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]}>
                                <LinearGradient
                                    colors={['#ff7a18', '#ff4d00']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={StyleSheet.absoluteFill}
                                />
                            </View>
                        </View>
                        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
                    </View>
                )}
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#ff7a18" />
                </View>
            ) : list.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconCircle}>
                        <Ionicons name="basket-outline" size={60} color="#ff7a18" opacity={0.3} />
                    </View>
                    <Text style={styles.emptyTitle}>Keranjang Kosong</Text>
                    <Text style={styles.emptyText}>Mulai tambahkan bahan dari resep favoritmu!</Text>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => router.push('/')}
                    >
                        <LinearGradient
                            colors={['#ff7a18', '#ff4d00']}
                            style={styles.browseGradient}
                        >
                            <Text style={styles.browseText}>Cari Bahan</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={list}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fcfcfc',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    headerCard: {
        backgroundColor: '#fff',
        paddingHorizontal: 25,
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
    headerMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    actionIcon: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#fff5ed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
    },
    progressBarBg: {
        flex: 1,
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#ff7a18',
        marginLeft: 12,
        width: 35,
    },
    listContainer: {
        padding: 20,
        paddingTop: 30,
        paddingBottom: 130,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f2f2f2',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
    },
    itemCardCompleted: {
        backgroundColor: '#fafafa',
        borderColor: 'transparent',
        opacity: 0.8,
    },
    checkboxWrapper: {
        marginRight: 16,
    },
    circularCheckbox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#ff7a18',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    checkboxActive: {
        backgroundColor: '#ff7a18',
        borderColor: '#ff7a18',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
    },
    itemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    itemMeasure: {
        fontSize: 13,
        color: '#ff7a18',
        fontWeight: '700',
    },
    dotSeparator: {
        fontSize: 13,
        color: '#ccc',
        marginHorizontal: 6,
    },
    recipeSource: {
        flex: 1,
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    textCompleted: {
        textDecorationLine: 'line-through',
        color: '#bbb',
        fontWeight: '400',
    },
    deleteButton: {
        padding: 8,
        marginLeft: 8,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        paddingBottom: 150,
    },
    emptyIconCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#fff5ed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    emptyText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 22,
    },
    browseButton: {
        marginTop: 35,
        width: 200,
        height: 54,
        borderRadius: 27,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#ff7a18',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    browseGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    browseText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
