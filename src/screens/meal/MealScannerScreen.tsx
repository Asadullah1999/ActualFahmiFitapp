import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { analyzeMeal, MealAnalysisResponse } from '@/lib/api';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export default function MealScannerScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<MealAnalysisResponse | null>(null);
  const [saving, setSaving] = useState(false);

  async function takePicture() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });
      if (photo?.uri) {
        setCapturedImage(photo.uri);
        analyzeImage(photo.base64 ?? '');
      }
    } catch {
      Alert.alert('Error', 'Failed to capture photo');
    }
  }

  async function pickFromLibrary() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled && res.assets[0]) {
      setCapturedImage(res.assets[0].uri);
      analyzeImage(res.assets[0].base64 ?? '');
    }
  }

  async function analyzeImage(base64: string) {
    setAnalyzing(true);
    setResult(null);
    try {
      const analysis = await analyzeMeal(base64);
      setResult(analysis);
    } catch (err) {
      Alert.alert('Analysis Failed', 'Could not analyze the meal. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveToLog() {
    if (!result || !profile?.id) return;
    setSaving(true);
    try {
      const entries = result.foods.map((food) => ({
        user_id: profile.id,
        date: todayISO(),
        meal_type: 'snack',
        food_name: food.name,
        calories: food.calories,
        protein_g: food.protein_g,
        carbs_g: food.carbs_g,
        fat_g: food.fat_g,
        fiber_g: food.fiber_g ?? 0,
      }));
      await supabase.from('daily_logs').insert(entries);
      Alert.alert('Saved!', 'Meal added to your log', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save meal');
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setCapturedImage(null);
    setResult(null);
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={60} color={Colors.textMuted} />
        <Text style={styles.permText}>Camera access needed</Text>
        <Button title="Grant Permission" onPress={requestPermission} style={{ marginTop: Spacing.md, width: 200 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Meal Scanner</Text>
        <View style={{ width: 40 }} />
      </View>

      {!capturedImage ? (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.cameraHint}>Point at your meal to analyze</Text>
            </View>
          </CameraView>
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.galleryBtn} onPress={pickFromLibrary}>
              <Ionicons name="images-outline" size={24} color={Colors.text} />
              <Text style={styles.galleryText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
            <View style={{ width: 80 }} />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.resultScroll}>
          <Image source={{ uri: capturedImage }} style={styles.preview} resizeMode="cover" />

          {analyzing ? (
            <Card style={styles.analyzingCard}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.analyzingText}>Analyzing your meal with AI...</Text>
            </Card>
          ) : result ? (
            <View>
              <Card style={styles.resultCard}>
                <Text style={styles.resultTitle}>AI Meal Analysis</Text>
                <View style={styles.totalRow}>
                  {[
                    { label: 'Calories', value: `${result.total_calories}`, unit: 'kcal', color: Colors.primary },
                    { label: 'Protein', value: `${result.total_protein}`, unit: 'g', color: Colors.secondary },
                    { label: 'Carbs', value: `${result.total_carbs}`, unit: 'g', color: Colors.warning },
                    { label: 'Fat', value: `${result.total_fat}`, unit: 'g', color: Colors.accent },
                  ].map((item) => (
                    <View key={item.label} style={styles.totalItem}>
                      <Text style={[styles.totalValue, { color: item.color }]}>
                        {item.value}
                      </Text>
                      <Text style={styles.totalUnit}>{item.unit}</Text>
                      <Text style={styles.totalLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </Card>

              <Text style={styles.sectionTitle}>Identified Foods</Text>
              {result.foods.map((food, idx) => (
                <Card key={idx} style={styles.foodCard}>
                  <View style={styles.foodHeader}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={styles.foodCals}>{food.calories} kcal</Text>
                  </View>
                  <View style={styles.foodMacros}>
                    {[
                      { label: 'P', value: food.protein_g, color: Colors.secondary },
                      { label: 'C', value: food.carbs_g, color: Colors.warning },
                      { label: 'F', value: food.fat_g, color: Colors.accent },
                    ].map((m) => (
                      <View key={m.label} style={styles.macroPill}>
                        <Text style={[styles.macroPillText, { color: m.color }]}>
                          {m.label}: {m.value}g
                        </Text>
                      </View>
                    ))}
                  </View>
                  {food.serving_size && (
                    <Text style={styles.servingSize}>Serving: {food.serving_size}</Text>
                  )}
                </Card>
              ))}

              {result.notes && (
                <Card style={styles.notesCard}>
                  <Ionicons name="information-circle-outline" size={18} color={Colors.secondary} />
                  <Text style={styles.notesText}>{result.notes}</Text>
                </Card>
              )}

              <View style={styles.actionBtns}>
                <Button title="Retake" onPress={reset} variant="outline" fullWidth={false} style={{ flex: 1 }} />
                <Button title="Add to Log" onPress={saveToLog} loading={saving} fullWidth={false} style={{ flex: 1 }} />
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  permText: {
    color: Colors.textMuted,
    fontSize: FontSize.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
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
  navTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 260,
    height: 260,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'transparent',
  },
  cameraHint: {
    color: '#fff',
    fontSize: FontSize.md,
    marginTop: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  galleryBtn: { alignItems: 'center', gap: Spacing.xs, width: 80 },
  galleryText: { color: Colors.text, fontSize: FontSize.xs },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
  resultScroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  analyzingCard: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  analyzingText: { color: Colors.textMuted, fontSize: FontSize.md },
  resultCard: { marginBottom: Spacing.md },
  resultTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalItem: { alignItems: 'center' },
  totalValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  totalUnit: { color: Colors.textMuted, fontSize: FontSize.xs },
  totalLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  foodCard: { marginBottom: Spacing.sm },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  foodName: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  foodCals: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  foodMacros: { flexDirection: 'row', gap: Spacing.sm },
  macroPill: {
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  macroPillText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  servingSize: { color: Colors.textDim, fontSize: FontSize.xs, marginTop: Spacing.xs },
  notesCard: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', marginBottom: Spacing.md },
  notesText: { color: Colors.textMuted, fontSize: FontSize.sm, flex: 1 },
  actionBtns: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
});
