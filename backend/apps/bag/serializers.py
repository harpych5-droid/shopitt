from rest_framework import serializers
from .models import Bag, BagItem
from apps.products.models import Product


class BagItemSerializer(serializers.ModelSerializer):
    """
    Serializer for individual bag items
    Includes product information for frontend display
    """
    id = serializers.CharField(source='product.id', read_only=True)
    title = serializers.CharField(source='product.title', read_only=True)
    price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    image = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = BagItem
        fields = ['id', 'title', 'price', 'image', 'quantity']

    def get_image(self, obj):
        """Get product image URL - uses image_url field"""
        try:
            if hasattr(obj.product, 'image_url') and obj.product.image_url:
                return obj.product.image_url
        except:
            pass
        # Return None if no image found
        return None


class BagSerializer(serializers.ModelSerializer):
    """
    Serializer for user's shopping bag
    Returns all items with product details
    """
    items = serializers.SerializerMethodField(read_only=True)
    total_items = serializers.SerializerMethodField(read_only=True)
    total_price = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Bag
        fields = ['items', 'total_items', 'total_price', 'updated_at']

    def get_items(self, obj):
        """Get all items in the bag"""
        bag_items = obj.bagitem_set.all()
        return BagItemSerializer(bag_items, many=True).data

    def get_total_items(self, obj):
        """Get total quantity of items"""
        return obj.get_total_items()

    def get_total_price(self, obj):
        """Get total price"""
        return float(obj.get_total_price())


class AddToBagSerializer(serializers.Serializer):
    """
    Serializer for adding items to bag
    Expects product ID and quantity
    """
    product_id = serializers.CharField(max_length=255)
    quantity = serializers.IntegerField(default=1, min_value=1)

    def validate_quantity(self, value):
        """Validate quantity is positive"""
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1")
        return value
