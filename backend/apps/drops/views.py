from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Drop, Purchase
from .serializers import (
    DropSerializer, DropDetailSerializer, PurchaseSerializer, PurchaseCreateSerializer
)


class IsCreatorOrReadOnly(permissions.BasePermission):
    """Allow creators to edit their own drops"""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.creator.user == request.user


class DropViewSet(viewsets.ModelViewSet):
    """Drop endpoints"""
    queryset = Drop.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsCreatorOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DropDetailSerializer
        return DropSerializer

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active drops"""
        now = timezone.now()
        drops = Drop.objects.filter(
            start_time__lte=now,
            end_time__gte=now,
            status__in=['active', 'upcoming']
        ).order_by('-start_time')
        serializer = DropSerializer(drops, many=True)
        return Response({
            'count': drops.count(),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming drops"""
        now = timezone.now()
        drops = Drop.objects.filter(
            start_time__gt=now,
            status='upcoming'
        ).order_by('start_time')
        serializer = DropSerializer(drops, many=True)
        return Response({
            'count': drops.count(),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def trending(self, request):
        """Get trending drops (most sold)"""
        drops = Drop.objects.filter(status__in=['active', 'sold_out']).order_by('-sold_quantity')[:10]
        serializer = DropSerializer(drops, many=True)
        return Response({
            'count': len(drops),
            'results': serializer.data
        })

    @action(detail=True, methods=['post'])
    def purchase(self, request, pk=None):
        """Purchase from a drop"""
        drop = self.get_object()
        serializer = PurchaseCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            purchase = serializer.save()
            return Response(
                PurchaseSerializer(purchase).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PurchaseViewSet(viewsets.ModelViewSet):
    """Purchase endpoints"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PurchaseSerializer

    def get_queryset(self):
        return Purchase.objects.filter(buyer=self.request.user)

    @action(detail=False, methods=['get'])
    def my_purchases(self, request):
        """Get current user's purchases"""
        purchases = self.get_queryset().order_by('-created_at')
        serializer = self.get_serializer(purchases, many=True)
        return Response({
            'count': purchases.count(),
            'results': serializer.data
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a purchase"""
        purchase = self.get_object()
        if purchase.status == 'completed':
            return Response(
                {'error': 'Cannot cancel completed purchase'},
                status=status.HTTP_400_BAD_REQUEST
            )
        purchase.status = 'cancelled'
        purchase.save()
        return Response({'message': 'Purchase cancelled'})
