from .models import Alert


def ensure_stock_alert(product, user=None):
    if product.stock_actual <= product.stock_minimo:
        message = f"Stock bajo para {product.name}"
        alert, created = Alert.objects.get_or_create(
            product=product,
            is_resolved=False,
            defaults={"message": message},
        )
        if not created and alert.message != message:
            alert.message = message
            alert.save(update_fields=["message"])
        return alert
    return None
