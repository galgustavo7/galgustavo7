<?php
require_once 'functions.php';
require_once 'Cart.php';

class OrderProcessor {
    private $pdo;
    private $userId;

    public function __construct($pdo, $userId) {
        $this->pdo = $pdo;
        $this->userId = $userId;
    }

    public function processOrder($direccionEnvio, $metodoPago, $transaccionId = null) {
        try {
            $this->pdo->beginTransaction();

            // Obtener items del carrito
            $cart = new Cart($this->pdo, $this->userId);
            $cartItems = $cart->getItems();
            
            if (empty($cartItems)) {
                throw new Exception("El carrito está vacío");
            }

            // Calcular totales
            $subtotal = 0;
            foreach ($cartItems as $item) {
                $subtotal += $item['precio'] * $item['cantidad'];
            }
            
            $impuesto = $subtotal * 0.19; // 19% de IVA
            $envio = $subtotal > 5000 ? 0 : 199.99; // Envío gratuito si compra supera $5000
            $total = $subtotal + $impuesto + $envio;

            // Generar número de pedido
            $numeroPedido = generateOrderNumber();

            // Insertar pedido principal
            $stmt = $this->pdo->prepare("
                INSERT INTO pedidos (usuario_id, numero_pedido, subtotal, impuesto, envio, total, metodo_pago, transaccion_id, direccion_envio)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $this->userId, $numeroPedido, $subtotal, $impuesto, $envio, $total, 
                $metodoPago, $transaccionId, $direccionEnvio
            ]);
            
            $pedidoId = $this->pdo->lastInsertId();

            // Insertar detalles del pedido y actualizar stock
            foreach ($cartItems as $item) {
                // Insertar detalle del pedido
                $detalleStmt = $this->pdo->prepare("
                    INSERT INTO pedido_detalles (pedido_id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $detalleStmt->execute([
                    $pedidoId, $item['producto_id'], $item['nombre'], 
                    $item['precio'], $item['cantidad'], 
                    $item['precio'] * $item['cantidad']
                ]);

                // Actualizar stock del producto
                $stockStmt = $this->pdo->prepare("UPDATE productos SET stock = stock - ? WHERE id = ?");
                $stockStmt->execute([$item['cantidad'], $item['producto_id']]);
            }

            // Vaciar carrito
            $cart->clearCart();

            $this->pdo->commit();
            
            return [
                'success' => true,
                'pedido_id' => $pedidoId,
                'numero_pedido' => $numeroPedido,
                'total' => $total
            ];
        } catch (Exception $e) {
            $this->pdo->rollback();
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    public function updateOrderStatus($orderId, $status) {
        $allowedStatus = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];
        
        if (!in_array($status, $allowedStatus)) {
            return false;
        }

        $stmt = $this->pdo->prepare("UPDATE pedidos SET estado = ? WHERE id = ?");
        return $stmt->execute([$status, $orderId]);
    }

    public function getOrder($orderId) {
        $stmt = $this->pdo->prepare("
            SELECT p.*, u.nombre as usuario_nombre, u.email as usuario_email
            FROM pedidos p
            INNER JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.id = ?
        ");
        $stmt->execute([$orderId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getAllOrders($limit = 20, $offset = 0) {
        $stmt = $this->pdo->prepare("
            SELECT p.*, u.nombre as usuario_nombre
            FROM pedidos p
            INNER JOIN usuarios u ON p.usuario_id = u.id
            ORDER BY p.fecha_pedido DESC
            LIMIT ?, ?
        ");
        $stmt->execute([$offset, $limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getOrdersByStatus($status, $limit = 20, $offset = 0) {
        $stmt = $this->pdo->prepare("
            SELECT p.*, u.nombre as usuario_nombre
            FROM pedidos p
            INNER JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.estado = ?
            ORDER BY p.fecha_pedido DESC
            LIMIT ?, ?
        ");
        $stmt->execute([$status, $offset, $limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getOrdersCountByStatus() {
        $stmt = $this->pdo->query("
            SELECT estado, COUNT(*) as count
            FROM pedidos
            GROUP BY estado
        ");
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $counts = [];
        foreach ($results as $row) {
            $counts[$row['estado']] = $row['count'];
        }
        
        return $counts;
    }
}
?>