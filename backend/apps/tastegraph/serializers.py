from rest_framework import serializers
from .models import TasteGraph


class TasteGraphSerializer(serializers.ModelSerializer):
    class Meta:
        model = TasteGraph
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
