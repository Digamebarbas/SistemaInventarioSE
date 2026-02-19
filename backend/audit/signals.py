from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.forms.models import model_to_dict
from django.db import connection

from .middleware import get_current_request
from .models import AuditLog


def normalize_value(value):
    if value is None:
        return None

    if isinstance(value, (str, int, float, bool)):
        return value

    if hasattr(value, "isoformat"):
        return value.isoformat()

    if isinstance(value, dict):
        return {str(key): normalize_value(item) for key, item in value.items()}

    if isinstance(value, (list, tuple, set)):
        return [normalize_value(item) for item in value]

    if hasattr(value, "pk"):
        return value.pk

    return str(value)


def serialize_data(instance):
    """Convert instance to dict and handle non-serializable fields."""
    data = model_to_dict(instance)
    return normalize_value(data)


def audit_table_exists():
    """Check if audit table exists."""
    return "audit_auditlog" in connection.introspection.table_names()


@receiver(post_save)
def audit_save(sender, instance, created, **kwargs):
    if sender == AuditLog or not audit_table_exists():
        return

    request = get_current_request()
    user = getattr(request, "user", None) if request else None
    ip_address = request.META.get("REMOTE_ADDR") if request else None

    action = "create" if created else "update"
    AuditLog.objects.create(
        action=action,
        model=sender.__name__,
        object_id=str(instance.pk),
        data=serialize_data(instance),
        user=user if user and user.is_authenticated else None,
        ip_address=ip_address,
    )


@receiver(pre_delete)
def audit_delete(sender, instance, **kwargs):
    if sender == AuditLog or not audit_table_exists():
        return

    request = get_current_request()
    user = getattr(request, "user", None) if request else None
    ip_address = request.META.get("REMOTE_ADDR") if request else None

    AuditLog.objects.create(
        action="delete",
        model=sender.__name__,
        object_id=str(instance.pk),
        data=serialize_data(instance),
        user=user if user and user.is_authenticated else None,
        ip_address=ip_address,
    )
