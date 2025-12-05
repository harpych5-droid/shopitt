from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import UserProfile, Follow
from .serializers import (
    UserSerializer, UserProfileSerializer, RegisterSerializer,
    LoginSerializer, FollowSerializer
)


class RegisterViewSet(viewsets.ViewSet):
    """User registration endpoint"""
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key,
                'message': 'User registered successfully'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginViewSet(viewsets.ViewSet):
    """User login endpoint"""
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                username=serializer.validated_data['username'],
                password=serializer.validated_data['password']
            )
            if user:
                token, _ = Token.objects.get_or_create(user=user)
                return Response({
                    'user': UserSerializer(user).data,
                    'token': token.key,
                    'message': 'Login successful'
                }, status=status.HTTP_200_OK)
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileViewSet(viewsets.ModelViewSet):
    """User profile endpoints"""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile"""
        try:
            profile = request.user.profile
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        """Follow a user"""
        try:
            user_to_follow = User.objects.get(pk=pk)
            if request.user == user_to_follow:
                return Response(
                    {'error': 'Cannot follow yourself'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            follow, created = Follow.objects.get_or_create(
                follower=request.user,
                following=user_to_follow
            )
            if created:
                return Response(
                    {'message': f'Now following {user_to_follow.username}'},
                    status=status.HTTP_201_CREATED
                )
            return Response(
                {'message': 'Already following this user'},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def unfollow(self, request, pk=None):
        """Unfollow a user"""
        try:
            user_to_unfollow = User.objects.get(pk=pk)
            Follow.objects.filter(
                follower=request.user,
                following=user_to_unfollow
            ).delete()
            return Response(
                {'message': f'Unfollowed {user_to_unfollow.username}'},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def followers(self, request, pk=None):
        """Get user's followers"""
        try:
            user = User.objects.get(pk=pk)
            followers = Follow.objects.filter(following=user)
            serializer = FollowSerializer(followers, many=True)
            return Response({
                'count': followers.count(),
                'followers': serializer.data
            })
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def following(self, request, pk=None):
        """Get users that a user is following"""
        try:
            user = User.objects.get(pk=pk)
            following = Follow.objects.filter(follower=user)
            serializer = FollowSerializer(following, many=True)
            return Response({
                'count': following.count(),
                'following': serializer.data
            })
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
