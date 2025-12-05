from rest_framework import serializers
from .models import Event, EventParticipant


class EventSerializer(serializers.ModelSerializer):
    creator_handle = serializers.CharField(source='creator.handle', read_only=True)
    is_participating = serializers.SerializerMethodField()
    available_spots = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'creator', 'creator_handle', 'title', 'description',
            'event_type', 'image_url', 'start_time', 'end_time',
            'location', 'max_participants', 'participants_count',
            'available_spots', 'is_participating', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'participants_count', 'created_at']

    def get_is_participating(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return EventParticipant.objects.filter(
                event=obj,
                user=request.user
            ).exists()
        return False

    def get_available_spots(self, obj):
        if obj.max_participants is None:
            return None
        return max(0, obj.max_participants - obj.participants_count)


class EventDetailSerializer(EventSerializer):
    participants = serializers.SerializerMethodField()

    class Meta(EventSerializer.Meta):
        fields = EventSerializer.Meta.fields + ['participants', 'updated_at']
        read_only_fields = EventSerializer.Meta.read_only_fields + ['updated_at']

    def get_participants(self, obj):
        participants = EventParticipant.objects.filter(event=obj)[:10]
        return [
            {
                'username': p.user.username,
                'joined_at': p.joined_at
            }
            for p in participants
        ]


class EventParticipantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)

    class Meta:
        model = EventParticipant
        fields = ['id', 'event', 'event_title', 'user', 'username', 'joined_at']
        read_only_fields = ['id', 'joined_at']
