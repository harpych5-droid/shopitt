from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    creator_handle = serializers.CharField(source='creator.handle', read_only=True)
    creator_avatar = serializers.CharField(source='creator.avatar_url', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'creator', 'creator_handle', 'creator_avatar', 'title',
            'description', 'price', 'category', 'image_url', 'stock',
            'rating', 'reviews_count', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'rating', 'reviews_count', 'created_at']


class ProductDetailSerializer(ProductSerializer):
    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + ['updated_at']
        read_only_fields = ProductSerializer.Meta.read_only_fields + ['updated_at']


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'title', 'description', 'price', 'category',
            'image_url', 'stock', 'is_active'
        ]

    def create(self, validated_data):
        validated_data['creator'] = self.context['request'].user.creator_profile
        return super().create(validated_data)
