from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Bag, BagItem
from .serializers import BagSerializer, AddToBagSerializer
from apps.products.models import Product


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_bag(request):
    """
    GET /api/bag/
    
    Returns user's shopping bag with all items
    Requires authentication
    """
    try:
        bag = Bag.objects.get(user=request.user)
    except Bag.DoesNotExist:
        # Create bag if it doesn't exist
        bag = Bag.objects.create(user=request.user)

    serializer = BagSerializer(bag)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_bag(request):
    """
    POST /api/bag/add/
    
    Adds item to user's bag
    
    Request body:
    {
        "product_id": "product-id-string",
        "quantity": 1  (optional, defaults to 1)
    }
    
    Returns updated bag item
    """
    serializer = AddToBagSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    product_id = serializer.validated_data['product_id']
    quantity = serializer.validated_data.get('quantity', 1)

    # Get or create product
    product = get_object_or_404(Product, id=product_id)

    # Get or create user's bag
    bag, created = Bag.objects.get_or_create(user=request.user)

    # Add or update item in bag
    bag_item, item_created = BagItem.objects.get_or_create(
        bag=bag,
        product=product,
        defaults={'quantity': quantity}
    )

    if not item_created:
        # If item already exists, increase quantity
        bag_item.quantity += quantity
        bag_item.save()

    # Return updated bag
    bag_serializer = BagSerializer(bag)
    return Response(
        {
            'success': True,
            'message': f'{product.title} added to bag',
            'bag': bag_serializer.data
        },
        status=status.HTTP_200_OK
    )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_bag(request, item_id):
    """
    DELETE /api/bag/<item_id>/
    
    Removes item from user's bag
    """
    try:
        bag = Bag.objects.get(user=request.user)
        bag_item = BagItem.objects.get(id=item_id, bag=bag)
        bag_item.delete()
        
        bag_serializer = BagSerializer(bag)
        return Response(
            {
                'success': True,
                'message': 'Item removed from bag',
                'bag': bag_serializer.data
            },
            status=status.HTTP_200_OK
        )
    except BagItem.DoesNotExist:
        return Response(
            {'error': 'Item not found in bag'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_bag(request):
    """
    POST /api/bag/clear/
    
    Clears all items from user's bag
    """
    try:
        bag = Bag.objects.get(user=request.user)
        bag.bagitem_set.all().delete()
        
        bag_serializer = BagSerializer(bag)
        return Response(
            {
                'success': True,
                'message': 'Bag cleared',
                'bag': bag_serializer.data
            },
            status=status.HTTP_200_OK
        )
    except Bag.DoesNotExist:
        return Response(
            {'error': 'Bag not found'},
            status=status.HTTP_404_NOT_FOUND
        )
