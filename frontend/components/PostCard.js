"use client"

import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Heart, MessageCircle, Share2, Star } from "lucide-react"

export default function PostCard({ user, product, likes, comments, rating }) {
  return (
    <Card className="w-full max-w-md mx-auto border shadow-lg">
      <CardContent className="p-0">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
            {user?.initials || "AC"}
          </div>
          <div>
            <p className="text-sm font-semibold">{user?.name || "Ava Carter"}</p>
            <p className="text-xs text-muted-foreground">@{user?.handle || "avacrafts"}</p>
          </div>
        </div>

        {/* Media (long vertical image or video) */}
        <div className="relative rounded-lg overflow-hidden mx-4 mb-4">
          {product?.video ? (
            <video
              src={product.video}
              controls
              className="w-full h-[600px] object-cover rounded-lg"
            />
          ) : (
            <img
              src={product?.image || "https://via.placeholder.com/400x600.png?text=Product"}
              alt={product?.title || "Product"}
              className="w-full h-[600px] object-cover rounded-lg"
            />
          )}

          {/* Save button */}
          <button className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors">
            <Heart className="w-4 h-4 text-gray-700" />
          </button>

          {/* Buy Now */}
          <Button
            size="sm"
            className="absolute bottom-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full px-4 shadow-lg"
          >
            Buy Now • {product?.price || "$49"}
          </Button>
        </div>

        {/* Caption */}
        <div className="px-4 mb-3">
          <p className="text-sm">
            <span className="font-semibold">{product?.title || "Linen Summer Shirt"}</span>{" "}
            {product?.description || "Breathable, soft, and perfect for sunny days."}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {product?.tags || "#linen #summer #handmade"}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">{likes || 320}</span>
            </button>
            <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{comments || 12}</span>
            </button>
            <button className="flex items-center gap-2 text-muted-foreground hover:text-green-500 transition-colors">
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-semibold">{rating || 4.8}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
