from django.contrib.auth.models import Group, Permission
from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate)
def ensure_default_groups(sender, **kwargs):
    admin_group, _ = Group.objects.get_or_create(name="Admin")
    user_group, _ = Group.objects.get_or_create(name="Usuario")

    if not admin_group.permissions.exists():
        admin_group.permissions.set(Permission.objects.all())

    view_perms = Permission.objects.filter(codename__startswith="view_")
    user_group.permissions.set(view_perms)
