<?php
require_once 'config/database.php';
require_once 'includes/auth.php';
checkLogin();

// Esta página se muestra cuando un pago es cancelado
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pago Cancelado - Edixon Electronic</title>
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
                        <i class="fas fa-times-circle text-danger" style="font-size: 4rem;"></i>
                        <h2 class="card-title mt-3 text-danger">Pago Cancelado</h2>
                        <p class="card-text">Has cancelado el proceso de pago. Tu pedido no ha sido procesado.</p>
                        
                        <div class="mt-4">
                            <a href="carrito.php" class="btn btn-primary me-2">
                                <i class="fas fa-shopping-cart"></i> Volver al Carrito
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