from django.db import models
from django.contrib.auth.models import User
from apps.products.models import Product


class UserPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='taste_profile')
    categories = models.JSONField(default=list, blank=True)
    price_range_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_range_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Taste Profile"


class ProductInteraction(models.Model):
    INTERACTION_TYPES = [
        ('view', 'View'),
        ('like', 'Like'),
        ('purchase', 'Purchase'),
        ('dislike', 'Dislike'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='product_interactions')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='interactions')
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPES)
    rating = models.IntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product', 'interaction_type')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} {self.interaction_type} {self.product.title}"


class Recommendation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recommendations')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    score = models.FloatField()
    reason = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score']

    def __str__(self):
        return f"Recommendation for {self.user.username}: {self.product.title}"
