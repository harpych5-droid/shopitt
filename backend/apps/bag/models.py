from django.db import models
from django.contrib.auth.models import User
from apps.products.models import Product


class Bag(models.Model):
    """
    Shopping bag model - stores user's bag items
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='bag')
    items = models.ManyToManyField(Product, through='BagItem', related_name='in_bags')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.username}'s Bag"

    def get_total_items(self):
        """Get total quantity of items in bag"""
        return sum(item.quantity for item in self.bagitem_set.all())

    def get_total_price(self):
        """Get total price of items in bag"""
        return sum(item.get_total_price() for item in self.bagitem_set.all())


class BagItem(models.Model):
    """
    Individual item in a shopping bag
    """
    bag = models.ForeignKey(Bag, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('bag', 'product')
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.product.title} x {self.quantity}"

    def get_total_price(self):
        """Get total price for this item (quantity * price)"""
        return self.product.price * self.quantity
