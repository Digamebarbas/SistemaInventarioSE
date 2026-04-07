from django.contrib import admin

from .models import Company, UserCompany


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
	list_display = ("id", "name", "slug", "is_active")
	list_filter = ("is_active",)
	search_fields = ("name", "slug")


@admin.register(UserCompany)
class UserCompanyAdmin(admin.ModelAdmin):
	list_display = ("id", "user", "company", "is_default", "created_at")
	list_filter = ("is_default", "company")
	search_fields = ("user__username", "company__name", "company__slug")
