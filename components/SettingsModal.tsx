import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { saveUserGeminiKey, getUserGeminiKey, removeUserGeminiKey, saveUserPreferences, getUserPreferences } from '../services/storage';

interface SettingsModalProps {
    isVisible: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isVisible, onClose }: SettingsModalProps) {
    const [apiKey, setApiKey] = useState('');
    const [preferences, setPreferences] = useState('');
    const [hasStoredKey, setHasStoredKey] = useState(false);

    useEffect(() => {
        if (isVisible) {
            loadKey();
        }
    }, [isVisible]);

    const loadKey = async () => {
        const [storedKey, storedPrefs] = await Promise.all([
            getUserGeminiKey(),
            getUserPreferences()
        ]);

        if (storedKey) {
            setApiKey(storedKey);
            setHasStoredKey(true);
        }
        if (storedPrefs) {
            setPreferences(storedPrefs);
        }
    };

    const handleSave = async () => {
        const keyToSave = apiKey.trim();
        const prefsToSave = preferences.trim();

        const results = await Promise.all([
            keyToSave ? saveUserGeminiKey(keyToSave) : Promise.resolve(true),
            saveUserPreferences(prefsToSave)
        ]);

        if (results.every(r => r)) {
            Alert.alert('Sukses', 'Pengaturan berhasil disimpan! ✨');
            if (keyToSave) setHasStoredKey(true);
            onClose();
        } else {
            Alert.alert('Error', 'Gagal menyimpan beberapa pengaturan.');
        }
    };

    const handleDelete = async () => {
        const success = await removeUserGeminiKey();
        if (success) {
            setApiKey('');
            setHasStoredKey(false);
            Alert.alert('Sukses', 'API Key berhasil dihapus.');
        }
    };

    return (
        <Modal
            visible={isVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Pengaturan Asisten AI</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle-outline" size={20} color="#ff7a18" />
                            <Text style={styles.infoText}>
                                Gunakan API Key Anda sendiri agar fitur Chef AI Assistant bisa berjalan tanpa batas.
                            </Text>
                        </View>

                        <Text style={styles.label}>Preferensi Diet / Alergi</Text>
                        <View style={[styles.inputWrapper, { height: 80, alignItems: 'flex-start', paddingVertical: 10 }]}>
                            <Ionicons name="nutrition-outline" size={20} color="#999" style={[styles.inputIcon, { marginTop: 5 }]} />
                            <TextInput
                                style={[styles.input, { textAlignVertical: 'top' }]}
                                placeholder="Contoh: Alergi kacang, Diet Keto, Vegetarian..."
                                placeholderTextColor="#bbb"
                                value={preferences}
                                onChangeText={setPreferences}
                                multiline
                            />
                        </View>

                        <Text style={styles.label}>Gemini API Key</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="key-outline" size={20} color="#999" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Masukkan API Key Anda..."
                                placeholderTextColor="#bbb"
                                value={apiKey}
                                onChangeText={setApiKey}
                                secureTextEntry={true}
                                autoCapitalize="none"
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => Linking.openURL('https://aistudio.google.com/app/apikey')}
                        >
                            <Text style={styles.linkText}>Dapatkan API Key Gratis di Google AI Studio</Text>
                            <Ionicons name="open-outline" size={14} color="#ff7a18" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <LinearGradient
                                colors={['#ff7a18', '#ff4d00']}
                                style={styles.saveGradient}
                            >
                                <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {hasStoredKey && (
                            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                                <Text style={styles.deleteButtonText}>Hapus Key Tersimpan</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 5,
    },
    content: {
        padding: 20,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#fff5ed',
        padding: 15,
        borderRadius: 15,
        marginBottom: 25,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#666',
        marginLeft: 10,
        lineHeight: 18,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#444',
        marginBottom: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 10,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        alignSelf: 'flex-start',
    },
    linkText: {
        fontSize: 12,
        color: '#ff7a18',
        marginRight: 5,
        fontWeight: '600',
    },
    saveButton: {
        height: 55,
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 15,
    },
    saveGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteButton: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#ff4444',
        fontSize: 14,
        fontWeight: '600',
    },
});
