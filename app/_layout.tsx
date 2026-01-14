// import 'react-native-reanimated';
import { Stack } from "expo-router";

export default function Layout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: '#ff7a18' },
                headerTintColor: '#FFF',
                headerTitleStyle: { fontWeight: 'bold' }
            }}
        />
    );
}
