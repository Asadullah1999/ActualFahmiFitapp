import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { generateGroceryList } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

interface GroceryItem {
  category: string;
  name: string;
  quantity?: string;
  checked: boolean;
}

export default function GroceryListScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const result = await generateGroceryList(
        profile.goal ?? 'maintain',
        profile.diet_preference ?? 'none',
        profile.daily_calories ?? 2000
      );
      setItems(result.items.map((item) => ({ ...item, checked: false })));
      setGenerated(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to generate grocery list. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    generate();
  }, [generate]);

  function toggleItem(idx: number) {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, checked: !item.checked } : item))
    );
  }

  function clearChecked() {
    setItems((prev) => prev.filter((item) => !item.checked));
  }

  const categories = [...new Set(items.map((i) => i.category))];
  const checkedCount = items.filter((i) => i.checked).length;

  const categoryIcons: Record<string, string> = {
    Vegetables: '🥦',
    Fruits: '🍎',
    Proteins: '🥩',
    Grains: '🌾',
    Dairy: '🥛',
    Legumes: '🫘',
    Nuts: '🥜',
    Oils: '🫙',
    Beverages: '🧃',
    Other: '🛒',
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Grocery List</Text>
        <TouchableOpacity onPress={generate} disabled={loading}>
          <Ionicons name="refresh" size={22} color={loading ? Colors.textDim : Colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <LinearGradient colors={['#22c55e20', '#06b6d420']} style={styles.loadingIcon}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </LinearGradient>
          <Text style={styles.loadingTitle}>Generating your list...</Text>
          <Text style={styles.loadingSubtitle}>
            AI is creating a personalized grocery list for your {profile?.goal?.replace('_', ' ')} goal
          </Text>
        </View>
      ) : !generated || items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color={Colors.textDim} />
          <Text style={styles.emptyTitle}>No grocery list yet</Text>
          <Button title="Generate List" onPress={generate} style={{ marginTop: Spacing.lg, width: 200 }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Progress */}
          <Card style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Shopping Progress</Text>
              <Text style={styles.progressCount}>
                {checkedCount}/{items.length} items
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${items.length ? (checkedCount / items.length) * 100 : 0}%` },
                ]}
              />
            </View>
            {checkedCount > 0 && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  Alert.alert(
                    'Clear Checked',
                    'Remove all checked items?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Clear', style: 'destructive', onPress: clearChecked },
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                <Text style={styles.clearBtnText}>Clear checked ({checkedCount})</Text>
              </TouchableOpacity>
            )}
          </Card>

          {/* Diet badge */}
          <View style={styles.dietBadgeRow}>
            <View style={styles.dietBadge}>
              <Ionicons name="nutrition-outline" size={14} color={Colors.accent} />
              <Text style={styles.dietBadgeText}>
                Tailored for {profile?.diet_preference?.replace('_', '-') ?? 'balanced'} diet •{' '}
                {profile?.daily_calories ?? 2000} kcal goal
              </Text>
            </View>
          </View>

          {/* Categories */}
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.category === cat);
            return (
              <View key={cat} style={styles.category}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryIcon}>
                    {categoryIcons[cat] ?? '🛒'}
                  </Text>
                  <Text style={styles.categoryTitle}>{cat}</Text>
                  <Text style={styles.categoryCount}>
                    {catItems.filter((i) => i.checked).length}/{catItems.length}
                  </Text>
                </View>
                {catItems.map((item, itemIdx) => {
                  const globalIdx = items.indexOf(item);
                  return (
                    <TouchableOpacity
                      key={`${cat}-${itemIdx}`}
                      style={[styles.item, item.checked && styles.itemChecked]}
                      onPress={() => toggleItem(globalIdx)}
                    >
                      <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                        {item.checked && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </View>
                      <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
                        {item.name}
                      </Text>
                      {item.quantity && (
                        <Text style={styles.itemQty}>{item.quantity}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}

          <Button
            title="Regenerate List"
            onPress={() => {
              Alert.alert(
                'Regenerate?',
                'This will create a new grocery list.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Regenerate', onPress: generate },
                ]
              );
            }}
            variant="outline"
            style={styles.regenerateBtn}
          />
        </ScrollView>
      )}
    </View>
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
  navTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  loadingTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  loadingSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyTitle: { color: Colors.textMuted, fontSize: FontSize.lg },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  progressCard: { marginBottom: Spacing.md },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  progressCount: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
  },
  clearBtnText: { color: Colors.danger, fontSize: FontSize.sm },
  dietBadgeRow: { marginBottom: Spacing.md },
  dietBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accent + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  dietBadgeText: { color: Colors.accent, fontSize: FontSize.xs },
  category: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.bgCardAlt,
    gap: Spacing.sm,
  },
  categoryIcon: { fontSize: 18 },
  categoryTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  categoryCount: { color: Colors.textMuted, fontSize: FontSize.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  itemChecked: { opacity: 0.5 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  itemName: {
    color: Colors.text,
    fontSize: FontSize.md,
    flex: 1,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textDim,
  },
  itemQty: { color: Colors.textMuted, fontSize: FontSize.sm },
  regenerateBtn: { marginTop: Spacing.sm },
});
