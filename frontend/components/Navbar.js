"use client"

import { motion } from "framer-motion"
import { Menu } from "lucide-react"
import { useState } from "react"

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 md:py-4">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-extrabold text-2xl text-purple-600"
        >
          Shopitt
        </motion.div>

        {/* Desktop Nav */}
        <motion.ul
          className="hidden md:flex space-x-8 font-medium text-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <li className="hover:text-purple-600 transition">Home</li>
          <li className="hover:text-purple-600 transition">Vidz</li>
          <li className="hover:text-purple-600 transition">Notify</li>
          <li className="hover:text-purple-600 transition">Promo</li>
        </motion.ul>

        {/* CTA (Desktop) */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="hidden md:block px-5 py-2 rounded-full bg-purple-600 text-white font-semibold shadow hover:bg-purple-700 transition"
        >
          Login
        </motion.button>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-100 transition"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Menu className="w-6 h-6 text-gray-800" />
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-white shadow-md px-6 py-4 space-y-4"
        >
          <a className="block font-medium text-gray-700 hover:text-purple-600">Home</a>
          <a className="block font-medium text-gray-700 hover:text-purple-600">Vidz</a>
          <a className="block font-medium text-gray-700 hover:text-purple-600">Notify</a>
          <a className="block font-medium text-gray-700 hover:text-purple-600">Promo</a>
          <button className="w-full px-5 py-2 rounded-full bg-purple-600 text-white font-semibold shadow hover:bg-purple-700 transition">
            Login
          </button>
        </motion.div>
      )}
    </nav>
  )
}
