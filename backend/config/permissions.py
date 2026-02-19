from rest_framework.permissions import BasePermission, SAFE_METHODS


def is_platform_admin(user):
    if not user or not user.is_authenticated:
        return False
    return user.is_superuser or user.is_staff or user.groups.filter(name="Admin").exists()


def is_operator_user(user):
    if not user or not user.is_authenticated:
        return False
    return user.groups.filter(name="Usuario").exists()


class IsPlatformAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_platform_admin(request.user)


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return is_platform_admin(request.user)


class CanCreateInventoryMovement(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        if request.method == "POST":
            return is_operator_user(request.user) or is_platform_admin(request.user)

        return False
