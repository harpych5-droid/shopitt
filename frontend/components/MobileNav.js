"use client"

import { Home, MessageCircle, Video, Bell, User, Sparkles, ShoppingCart, Heart, Film, Tag, Camera } from "lucide-react"
import { useState } from "react"

export default function MobileNav() {
  const [fabOpen, setFabOpen] = useState(false)

  return (
    <div className="md:hidden">
      {/* Bottom Navbar */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around items-center py-2 z-40">
        <button className="flex flex-col items-center text-gray-700">
          <Home size={22} />
          <span className="text-xs">Home</span>
        </button>
        <button className="flex flex-col items-center text-gray-700">
          <MessageCircle size={22} />
          <span className="text-xs">Chats</span>
        </button>
        <button className="flex flex-col items-center text-gray-700">
          <Video size={22} />
          <span className="text-xs">Studio</span>
        </button>
        <button className="flex flex-col items-center text-gray-700">
          <Bell size={22} />
          <span className="text-xs">Notify</span>
        </button>
        <button className="flex flex-col items-center text-gray-700">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            U
          </div>
          <span className="text-xs">Profile</span>
        </button>
      </nav>

      {/* FAB */}
      <div className="fixed bottom-16 right-5 z-50 flex flex-col items-end gap-3">
        {fabOpen && (
          <div className="flex flex-col gap-3">
            <button className="w-12 h-12 rounded-full bg-gray-800 text-white flex items-center justify-center shadow-lg">
              <ShoppingCart size={20} />
            </button>
            <button className="w-12 h-12 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg">
              <Heart size={20} />
            </button>
            <button className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg">
              <Film size={20} />
            </button>
            <button className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg">
              <Tag size={20} />
            </button>
            <button className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg">
              <Camera size={20} />
            </button>
          </div>
        )}

        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-xl"
        >
          <Sparkles size={24} />
        </button>
      </div>
    </div>
  )
}
