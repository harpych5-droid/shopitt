from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import CreatorViewSet

router = SimpleRouter()
router.register(r'creators', CreatorViewSet, basename='creator')

urlpatterns = [
    path('', include(router.urls)),
]
