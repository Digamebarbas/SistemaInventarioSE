from typing import Optional

from .models import Company, UserCompany


def get_user_companies(user):
    if not user or not user.is_authenticated:
        return Company.objects.none()
    return Company.objects.filter(user_memberships__user=user, is_active=True).distinct()


def get_default_company_for_user(user) -> Optional[Company]:
    if not user or not user.is_authenticated:
        return None

    membership = (
        UserCompany.objects.select_related("company")
        .filter(user=user, company__is_active=True)
        .order_by("-is_default", "company__name")
        .first()
    )
    return membership.company if membership else None


def get_request_company(request) -> Optional[Company]:
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return None

    token = getattr(request, "auth", None)
    token_company_id = None
    if token is not None:
        token_company_id = token.get("company_id")

    if token_company_id:
        membership = (
            UserCompany.objects.select_related("company")
            .filter(user=user, company_id=token_company_id, company__is_active=True)
            .first()
        )
        if membership:
            return membership.company

    return get_default_company_for_user(user)
