from django.contrib import admin
from .models import Bag, BagItem


@admin.register(Bag)
class BagAdmin(admin.ModelAdmin):
    list_display = ['user', 'get_total_items', 'get_total_price', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(BagItem)
class BagItemAdmin(admin.ModelAdmin):
    list_display = ['product', 'bag', 'quantity', 'get_total_price', 'added_at']
    list_filter = ['added_at', 'bag']
    search_fields = ['product__title', 'bag__user__username']
    readonly_fields = ['added_at']
