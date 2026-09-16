import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  KeyboardAvoidingView, Platform, Animated, Modal, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useBag } from '@/hooks/useBag';
import { useAuth } from '@/contexts/AuthContext';
import { saveAddress, createOrder } from '@/services/ordersService';
import { clearCart } from '@/services/cartService';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, clearBag } = useBag();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  const btnScale = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0.7)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const total = items.reduce((sum, item) => {
    const num = Number(item.price) * item.quantity;
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
  const currency = items[0]?.currency ?? 'USD';

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!phone.trim()) e.phone = 'Phone number is required';
    if (!address.trim()) e.address = 'Delivery address is required';
    if (!city.trim()) e.city = 'City is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    if (!validate()) return;
    if (!user) {
      setErrors({ submit: 'Please sign in before placing an order.' });
      return;
    }

    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.93, duration: 100, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 8 }),
    ]).start();

    setLoading(true);
    try {
        // Save address
        const { data: addrData, error: addrError } = await saveAddress(user.id, {
          full_name: name.trim(),
          phone: phone.trim(),
          line1: address.trim(),
          city: city.trim(),
          country: 'ZM',
          is_default: true,
        });

        if (addrError || !addrData) throw new Error(addrError ?? 'Could not save delivery address');

        const createdOrderIds: string[] = [];
        for (const item of items) {
          const { data: post, error: postError } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', item.id)
            .single();
          if (postError || !post?.user_id) throw new Error(postError?.message ?? 'Seller information is missing');

          const { data: orderData, error: orderError } = await createOrder({
            buyerId: user.id,
            sellerId: post.user_id,
            postId: item.id,
            quantity: item.quantity,
            totalPrice: item.price * item.quantity,
            currency: item.currency,
            size: item.selectedSize ?? undefined,
            color: item.selectedColor ?? undefined,
            shippingAddress: {
              full_name: name.trim(),
              phone: phone.trim(),
              line1: address.trim(),
              city: city.trim(),
              country: 'ZM',
            },
            productSnapshot: { title: item.name, price: item.price, image: item.image },
          });
          if (orderError || !orderData) throw new Error(orderError ?? 'Could not create order');
          createdOrderIds.push(orderData.id);
        }

        setConfirmedOrderId(createdOrderIds[0] ?? null);
        await clearCart(user.id);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Could not place order' });
      return;
    } finally {
      setLoading(false);
    }

    setShowSuccess(true);
    Animated.parallel([
      Animated.spring(successScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 12 }),
      Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleSuccessClose = () => {
    clearBag();
    setShowSuccess(false);
    if (confirmedOrderId) router.replace(`/order/${confirmedOrderId}`);
    else router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 130 }}>

        {/* ─── DELIVERY ADDRESS ─── */}
        <View style={styles.sectionHeader}>
          <LinearGradient colors={['#FF4DA6', '#7B5CFF']} style={styles.sectionIcon}>
            <Ionicons name="location-outline" size={16} color="#fff" />
          </LinearGradient>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
        </View>

        <View style={styles.card}>
          {[
            { key: 'name', label: 'Full Name', value: name, setter: setName, placeholder: 'e.g. Sharon Mulenga', keyboardType: 'default' as const },
            { key: 'phone', label: 'Phone Number', value: phone, setter: setPhone, placeholder: '+260 977 000 000', keyboardType: 'phone-pad' as const },
            { key: 'city', label: 'City / Town', value: city, setter: setCity, placeholder: 'e.g. Lusaka', keyboardType: 'default' as const },
          ].map(f => (
            <View key={f.key} style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <TextInput
                style={[styles.input, errors[f.key] ? styles.inputError : null]}
                placeholder={f.placeholder}
                placeholderTextColor={Colors.textSubtle}
                value={f.value}
                onChangeText={v => { f.setter(v); setErrors(p => ({ ...p, [f.key]: '' })); }}
                keyboardType={f.keyboardType}
                selectionColor="#FF4DA6"
              />
              {errors[f.key] ? <Text style={styles.errorText}>{errors[f.key]}</Text> : null}
            </View>
          ))}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Delivery Address</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.address ? styles.inputError : null]}
              placeholder="Street address, neighbourhood, house/plot number..."
              placeholderTextColor={Colors.textSubtle}
              value={address}
              onChangeText={v => { setAddress(v); setErrors(p => ({ ...p, address: '' })); }}
              multiline
              numberOfLines={3}
              selectionColor="#FF4DA6"
            />
            {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
          </View>
        </View>

        {/* ─── ORDER SUMMARY ─── */}
        <View style={styles.sectionHeader}>
          <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.sectionIcon}>
            <Ionicons name="bag-outline" size={16} color="#fff" />
          </LinearGradient>
          <Text style={styles.sectionTitle}>Order Summary</Text>
        </View>

        <View style={styles.card}>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>No items in bag</Text>
          ) : (
            items.map((item, idx) => (
              <View key={`${item.id}-${idx}`} style={[styles.orderRow, idx < items.length - 1 && styles.orderRowBorder]}>
                <View style={styles.orderItemDot}><Ionicons name="bag-outline" size={14} color={Colors.textSubtle} /></View>
                <Text style={styles.orderItemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.orderQty}>×{item.quantity}</Text>
                <Text style={styles.orderPrice}>{item.price}</Text>
              </View>
            ))
          )}
          {items.length > 0 ? (
            <>
              <View style={styles.totalDivider} />
              <View style={styles.totalRow}>
                <View>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <View style={styles.freeDeliveryRow}>
                    <Ionicons name="car-outline" size={13} color="#22C55E" />
                    <Text style={styles.freeDeliveryText}>Free Delivery</Text>
                  </View>
                </View>
                <Text style={styles.totalAmount}>{currency} {total.toLocaleString()}</Text>
              </View>
            </>
          ) : null}
        </View>

        {errors.submit ? <Text style={styles.errorText}>{errors.submit}</Text> : null}
      </ScrollView>

      {/* ─── STICKY FOOTER ─── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalAmount}>{currency} {total.toLocaleString()}</Text>
        </View>
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable onPress={placeOrder} disabled={loading}>
            <LinearGradient colors={['#FF4DA6', '#7B5CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.placeOrderBtn, loading && { opacity: 0.7 }]}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
              <Text style={styles.placeOrderText}>{loading ? 'Processing...' : 'Place Order'}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>

      {/* ─── SUCCESS MODAL ─── */}
      <Modal visible={showSuccess} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.successModal, { transform: [{ scale: successScale }], opacity: successOpacity }]}>
            <LinearGradient colors={['#FF4DA6', '#7B5CFF']} style={styles.successIconWrap}>
              <Ionicons name="checkmark" size={42} color="#fff" />
            </LinearGradient>
            <Text style={styles.confetti}>🎉</Text>
            <Text style={styles.successTitle}>Order Placed!</Text>
            <Text style={styles.successOrderId}>#{confirmedOrderId?.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.successSub}>Your order was received by the seller and is ready to be prepared.</Text>
            <Text style={styles.successSub}>{currency} {total.toLocaleString()} · Order received</Text>
            <Pressable onPress={handleSuccessClose} style={styles.successBtn} disabled={!confirmedOrderId}>
              <LinearGradient colors={['#FF4DA6', '#7B5CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.successBtnGrad}>
                <Text style={styles.successBtnText}>View Order</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22, marginBottom: 12 },
  sectionIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: Colors.surfaceElevated, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: Colors.textPrimary, fontSize: 15, borderWidth: 1.5, borderColor: Colors.border },
  inputError: { borderColor: '#FF3B30' },
  textArea: { height: 90, textAlignVertical: 'top', paddingTop: 12 },
  errorText: { color: '#FF3B30', fontSize: 12, marginTop: 4, fontWeight: '500' },
  payGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  payCard: { width: (width - 42) / 2, backgroundColor: Colors.surfaceCard, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, padding: 14, alignItems: 'center', gap: 6, position: 'relative' },
  payCardActive: { borderColor: '#FF4DA6', backgroundColor: 'rgba(255,77,166,0.06)' },
  payCheckmark: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  payEmoji: { fontSize: 28 },
  payLabel: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14, textAlign: 'center' },
  paySub: { color: Colors.textSubtle, fontSize: 11, textAlign: 'center' },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  orderRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  orderItemDot: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  orderItemName: { flex: 1, color: Colors.textPrimary, fontSize: 14 },
  orderQty: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  orderPrice: { color: '#FF4DA6', fontWeight: '800', fontSize: 15 },
  totalDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  freeDeliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  freeDeliveryText: { color: '#22C55E', fontSize: 12, fontWeight: '600' },
  totalAmount: { color: Colors.textPrimary, fontWeight: '900', fontSize: 22 },
  emptyText: { color: Colors.textSubtle, fontSize: 14, textAlign: 'center', paddingVertical: 12 },
  deliveryNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: 'rgba(123,92,255,0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(123,92,255,0.18)' },
  deliveryNoteText: { color: Colors.textSecondary, fontSize: 13, flex: 1 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surfaceCard, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border, gap: 12 },
  footerTotal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerTotalLabel: { color: Colors.textSubtle, fontSize: 13, fontWeight: '600' },
  footerTotalAmount: { color: Colors.textPrimary, fontWeight: '900', fontSize: 20 },
  placeOrderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, paddingVertical: 16 },
  placeOrderText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  successModal: { backgroundColor: Colors.surfaceCard, borderRadius: 28, padding: 28, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  successIconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  confetti: { fontSize: 36, marginBottom: 12 },
  successTitle: { color: Colors.textPrimary, fontSize: 28, fontWeight: '900', marginBottom: 6 },
  successOrderId: { color: '#7B5CFF', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  successSub: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 20 },
  successInfoCard: { width: '100%', backgroundColor: Colors.surfaceElevated, borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  successInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  successInfoText: { flex: 1, color: Colors.textSecondary, fontSize: 13 },
  successInfoValue: { color: Colors.textPrimary, fontWeight: '700', fontSize: 13 },
  successBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  successBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  successBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
