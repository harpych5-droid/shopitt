from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Event, EventParticipant
from .serializers import EventSerializer, EventDetailSerializer, EventParticipantSerializer


class IsCreatorOrReadOnly(permissions.BasePermission):
    """Allow creators to edit their own events"""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.creator.user == request.user


class EventViewSet(viewsets.ModelViewSet):
    """Event endpoints"""
    queryset = Event.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsCreatorOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EventDetailSerializer
        return EventSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming events"""
        now = timezone.now()
        events = Event.objects.filter(
            start_time__gt=now,
            is_active=True
        ).order_by('start_time')
        serializer = EventSerializer(events, many=True, context={'request': request})
        return Response({
            'count': events.count(),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def live(self, request):
        """Get live events"""
        now = timezone.now()
        events = Event.objects.filter(
            start_time__lte=now,
            end_time__gte=now,
            is_active=True
        ).order_by('-start_time')
        serializer = EventSerializer(events, many=True, context={'request': request})
        return Response({
            'count': events.count(),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def trending(self, request):
        """Get trending events (most participants)"""
        events = Event.objects.filter(is_active=True).order_by('-participants_count')[:10]
        serializer = EventSerializer(events, many=True, context={'request': request})
        return Response({
            'count': len(events),
            'results': serializer.data
        })

    @action(detail=True, methods=['post'])
    def participate(self, request, pk=None):
        """Join an event"""
        event = self.get_object()
        
        # Check if max participants reached
        if event.max_participants and event.participants_count >= event.max_participants:
            return Response(
                {'error': 'Event is full'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        participant, created = EventParticipant.objects.get_or_create(
            event=event,
            user=request.user
        )
        
        if created:
            event.participants_count += 1
            event.save()
            return Response(
                {'message': f'Joined {event.title}'},
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            {'message': 'Already participating in this event'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Leave an event"""
        event = self.get_object()
        deleted, _ = EventParticipant.objects.filter(
            event=event,
            user=request.user
        ).delete()
        
        if deleted:
            event.participants_count = max(0, event.participants_count - 1)
            event.save()
            return Response({'message': f'Left {event.title}'})
        
        return Response(
            {'error': 'Not participating in this event'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['get'])
    def my_events(self, request):
        """Get events user is participating in"""
        participations = EventParticipant.objects.filter(user=request.user)
        events = Event.objects.filter(
            id__in=participations.values_list('event_id', flat=True)
        )
        serializer = EventSerializer(events, many=True, context={'request': request})
        return Response({
            'count': events.count(),
            'results': serializer.data
        })
