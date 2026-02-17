from rest_framework import serializers

from .models import Alert


class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = [
            "id",
            "product",
            "message",
            "is_resolved",
            "created_at",
            "resolved_at",
            "resolved_by",
        ]
        read_only_fields = ["resolved_at", "resolved_by"]
