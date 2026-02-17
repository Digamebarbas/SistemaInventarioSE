from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.core.serializers.json import DjangoJSONEncoder
from django.forms.models import model_to_dict
from django.db import connection

from .middleware import get_current_request
from .models import AuditLog


def serialize_data(instance):
    """Convert instance to dict and handle non-serializable fields."""
    data = model_to_dict(instance)
    # Convert datetime and other non-serializable objects to strings
    for key, value in data.items():
        if value is None:
            continue
        if hasattr(value, 'isoformat'):
            data[key] = value.isoformat()
        elif not isinstance(value, (str, int, float, bool, list, dict)):
            data[key] = str(value)
    return data


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
