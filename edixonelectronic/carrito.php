<?php
require_once 'config/database.php';
require_once 'includes/auth.php';
checkLogin();

require_once 'includes/Cart.php';

$cart = new Cart($pdo, $_SESSION['user_id']);

if ($_POST) {
    if (isset($_POST['update_quantity'])) {
        $productId = (int)$_POST['product_id'];
        $quantity = (int)$_POST['quantity'];
        $cart->updateItem($productId, $quantity);
        header('Location: carrito.php');
        exit();
    } elseif (isset($_POST['remove_item'])) {
        $productId = (int)$_POST['product_id'];
        $cart->removeItem($productId);
        header('Location: carrito.php');
        exit();
    }
}

$cartItems = $cart->getItems();
$total = $cart->getTotal();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Carrito de Compras - Edixon Electronic</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <?php include 'includes/header.php'; ?>
    
    <div class="container mt-4">
        <h2>Carrito de Compras</h2>
        
        <?php if (empty($cartItems)): ?>
            <div class="alert alert-info">
                Tu carrito está vacío.
                <a href="productos.php" class="btn btn-primary">Seguir comprando</a>
            </div>
        <?php else: ?>
            <div class="cart-container">
                <?php foreach ($cartItems as $item): ?>
                    <div class="cart-item">
                        <div class="row align-items-center">
                            <div class="col-md-2">
                                <?php if ($item['imagen']): ?>
                                    <img src="<?php echo $item['imagen']; ?>" class="img-fluid" alt="<?php echo htmlspecialchars($item['nombre']); ?>">
                                <?php else: ?>
                                    <img src="https://via.placeholder.com/100x100?text=Sin+Imagen" class="img-fluid" alt="Sin imagen">
                                <?php endif; ?>
                            </div>
                            <div class="col-md-4">
                                <h5><?php echo htmlspecialchars($item['nombre']); ?></h5>
                            </div>
                            <div class="col-md-2">
                                <p class="mb-0">$<?php echo number_format($item['precio'], 2); ?></p>
                            </div>
                            <div class="col-md-2">
                                <form method="post" class="d-inline">
                                    <input type="hidden" name="product_id" value="<?php echo $item['producto_id']; ?>">
                                    <div class="input-group">
                                        <input type="number" name="quantity" value="<?php echo $item['cantidad']; ?>" min="1" max="<?php echo $item['stock']; ?>" class="form-control form-control-sm">
                                        <button type="submit" name="update_quantity" class="btn btn-outline-primary btn-sm">
                                            <i class="fas fa-sync-alt"></i>
                                        </button>
                                    </div>
                                </form>
                            </div>
                            <div class="col-md-2">
                                <p class="mb-0"><strong>$<?php echo number_format($item['precio'] * $item['cantidad'], 2); ?></strong></p>
                            </div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-md-12">
                                <form method="post" class="d-inline">
                                    <input type="hidden" name="product_id" value="<?php echo $item['producto_id']; ?>">
                                    <button type="submit" name="remove_item" class="btn btn-sm btn-outline-danger" onclick="return confirm('¿Estás seguro de eliminar este producto del carrito?')">
                                        <i class="fas fa-trash"></i> Eliminar
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
                
                <div class="cart-total text-end">
                    <h4>Total: $<?php echo number_format($total, 2); ?></h4>
                </div>
                
                <div class="text-center mt-4">
                    <a href="productos.php" class="btn btn-secondary">Seguir comprando</a>
                    <a href="checkout.php" class="btn btn-success">Proceder al pago</a>
                </div>
            </div>
        <?php endif; ?>
    </div>

    <?php include 'includes/footer.php'; ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Función para actualizar el contador del carrito
        function updateCartCount() {
            fetch('api/cart.php')
            .then(response => response.json())
            .then(data => {
                const cartCountElement = document.querySelector('.cart-count');
                if (cartCountElement) {
                    cartCountElement.textContent = data.count || 0;
                }
            })
            .catch(error => {
                console.error('Error al actualizar el contador del carrito:', error);
            });
        }

        // Actualizar contador del carrito al cargar la página
        document.addEventListener('DOMContentLoaded', function() {
            updateCartCount();
        });
    </script>
</body>
</html>