import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Recipe } from '../types/recipe';
import { askChefAI } from '../services/gemini';
import { getThemeByCategory } from '../services/theme';
import { getChatHistory, saveChatHistory } from '../services/storage';
import * as Speech from 'expo-speech';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
}

interface AIChatModalProps {
    isVisible: boolean;
    onClose: () => void;
    recipe: Recipe;
}

const { height } = Dimensions.get('window');

export default function AIChatModal({ isVisible, onClose, recipe }: AIChatModalProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: `Halo! Saya Chef AI. Ada yang bisa saya bantu dengan resep ${recipe.strMeal} ini?`,
            sender: 'ai'
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAutoSpeak, setIsAutoSpeak] = useState(false);
    const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const theme = getThemeByCategory(recipe.strCategory);

    useEffect(() => {
        if (isVisible) {
            loadHistory();
        }
    }, [isVisible, recipe.idMeal]);

    const loadHistory = async () => {
        const history = await getChatHistory(recipe.idMeal);
        if (history && history.length > 0) {
            setMessages(history);
        } else {
            // Reset to initial message if no history
            setMessages([
                {
                    id: '1',
                    text: `Halo! Saya Chef AI. Ada yang bisa saya bantu dengan resep ${recipe.strMeal} ini?`,
                    sender: 'ai'
                }
            ]);
        }
    };

    const handleClearChat = async () => {
        const initialMessage: Message = {
            id: '1',
            text: `Halo! Saya Chef AI. Ada yang bisa saya bantu dengan resep ${recipe.strMeal} ini?`,
            sender: 'ai'
        };
        setMessages([initialMessage]);
        await saveChatHistory(recipe.idMeal, [initialMessage]);
    };

    const detectLanguage = (text: string): string => {
        // Simple heuristic: check for common Indonesian words
        const idKeywords = [
            'saya', 'anda', 'bisa', 'apa', 'bagaimana', 'resep', 'bahan', 'langkah',
            'masak', 'panaskan', 'tambahkan', 'siapkan', 'dan', 'yang', 'dengan'
        ];
        const lowerText = text.toLowerCase();
        const isIndonesian = idKeywords.some(word => lowerText.includes(word));
        return isIndonesian ? 'id-ID' : 'en-US';
    };

    const handleSpeak = (text: string, msgId: string) => {
        if (speakingMsgId === msgId) {
            Speech.stop();
            setSpeakingMsgId(null);
            return;
        }

        setSpeakingMsgId(msgId);
        const lang = detectLanguage(text);

        Speech.speak(text, {
            language: lang,
            pitch: 0.9,
            rate: 0.9,
            onDone: () => setSpeakingMsgId(null),
            onStopped: () => setSpeakingMsgId(null),
            onError: () => setSpeakingMsgId(null),
        });
    };

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'user'
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        const response = await askChefAI(recipe, userMessage.text);

        const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: response,
            sender: 'ai'
        };

        setMessages(prev => {
            const updated = [...prev, aiMessage];
            saveChatHistory(recipe.idMeal, updated);
            return updated;
        });
        setIsLoading(false);

        if (isAutoSpeak) {
            handleSpeak(aiMessage.text, aiMessage.id);
        }
    };

    useEffect(() => {
        return () => {
            Speech.stop();
        };
    }, []);

    useEffect(() => {
        if (scrollViewRef.current) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages, isLoading]);

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <View style={styles.header}>
                        <LinearGradient
                            colors={theme.gradient as any}
                            style={styles.headerGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <View style={styles.headerContent}>
                                <View style={styles.chefIconContainer}>
                                    <Ionicons name="restaurant" size={20} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.headerTitle}>Chef AI Assistant</Text>
                                    <Text style={styles.headerSubtitle}>Tanya apa saja tentang resep ini</Text>
                                </View>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={24} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setIsAutoSpeak(!isAutoSpeak)}
                                    style={[styles.headerIcon, isAutoSpeak && { backgroundColor: 'rgba(255,255,255,0.3)' }]}
                                >
                                    <Ionicons name={isAutoSpeak ? "volume-medium" : "volume-mute-outline"} size={20} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
                                    <Ionicons name="trash-outline" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>

                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.chatArea}
                        contentContainerStyle={styles.chatContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {messages.map((message) => (
                            <View key={message.id} style={{ marginBottom: 15 }}>
                                <View
                                    style={[
                                        styles.messageBubble,
                                        message.sender === 'user'
                                            ? [styles.userBubble, { backgroundColor: theme.primary }]
                                            : styles.aiBubble
                                    ]}
                                >
                                    <Text style={[
                                        styles.messageText,
                                        message.sender === 'user' ? styles.userText : styles.aiText
                                    ]}>
                                        {message.text}
                                    </Text>
                                </View>
                                {message.sender === 'ai' && (
                                    <TouchableOpacity
                                        style={[styles.msgSpeakBtn, speakingMsgId === message.id && { backgroundColor: theme.primary }]}
                                        onPress={() => handleSpeak(message.text, message.id)}
                                    >
                                        <Ionicons
                                            name={speakingMsgId === message.id ? "stop-circle" : "volume-high-outline"}
                                            size={14}
                                            color={speakingMsgId === message.id ? "#fff" : "#999"}
                                        />
                                        <Text style={[styles.msgSpeakText, speakingMsgId === message.id && { color: '#fff' }]}>
                                            {speakingMsgId === message.id ? 'Stop' : 'Dengarkan'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                        {isLoading && (
                            <View style={[styles.messageBubble, styles.aiBubble]}>
                                <ActivityIndicator size="small" color={theme.primary} />
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { maxHeight: 100 }]}
                                placeholder="Tanya Chef AI..."
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                            />
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={!inputText.trim() || isLoading}
                                style={[
                                    styles.sendButton,
                                    { backgroundColor: inputText.trim() ? theme.primary : '#ccc' }
                                ]}
                            >
                                <Ionicons name="send" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    container: {
        height: height * 0.88,
        backgroundColor: '#fff',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        overflow: 'hidden',
        elevation: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    header: {
        height: 100,
    },
    headerGradient: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 25,
        paddingTop: 15,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chefIconContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13,
        fontWeight: '500',
    },
    closeButton: {
        marginLeft: 'auto',
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerIcon: {
        padding: 8,
        borderRadius: 15,
        marginLeft: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    clearButton: {
        padding: 5,
        marginLeft: 8,
    },
    msgSpeakBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#fff',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        marginTop: -12,
        marginLeft: 15,
        zIndex: 1,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    msgSpeakText: {
        fontSize: 11,
        color: '#888',
        marginLeft: 5,
        fontWeight: '700',
    },
    chatArea: {
        flex: 1,
        backgroundColor: '#fcfcfc',
    },
    chatContent: {
        padding: 25,
        paddingBottom: 40,
    },
    messageBubble: {
        maxWidth: '85%',
        padding: 18,
        borderRadius: 24,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },
    userBubble: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 6,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 6,
        borderWidth: 1,
        borderColor: '#f5f5f5',
    },
    messageText: {
        fontSize: 16,
        lineHeight: 24,
    },
    userText: {
        color: '#fff',
        fontWeight: '500',
    },
    aiText: {
        color: '#222',
    },
    inputContainer: {
        padding: 25,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 25,
        paddingHorizontal: 18,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    input: {
        flex: 1,
        minHeight: 45,
        fontSize: 16,
        color: '#1a1a1a',
        paddingTop: 10,
        paddingBottom: 10,
        fontWeight: '500',
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
});
