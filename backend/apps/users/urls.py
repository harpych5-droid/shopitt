from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import RegisterViewSet, LoginViewSet, UserProfileViewSet

router = SimpleRouter()
router.register(r'profiles', UserProfileViewSet, basename='profile')
router.register(r'register', RegisterViewSet, basename='register')
router.register(r'login', LoginViewSet, basename='login')

urlpatterns = [
    path('', include(router.urls)),
]
