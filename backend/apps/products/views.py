from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product
from .serializers import (
    ProductSerializer, ProductDetailSerializer, ProductCreateUpdateSerializer
)


class IsCreatorOrReadOnly(permissions.BasePermission):
    """Allow creators to edit their own products"""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.creator.user == request.user


class ProductViewSet(viewsets.ModelViewSet):
    """Product endpoints"""
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsCreatorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'creator']
    search_fields = ['title', 'description', 'creator__handle']
    ordering_fields = ['created_at', 'price', 'rating']
    ordering = ['-created_at']

    def get_queryset(self):
        return Product.objects.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        return ProductSerializer

    @action(detail=False, methods=['get'])
    def trending(self, request):
        """Get trending products"""
        products = Product.objects.filter(is_active=True).order_by('-rating', '-reviews_count')[:10]
        serializer = ProductSerializer(products, many=True)
        return Response({
            'count': len(products),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get products by category"""
        category = request.query_params.get('category')
        if not category:
            return Response(
                {'error': 'Category parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        products = Product.objects.filter(category=category, is_active=True)
        serializer = ProductSerializer(products, many=True)
        return Response({
            'category': category,
            'count': products.count(),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def my_products(self, request):
        """Get current user's products (for creators)"""
        if not hasattr(request.user, 'creator_profile'):
            return Response(
                {'error': 'User is not a creator'},
                status=status.HTTP_403_FORBIDDEN
            )
        products = Product.objects.filter(creator=request.user.creator_profile)
        serializer = ProductSerializer(products, many=True)
        return Response({
            'count': products.count(),
            'results': serializer.data
        })

    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        """Rate a product"""
        product = self.get_object()
        rating = request.data.get('rating')
        
        if not rating or not (1 <= float(rating) <= 5):
            return Response(
                {'error': 'Rating must be between 1 and 5'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update product rating (simplified)
        product.reviews_count += 1
        product.rating = (product.rating + float(rating)) / 2
        product.save()
        
        return Response({
            'message': 'Rating submitted',
            'new_rating': product.rating,
            'reviews_count': product.reviews_count
        })
