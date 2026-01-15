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
    const scrollViewRef = useRef<ScrollView>(null);
    const theme = getThemeByCategory(recipe.strCategory);

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

        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
    };

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
                            <View
                                key={message.id}
                                style={[
                                    styles.messageBubble,
                                    message.sender === 'user' ? styles.userBubble : styles.aiBubble
                                ]}
                            >
                                <Text style={[
                                    styles.messageText,
                                    message.sender === 'user' ? styles.userText : styles.aiText
                                ]}>
                                    {message.text}
                                </Text>
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
        backgroundColor: '#fff',
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
        color: '#333',
    },
    aiText: {
        color: '#444',
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
