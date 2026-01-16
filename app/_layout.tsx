// import 'react-native-reanimated';
import { Stack } from "expo-router";

export default function Layout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                headerStyle: { backgroundColor: '#ff7a18' },
                headerTintColor: '#FFF',
                headerTitleStyle: { fontWeight: 'bold' }
            }}
        >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="recipe/[id]" options={{ headerShown: false }} />
        </Stack>
    );
}
