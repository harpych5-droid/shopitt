from rest_framework import serializers
from .models import Drop, Purchase


class DropSerializer(serializers.ModelSerializer):
    creator_handle = serializers.CharField(source='creator.handle', read_only=True)
    product_title = serializers.CharField(source='product.title', read_only=True)
    remaining_quantity = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Drop
        fields = [
            'id', 'creator', 'creator_handle', 'product', 'product_title',
            'title', 'description', 'quantity', 'sold_quantity',
            'remaining_quantity', 'progress_percentage', 'status',
            'start_time', 'end_time', 'created_at'
        ]
        read_only_fields = ['id', 'sold_quantity', 'created_at']

    def get_remaining_quantity(self, obj):
        return obj.quantity - obj.sold_quantity

    def get_progress_percentage(self, obj):
        if obj.quantity == 0:
            return 0
        return (obj.sold_quantity / obj.quantity) * 100


class DropDetailSerializer(DropSerializer):
    purchases_count = serializers.SerializerMethodField()

    class Meta(DropSerializer.Meta):
        fields = DropSerializer.Meta.fields + ['purchases_count', 'updated_at']
        read_only_fields = DropSerializer.Meta.read_only_fields + ['updated_at']

    def get_purchases_count(self, obj):
        return obj.purchases.count()


class PurchaseSerializer(serializers.ModelSerializer):
    drop_title = serializers.CharField(source='drop.title', read_only=True)
    buyer_username = serializers.CharField(source='buyer.username', read_only=True)

    class Meta:
        model = Purchase
        fields = [
            'id', 'drop', 'drop_title', 'buyer', 'buyer_username',
            'quantity', 'price', 'creator_markup', 'total_price',
            'status', 'created_at'
        ]
        read_only_fields = ['id', 'creator_markup', 'total_price', 'created_at']


class PurchaseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purchase
        fields = ['drop', 'quantity']

    def create(self, validated_data):
        drop = validated_data['drop']
        quantity = validated_data['quantity']
        
        # Calculate prices
        product_price = drop.product.price
        creator_markup = (product_price * drop.creator.markup_percentage) / 100
        total_price = (product_price + creator_markup) * quantity
        
        purchase = Purchase.objects.create(
            drop=drop,
            buyer=self.context['request'].user,
            quantity=quantity,
            price=product_price,
            creator_markup=creator_markup,
            total_price=total_price,
            status='completed'
        )
        
        # Update drop sold quantity
        drop.sold_quantity += quantity
        if drop.sold_quantity >= drop.quantity:
            drop.status = 'sold_out'
        drop.save()
        
        return purchase
