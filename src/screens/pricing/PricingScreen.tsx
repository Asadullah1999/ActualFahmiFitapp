import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { createStripeCheckout } from '@/lib/api';
import Card from '@/components/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  gradient: readonly [string, string];
  features: string[];
  highlight?: boolean;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Get started with basic nutrition tracking',
    gradient: ['#1a1d27', '#212435'] as const,
    features: [
      'Calorie & macro tracking',
      'Basic meal logging',
      'Water intake tracker',
      '7-day progress history',
      '5 AI chat messages/day',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'Advanced tracking with AI coaching',
    gradient: ['#22c55e', '#16a34a'] as const,
    features: [
      'Everything in Free',
      'Unlimited AI chat',
      'Meal photo scanner',
      'Barcode scanner',
      'AI grocery lists',
      'Sleep tracking',
      'Workout logging',
      'WhatsApp reminders',
    ],
    highlight: true,
    badge: 'Most Popular',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$29',
    period: '/month',
    description: 'Complete health & nutrition platform',
    gradient: ['#8b5cf6', '#7c3aed'] as const,
    features: [
      'Everything in Pro',
      'Personal AI nutritionist',
      'Custom meal plans',
      'Advanced analytics',
      'Priority support',
      'Family accounts (3 users)',
      'API access',
      'Dedicated WhatsApp coach',
    ],
    badge: 'Best Value',
  },
];

export default function PricingScreen() {
  const { profile, user } = useAuth();
  const navigation = useNavigation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function subscribeToPlan(plan: Plan) {
    if (plan.id === 'free') {
      Alert.alert('Already on Free', 'You are already using the free plan.');
      return;
    }
    if (!user?.email) {
      Alert.alert('Login Required', 'Please log in to subscribe.');
      return;
    }
    setLoadingPlan(plan.id);
    try {
      const { checkoutUrl } = await createStripeCheckout(
        plan.id,
        user.id,
        user.email
      );
      await Linking.openURL(checkoutUrl);
    } catch {
      Alert.alert(
        'Checkout Failed',
        'Unable to start checkout. Please try again.'
      );
    } finally {
      setLoadingPlan(null);
    }
  }

  const currentPlan = 'free'; // In production, fetch from subscriptions table

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Choose Your Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upgrade to unlock</Text>
          <Text style={styles.headerSubtitle}>
            full AI-powered nutrition coaching
          </Text>
        </View>

        {/* Plans */}
        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            activeOpacity={0.9}
            onPress={() => subscribeToPlan(plan)}
          >
            <View
              style={[
                styles.planWrapper,
                plan.highlight && styles.planWrapperHighlight,
              ]}
            >
              {plan.badge && (
                <View
                  style={[
                    styles.planBadge,
                    plan.id === 'premium' && styles.planBadgePremium,
                  ]}
                >
                  <Text style={styles.planBadgeText}>{plan.badge}</Text>
                </View>
              )}
              <LinearGradient
                colors={plan.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.planCard}
              >
                <View style={styles.planHeader}>
                  <View>
                    <Text
                      style={[
                        styles.planName,
                        plan.highlight && styles.planNameHighlight,
                      ]}
                    >
                      {plan.name}
                    </Text>
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  </View>
                  <View style={styles.planPrice}>
                    <Text
                      style={[
                        styles.planPriceValue,
                        plan.highlight && styles.planPriceHighlight,
                      ]}
                    >
                      {plan.price}
                    </Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </View>
                </View>

                <View style={styles.planFeatures}>
                  {plan.features.map((feature) => (
                    <View key={feature} style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={plan.highlight ? '#fff' : Colors.primary}
                      />
                      <Text
                        style={[
                          styles.featureText,
                          plan.highlight && styles.featureTextHighlight,
                        ]}
                      >
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.planAction}>
                  {currentPlan === plan.id ? (
                    <View style={styles.currentPlanBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                      <Text style={styles.currentPlanText}>Current Plan</Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.subscribeBtn,
                        plan.highlight && styles.subscribeBtnHighlight,
                        loadingPlan === plan.id && styles.subscribeBtnLoading,
                      ]}
                    >
                      <Text
                        style={[
                          styles.subscribeBtnText,
                          plan.highlight && styles.subscribeBtnTextHighlight,
                        ]}
                      >
                        {loadingPlan === plan.id ? 'Loading...' : `Get ${plan.name}`}
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        ))}

        {/* FAQs */}
        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
        {[
          {
            q: 'Can I cancel anytime?',
            a: 'Yes, you can cancel your subscription at any time. No questions asked.',
          },
          {
            q: 'Is my payment secure?',
            a: 'All payments are processed securely via Stripe. We never store card details.',
          },
          {
            q: 'Can I switch plans?',
            a: 'You can upgrade or downgrade your plan at any time from your account settings.',
          },
        ].map((faq) => (
          <Card key={faq.q} style={styles.faqCard}>
            <Text style={styles.faqQuestion}>{faq.q}</Text>
            <Text style={styles.faqAnswer}>{faq.a}</Text>
          </Card>
        ))}

        <View style={styles.guarantee}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
          <Text style={styles.guaranteeText}>
            30-day money-back guarantee. No risk, cancel anytime.
          </Text>
        </View>
      </ScrollView>
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
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginTop: 4,
  },
  planWrapper: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    position: 'relative',
  },
  planWrapperHighlight: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  planBadge: {
    position: 'absolute',
    top: -12,
    right: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    zIndex: 1,
  },
  planBadgePremium: {
    backgroundColor: Colors.accent,
  },
  planBadgeText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  planCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  planName: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
  },
  planNameHighlight: { color: '#fff' },
  planDescription: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  planPrice: { alignItems: 'flex-end' },
  planPriceValue: {
    color: Colors.primary,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
  },
  planPriceHighlight: { color: '#fff' },
  planPeriod: { color: Colors.textMuted, fontSize: FontSize.sm },
  planFeatures: { gap: Spacing.sm, marginBottom: Spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  featureText: { color: Colors.textMuted, fontSize: FontSize.md },
  featureTextHighlight: { color: 'rgba(255,255,255,0.9)' },
  planAction: {},
  currentPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  currentPlanText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  subscribeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  subscribeBtnHighlight: {
    backgroundColor: '#fff',
  },
  subscribeBtnLoading: { opacity: 0.6 },
  subscribeBtnText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  subscribeBtnTextHighlight: { color: Colors.primary },
  faqTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  faqCard: { marginBottom: Spacing.sm },
  faqQuestion: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  faqAnswer: { color: Colors.textMuted, fontSize: FontSize.md, lineHeight: 22 },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  guaranteeText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
});
