<?php
class Cart {
    private $pdo;
    private $userId;

    public function __construct($pdo, $userId) {
        $this->pdo = $pdo;
        $this->userId = $userId;
    }

    public function addItem($productId, $quantity = 1) {
        // Verificar si el producto ya está en el carrito
        $stmt = $this->pdo->prepare("SELECT * FROM carrito WHERE usuario_id = ? AND producto_id = ?");
        $stmt->execute([$this->userId, $productId]);
        $existingItem = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existingItem) {
            // Actualizar cantidad si ya existe
            $newQuantity = $existingItem['cantidad'] + $quantity;
            $updateStmt = $this->pdo->prepare("UPDATE carrito SET cantidad = ? WHERE id = ?");
            $updateStmt->execute([$newQuantity, $existingItem['id']]);
        } else {
            // Agregar nuevo item al carrito
            $insertStmt = $this->pdo->prepare("INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)");
            $insertStmt->execute([$this->userId, $productId, $quantity]);
        }
        
        return true;
    }

    public function updateItem($productId, $quantity) {
        if ($quantity <= 0) {
            return $this->removeItem($productId);
        }
        
        $stmt = $this->pdo->prepare("UPDATE carrito SET cantidad = ? WHERE usuario_id = ? AND producto_id = ?");
        $result = $stmt->execute([$quantity, $this->userId, $productId]);
        
        return $result;
    }

    public function removeItem($productId) {
        $stmt = $this->pdo->prepare("DELETE FROM carrito WHERE usuario_id = ? AND producto_id = ?");
        $result = $stmt->execute([$this->userId, $productId]);
        
        return $result;
    }

    public function clearCart() {
        $stmt = $this->pdo->prepare("DELETE FROM carrito WHERE usuario_id = ?");
        $result = $stmt->execute([$this->userId]);
        
        return $result;
    }

    public function getItems() {
        $stmt = $this->pdo->prepare("
            SELECT c.*, p.nombre, p.precio, p.imagen, p.stock 
            FROM carrito c 
            INNER JOIN productos p ON c.producto_id = p.id 
            WHERE c.usuario_id = ?
        ");
        $stmt->execute([$this->userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTotal() {
        $stmt = $this->pdo->prepare("
            SELECT SUM(c.cantidad * p.precio) as total 
            FROM carrito c 
            INNER JOIN productos p ON c.producto_id = p.id 
            WHERE c.usuario_id = ?
        ");
        $stmt->execute([$this->userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    }

    public function getCount() {
        $stmt = $this->pdo->prepare("SELECT SUM(cantidad) as count FROM carrito WHERE usuario_id = ?");
        $stmt->execute([$this->userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        return $result ? $result : 0;
    }
}
?>