<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
require_once '../includes/auth.php';
require_once '../includes/PaymentGateway.php';

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
    switch ($method) {
        case 'POST':
            if (isset($input['amount']) && isset($input['order_id'])) {
                $amount = floatval($input['amount']);
                $orderId = $input['order_id'];
                $description = isset($input['description']) ? $input['description'] : '';
                
                // Inicializar gateway de pagos
                $paymentGateway = new PaymentGateway();
                
                // Procesar pago
                $paymentResult = $paymentGateway->createPayment($amount, 'MXN', $orderId, $description);
                
                if ($paymentResult['success']) {
                    // Aquí normalmente se guardaría la transacción en la base de datos
                    // y se actualizaría el estado del pedido
                    
                    echo json_encode([
                        'success' => true,
                        'transaction_id' => $paymentResult['transaction_id'],
                        'status' => $paymentResult['status'],
                        'message' => 'Pago procesado exitosamente'
                    ]);
                } else {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Error al procesar el pago'
                    ]);
                }
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Datos incompletos']);
            }
            break;
            
        case 'GET':
            if (isset($_GET['transaction_id'])) {
                $transactionId = $_GET['transaction_id'];
                
                // Inicializar gateway de pagos
                $paymentGateway = new PaymentGateway();
                
                // Validar pago
                $validationResult = $paymentGateway->validatePayment($transactionId);
                
                if ($validationResult['valid']) {
                    echo json_encode([
                        'success' => true,
                        'transaction_id' => $validationResult['payment_id'],
                        'status' => $validationResult['status']
                    ]);
                } else {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Transacción inválida'
                    ]);
                }
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'ID de transacción requerido']);
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