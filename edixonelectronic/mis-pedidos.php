<?php
require_once 'config/database.php';
require_once 'includes/auth.php';
checkLogin();

require_once 'includes/functions.php';

$pedidos = getUserOrders($_SESSION['user_id']);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mis Pedidos - Edixon Electronic</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <?php include 'includes/header.php'; ?>
    
    <div class="container mt-4">
        <h2>Mis Pedidos</h2>
        
        <?php if (empty($pedidos)): ?>
            <div class="alert alert-info">
                No has realizado ningún pedido aún.
                <a href="productos.php" class="btn btn-primary">Comenzar a comprar</a>
            </div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Número de Pedido</th>
                            <th>Fecha</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($pedidos as $pedido): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($pedido['numero_pedido']); ?></td>
                            <td><?php echo date('d/m/Y H:i', strtotime($pedido['fecha_pedido'])); ?></td>
                            <td>$<?php echo number_format($pedido['total'], 2); ?></td>
                            <td>
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
                            </td>
                            <td>
                                <a href="ver-pedido.php?id=<?php echo $pedido['id']; ?>" class="btn btn-sm btn-primary">
                                    <i class="fas fa-eye"></i> Ver
                                </a>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>

    <?php include 'includes/footer.php'; ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>