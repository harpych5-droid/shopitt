import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { DbOrder, fetchOrderById, updateOrderStatus } from '@/services/ordersService';
import { supabase } from '@/lib/supabase';

export default function OrderTrackingScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { id }  = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [order,   setOrder]   = useState<DbOrder | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch order ───────────────────────────────────────────────────────────
  const load = async () => {
    if (!user) return;
    if (!id) {
      setOrder(null);
      setLoading(false);
      return;
    }
    const { data } = await fetchOrderById(id);
    setOrder(data && (data.buyer_id === user.id || data.seller_id === user.id) ? data : null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id, user?.id]);

  // ── Real-time subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`order_tracking_${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${id}`,
      }, (payload) => {
        setOrder(prev => prev ? { ...prev, ...(payload.new as Partial<DbOrder>) } : prev);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // ── Seller: update status ─────────────────────────────────────────────────
  const handleAdvanceStatus = async () => {
    if (!order) return;
    const next = order.status === 'pending' ? 'preparing' : 'delivered';
    if (order.status !== 'delivered' && order.status !== 'cancelled') {
      await updateOrderStatus(order.id, next);
      setOrder(prev => prev ? { ...prev, status: next } : prev);
    }
  };

  const isSeller = user?.id === order?.seller_id;

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#FF4DA6" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }]}>
        <StatusBar style="light" />
        <Ionicons name="receipt-outline" size={52} color={Colors.textSubtle} />
        <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>
          Order not found
        </Text>
        <Pressable style={styles.backBtnCenter} onPress={() => router.back()}>
          <Text style={{ color: '#FF4DA6', fontWeight: '700' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isCancelled   = order.status === 'cancelled';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={['rgba(14,14,14,1)', 'rgba(14,14,14,0.92)']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <Text style={styles.headerTitle}>Order Tracking</Text>
          <Text style={styles.headerSub}>#{order.id.slice(0, 8).toUpperCase()}</Text>
        </View>
        {isCancelled ? (
          <View style={styles.cancelledBadge}>
            <Text style={styles.cancelledText}>Cancelled</Text>
          </View>
        ) : (
          <LinearGradient
            colors={['#FF4DA6', '#7B5CFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusBadge}
          >
            <Text style={styles.statusBadgeText}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</Text>
          </LinearGradient>
        )}
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <Text style={styles.addressLine}>{order.status === 'pending' ? 'Order received' : order.status === 'preparing' ? 'Preparing' : 'Completed'}</Text>
        </View>

        {/* Product snapshot */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product</Text>
          <View style={styles.orderItem}>
            {order.product_snapshot?.image ? (
              <Image source={{ uri: order.product_snapshot.image }} style={styles.itemImage} contentFit="cover" />
            ) : (
              <View style={[styles.itemImage, { backgroundColor: Colors.surfaceCard, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="bag-outline" size={24} color={Colors.textSubtle} />
              </View>
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{order.product_snapshot?.title ?? 'Product'}</Text>
              <Text style={styles.itemQty}>Qty: {order.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>{order.currency} {Number(order.total_price).toLocaleString()}</Text>
          </View>
        </View>

        {/* Delivery address */}
        {order.shipping_address_snapshot ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addressCard}>
              <View style={styles.addressIconWrap}>
                <LinearGradient colors={['#FF4DA6', '#7B5CFF']} style={styles.addressIcon}>
                  <Ionicons name="location-outline" size={16} color="#fff" />
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressName}>{order.shipping_address_snapshot.full_name}</Text>
                <Text style={styles.addressLine}>{order.shipping_address_snapshot.line1}</Text>
                <Text style={styles.addressLine}>{order.shipping_address_snapshot.city}, {order.shipping_address_snapshot.country}</Text>
                <Text style={styles.addressPhone}>{order.shipping_address_snapshot.phone}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Payment summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Order total</Text>
              <Text style={styles.summaryValue}>{order.currency} {Number(order.total_price).toLocaleString()}</Text>
            </View>
            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 }]}>
              <Text style={[styles.summaryLabel, { fontWeight: '800', color: Colors.textPrimary }]}>Total</Text>
              <LinearGradient
                colors={['#FF4DA6', '#7B5CFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.totalBadge}
              >
                <Text style={styles.totalText}>{order.currency} {Number(order.total_price).toLocaleString()}</Text>
              </LinearGradient>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Seller: Advance status button */}
      {isSeller && !isCancelled && order.status !== 'delivered' ? (
        <View style={[styles.sellerCTA, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable onPress={handleAdvanceStatus}>
            <LinearGradient
              colors={['#FF4DA6', '#7B5CFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.advanceBtn}
            >
              <Ionicons name="arrow-forward-circle-outline" size={22} color="#fff" />
                <Text style={styles.advanceBtnText}>
                {order.status === 'pending' ? 'Start preparing'
                  : 'Complete order'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  headerSub: { color: Colors.textSubtle, fontSize: 12, marginTop: 2 },

  statusBadge: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  statusBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  cancelledBadge: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  cancelledText: { color: Colors.error, fontWeight: '700', fontSize: 13 },

  deliveryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    margin: 16, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,77,166,0.2)',
  },
  deliveryLabel: { color: Colors.textSubtle, fontSize: 12, fontWeight: '600', marginBottom: 2 },
  deliveryDate: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800' },
  deliveredTag: {
    backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)',
  },
  deliveredTagText: { color: '#22C55E', fontSize: 12, fontWeight: '700' },

  timelineSection: { paddingHorizontal: 24, paddingVertical: 8 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 16 },

  timeline: { paddingLeft: 4 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingBottom: 6 },
  connector: {
    position: 'absolute', left: 19, top: -20, width: 2, height: 26,
    backgroundColor: Colors.border,
  },
  connectorActive: { backgroundColor: '#22C55E' },

  dotActive: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF4DA6', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  dotDone: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 2, borderColor: '#22C55E',
  },
  dotPending: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  stepLabel: { flex: 1, paddingTop: 10, paddingBottom: 20 },
  stepTitle: { color: Colors.textSubtle, fontSize: 15, fontWeight: '600', marginBottom: 4 },
  stepTitleActive: { color: Colors.textPrimary, fontWeight: '800' },
  stepDesc: { color: Colors.textSubtle, fontSize: 13, lineHeight: 18 },

  section: { paddingHorizontal: 20, paddingVertical: 12 },

  orderItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surfaceCard, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  itemImage: { width: 56, height: 56, borderRadius: 10 },
  itemInfo: { flex: 1 },
  itemName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  itemQty: { color: Colors.textSubtle, fontSize: 12 },
  itemPrice: { color: '#FF4DA6', fontWeight: '800', fontSize: 15 },

  addressCard: {
    flexDirection: 'row', gap: 14, alignItems: 'flex-start',
    backgroundColor: Colors.surfaceCard, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  addressIconWrap: {},
  addressIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  addressName: { color: Colors.textPrimary, fontWeight: '700', fontSize: 15, marginBottom: 4 },
  addressLine: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  addressPhone: { color: Colors.textSubtle, fontSize: 13, marginTop: 4 },

  summaryCard: {
    backgroundColor: Colors.surfaceCard, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: Colors.textSecondary, fontSize: 14 },
  summaryValue: { color: Colors.textPrimary, fontWeight: '600', fontSize: 14 },
  totalBadge: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6 },
  totalText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  paymentMethodRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  paymentMethodText: { color: Colors.textSubtle, fontSize: 13 },

  sellerCTA: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  advanceBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 16, paddingVertical: 18, minHeight: 56,
  },
  advanceBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },

  backBtnCenter: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 24 },
});
