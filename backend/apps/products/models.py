from django.db import models
from apps.creators.models import Creator


class Product(models.Model):
    CATEGORY_CHOICES = [
        ('fashion', 'Fashion'),
        ('electronics', 'Electronics'),
        ('home', 'Home & Garden'),
        ('beauty', 'Beauty'),
        ('sports', 'Sports'),
        ('other', 'Other'),
    ]

    creator = models.ForeignKey(Creator, on_delete=models.CASCADE, related_name='products')
    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    image_url = models.URLField()
    stock = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    reviews_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} by {self.creator.handle}"

    class Meta:
        ordering = ['-created_at']
