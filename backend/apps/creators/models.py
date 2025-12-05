from django.db import models
from django.contrib.auth.models import User


class Creator(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='creator_profile')
    handle = models.CharField(max_length=100, unique=True)
    bio = models.TextField(blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)
    banner_url = models.URLField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    markup_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=10.0)
    followers_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.handle} (@{self.user.username})"

    class Meta:
        ordering = ['-followers_count']
