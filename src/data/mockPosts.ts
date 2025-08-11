import img1 from "@/assets/shopit-post-1.jpg";
import img2 from "@/assets/shopit-post-2.jpg";
import img3 from "@/assets/shopit-post-3.jpg";
import img4 from "@/assets/shopit-post-4.jpg";
import { type Post } from "@/components/feed/PostCard";

export const mockPosts: Post[] = [
  {
    id: "p1",
    product: {
      id: "prod-1",
      title: "Linen Summer Shirt",
      price: 49,
      currency: "$",
      media: [img1],
      seller: { name: "Ava Carter", handle: "avacrafts" },
    },
    caption: "Breathable, soft, and perfect for sunny days.",
    hashtags: ["linen", "summer", "handmade"],
    likes: 320,
  },
  {
    id: "p2",
    product: {
      id: "prod-2",
      title: "Minimal Leather Tote",
      price: 129,
      currency: "$",
      media: [img2],
      seller: { name: "Noah Stone", handle: "stonegoods" },
    },
    caption: "Carry-on elegance with all-day durability.",
    hashtags: ["leather", "everyday", "essentials"],
    likes: 842,
  },
  {
    id: "p3",
    product: {
      id: "prod-3",
      title: "Studio Headphones",
      price: 199,
      currency: "$",
      media: [img3],
      seller: { name: "Maya Beats", handle: "mayamix" },
    },
    caption: "Lose yourself in the sound.",
    hashtags: ["audio", "music", "studio"],
    likes: 1542,
  },
  {
    id: "p4",
    product: {
      id: "prod-4",
      title: "Ceramic Mug Set",
      price: 39,
      currency: "$",
      media: [img4],
      seller: { name: "Clay Co.", handle: "clayco" },
    },
    caption: "Wheel-thrown with a satin glaze.",
    hashtags: ["ceramics", "home", "coffee"],
    likes: 410,
  },
  // repeatable for infinite demo
  {
    id: "p5",
    product: {
      id: "prod-5",
      title: "Athleisure Sneakers",
      price: 89,
      currency: "$",
      media: [img2],
      seller: { name: "Swift Run", handle: "swiftrun" },
    },
    caption: "Lightweight comfort for every move.",
    hashtags: ["sneakers", "comfort", "daily"],
    likes: 102,
  },
];
