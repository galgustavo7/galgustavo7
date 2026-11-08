<?php
require_once '../config/database.php';
require_once 'auth.php';

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

function generateOrderNumber() {
    return 'ORD-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid()), 0, 8));
}

function getProductById($id) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT p.*, c.nombre as categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function getProducts($limit = 12, $offset = 0, $category = null) {
    global $pdo;
    $sql = "SELECT p.*, c.nombre as categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.activo = 1";
    
    if ($category) {
        $sql .= " AND p.categoria_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$category]);
    } else {
        $stmt = $pdo->prepare($sql . " LIMIT ?, ?");
        $stmt->execute([$offset, $limit]);
    }
    
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getCategories() {
    global $pdo;
    $stmt = $pdo->query("SELECT * FROM categorias WHERE activo = 1");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getFeaturedProducts() {
    global $pdo;
    $stmt = $pdo->query("SELECT p.*, c.nombre as categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.destacado = 1 AND p.activo = 1 LIMIT 8");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getCartItems($userId) {
    global $pdo;
    $stmt = $pdo->prepare("
        SELECT c.*, p.nombre, p.precio, p.imagen 
        FROM carrito c 
        INNER JOIN productos p ON c.producto_id = p.id 
        WHERE c.usuario_id = ?
    ");
    $stmt->execute([$userId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function calculateCartTotal($userId) {
    global $pdo;
    $stmt = $pdo->prepare("
        SELECT SUM(c.cantidad * p.precio) as total 
        FROM carrito c 
        INNER JOIN productos p ON c.producto_id = p.id 
        WHERE c.usuario_id = ?
    ");
    $stmt->execute([$userId]);
    return $stmt->fetch(PDO::FETCH_ASSOC)['total'];
}

function getUserOrders($userId) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY fecha_pedido DESC");
    $stmt->execute([$userId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getOrderDetails($orderId) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM pedido_detalles WHERE pedido_id = ?");
    $stmt->execute([$orderId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getUserAddresses($userId) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM direcciones WHERE usuario_id = ? ORDER BY es_principal DESC, id DESC");
    $stmt->execute([$userId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function updateUserLastAccess($userId) {
    global $pdo;
    $stmt = $pdo->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?");
    $stmt->execute([$userId]);
}
?>