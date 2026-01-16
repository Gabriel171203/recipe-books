import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: '#ff7a18',
                tabBarInactiveTintColor: '#999',
                tabBarShowLabel: true,
                tabBarLabelStyle: styles.tabBarLabel,
                tabBarBackground: () => (
                    Platform.OS === 'ios' ? (
                        <BlurView intensity={80} style={StyleSheet.absoluteFill} />
                    ) : (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 30 }]} />
                    )
                ),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="meal-planner"
                options={{
                    title: 'Planner',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="shopping-list"
                options={{
                    title: 'Shopping',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'cart' : 'cart-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="cooking-diary"
                options={{
                    title: 'Diary',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
        height: 65,
        borderRadius: 30,
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
        paddingTop: 10,
    },
    tabBarLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 5,
    },
});
