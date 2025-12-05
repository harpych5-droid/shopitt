from django.db import transaction
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Creator
from .serializers import CreatorSerializer, CreatorDetailSerializer
from apps.users.models import Follow


class CreatorViewSet(viewsets.ModelViewSet):
    """Creator endpoints"""
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'handle'

    def get_queryset(self):
        return Creator.objects.prefetch_related('user').all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CreatorDetailSerializer
        return CreatorSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['get'])
    def trending(self, request):
        """Get trending creators"""
        creators = Creator.objects.all().order_by('-followers_count')[:10]
        serializer = self.get_serializer(creators, many=True)
        return Response({
            'count': len(creators),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'], pagination_class=viewsets.ModelViewSet.pagination_class)
    def verified(self, request):
        """Get verified creators"""
        creators = Creator.objects.filter(is_verified=True).order_by('-followers_count')
        page = self.paginate_queryset(creators)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(creators, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def follow(self, request, handle=None):
        """Follow a creator"""
        try:
            creator = Creator.objects.select_related('user').get(handle=handle)
            if creator.user == request.user:
                return Response({'error': 'You cannot follow yourself.'}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                follow, created = Follow.objects.get_or_create(
                    follower=request.user,
                    following=creator.user
                )
                if created:
                    # Use F() expression for a race-condition-safe update
                    creator.followers_count = F('followers_count') + 1
                    creator.save(update_fields=['followers_count'])
                    return Response({'message': f'Now following {creator.handle}'}, status=status.HTTP_201_CREATED)
            return Response({'message': 'Already following this creator'}, status=status.HTTP_200_OK)
        except Creator.DoesNotExist:
            return Response(
                {'error': 'Creator not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def unfollow(self, request, handle=None):
        """Unfollow a creator"""
        try:
            creator = Creator.objects.select_related('user').get(handle=handle)
            with transaction.atomic():
                deleted_count, _ = Follow.objects.filter(
                    follower=request.user,
                    following=creator.user
                ).delete()
                if deleted_count > 0:
                    # Use F() expression and a constraint to prevent going below zero
                    creator.followers_count = F('followers_count') - 1
                    creator.save(update_fields=['followers_count'])
            return Response({'message': f'Unfollowed {creator.handle}'}, status=status.HTTP_200_OK)
        except Creator.DoesNotExist:
            return Response(
                {'error': 'Creator not found'},
                status=status.HTTP_404_NOT_FOUND
            )
