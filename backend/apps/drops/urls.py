from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import DropViewSet, PurchaseViewSet

router = SimpleRouter()
router.register(r'drops', DropViewSet, basename='drop')
router.register(r'purchases', PurchaseViewSet, basename='purchase')

urlpatterns = [
    path('', include(router.urls)),
]
