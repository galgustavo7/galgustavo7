<?php
require_once '../includes/auth.php';
checkAdmin();

require_once '../config/database.php';
require_once '../includes/functions.php';
require_once '../includes/OrderProcessor.php';

$orderProcessor = new OrderProcessor($pdo, $_SESSION['user_id']);

// Obtener estadísticas
$stmt = $pdo->query("SELECT COUNT(*) as total FROM usuarios WHERE activo = 1");
$totalUsuarios = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

$stmt = $pdo->query("SELECT COUNT(*) as total FROM productos WHERE activo = 1");
$totalProductos = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

$stmt = $pdo->query("SELECT COUNT(*) as total FROM pedidos");
$totalPedidos = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

$ordersCountByStatus = $orderProcessor->getOrdersCountByStatus();

// Últimos pedidos
$ultimosPedidos = $orderProcessor->getAllOrders(5, 0);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración - Edixon Electronic</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
    <?php include '../includes/header.php'; ?>
    
    <div class="container-fluid">
        <div class="row">
            <?php include 'sidebar.php'; ?>
            
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">Dashboard</h1>
                </div>

                <!-- Estadísticas -->
                <div class="row mb-4">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                            Usuarios</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800"><?php echo $totalUsuarios; ?></div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-users fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                            Productos</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800"><?php echo $totalProductos; ?></div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-boxes fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card border-left-info shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                                            Pedidos</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800"><?php echo $totalPedidos; ?></div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-shopping-cart fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card border-left-warning shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                            Pendientes</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">
                                            <?php echo isset($ordersCountByStatus['pendiente']) ? $ordersCountByStatus['pendiente'] : 0; ?>
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-clock fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Últimos pedidos -->
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold text-primary">Últimos Pedidos</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-bordered" width="100%" cellspacing="0">
                                        <thead>
                                            <tr>
                                                <th>Número</th>
                                                <th>Cliente</th>
                                                <th>Total</th>
                                                <th>Estado</th>
                                                <th>Fecha</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <?php foreach ($ultimosPedidos as $pedido): ?>
                                            <tr>
                                                <td><?php echo htmlspecialchars($pedido['numero_pedido']); ?></td>
                                                <td><?php echo htmlspecialchars(getUserInfo($pedido['usuario_id'])['nombre']); ?></td>
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
                                                <td><?php echo date('d/m/Y H:i', strtotime($pedido['fecha_pedido'])); ?></td>
                                                <td>
                                                    <a href="pedidos.php?ver=<?php echo $pedido['id']; ?>" class="btn btn-sm btn-primary">
                                                        <i class="fas fa-eye"></i>
                                                    </a>
                                                </td>
                                            </tr>
                                            <?php endforeach; ?>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>