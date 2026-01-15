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

    const handleSpeak = (text: string, msgId: string) => {
        if (speakingMsgId === msgId) {
            Speech.stop();
            setSpeakingMsgId(null);
            return;
        }

        setSpeakingMsgId(msgId);
        Speech.speak(text, {
            language: 'id-ID',
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        height: height * 0.85,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
    },
    header: {
        height: 90,
    },
    headerGradient: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chefIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    closeButton: {
        marginLeft: 'auto',
        padding: 5,
    },
    headerIcon: {
        padding: 8,
        borderRadius: 12,
        marginLeft: 5,
    },
    clearButton: {
        padding: 5,
        marginLeft: 5,
    },
    msgSpeakBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        marginTop: -10,
        marginLeft: 10,
        zIndex: 1,
    },
    msgSpeakText: {
        fontSize: 10,
        color: '#999',
        marginLeft: 4,
        fontWeight: 'bold',
    },
    chatArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    chatContent: {
        padding: 20,
        paddingBottom: 30,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 15,
        borderRadius: 20,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    userBubble: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 5,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 5,
        borderWidth: 1,
        borderColor: '#eee',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: '#fff',
    },
    aiText: {
        color: '#333',
    },
    inputContainer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 5,
    },
    input: {
        flex: 1,
        minHeight: 40,
        fontSize: 15,
        color: '#333',
        paddingTop: 8,
        paddingBottom: 8,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
});
