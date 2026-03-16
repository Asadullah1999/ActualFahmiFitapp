import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { sendWhatsAppVerification } from '@/lib/api';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

type Step = 'phone' | 'otp' | 'success';

export default function WhatsAppSetupScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendOTP() {
    if (!phone.trim() || phone.length < 10) {
      Alert.alert('Invalid', 'Enter a valid phone number with country code');
      return;
    }
    setLoading(true);
    try {
      await sendWhatsAppVerification(phone);
      setStep('otp');
    } catch {
      Alert.alert('Error', 'Failed to send verification. Check the number and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOTP() {
    if (!otp.trim() || otp.length < 4) {
      Alert.alert('Invalid', 'Enter the OTP you received');
      return;
    }
    setLoading(true);
    try {
      // In production, verify OTP via backend. Here we save the contact.
      if (!profile?.id) return;
      await supabase.from('whatsapp_contacts').upsert({
        user_id: profile.id,
        phone_number: phone,
        verified: true,
        opt_in: true,
      });
      setStep('success');
    } catch {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>WhatsApp Setup</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#25D36620', '#25D36605']}
            style={styles.iconContainer}
          >
            <Ionicons name="logo-whatsapp" size={48} color="#25D366" />
          </LinearGradient>
          <Text style={styles.title}>WhatsApp Reminders</Text>
          <Text style={styles.subtitle}>
            Get personalized meal reminders, water alerts, and coaching tips directly on WhatsApp
          </Text>
        </View>

        {/* Benefits */}
        <Card style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>What you&apos;ll get:</Text>
          {[
            { icon: '🍽️', text: 'Meal reminders at your preferred times' },
            { icon: '💧', text: 'Water intake nudges throughout the day' },
            { icon: '⚖️', text: 'Daily weigh-in reminders' },
            { icon: '🤖', text: 'AI coaching tips and motivation' },
          ].map((benefit) => (
            <View key={benefit.text} style={styles.benefit}>
              <Text style={styles.benefitIcon}>{benefit.icon}</Text>
              <Text style={styles.benefitText}>{benefit.text}</Text>
            </View>
          ))}
        </Card>

        {/* Step: Phone */}
        {step === 'phone' && (
          <Card style={styles.stepCard}>
            <Text style={styles.stepTitle}>Enter Your Phone Number</Text>
            <Text style={styles.stepSubtitle}>
              Include country code (e.g. +91 for India)
            </Text>
            <Input
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 9876543210"
              leftIcon={<Ionicons name="call-outline" size={20} color={Colors.textMuted} />}
            />
            <Button
              title="Send Verification Code"
              onPress={sendOTP}
              loading={loading}
            />
          </Card>
        )}

        {/* Step: OTP */}
        {step === 'otp' && (
          <Card style={styles.stepCard}>
            <Text style={styles.stepTitle}>Enter Verification Code</Text>
            <Text style={styles.stepSubtitle}>
              We sent a code to {phone} via WhatsApp
            </Text>
            <Input
              label="OTP Code"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              placeholder="Enter 6-digit code"
              leftIcon={<Ionicons name="key-outline" size={20} color={Colors.textMuted} />}
              maxLength={6}
            />
            <Button
              title="Verify"
              onPress={verifyOTP}
              loading={loading}
              style={{ marginBottom: Spacing.md }}
            />
            <Button
              title="Resend Code"
              onPress={sendOTP}
              variant="ghost"
              loading={loading}
            />
          </Card>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <Card style={styles.successCard}>
            <View style={styles.successIcon}>
              <LinearGradient
                colors={['#25D366', '#128C7E']}
                style={styles.successGradient}
              >
                <Ionicons name="checkmark" size={36} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.successTitle}>WhatsApp Connected!</Text>
            <Text style={styles.successText}>
              Your WhatsApp number {phone} has been verified. You&apos;ll start receiving reminders soon.
            </Text>
            <Button
              title="Set Up Reminders"
              onPress={() => navigation.navigate('Reminders' as never)}
              style={{ marginTop: Spacing.md }}
            />
            <Button
              title="Done"
              onPress={() => navigation.goBack()}
              variant="outline"
              style={{ marginTop: Spacing.sm }}
            />
          </Card>
        )}

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.textDim} />
          <Text style={styles.privacyText}>
            Your number is never shared. You can opt out anytime.
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
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsCard: { marginBottom: Spacing.lg },
  benefitsTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  benefitIcon: { fontSize: 20 },
  benefitText: { color: Colors.textMuted, fontSize: FontSize.md, flex: 1 },
  stepCard: { marginBottom: Spacing.lg },
  stepTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
  },
  successCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  successIcon: { marginBottom: Spacing.lg },
  successGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  successText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  privacyText: { color: Colors.textDim, fontSize: FontSize.sm },
});
