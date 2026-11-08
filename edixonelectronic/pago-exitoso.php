<?php
require_once 'config/database.php';
require_once 'includes/auth.php';
checkLogin();

require_once 'includes/OrderProcessor.php';

$pedidoId = isset($_GET['pedido']) ? (int)$_GET['pedido'] : 0;

if ($pedidoId > 0) {
    $orderProcessor = new OrderProcessor($pdo, $_SESSION['user_id']);
    $pedido = $orderProcessor->getOrder($pedidoId);
    
    if (!$pedido || $pedido['usuario_id'] != $_SESSION['user_id']) {
        header('Location: index.php');
        exit();
    }
} else {
    header('Location: index.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pago Exitoso - Edixon Electronic</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <?php include 'includes/header.php'; ?>
    
    <div class="container mt-4">
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card text-center">
                    <div class="card-body">
                        <i class="fas fa-check-circle text-success" style="font-size: 4rem;"></i>
                        <h2 class="card-title mt-3 text-success">¡Pago Exitoso!</h2>
                        <p class="card-text">Tu pedido ha sido procesado correctamente.</p>
                        
                        <div class="alert alert-info mt-4">
                            <h5>Detalles del Pedido</h5>
                            <p><strong>Número de Pedido:</strong> <?php echo htmlspecialchars($pedido['numero_pedido']); ?></p>
                            <p><strong>Total Pagado:</strong> $<?php echo number_format($pedido['total'], 2); ?></p>
                            <p><strong>Estado:</strong> 
                                <span class="badge 
                                    <?php 
                                        switch($pedido['estado']) {
                                            case 'pendiente': echo 'bg-warning'; break;
                                            case 'procesando': echo 'bg-info'; break;
                                            case 'enviado': echo 'bg-primary'; break;
                                            case 'entregado': echo 'bg-success'; break;
                                            case 'cancelado': echo 'bg-danger'; break;
                                            default: echo 'bg-secondary';
                                        }
                                    ?>
                                ">
                                    <?php echo ucfirst($pedido['estado']); ?>
                                </span>
                            </p>
                        </div>
                        
                        <div class="mt-4">
                            <a href="mis-pedidos.php" class="btn btn-primary me-2">
                                <i class="fas fa-list"></i> Ver Mis Pedidos
                            </a>
                            <a href="index.php" class="btn btn-outline-primary">
                                <i class="fas fa-home"></i> Volver a la Tienda
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <?php include 'includes/footer.php'; ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>