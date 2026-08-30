import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated,
  NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from 'expo-router';
import { Colors } from '@/constants/theme';
import { fetchFeedPosts, DbPost } from '@/services/postsService';
import { toggleLike, toggleSave, fetchLikedPostIds, fetchSavedPostIds, getLikesCount } from '@/services/likesService';
import TopNavBar from '@/components/layout/TopNavBar';
import CategoryTabs from '@/components/layout/CategoryTabs';
import FeedPost from '@/components/feature/FeedPost';
import FloatingBag from '@/components/ui/FloatingBag';
import { useAuth } from '@/contexts/AuthContext';

const NAV_HEIGHT = 56;
const TAB_HEIGHT = 44;
const NAV_HIDE_OFFSET = 24;
const NAV_DIRECTION_THRESHOLD = 8;

// ── Mock fallback posts (typed as DbPost) ────────────────────────────────────
const MOCK_DB_POSTS: DbPost[] = [
  {
    id: 'mock-1',
    user_id: 'mock',
    title: 'Air Jordan 1 Retro High',
    description: 'Fresh drop just landed 🏀 These go hard with anything #sneakers #jordan #shopzambia',
    media_url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=1000&fit=crop',
    media_urls: [],
    media: [],
    media_type: 'image',
    price: 1800,
    stock_quantity: 2,
    post_type: 'product',
    delivery_type: 'local',
    hashtags: ['sneakers', 'jordan', 'shopzambia', 'kicks'],
    sizes: ['41', '42', '43', '44', '45'],
    colors: ['Black/White', 'Red/Black'],
    currency: 'K',
    is_available: true,
    created_at: new Date().toISOString(),
    profiles: {
      username: 'lusaka_sneakerhead',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
  },
  {
    id: 'mock-2',
    user_id: 'mock',
    title: 'Oversized Hoodie Drop',
    description: 'New collection just dropped. Streetwear for the culture 🙌 #streetwear #shopzambia',
    media_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop',
    media_urls: [],
    media: [],
    media_type: 'image',
    price: 450,
    stock_quantity: 5,
    post_type: 'product',
    delivery_type: 'country',
    hashtags: ['streetwear', 'shopzambia', 'hoodie', 'fashion'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'White', 'Navy'],
    currency: 'K',
    is_available: true,
    created_at: new Date().toISOString(),
    profiles: {
      username: 'zm_fashion_house',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    },
  },
  {
    id: 'mock-3',
    user_id: 'mock',
    title: 'Vintage Accessories',
    description: 'Curated for the culture 💎 #fashion #shopzambia #lusaka',
    media_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=1000&fit=crop',
    media_urls: [],
    media: [],
    media_type: 'image',
    price: 215,
    stock_quantity: null,
    post_type: 'product',
    delivery_type: 'local',
    hashtags: ['fashion', 'shopzambia', 'shopitt', 'lusaka'],
    sizes: [],
    colors: [],
    currency: 'K',
    is_available: true,
    created_at: new Date().toISOString(),
    profiles: {
      username: 'sharonmulenga_plug',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
    },
  },
  {
    id: 'mock-4',
    user_id: 'mock',
    title: 'Bridal Package',
    description: 'Full bridal glam package ✨ Book your date before slots fill up #beauty #bridal',
    media_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=1000&fit=crop',
    media_urls: [],
    media: [],
    media_type: 'image',
    price: 800,
    stock_quantity: null,
    post_type: 'service',
    delivery_type: null,
    hashtags: ['beauty', 'bridal', 'zambia', 'makeup'],
    sizes: [],
    colors: [],
    currency: 'K',
    is_available: true,
    created_at: new Date().toISOString(),
    profiles: {
      username: 'beauty_by_chanda',
      avatar_url: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop',
    },
  },
];

function SkeletonPost() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return (
    <View style={sk.post}>
      <View style={sk.header}>
        <Animated.View style={[sk.avatar, { opacity }]} />
        <View style={sk.headerInfo}>
          <Animated.View style={[sk.line, { width: 120, opacity }]} />
          <Animated.View style={[sk.line, { width: 80, marginTop: 6, opacity }]} />
        </View>
      </View>
      <Animated.View style={[sk.media, { opacity }]} />
      <View style={{ padding: 14, gap: 8 }}>
        <Animated.View style={[sk.line, { width: '70%', opacity }]} />
        <Animated.View style={[sk.line, { width: '50%', opacity }]} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const scrollY     = useRef(new Animated.Value(0)).current;
  const directionAnchorY = useRef(0);
  const navTranslate = useRef(new Animated.Value(0)).current;
  const navHidden = useRef(false);
  const navigation = useNavigation();

  const [likedPosts,  setLikedPosts]  = useState<Set<string>>(new Set());
  const [savedPosts,  setSavedPosts]  = useState<Set<string>>(new Set());
  const [likesCounts, setLikesCounts] = useState<Record<string, number>>({});
  const [posts,       setPosts]       = useState<DbPost[]>([]);
  const [loading,     setLoading]     = useState(true);

  // ── Load feed ────────────────────────────────────────────────────────────
  useEffect(() => { loadFeed(); }, [user?.id]);

  const loadFeed = async () => {
    setLoading(true);
    const [feedResult, likedIds, savedIds] = await Promise.all([
      fetchFeedPosts(30),
      user ? fetchLikedPostIds(user.id) : Promise.resolve<string[]>([]),
      user ? fetchSavedPostIds(user.id) : Promise.resolve<string[]>([]),
    ]);

    const dbPosts = (feedResult.data && feedResult.data.length > 0)
      ? feedResult.data
      : MOCK_DB_POSTS;

    setPosts(dbPosts);
    if (likedIds.length) setLikedPosts(new Set(likedIds));
    if (savedIds.length) setSavedPosts(new Set(savedIds));

    // Fetch like counts for real posts
    if (feedResult.data && feedResult.data.length > 0) {
      const counts: Record<string, number> = {};
      await Promise.all(
        feedResult.data.slice(0, 10).map(async p => {
          counts[p.id] = await getLikesCount(p.id);
        })
      );
      setLikesCounts(counts);
    }

    setLoading(false);
  };

  // ── Scroll-aware navbar hide/show ────────────────────────────────────────
  const setNavigationVisibility = (hidden: boolean) => {
    if (navHidden.current === hidden) return;
    navHidden.current = hidden;

    Animated.timing(navTranslate, {
      toValue: hidden ? -(NAV_HEIGHT + TAB_HEIGHT + insets.top) : 0,
      duration: 140,
      useNativeDriver: true,
    }).start();

    navigation.setOptions({
      tabBarStyle: hidden
        ? { display: 'none' }
        : {
            height: Platform.select({ ios: insets.bottom + 60, android: 70, default: 70 }),
            paddingTop: 8,
            paddingBottom: Platform.select({ ios: insets.bottom + 8, android: 10, default: 8 }),
            backgroundColor: '#0A0A0A',
            borderTopWidth: 1,
            borderTopColor: '#1E1E1E',
          },
    });
  };

  useEffect(() => () => {
    navigation.setOptions({ tabBarStyle: undefined });
  }, [navigation]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentY = e.nativeEvent.contentOffset.y;
        const distance = currentY - directionAnchorY.current;
        if (currentY <= NAV_HIDE_OFFSET) {
          setNavigationVisibility(false);
          directionAnchorY.current = currentY;
        } else if (distance >= NAV_DIRECTION_THRESHOLD) {
          setNavigationVisibility(true);
          directionAnchorY.current = currentY;
        } else if (distance <= -NAV_DIRECTION_THRESHOLD) {
          setNavigationVisibility(false);
          directionAnchorY.current = currentY;
        }
      },
    }
  );

  // ── Like toggle (optimistic) ──────────────────────────────────────────────
  const handleLike = useCallback(async (id: string) => {
    const wasLiked = likedPosts.has(id);

    setLikedPosts(prev => {
      const next = new Set(prev);
      wasLiked ? next.delete(id) : next.add(id);
      return next;
    });
    setLikesCounts(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] ?? 0) + (wasLiked ? -1 : 1)),
    }));

    if (user) {
      const { error } = await toggleLike(user.id, id);
      if (error) {
        // Revert on error
        setLikedPosts(prev => {
          const next = new Set(prev);
          wasLiked ? next.add(id) : next.delete(id);
          return next;
        });
        setLikesCounts(prev => ({
          ...prev,
          [id]: Math.max(0, (prev[id] ?? 0) + (wasLiked ? 1 : -1)),
        }));
      }
    }
  }, [user?.id, likedPosts]);

  // ── Save toggle ───────────────────────────────────────────────────────────
  const handleSave = useCallback(async (id: string) => {
    setSavedPosts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    if (user) {
      await toggleSave(user.id, id);
    }
  }, [user?.id]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Animated.View style={[styles.stickyHeader, { transform: [{ translateY: navTranslate }] }]}>
        <TopNavBar />
        <CategoryTabs />
      </Animated.View>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: NAV_HEIGHT + TAB_HEIGHT + insets.top + 8 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {loading ? (
          <>
            <SkeletonPost />
            <SkeletonPost />
            <SkeletonPost />
          </>
        ) : (
          posts.map(post => (
            <FeedPost
              key={post.id}
              post={post}
              likesCount={likesCounts[post.id] ?? 0}
              liked={likedPosts.has(post.id)}
              saved={savedPosts.has(post.id)}
              onLike={() => handleLike(post.id)}
              onSave={() => handleSave(post.id)}
            />
          ))
        )}
        <View style={{ height: 24 }} />
      </Animated.ScrollView>

      <FloatingBag />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  stickyHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    zIndex: 100, backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
});

const sk = StyleSheet.create({
  post: { marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.surfaceCard },
  headerInfo: { flex: 1 },
  line: { height: 12, borderRadius: 6, backgroundColor: Colors.surfaceCard },
  media: { width: '100%', height: 360, backgroundColor: Colors.surfaceCard },
});
