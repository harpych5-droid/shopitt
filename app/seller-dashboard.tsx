import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import FloatingBag from '@/components/ui/FloatingBag';
import { useAuth } from '@/contexts/AuthContext';
import { fetchSellerOrders, updateOrderStatus, DbOrder } from '@/services/ordersService';
import { fetchWalletBalance } from '@/services/walletService';
import { WEEKLY_REVENUE } from '@/services/mockData';
import OrderCard from '@/components/feature/OrderCard';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CHART_MAX = 12400;
const CHART_HEIGHT = 110;

type FilterType = 'all' | 'pending' | 'preparing' | 'delivered';

const TOP_PRODUCTS = [
  { id: '1', name: 'Air Jordan 1 Retro High', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop', sold: 89, revenue: 'K160,200', badge: '🔥 Top Seller' },
  { id: '2', name: 'Oversized Hoodie – Black', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=200&fit=crop', sold: 412, revenue: 'K185,400', badge: '⚡ Trending' },
  { id: '3', name: 'Nike Dunk Low', image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=200&h=200&fit=crop', sold: 47, revenue: 'K56,400', badge: '✅ Popular' },
];

function AnimatedBar({ value, isActive, delay }: { value: number; isActive: boolean; delay: number }) {
  const height = useSharedValue(0);
  const targetH = Math.max(8, (value / CHART_MAX) * CHART_HEIGHT);

  useEffect(() => {
    const t = setTimeout(() => {
      height.value = withTiming(targetH, { duration: 600 });
    }, delay);
    return () => clearTimeout(t);
  }, []);

  const animStyle = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <Animated.View style={[styles.barInner, animStyle]}>
      {isActive ? (
        <LinearGradient colors={['#FF4DA6', '#7B5CFF']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1, borderRadius: 6 }} />
      ) : (
        <View style={{ flex: 1, borderRadius: 6, backgroundColor: 'rgba(123,92,255,0.5)' }} />
      )}
    </Animated.View>
  );
}

export default function SellerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      fetchSellerOrders(user.id),
      fetchWalletBalance(user.id),
    ]).then(([ordersRes, balance]) => {
      setOrders(ordersRes.data ?? []);
      setWalletBalance(balance);
    }).finally(() => setLoading(false));
  }, [user]);

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const advanceOrder = (id: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      return { ...o, status: 'preparing', isNew: false };
    }));
    if (user) updateOrderStatus(id, 'preparing');
  };

  const deliverOrder = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'delivered' as const } : o));
    if (user) updateOrderStatus(id, 'delivered');
  };

  const pending = orders.filter(o => o.status === 'pending').length;
  const preparing = orders.filter(o => o.status === 'preparing').length;
  const delivered = orders.filter(o => o.status === 'delivered').length;

  const filterOptions: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: orders.length },
    { key: 'pending', label: 'Pending', count: pending },
    { key: 'preparing', label: 'Preparing', count: preparing },
    { key: 'delivered', label: 'Delivered', count: delivered },
  ];

  const displayBalance = walletBalance !== null
    ? `K ${walletBalance.toLocaleString()}`
    : 'K 49,100';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <LinearGradient colors={['#FF4DA6', '#7B5CFF']} style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>S</Text>
          </LinearGradient>
          <Text style={styles.headerTitle}>Seller Dashboard</Text>
        </View>
        <Feather name="shield" size={22} color={Colors.textPrimary} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}>

        {/* ─── REVENUE CHART ─── */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Revenue This Week</Text>
            <LinearGradient colors={['#FF4DA6', '#7B5CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.revenueBadge}>
              <Text style={styles.revenueText}>K 49,100</Text>
            </LinearGradient>
          </View>

          <View style={styles.chartContainer}>
            {WEEKLY_REVENUE.map((d, idx) => {
              const isActive = d.day === 'SAT';
              return (
                <View key={d.day} style={styles.barColumn}>
                  <View style={[styles.barBg, { height: CHART_HEIGHT }]}>
                    <AnimatedBar value={d.value} isActive={isActive} delay={idx * 70} />
                  </View>
                  <Text style={[styles.barDay, isActive && { color: '#FF4DA6', fontWeight: '700' }]}>{d.day}</Text>
                  <Text style={[styles.barLabel, isActive && { color: '#FF4DA6', fontWeight: '700' }]}>{d.label}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.chartFooter}>
            <View style={styles.peakRow}>
              <View style={styles.peakDot} />
              <Text style={styles.peakText}>Peak: Saturday</Text>
            </View>
            <Text style={styles.vsText}>↗ +28% vs last week</Text>
          </View>
        </View>

        {/* ─── STAT CARDS ─── */}
        <View style={styles.statsGrid}>
          {[
            { num: pending, label: 'Pending', color: '#F59E0B' },
            { num: preparing, label: 'Preparing', color: '#3B82F6' },
            { num: delivered, label: 'Delivered', color: '#22C55E' },
            { num: 'K49K', label: 'Revenue', color: '#FF4DA6' },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { borderColor: s.color }]}>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ─── FILTER CHIPS ─── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginHorizontal: -16 }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8 }}>
            {filterOptions.map(opt => (
              <Pressable key={opt.key} onPress={() => setFilter(opt.key)} style={[styles.filterChip, filter === opt.key && styles.filterChipActive]}>
                {filter === opt.key ? (
                  <LinearGradient colors={['#FF4DA6', '#7B5CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.filterChipGrad}>
                    <Text style={styles.filterChipActiveText}>{opt.label} ({opt.count})</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.filterChipText}>{opt.label} ({opt.count})</Text>
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* ─── ORDERS ─── */}
        {filteredOrders.map(order => (
          <OrderCard key={order.id} order={order} onConfirm={advanceOrder} onDeliver={deliverOrder} />
        ))}

        {/* ─── TOP PRODUCTS ─── */}
        <View style={styles.topProductsHeader}>
          <LinearGradient colors={['#FF4DA6', '#7B5CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.topProductsBadge}>
            <Text style={styles.topProductsBadgeText}>🏆 Top Products</Text>
          </LinearGradient>
          <Text style={styles.topProductsSub}>This week</Text>
        </View>

        {TOP_PRODUCTS.map((product, idx) => (
          <Pressable key={product.id} style={({ pressed }) => [styles.topProductCard, pressed && { opacity: 0.85 }]}>
            <View style={[styles.rankBadge, { backgroundColor: idx === 0 ? '#F59E0B' : Colors.surfaceElevated }]}>
              <Text style={[styles.rankText, { color: idx === 0 ? '#fff' : Colors.textSubtle }]}>#{idx + 1}</Text>
            </View>
            <Image source={{ uri: product.image }} style={styles.productImg} contentFit="cover" />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
              <View style={styles.productBadgeRow}>
                <View style={styles.productBadge}>
                  <Text style={styles.productBadgeText}>{product.badge}</Text>
                </View>
              </View>
              <View style={styles.productMetaRow}>
                <View style={styles.productMeta}>
                  <Text style={styles.productMetaLabel}>Sold</Text>
                  <Text style={styles.productMetaValue}>{product.sold}</Text>
                </View>
                <View style={styles.productMetaDivider} />
                <View style={styles.productMeta}>
                  <Text style={styles.productMetaLabel}>Revenue</Text>
                  <Text style={[styles.productMetaValue, { color: '#22C55E' }]}>{product.revenue}</Text>
                </View>
              </View>
            </View>
            <LinearGradient
              colors={idx === 0 ? ['rgba(255,77,166,0.15)', 'rgba(123,92,255,0.15)'] : ['rgba(123,92,255,0.08)', 'rgba(123,92,255,0.04)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Pressable>
        ))}

        {/* ─── WALLET SHORTCUT ─── */}
        <Pressable style={({ pressed }) => [styles.walletShortcut, pressed && { opacity: 0.85 }]} onPress={() => router.push('/wallet')}>
          <LinearGradient colors={['#FF4DA6', '#A855F7', '#7B5CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.walletShortcutGrad}>
            <Ionicons name="wallet-outline" size={22} color="#fff" />
            <View style={styles.walletShortcutInfo}>
              <Text style={styles.walletShortcutLabel}>My Wallet Balance</Text>
              <Text style={styles.walletShortcutAmount}>{displayBalance}</Text>
            </View>
            <Feather name="arrow-right" size={20} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  headerTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800' },
  chartCard: { backgroundColor: Colors.surfaceCard, borderRadius: 18, padding: 18, marginTop: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  chartTitle: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
  revenueBadge: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  revenueText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 },
  barColumn: { flex: 1, alignItems: 'center' },
  barBg: { justifyContent: 'flex-end', width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 6, overflow: 'hidden' },
  barInner: { width: '100%', overflow: 'hidden' },
  barDay: { color: Colors.textSubtle, fontSize: 10, marginTop: 6, fontWeight: '600' },
  barLabel: { color: Colors.textSubtle, fontSize: 10, fontWeight: '500' },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  peakRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  peakDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF4DA6' },
  peakText: { color: Colors.textSecondary, fontSize: 13 },
  vsText: { color: '#22C55E', fontSize: 13, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.surfaceCard, borderRadius: 14, borderWidth: 1.5, padding: 14, alignItems: 'center' },
  statNum: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '700' },
  filterChip: { borderRadius: 999, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceCard, overflow: 'hidden' },
  filterChipActive: { borderColor: 'transparent' },
  filterChipGrad: { paddingHorizontal: 16, paddingVertical: 9 },
  filterChipText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 14, paddingHorizontal: 16, paddingVertical: 9 },
  filterChipActiveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  topProductsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 28, marginBottom: 14 },
  topProductsBadge: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  topProductsBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  topProductsSub: { color: Colors.textSubtle, fontSize: 12, fontWeight: '600' },
  topProductCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', position: 'relative' },
  rankBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontWeight: '800', fontSize: 13 },
  productImg: { width: 56, height: 56, borderRadius: 12 },
  productInfo: { flex: 1 },
  productName: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  productBadgeRow: { flexDirection: 'row', marginBottom: 6 },
  productBadge: { backgroundColor: 'rgba(123,92,255,0.12)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  productBadgeText: { color: '#7B5CFF', fontSize: 11, fontWeight: '700' },
  productMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productMeta: { alignItems: 'flex-start' },
  productMetaLabel: { color: Colors.textSubtle, fontSize: 10, fontWeight: '600' },
  productMetaValue: { color: Colors.textPrimary, fontWeight: '700', fontSize: 13 },
  productMetaDivider: { width: 1, height: 22, backgroundColor: Colors.border },
  walletShortcut: { marginTop: 20, borderRadius: 18, overflow: 'hidden' },
  walletShortcutGrad: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 18 },
  walletShortcutInfo: { flex: 1 },
  walletShortcutLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  walletShortcutAmount: { color: '#fff', fontWeight: '900', fontSize: 22 },
});
