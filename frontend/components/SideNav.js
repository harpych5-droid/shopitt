"use client"

import { Search, ShoppingCart, MessageCircle, Camera, PlusCircle } from "lucide-react"
import { motion } from "framer-motion"

export default function SideNav() {
  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="hidden lg:flex flex-col items-center w-20 bg-white border-r border-gray-200 shadow-md py-6 fixed left-0 top-0 h-screen z-40"
    >
      {/* Search */}
      <div className="mb-8 w-full px-2">
        <div className="bg-muted rounded-xl px-2 py-1 flex items-center">
          <Search className="h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            className="ml-2 bg-transparent text-sm outline-none w-full text-gray-600"
          />
        </div>
      </div>

      {/* Menu icons */}
      <nav className="flex flex-col space-y-8 flex-1">
        <button className="flex flex-col items-center text-gray-600 hover:text-primary transition">
          <ShoppingCart className="h-6 w-6 mb-1" />
          <span className="text-xs">Cart</span>
        </button>
        <button className="flex flex-col items-center text-gray-600 hover:text-primary transition">
          <MessageCircle className="h-6 w-6 mb-1" />
          <span className="text-xs">Chats</span>
        </button>
        <button className="flex flex-col items-center text-gray-600 hover:text-primary transition">
          <Camera className="h-6 w-6 mb-1" />
          <span className="text-xs">AR</span>
        </button>
      </nav>

      {/* Studio CTA */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full p-3 shadow-lg"
      >
        <PlusCircle className="h-7 w-7" />
      </motion.button>
    </motion.aside>
  )
}
