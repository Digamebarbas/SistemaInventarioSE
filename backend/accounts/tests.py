from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Company, UserCompany


class CompanyOnboardingCreateApiTests(APITestCase):
	def test_creates_company_admin_and_membership(self):
		response = self.client.post(
			reverse("company_onboarding_create"),
			{
				"company_name": "Empresa Demo",
				"admin_email": "admin@demo.com",
				"inventory_category": "general",
			},
			format="json",
		)

		self.assertEqual(response.status_code, 201)
		self.assertTrue(Company.objects.filter(name="Empresa Demo").exists())

		created_user = User.objects.get(email="admin@demo.com")
		self.assertTrue(created_user.check_password("Admin123"))
		self.assertTrue(created_user.groups.filter(name="Admin").exists())

		company = Company.objects.get(name="Empresa Demo")
		self.assertTrue(UserCompany.objects.filter(user=created_user, company=company, is_default=True).exists())

	def test_rejects_existing_admin_email(self):
		User.objects.create_user(username="existing", email="admin@demo.com", password="Temp12345")

		response = self.client.post(
			reverse("company_onboarding_create"),
			{
				"company_name": "Otra Empresa",
				"admin_email": "admin@demo.com",
				"inventory_category": "general",
			},
			format="json",
		)

		self.assertEqual(response.status_code, 400)
		self.assertIn("admin_email", response.data)
