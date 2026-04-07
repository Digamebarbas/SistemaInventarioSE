from django.contrib.auth.models import Group, User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Company, UserCompany
from .tenancy import get_default_company_for_user


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
    company = serializers.SerializerMethodField()
    companies = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "roles",
            "is_admin",
            "company",
            "companies",
        ]

    def get_roles(self, obj):
        roles = list(obj.groups.values_list("name", flat=True))
        if (obj.is_superuser or obj.is_staff) and "Admin" not in roles:
            roles.append("Admin")
        return roles

    def get_is_admin(self, obj):
        return bool(obj.is_superuser or obj.is_staff or obj.groups.filter(name="Admin").exists())

    def get_company(self, obj):
        request = self.context.get("request")
        token = getattr(request, "auth", None) if request else None
        company_id = token.get("company_id") if token else None

        if company_id:
            membership = (
                UserCompany.objects.select_related("company")
                .filter(user=obj, company_id=company_id, company__is_active=True)
                .first()
            )
            if membership:
                return {
                    "id": membership.company.id,
                    "name": membership.company.name,
                    "slug": membership.company.slug,
                }

        default_company = get_default_company_for_user(obj)
        if not default_company:
            return None
        return {
            "id": default_company.id,
            "name": default_company.name,
            "slug": default_company.slug,
        }

    def get_companies(self, obj):
        memberships = (
            UserCompany.objects.select_related("company")
            .filter(user=obj, company__is_active=True)
            .order_by("-is_default", "company__name")
        )
        return [
            {
                "id": membership.company.id,
                "name": membership.company.name,
                "slug": membership.company.slug,
                "is_default": membership.is_default,
            }
            for membership in memberships
        ]


class UserManagementSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    role = serializers.ChoiceField(choices=["Admin", "Usuario"], write_only=True, required=False)
    roles = serializers.SerializerMethodField(read_only=True)
    company_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        write_only=True,
        required=False,
        allow_empty=False,
    )

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
            "company_ids",
        ]

    def get_roles(self, obj):
        return list(obj.groups.values_list("name", flat=True))

    def create(self, validated_data):
        role = validated_data.pop("role", "Usuario")
        password = validated_data.pop("password", None)
        company_ids = validated_data.pop("company_ids", [])

        user = User.objects.create(**validated_data)
        user.set_password(password or "Temporal123*")
        user.save()

        group, _ = Group.objects.get_or_create(name=role)
        user.groups.set([group])

        if company_ids:
            companies = list(Company.objects.filter(id__in=company_ids, is_active=True))
            for index, company in enumerate(companies):
                UserCompany.objects.get_or_create(
                    user=user,
                    company=company,
                    defaults={"is_default": index == 0},
                )
        return user

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)
        password = validated_data.pop("password", None)
        company_ids = validated_data.pop("company_ids", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if role:
            group, _ = Group.objects.get_or_create(name=role)
            instance.groups.set([group])

        if company_ids is not None:
            companies = list(Company.objects.filter(id__in=company_ids, is_active=True))
            UserCompany.objects.filter(user=instance).exclude(company__in=companies).delete()
            for index, company in enumerate(companies):
                membership, _ = UserCompany.objects.get_or_create(user=instance, company=company)
                membership.is_default = index == 0
                membership.save(update_fields=["is_default"])

        return instance


class CompanyTokenObtainPairSerializer(TokenObtainPairSerializer):
    company_slug = serializers.CharField(required=False, allow_blank=True, write_only=True)

    @classmethod
    def get_token(cls, user):
        return super().get_token(user)

    def validate(self, attrs):
        company_slug = (attrs.pop("company_slug", "") or "").strip().lower()
        data = super().validate(attrs)

        memberships = (
            UserCompany.objects.select_related("company")
            .filter(user=self.user, company__is_active=True)
            .order_by("-is_default", "company__name")
        )
        if not memberships.exists():
            raise serializers.ValidationError({"detail": "Tu usuario no tiene empresas asignadas."})

        if company_slug:
            membership = memberships.filter(company__slug=company_slug).first()
            if not membership:
                raise serializers.ValidationError({"detail": "No tienes acceso a la empresa seleccionada."})
        elif memberships.count() == 1:
            membership = memberships.first()
        else:
            raise serializers.ValidationError(
                {"detail": "Debes seleccionar una empresa para iniciar sesión.", "code": "company_required"}
            )

        refresh = self.get_token(self.user)
        refresh["company_id"] = membership.company.id
        refresh["company_slug"] = membership.company.slug
        refresh["company_name"] = membership.company.name

        data["refresh"] = str(refresh)
        data["access"] = str(refresh.access_token)
        data["company"] = {
            "id": membership.company.id,
            "name": membership.company.name,
            "slug": membership.company.slug,
        }
        return data
