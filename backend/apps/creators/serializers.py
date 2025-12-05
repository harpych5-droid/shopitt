from rest_framework import serializers
from .models import Creator


class CreatorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = Creator
        fields = [
            'id', 'user', 'username', 'email', 'handle', 'bio', 'avatar_url',
            'banner_url', 'is_verified', 'markup_percentage', 'followers_count',
            'is_following', 'created_at'
        ]
        read_only_fields = ['id', 'followers_count', 'created_at']

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from apps.users.models import Follow
            return Follow.objects.filter(
                follower=request.user,
                following=obj.user
            ).exists()
        return False


class CreatorDetailSerializer(CreatorSerializer):
    products_count = serializers.SerializerMethodField()
    drops_count = serializers.SerializerMethodField()

    class Meta(CreatorSerializer.Meta):
        fields = CreatorSerializer.Meta.fields + ['products_count', 'drops_count']

    def get_products_count(self, obj):
        from apps.products.models import Product
        return Product.objects.filter(creator=obj).count()

    def get_drops_count(self, obj):
        from apps.drops.models import Drop
        return Drop.objects.filter(creator=obj).count()
