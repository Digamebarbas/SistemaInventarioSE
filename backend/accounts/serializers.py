from django.contrib.auth.models import Group, User
from rest_framework import serializers


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "first_name", "last_name"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )
        user_group = Group.objects.filter(name="Usuario").first()
        if user_group:
            user.groups.add(user_group)
        return user


class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "roles", "is_admin"]

    def get_roles(self, obj):
        roles = list(obj.groups.values_list("name", flat=True))
        if (obj.is_superuser or obj.is_staff) and "Admin" not in roles:
            roles.append("Admin")
        return roles

    def get_is_admin(self, obj):
        return bool(obj.is_superuser or obj.is_staff or obj.groups.filter(name="Admin").exists())


class UserManagementSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    role = serializers.ChoiceField(choices=["Admin", "Usuario"], write_only=True, required=False)
    roles = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "is_active",
            "role",
            "roles",
        ]

    def get_roles(self, obj):
        return list(obj.groups.values_list("name", flat=True))

    def create(self, validated_data):
        role = validated_data.pop("role", "Usuario")
        password = validated_data.pop("password", None)

        user = User.objects.create(**validated_data)
        user.set_password(password or "Temporal123*")
        user.save()

        group, _ = Group.objects.get_or_create(name=role)
        user.groups.set([group])
        return user

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if role:
            group, _ = Group.objects.get_or_create(name=role)
            instance.groups.set([group])

        return instance
