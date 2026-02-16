<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
require_once '../includes/auth.php';
require_once '../includes/Cart.php';

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    $cart = new Cart($pdo, $_SESSION['user_id']);

    switch ($method) {
        case 'GET':
            $items = $cart->getItems();
            $count = $cart->getCount();
            $total = $cart->getTotal();
            
            echo json_encode([
                'items' => $items,
                'count' => $count,
                'total' => $total ? $total : 0
            ]);
            break;
            
        case 'POST':
            if (isset($input['product_id']) && isset($input['quantity'])) {
                $productId = (int)$input['product_id'];
                $quantity = (int)$input['quantity'];
                
                // Verificar que el producto exista y tenga suficiente stock
                $stmt = $pdo->prepare("SELECT stock FROM productos WHERE id = ? AND activo = 1");
                $stmt->execute([$productId]);
                $product = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$product) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Producto no encontrado']);
                    exit();
                }
                
                if ($product['stock'] < $quantity) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Stock insuficiente']);
                    exit();
                }
                
                $result = $cart->addItem($productId, $quantity);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Producto agregado al carrito']);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Error al agregar producto']);
                }
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Datos incompletos']);
            }
            break;
            
        case 'PUT':
            if (isset($input['product_id']) && isset($input['quantity'])) {
                $productId = (int)$input['product_id'];
                $quantity = (int)$input['quantity'];
                
                $result = $cart->updateItem($productId, $quantity);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Carrito actualizado']);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Error al actualizar producto']);
                }
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Datos incompletos']);
            }
            break;
            
        case 'DELETE':
            if (isset($_GET['product_id'])) {
                $productId = (int)$_GET['product_id'];
                
                $result = $cart->removeItem($productId);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Producto eliminado del carrito']);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Error al eliminar producto']);
                }
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'ID de producto requerido']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor']);
}
?>