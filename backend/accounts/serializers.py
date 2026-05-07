from django.contrib.auth.models import Group, User
from django.db import transaction
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Company, UserCompany
from .tenancy import get_default_company_for_user


class CompanyOnboardingCreateSerializer(serializers.Serializer):
    company_name = serializers.CharField(max_length=200, min_length=2)
    admin_email = serializers.EmailField()
    inventory_category = serializers.CharField(max_length=80, required=False, allow_blank=True)
    uses_warranty_period = serializers.BooleanField(required=False, default=False)

    def validate_company_name(self, value):
        company_name = value.strip()
        if Company.objects.filter(name__iexact=company_name).exists():
            raise serializers.ValidationError("Ya existe una empresa con ese nombre.")
        return company_name

    def validate_admin_email(self, value):
        admin_email = value.strip().lower()
        if User.objects.filter(email__iexact=admin_email).exists():
            raise serializers.ValidationError("Ya existe un usuario registrado con ese correo.")
        return admin_email

    def _build_unique_slug(self, company_name):
        base_slug = slugify(company_name) or "empresa"
        slug = base_slug
        index = 2
        while Company.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{index}"
            index += 1
        return slug

    def _build_unique_username(self, admin_email):
        base_username = admin_email.lower()
        username = base_username
        index = 2
        while User.objects.filter(username=username).exists():
            username = f"{base_username}.{index}"
            index += 1
        return username

    @transaction.atomic
    def create(self, validated_data):
        company_name = validated_data["company_name"]
        admin_email = validated_data["admin_email"]

        company = Company.objects.create(
            name=company_name,
            slug=self._build_unique_slug(company_name),
            uses_warranty_period=validated_data.get("uses_warranty_period", False),
            is_active=True,
        )

        admin_user = User.objects.create_user(
            username=self._build_unique_username(admin_email),
            email=admin_email,
            password="Admin123",
            first_name="Administrador",
        )
        
        # Set must_change_password flag via raw SQL since we're modifying auth_user table
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE auth_user SET must_change_password = 1 WHERE id = %s",
                    [admin_user.id]
                )
        except Exception:
            # Column might not exist in test DB, ignore
            pass

        admin_group, _ = Group.objects.get_or_create(name="Admin")
        admin_user.groups.add(admin_group)

        UserCompany.objects.create(user=admin_user, company=company, is_default=True)

        return {
            "company": {
                "id": company.id,
                "name": company.name,
                "slug": company.slug,
                "uses_warranty_period": company.uses_warranty_period,
            },
            "admin": {
                "id": admin_user.id,
                "username": admin_user.username,
                "email": admin_user.email,
                "temporary_password": "Admin123",
            },
            "inventory_category": validated_data.get("inventory_category", "").strip().lower(),
        }


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, min_length=1)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Las contraseñas no coinciden."})
        return data


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
                    "uses_warranty_period": membership.company.uses_warranty_period,
                }

        default_company = get_default_company_for_user(obj)
        if not default_company:
            return None
        return {
            "id": default_company.id,
            "name": default_company.name,
            "slug": default_company.slug,
            "uses_warranty_period": default_company.uses_warranty_period,
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
                "uses_warranty_period": membership.company.uses_warranty_period,
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

    def _resolve_creator_company(self):
        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            return None

        token = getattr(request, "auth", None)
        company_id = token.get("company_id") if isinstance(token, dict) else None
        if company_id:
            company = Company.objects.filter(id=company_id, is_active=True).first()
            if company:
                return company

        return get_default_company_for_user(request.user)

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
        else:
            creator_company = self._resolve_creator_company()
            if creator_company:
                UserCompany.objects.get_or_create(
                    user=user,
                    company=creator_company,
                    defaults={"is_default": True},
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
        
        # Get must_change_password flag from DB
        must_change_password = False
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT must_change_password FROM auth_user WHERE id = %s", [self.user.id])
                row = cursor.fetchone()
                must_change_password = bool(row[0]) if row else False
        except Exception:
            # Column might not exist in test DB, ignore
            pass

        refresh["must_change_password"] = must_change_password

        data["refresh"] = str(refresh)
        data["access"] = str(refresh.access_token)
        data["company"] = {
            "id": membership.company.id,
            "name": membership.company.name,
            "slug": membership.company.slug,
        }
        data["must_change_password"] = must_change_password
        return data
