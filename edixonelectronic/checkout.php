<?php
require_once 'config/database.php';
require_once 'includes/auth.php';
checkLogin();

require_once 'includes/Cart.php';
require_once 'includes/OrderProcessor.php';
require_once 'includes/functions.php';

$cart = new Cart($pdo, $_SESSION['user_id']);
$orderProcessor = new OrderProcessor($pdo, $_SESSION['user_id']);

$cartItems = $cart->getItems();
$total = $cart->getTotal();

if (empty($cartItems)) {
    header('Location: carrito.php');
    exit();
}

$userAddresses = getUserAddresses($_SESSION['user_id']);

// Procesar orden si se envía el formulario
if ($_POST && isset($_POST['procesar_orden'])) {
    $direccionEnvio = sanitizeInput($_POST['direccion_envio']);
    $metodoPago = sanitizeInput($_POST['metodo_pago']);
    
    $result = $orderProcessor->processOrder($direccionEnvio, $metodoPago);
    
    if ($result['success']) {
        // Redirigir al usuario según el método de pago
        if ($metodoPago === 'paypal' || $metodoPago === 'stripe') {
            // Simular redirección a pasarela de pago
            header('Location: pago-exitoso.php?pedido=' . $result['pedido_id']);
        } else {
            header('Location: pago-exitoso.php?pedido=' . $result['pedido_id']);
        }
        exit();
    } else {
        $error = $result['error'];
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checkout - Edixon Electronic</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <?php include 'includes/header.php'; ?>
    
    <div class="container mt-4">
        <h2>Checkout</h2>
        
        <div class="row">
            <div class="col-md-8">
                <div class="checkout-form">
                    <h4>Información de Envío</h4>
                    
                    <form method="post" id="checkout-form">
                        <div class="mb-3">
                            <label for="direccion_envio" class="form-label">Dirección de Envío</label>
                            <textarea class="form-control" id="direccion_envio" name="direccion_envio" rows="3" required><?php echo isset($_POST['direccion_envio']) ? htmlspecialchars($_POST['direccion_envio']) : ''; ?></textarea>
                            <div class="form-text">Por favor incluya toda la información necesaria para la entrega (calle, número, colonia, ciudad, estado, código postal, país).</div>
                        </div>
                        
                        <h4 class="mt-4">Método de Pago</h4>
                        <div class="mb-3">
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="radio" name="metodo_pago" id="efectivo" value="efectivo" checked>
                                <label class="form-check-label" for="efectivo">
                                    Efectivo contra entrega
                                </label>
                            </div>
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="radio" name="metodo_pago" id="tarjeta" value="tarjeta">
                                <label class="form-check-label" for="tarjeta">
                                    Tarjeta de crédito/débito
                                </label>
                            </div>
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="radio" name="metodo_pago" id="paypal" value="paypal">
                                <label class="form-check-label" for="paypal">
                                    PayPal
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="metodo_pago" id="stripe" value="stripe">
                                <label class="form-check-label" for="stripe">
                                    Stripe
                                </label>
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <button type="submit" name="procesar_orden" class="btn btn-success btn-lg w-100">
                                <i class="fas fa-lock"></i> Confirmar Pedido - Total: $<?php echo number_format($total, 2); ?>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5>Resumen del Pedido</h5>
                    </div>
                    <div class="card-body">
                        <?php foreach ($cartItems as $item): ?>
                            <div class="d-flex justify-content-between mb-2">
                                <span><?php echo htmlspecialchars($item['nombre']); ?> x<?php echo $item['cantidad']; ?></span>
                                <span>$<?php echo number_format($item['precio'] * $item['cantidad'], 2); ?></span>
                            </div>
                        <?php endforeach; ?>
                        
                        <hr>
                        
                        <div class="d-flex justify-content-between">
                            <strong>Total:</strong>
                            <strong>$<?php echo number_format($total, 2); ?></strong>
                        </div>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header">
                        <h5>Direcciones Guardadas</h5>
                    </div>
                    <div class="card-body">
                        <?php if (!empty($userAddresses)): ?>
                            <?php foreach ($userAddresses as $address): ?>
                                <div class="mb-2">
                                    <p class="mb-1"><?php echo htmlspecialchars($address['direccion']); ?></p>
                                    <p class="mb-1"><?php echo htmlspecialchars($address['ciudad']); ?>, <?php echo htmlspecialchars($address['estado']); ?></p>
                                    <p class="mb-0"><?php echo htmlspecialchars($address['codigo_postal']); ?>, <?php echo htmlspecialchars($address['pais']); ?></p>
                                    <?php if ($address['es_principal']): ?>
                                        <span class="badge bg-primary">Principal</span>
                                    <?php endif; ?>
                                    <button class="btn btn-sm btn-outline-primary use-address-btn" data-address="<?php echo htmlspecialchars($address['direccion'] . ', ' . $address['ciudad'] . ', ' . $address['estado'] . ', ' . $address['codigo_postal'] . ', ' . $address['pais']); ?>">Usar</button>
                                </div>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <p>No tienes direcciones guardadas.</p>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <?php include 'includes/footer.php'; ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Función para usar dirección guardada
        document.querySelectorAll('.use-address-btn').forEach(button => {
            button.addEventListener('click', function() {
                const address = this.dataset.address;
                document.getElementById('direccion_envio').value = address;
            });
        });
        
        // Validar formulario antes de enviar
        document.getElementById('checkout-form').addEventListener('submit', function(e) {
            const direccion = document.getElementById('direccion_envio').value.trim();
            if (!direccion) {
                e.preventDefault();
                alert('Por favor ingresa una dirección de envío.');
                return false;
            }
        });
    </script>
</body>
</html>