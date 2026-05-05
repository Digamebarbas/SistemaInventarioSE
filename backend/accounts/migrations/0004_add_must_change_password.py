# Generated migration to add must_change_password field to auth_user table

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_configure_demo_companies'),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE auth_user ADD COLUMN must_change_password INTEGER DEFAULT 0;",
            reverse_sql="ALTER TABLE auth_user DROP COLUMN must_change_password;",
        ),
    ]
