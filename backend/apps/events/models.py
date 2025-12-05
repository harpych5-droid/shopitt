from django.db import models
from django.contrib.auth.models import User
from apps.creators.models import Creator


class Event(models.Model):
    EVENT_TYPE_CHOICES = [
        ('live_stream', 'Live Stream'),
        ('workshop', 'Workshop'),
        ('meetup', 'Meetup'),
        ('launch', 'Product Launch'),
        ('other', 'Other'),
    ]

    creator = models.ForeignKey(Creator, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=255)
    description = models.TextField()
    event_type = models.CharField(max_length=50, choices=EVENT_TYPE_CHOICES)
    image_url = models.URLField(blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.CharField(max_length=255, blank=True, null=True)
    max_participants = models.IntegerField(null=True, blank=True)
    participants_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} by {self.creator.handle}"

    class Meta:
        ordering = ['-start_time']


class EventParticipant(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_participations')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('event', 'user')

    def __str__(self):
        return f"{self.user.username} joined {self.event.title}"
