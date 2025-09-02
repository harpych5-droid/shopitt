"use client"

import PostCard from "../components/PostCard"
import Navbar from "../components/Navbar"
import MobileNav from "../components/MobileNav"
import SideNav from "../components/SideNav"

export default function Home() {
  const feed = [
    {
      user: { initials: "AC", name: "Ava Carter", handle: "avacrafts" },
      product: {
        title: "Linen Summer Shirt",
        description: "Breathable, soft, and perfect for sunny days.",
        price: "$49",
        tags: "#linen #summer #handmade",
        image: "https://via.placeholder.com/400x600.png?text=Summer+Shirt",
      },
      likes: 320,
      comments: 12,
      rating: 4.8,
    },
    {
      user: { initials: "JD", name: "John Doe", handle: "johnshop" },
      product: {
        title: "Handmade Leather Bag",
        description: "Stylish and durable leather bag for everyday use.",
        price: "$120",
        tags: "#leather #handmade #bag",
        video: "https://www.w3schools.com/html/mov_bbb.mp4",
      },
      likes: 210,
      comments: 8,
      rating: 4.6,
    },
    {
      user: { initials: "MS", name: "Mia Smith", handle: "miastudio" },
      product: {
        title: "Knitted Wool Scarf",
        description: "Warm, cozy, and handmade with love.",
        price: "$35",
        tags: "#wool #winter #handmade",
        image: "https://via.placeholder.com/400x600.png?text=Wool+Scarf",
      },
      likes: 145,
      comments: 5,
      rating: 4.7,
    },
  ]

  return (
    <>
      {/* Top Navbar */}
      <Navbar />

      {/* Desktop Sidebar */}
      <SideNav />

      {/* Main Content */}
      <main className="pt-20 min-h-screen flex flex-col items-center py-8 bg-gray-50 w-full lg:pl-20">
        <div className="space-y-8 w-full max-w-3xl">
          {feed.map((post, index) => (
            <PostCard key={index} {...post} />
          ))}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </>
  )
}
