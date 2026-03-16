import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { chatWithAI } from '@/lib/api';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';
import { ChatMessage } from '@/types';

const SUGGESTED_PROMPTS = [
  'What should I eat for breakfast?',
  'How can I increase my protein intake?',
  'Give me a high-protein meal plan',
  'What are healthy snacks under 200 calories?',
  'How much water should I drink daily?',
  'Can you analyze my eating habits?',
];

export default function AIChatScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true })
      .limit(50);
    setMessages((data as ChatMessage[]) ?? []);
    setInitialLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  async function sendMessage(text?: string) {
    const content = (text ?? inputText).trim();
    if (!content || loading || !profile?.id) return;
    setInputText('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      user_id: profile.id,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Save user message
      await supabase.from('chat_messages').insert({
        user_id: profile.id,
        role: 'user',
        content,
      });

      // Build context for AI
      const context = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      context.push({ role: 'user', content });

      const userContext = {
        name: profile.name,
        goal: profile.goal,
        diet: profile.diet_preference,
        dailyCalories: profile.daily_calories,
        dailyProtein: profile.daily_protein,
      };

      const response = await chatWithAI(context, userContext);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        user_id: profile.id,
        role: 'assistant',
        content: response.message,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Save assistant message
      await supabase.from('chat_messages').insert({
        user_id: profile.id,
        role: 'assistant',
        content: response.message,
      });
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        user_id: profile?.id ?? '',
        role: 'assistant',
        content: "I'm sorry, I couldn't process your request. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function renderMessage({ item }: { item: ChatMessage }) {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && (
          <LinearGradient colors={['#22c55e', '#06b6d4']} style={styles.aiAvatar}>
            <Ionicons name="nutrition" size={16} color="#fff" />
          </LinearGradient>
        )}
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text style={[styles.bubbleText, isUser ? styles.userText : styles.aiText]}>
            {item.content}
          </Text>
          <Text style={styles.messageTime}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <LinearGradient colors={['#22c55e', '#06b6d4']} style={styles.navAvatar}>
            <Ionicons name="nutrition" size={18} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.navTitle}>AI Nutritionist</Text>
            <Text style={styles.navSubtitle}>Powered by Groq AI</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            setMessages([]);
            supabase.from('chat_messages').delete().eq('user_id', profile?.id ?? '');
          }}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {initialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LinearGradient colors={['#22c55e20', '#06b6d420']} style={styles.emptyIcon}>
            <Ionicons name="chatbubbles" size={48} color={Colors.primary} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>Your AI Nutritionist</Text>
          <Text style={styles.emptyText}>
            Ask me anything about nutrition, meal planning, recipes, or your health goals!
          </Text>
          <Text style={styles.suggestedLabel}>Suggested questions:</Text>
          <View style={styles.suggestions}>
            {SUGGESTED_PROMPTS.map((p) => (
              <TouchableOpacity
                key={p}
                style={styles.suggestion}
                onPress={() => sendMessage(p)}
              >
                <Text style={styles.suggestionText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListFooterComponent={
            loading ? (
              <View style={styles.typingIndicator}>
                <LinearGradient colors={['#22c55e', '#06b6d4']} style={styles.aiAvatar}>
                  <Ionicons name="nutrition" size={16} color="#fff" />
                </LinearGradient>
                <View style={styles.typingBubble}>
                  <ActivityIndicator color={Colors.primary} size="small" />
                  <Text style={styles.typingText}>Thinking...</Text>
                </View>
              </View>
            ) : null
          }
        />
      )}

      {messages.length > 0 && !loading && (
        <View style={styles.suggestionsRow}>
          <FlatList
            horizontal
            data={SUGGESTED_PROMPTS.slice(0, 4)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.chipSuggestion}
                onPress={() => sendMessage(item)}
              >
                <Text style={styles.chipText} numberOfLines={1}>{item}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipList}
          />
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask your nutritionist..."
          placeholderTextColor={Colors.textDim}
          multiline
          maxLength={500}
          onSubmitEditing={() => sendMessage()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => sendMessage()}
          disabled={!inputText.trim() || loading}
        >
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            style={styles.sendGradient}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.xs },
  navCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  navAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  navSubtitle: { color: Colors.textMuted, fontSize: FontSize.xs },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  suggestedLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  suggestions: { width: '100%', gap: Spacing.xs },
  suggestion: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionText: { color: Colors.text, fontSize: FontSize.sm },
  messageList: { padding: Spacing.md, paddingBottom: Spacing.sm },
  messageRow: { flexDirection: 'row', marginBottom: Spacing.md, alignItems: 'flex-end', gap: Spacing.xs },
  userRow: { flexDirection: 'row-reverse' },
  aiRow: {},
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.bgCard,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleText: { fontSize: FontSize.md, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: Colors.text },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    opacity: 0.7,
    color: Colors.textMuted,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typingText: { color: Colors.textMuted, fontSize: FontSize.sm },
  suggestionsRow: { borderTopWidth: 1, borderTopColor: Colors.border },
  chipList: { padding: Spacing.sm, gap: Spacing.xs },
  chipSuggestion: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 200,
  },
  chipText: { color: Colors.textMuted, fontSize: FontSize.xs },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    maxHeight: 120,
  },
  sendBtn: { flexShrink: 0 },
  sendBtnDisabled: { opacity: 0.4 },
  sendGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
