from django.db import models
from django.contrib.auth.models import User
from apps.creators.models import Creator
from apps.products.models import Product


class Drop(models.Model):
    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('active', 'Active'),
        ('sold_out', 'Sold Out'),
        ('ended', 'Ended'),
    ]

    creator = models.ForeignKey(Creator, on_delete=models.CASCADE, related_name='drops')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='drops')
    title = models.CharField(max_length=255)
    description = models.TextField()
    quantity = models.IntegerField()
    sold_quantity = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} by {self.creator.handle}"

    class Meta:
        ordering = ['-start_time']


class Purchase(models.Model):
    drop = models.ForeignKey(Drop, on_delete=models.CASCADE, related_name='purchases')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='purchases')
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    creator_markup = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('completed', 'Completed'),
            ('cancelled', 'Cancelled'),
        ],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Purchase {self.id} - {self.buyer.username}"

    class Meta:
        ordering = ['-created_at']
