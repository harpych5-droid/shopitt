export interface Post {
  id: string;
  username: string;
  avatar: string;
  verified: boolean;
  location: string;
  ships24h: boolean;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  dropTitle: string;
  scarcity: string | null;
  price: string;
  freeDelivery: boolean;
  ctaType: 'Buy Now' | 'Book Now';
  likes: number;
  sold: number;
  caption: string;
  hashtags: string[];
  comments: number;
  topComment?: { username: string; text: string };
}

export interface ShortVideo {
  id: string;
  username: string;
  avatar: string;
  videoUrl: string;
  caption: string;
  likes: number;
  comments: number;
  price: string;
  sold: number;
  scarcity: string | null;
  hasProduct: boolean;
}

export interface Notification {
  id: string;
  avatar: string;
  username: string;
  action: string;
  timeAgo: string;
  type: 'like' | 'comment' | 'follow' | 'order' | 'sold';
}

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    username: 'sharonmulenga_plug',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
    verified: true,
    location: 'Kabwe',
    ships24h: true,
    mediaUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=1000&fit=crop',
    mediaType: 'image',
    dropTitle: 'Air Jordan 1',
    scarcity: 'Only 2 left',
    price: 'K215',
    freeDelivery: true,
    ctaType: 'Buy Now',
    likes: 23400,
    sold: 336,
    caption: 'Vintage accessories 💎 Curated for the culture #streetstyle',
    hashtags: ['#fashion', '#shopzambia', '#shopitt', '#lusaka'],
    comments: 896,
    topComment: { username: 'lusaka_drip', text: 'These are 🔥🔥 need them in my life' },
  },
  {
    id: '2',
    username: 'lusaka_sneakerhead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    verified: false,
    location: 'Lusaka',
    ships24h: true,
    mediaUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=1000&fit=crop',
    mediaType: 'image',
    dropTitle: 'Air Jordan 1 Retro High',
    scarcity: 'Only 2 left',
    price: 'K1,800',
    freeDelivery: false,
    ctaType: 'Buy Now',
    likes: 8500,
    sold: 89,
    caption: 'Fresh drop just landed 🏀 These go hard with anything',
    hashtags: ['#sneakers', '#jordan', '#shopzambia', '#kicks'],
    comments: 234,
    topComment: { username: 'zm_drip', text: 'Price is K1800 or negotiable?' },
  },
  {
    id: '3',
    username: 'zm_fashion_house',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    verified: true,
    location: 'Ndola',
    ships24h: true,
    mediaUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop',
    mediaType: 'image',
    dropTitle: 'Oversized Hoodie Drop',
    scarcity: 'Only 5 left',
    price: 'K450',
    freeDelivery: true,
    ctaType: 'Buy Now',
    likes: 15200,
    sold: 412,
    caption: 'New collection just dropped. Streetwear for the culture 🙌',
    hashtags: ['#streetwear', '#shopzambia', '#hoodie', '#fashion'],
    comments: 512,
    topComment: { username: 'copperbelt_fits', text: 'Slay in this daily 💜' },
  },
  {
    id: '4',
    username: 'beauty_by_chanda',
    avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop',
    verified: false,
    location: 'Livingstone',
    ships24h: false,
    mediaUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=1000&fit=crop',
    mediaType: 'image',
    dropTitle: 'Bridal Package',
    scarcity: null,
    price: 'K800',
    freeDelivery: false,
    ctaType: 'Book Now',
    likes: 6700,
    sold: 28,
    caption: 'Full bridal glam package ✨ Book your date before slots fill up',
    hashtags: ['#beauty', '#bridal', '#zambia', '#makeup'],
    comments: 189,
    topComment: { username: 'lusaka_bride', text: 'Booked! So excited 💕' },
  },
];

export const MOCK_SHORTS: ShortVideo[] = [
  {
    id: '1',
    username: 'lusaka_sneakerhead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    videoUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&h=900&fit=crop',
    caption: 'Limited edition. Only 1 left 👟 #sneakers #jordan',
    likes: 28900,
    comments: 412,
    price: 'K2,200',
    sold: 47,
    scarcity: 'Only 1 left',
    hasProduct: true,
  },
  {
    id: '2',
    username: 'zm_fashion_house',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    videoUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=900&fit=crop',
    caption: 'New hoodie collection drop 🔥 #streetwear #fashion',
    likes: 15400,
    comments: 298,
    price: 'K450',
    sold: 89,
    scarcity: 'Only 3 left',
    hasProduct: true,
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
    username: 'sharonmulenga_plug',
    action: 'liked your product post • Air Jordan 1',
    timeAgo: '2m ago',
    type: 'like',
  },
  {
    id: '2',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    username: 'lusaka_sneakerhead',
    action: 'started following you',
    timeAgo: '15m ago',
    type: 'follow',
  },
  {
    id: '3',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop',
    username: 'the_joystreet_shop',
    action: 'placed an order • Air Jordan 1 Retro High',
    timeAgo: '3h ago',
    type: 'order',
  },
  {
    id: '4',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    username: 'zm_isaacbanda_plug',
    action: 'commented: "Is this still available?"',
    timeAgo: '4h ago',
    type: 'comment',
  },
  {
    id: '5',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    username: 'zm_fashion_house',
    action: 'saved your post • Vintage Watch',
    timeAgo: '5h ago',
    type: 'like',
  },
  {
    id: '6',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    username: 'copperbelt_fits',
    action: '✅ 89 sold milestone on Air Jordan 1!',
    timeAgo: '6h ago',
    type: 'sold',
  },
];

export const WEEKLY_REVENUE = [
  { day: 'MON', value: 3200, label: '3.2K' },
  { day: 'TUE', value: 5800, label: '5.8K' },
  { day: 'WED', value: 4100, label: '4.1K' },
  { day: 'THU', value: 7200, label: '7.2K' },
  { day: 'FRI', value: 9600, label: '9.6K' },
  { day: 'SAT', value: 12400, label: '12.4K' },
  { day: 'SUN', value: 6800, label: '6.8K' },
];
