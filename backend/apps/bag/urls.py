from django.urls import path
from . import views

urlpatterns = [
    # GET bag items
    path('', views.get_bag, name='get-bag'),
    
    # POST add item to bag
    path('add/', views.add_to_bag, name='add-to-bag'),
    
    # DELETE remove item from bag
    path('<int:item_id>/', views.remove_from_bag, name='remove-from-bag'),
    
    # POST clear bag
    path('clear/', views.clear_bag, name='clear-bag'),
]
