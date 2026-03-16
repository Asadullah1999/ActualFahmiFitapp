import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { lookupBarcode } from '@/lib/api';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';
import { BarcodeProduct } from '@/lib/api';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export default function BarcodeScannerScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleBarcode({ data }: { data: string }) {
    if (scanned || scanning) return;
    setScanned(true);
    setScanning(true);
    setNotFound(false);
    try {
      const result = await lookupBarcode(data);
      if (result) {
        setProduct(result);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setScanning(false);
    }
  }

  async function saveToLog() {
    if (!product || !profile?.id) return;
    setSaving(true);
    try {
      await supabase.from('daily_logs').insert({
        user_id: profile.id,
        date: todayISO(),
        meal_type: 'snack',
        food_name: product.brand ? `${product.name} (${product.brand})` : product.name,
        calories: product.calories,
        protein_g: product.protein_g,
        carbs_g: product.carbs_g,
        fat_g: product.fat_g,
        fiber_g: product.fiber_g ?? 0,
      });
      Alert.alert('Added!', 'Product added to your food log', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to add product');
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setScanned(false);
    setProduct(null);
    setNotFound(false);
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
        <Ionicons name="barcode-outline" size={60} color={Colors.textMuted} />
        <Text style={styles.permText}>Camera access needed for barcode scanning</Text>
        <Button
          title="Grant Permission"
          onPress={requestPermission}
          style={{ marginTop: Spacing.md, width: 200 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Barcode Scanner</Text>
        <TouchableOpacity onPress={reset} style={styles.resetBtn}>
          <Ionicons name="refresh" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {!product && !notFound && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarcode}
            barcodeScannerSettings={{ barcodeTypes: ['ean8', 'ean13', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'] }}
          >
            <View style={styles.overlay}>
              <View style={styles.frameTop} />
              <View style={styles.frameRow}>
                <View style={styles.frameSide} />
                <View style={styles.scanWindow}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                  {scanning && (
                    <View style={styles.scanningIndicator}>
                      <ActivityIndicator color={Colors.primary} size="large" />
                      <Text style={styles.scanningText}>Looking up product...</Text>
                    </View>
                  )}
                </View>
                <View style={styles.frameSide} />
              </View>
              <View style={styles.frameBottom}>
                <Text style={styles.hint}>Point at a product barcode</Text>
              </View>
            </View>
          </CameraView>
        </View>
      )}

      {notFound && (
        <View style={styles.center}>
          <Ionicons name="sad-outline" size={60} color={Colors.textMuted} />
          <Text style={styles.notFoundTitle}>Product not found</Text>
          <Text style={styles.notFoundText}>
            This product isn&apos;t in the database yet. Try a different product or add it manually.
          </Text>
          <Button
            title="Scan Again"
            onPress={reset}
            style={{ marginTop: Spacing.lg, width: 200 }}
          />
        </View>
      )}

      {product && (
        <ScrollView contentContainerStyle={styles.resultScroll}>
          <Card style={styles.productCard}>
            <View style={styles.productHeader}>
              <View style={styles.productBarcodeIcon}>
                <Ionicons name="barcode" size={32} color={Colors.secondary} />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                {product.brand && (
                  <Text style={styles.productBrand}>{product.brand}</Text>
                )}
                {product.serving_size && (
                  <Text style={styles.productServing}>Per {product.serving_size}</Text>
                )}
              </View>
            </View>
          </Card>

          <Text style={styles.sectionTitle}>Nutrition Facts</Text>
          <Card style={styles.nutritionCard}>
            <View style={styles.nutritionGrid}>
              {[
                { label: 'Calories', value: product.calories, unit: 'kcal', color: Colors.primary },
                { label: 'Protein', value: product.protein_g, unit: 'g', color: Colors.secondary },
                { label: 'Carbs', value: product.carbs_g, unit: 'g', color: Colors.warning },
                { label: 'Fat', value: product.fat_g, unit: 'g', color: Colors.accent },
              ].map((item) => (
                <View key={item.label} style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: item.color }]}>
                    {item.value}
                  </Text>
                  <Text style={styles.nutritionUnit}>{item.unit}</Text>
                  <Text style={styles.nutritionLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
            {product.fiber_g !== undefined && (
              <View style={styles.fiberRow}>
                <Text style={styles.fiberLabel}>Dietary Fiber</Text>
                <Text style={styles.fiberValue}>{product.fiber_g}g</Text>
              </View>
            )}
          </Card>

          <View style={styles.actionBtns}>
            <Button title="Scan Again" onPress={reset} variant="outline" fullWidth={false} style={{ flex: 1 }} />
            <Button title="Add to Log" onPress={saveToLog} loading={saving} fullWidth={false} style={{ flex: 1 }} />
          </View>
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
    fontSize: FontSize.md,
    textAlign: 'center',
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
  resetBtn: { padding: Spacing.xs },
  navTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1 },
  frameTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  frameRow: { flexDirection: 'row' },
  frameSide: { flex: 1, height: 200, backgroundColor: 'rgba(0,0,0,0.5)' },
  scanWindow: {
    width: 260,
    height: 160,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  scanningIndicator: { alignItems: 'center', gap: Spacing.sm },
  scanningText: {
    color: '#fff',
    fontSize: FontSize.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  frameBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  hint: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  notFoundTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.md,
  },
  notFoundText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  resultScroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  productCard: { marginBottom: Spacing.md },
  productHeader: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  productBarcodeIcon: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(6,182,212,0.1)',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: { flex: 1 },
  productName: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  productBrand: { color: Colors.textMuted, fontSize: FontSize.md, marginTop: 2 },
  productServing: { color: Colors.textDim, fontSize: FontSize.sm, marginTop: 2 },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  nutritionCard: { marginBottom: Spacing.md },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  nutritionItem: { alignItems: 'center' },
  nutritionValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  nutritionUnit: { color: Colors.textMuted, fontSize: FontSize.xs },
  nutritionLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  fiberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  fiberLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
  fiberValue: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  actionBtns: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
});
