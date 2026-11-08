<?php
require_once '../includes/auth.php';
checkAdmin();

require_once '../config/database.php';
require_once '../includes/functions.php';
require_once '../includes/OrderProcessor.php';

$orderProcessor = new OrderProcessor($pdo, $_SESSION['user_id']);

// Acción de actualización de estado
if ($_POST && isset($_POST['actualizar_estado'])) {
    $pedidoId = $_POST['pedido_id'];
    $nuevoEstado = $_POST['nuevo_estado'];
    
    if ($orderProcessor->updateOrderStatus($pedidoId, $nuevoEstado)) {
        $mensaje = "Estado actualizado correctamente.";
    } else {
        $mensaje = "Error al actualizar el estado.";
    }
}

// Obtener pedidos
$page = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
$limit = 10;
$offset = ($page - 1) * $limit;

$pedidos = $orderProcessor->getAllOrders($limit, $offset);
$ordersCountByStatus = $orderProcessor->getOrdersCountByStatus();

// Si se solicita ver un pedido específico
$pedidoDetalle = null;
if (isset($_GET['ver'])) {
    $pedidoDetalle = $orderProcessor->getOrder($_GET['ver']);
    $detallesPedido = getOrderDetails($_GET['ver']);
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pedidos - Panel de Administración</title>
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
                    <h1 class="h2">Gestión de Pedidos</h1>
                </div>

                <?php if (isset($mensaje)): ?>
                    <div class="alert alert-info"><?php echo $mensaje; ?></div>
                <?php endif; ?>

                <?php if ($pedidoDetalle): ?>
                    <!-- Vista de detalle de pedido -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5>Detalles del Pedido #<?php echo htmlspecialchars($pedidoDetalle['numero_pedido']); ?></h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Información del Cliente</h6>
                                    <p><strong>Nombre:</strong> <?php echo htmlspecialchars($pedidoDetalle['usuario_nombre']); ?></p>
                                    <p><strong>Email:</strong> <?php echo htmlspecialchars($pedidoDetalle['usuario_email']); ?></p>
                                    <p><strong>Dirección:</strong> <?php echo nl2br(htmlspecialchars($pedidoDetalle['direccion_envio'])); ?></p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Información del Pedido</h6>
                                    <p><strong>Estado:</strong> 
                                        <span class="badge 
                                            <?php 
                                                switch($pedidoDetalle['estado']) {
                                                    case 'pendiente': echo 'bg-warning'; break;
                                                    case 'procesando': echo 'bg-info'; break;
                                                    case 'enviado': echo 'bg-primary'; break;
                                                    case 'entregado': echo 'bg-success'; break;
                                                    case 'cancelado': echo 'bg-danger'; break;
                                                    default: echo 'bg-secondary';
                                                }
                                            ?>
                                        ">
                                            <?php echo ucfirst($pedidoDetalle['estado']); ?>
                                        </span>
                                    </p>
                                    <p><strong>Fecha:</strong> <?php echo date('d/m/Y H:i', strtotime($pedidoDetalle['fecha_pedido'])); ?></p>
                                    <p><strong>Método de Pago:</strong> <?php echo htmlspecialchars($pedidoDetalle['metodo_pago']); ?></p>
                                </div>
                            </div>

                            <h6>Productos</h6>
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cantidad</th>
                                            <th>Precio Unitario</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($detallesPedido as $detalle): ?>
                                        <tr>
                                            <td><?php echo htmlspecialchars($detalle['nombre_producto']); ?></td>
                                            <td><?php echo $detalle['cantidad']; ?></td>
                                            <td>$<?php echo number_format($detalle['precio_unitario'], 2); ?></td>
                                            <td>$<?php echo number_format($detalle['subtotal'], 2); ?></td>
                                        </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colspan="3"><strong>Total</strong></td>
                                            <td><strong>$<?php echo number_format($pedidoDetalle['total'], 2); ?></strong></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <form method="post" class="mt-3">
                                <input type="hidden" name="pedido_id" value="<?php echo $pedidoDetalle['id']; ?>">
                                <div class="row">
                                    <div class="col-md-4">
                                        <select name="nuevo_estado" class="form-control" required>
                                            <option value="">Cambiar Estado...</option>
                                            <option value="pendiente" <?php echo $pedidoDetalle['estado'] === 'pendiente' ? 'selected' : ''; ?>>Pendiente</option>
                                            <option value="procesando" <?php echo $pedidoDetalle['estado'] === 'procesando' ? 'selected' : ''; ?>>Procesando</option>
                                            <option value="enviado" <?php echo $pedidoDetalle['estado'] === 'enviado' ? 'selected' : ''; ?>>Enviado</option>
                                            <option value="entregado" <?php echo $pedidoDetalle['estado'] === 'entregado' ? 'selected' : ''; ?>>Entregado</option>
                                            <option value="cancelado" <?php echo $pedidoDetalle['estado'] === 'cancelado' ? 'selected' : ''; ?>>Cancelado</option>
                                        </select>
                                    </div>
                                    <div class="col-md-2">
                                        <button type="submit" name="actualizar_estado" class="btn btn-primary">Actualizar</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                <?php else: ?>
                    <!-- Lista de pedidos -->
                    <div class="row mb-3">
                        <div class="col-md-12">
                            <div class="card">
                                <div class="card-body">
                                    <div class="row text-center">
                                        <div class="col-md-2">
                                            <div class="border-end">
                                                <h5><?php echo $totalPedidos; ?></h5>
                                                <small>Total</small>
                                            </div>
                                        </div>
                                        <div class="col-md-2">
                                            <div class="border-end">
                                                <h5><?php echo isset($ordersCountByStatus['pendiente']) ? $ordersCountByStatus['pendiente'] : 0; ?></h5>
                                                <small>Pendientes</small>
                                            </div>
                                        </div>
                                        <div class="col-md-2">
                                            <div class="border-end">
                                                <h5><?php echo isset($ordersCountByStatus['procesando']) ? $ordersCountByStatus['procesando'] : 0; ?></h5>
                                                <small>Procesando</small>
                                            </div>
                                        </div>
                                        <div class="col-md-2">
                                            <div class="border-end">
                                                <h5><?php echo isset($ordersCountByStatus['enviado']) ? $ordersCountByStatus['enviado'] : 0; ?></h5>
                                                <small>Enviados</small>
                                            </div>
                                        </div>
                                        <div class="col-md-2">
                                            <div class="border-end">
                                                <h5><?php echo isset($ordersCountByStatus['entregado']) ? $ordersCountByStatus['entregado'] : 0; ?></h5>
                                                <small>Entregados</small>
                                            </div>
                                        </div>
                                        <div class="col-md-2">
                                            <h5><?php echo isset($ordersCountByStatus['cancelado']) ? $ordersCountByStatus['cancelado'] : 0; ?></h5>
                                            <small>Cancelados</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
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
                                <?php foreach ($pedidos as $pedido): ?>
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
                                        <a href="?ver=<?php echo $pedido['id']; ?>" class="btn btn-sm btn-primary">
                                            <i class="fas fa-eye"></i> Ver
                                        </a>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>

                    <!-- Paginación -->
                    <?php
                    $stmt = $pdo->query("SELECT COUNT(*) as total FROM pedidos");
                    $totalPedidos = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
                    $totalPages = ceil($totalPedidos / $limit);
                    ?>
                    
                    <nav aria-label="Paginación de pedidos">
                        <ul class="pagination justify-content-center">
                            <?php if ($page > 1): ?>
                                <li class="page-item">
                                    <a class="page-link" href="?pagina=<?php echo $page - 1; ?>">Anterior</a>
                                </li>
                            <?php endif; ?>
                            
                            <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                                <li class="page-item <?php echo $i == $page ? 'active' : ''; ?>">
                                    <a class="page-link" href="?pagina=<?php echo $i; ?>"><?php echo $i; ?></a>
                                </li>
                            <?php endfor; ?>
                            
                            <?php if ($page < $totalPages): ?>
                                <li class="page-item">
                                    <a class="page-link" href="?pagina=<?php echo $page + 1; ?>">Siguiente</a>
                                </li>
                            <?php endif; ?>
                        </ul>
                    </nav>
                <?php endif; ?>
            </main>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>