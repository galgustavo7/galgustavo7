<?php
require_once 'config/database.php';
require_once 'includes/functions.php';

// Obtener parámetros de búsqueda y filtrado
$categoria = isset($_GET['categoria']) ? (int)$_GET['categoria'] : null;
$busqueda = isset($_GET['busqueda']) ? trim($_GET['busqueda']) : '';
$orden = isset($_GET['orden']) ? $_GET['orden'] : 'nombre';

// Configuración de paginación
$page = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
$limit = 12;
$offset = ($page - 1) * $limit;

// Construcción de la consulta con filtros
$sql = "SELECT p.*, c.nombre as categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.activo = 1";

$params = [];

if ($categoria) {
    $sql .= " AND p.categoria_id = ?";
    $params[] = $categoria;
}

if ($busqueda) {
    $sql .= " AND (p.nombre LIKE ? OR p.descripcion LIKE ?)";
    $params[] = "%$busqueda%";
    $params[] = "%$busqueda%";
}

// Ordenamiento
switch ($orden) {
    case 'precio_asc':
        $sql .= " ORDER BY p.precio ASC";
        break;
    case 'precio_desc':
        $sql .= " ORDER BY p.precio DESC";
        break;
    case 'nombre':
    default:
        $sql .= " ORDER BY p.nombre ASC";
        break;
}

$sql .= " LIMIT ? OFFSET ?";
$params[] = $limit;
$params[] = $offset;

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$productos = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Contar total de productos para paginación
$countSql = "SELECT COUNT(*) as total FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.activo = 1";
if ($categoria) {
    $countSql .= " AND p.categoria_id = ?";
}
if ($busqueda) {
    $countSql .= " AND (p.nombre LIKE ? OR p.descripcion LIKE ?)";
}

$countStmt = $pdo->prepare($countSql);
$countParams = [];
if ($categoria) $countParams[] = $categoria;
if ($busqueda) {
    $countParams[] = "%$busqueda%";
    $countParams[] = "%$busqueda%";
}
$countStmt->execute($countParams);
$totalProductos = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
$totalPages = ceil($totalProductos / $limit);

// Obtener categorías
$categorias = getCategories();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Productos - Edixon Electronic</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <?php include 'includes/header.php'; ?>
    
    <div class="container mt-4">
        <div class="row">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-header">
                        <h5>Filtros</h5>
                    </div>
                    <div class="card-body">
                        <form method="GET">
                            <div class="mb-3">
                                <label for="categoria" class="form-label">Categoría</label>
                                <select name="categoria" id="categoria" class="form-select">
                                    <option value="">Todas las categorías</option>
                                    <?php foreach ($categorias as $cat): ?>
                                        <option value="<?php echo $cat['id']; ?>" <?php echo $categoria == $cat['id'] ? 'selected' : ''; ?>>
                                            <?php echo htmlspecialchars($cat['nombre']); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="busqueda" class="form-label">Buscar</label>
                                <input type="text" name="busqueda" id="busqueda" class="form-control" value="<?php echo htmlspecialchars($busqueda); ?>" placeholder="Buscar productos...">
                            </div>
                            
                            <div class="mb-3">
                                <label for="orden" class="form-label">Ordenar por</label>
                                <select name="orden" id="orden" class="form-select">
                                    <option value="nombre" <?php echo $orden === 'nombre' ? 'selected' : ''; ?>>Nombre A-Z</option>
                                    <option value="precio_asc" <?php echo $orden === 'precio_asc' ? 'selected' : ''; ?>>Precio menor a mayor</option>
                                    <option value="precio_desc" <?php echo $orden === 'precio_desc' ? 'selected' : ''; ?>>Precio mayor a menor</option>
                                </select>
                            </div>
                            
                            <button type="submit" class="btn btn-primary w-100">Aplicar Filtros</button>
                        </form>
                    </div>
                </div>
            </div>
            
            <div class="col-md-9">
                <h2>Productos</h2>
                
                <?php if (empty($productos)): ?>
                    <div class="alert alert-info">
                        No se encontraron productos que coincidan con los filtros aplicados.
                    </div>
                <?php else: ?>
                    <div class="row">
                        <?php foreach ($productos as $producto): ?>
                            <div class="col-lg-4 col-md-6 mb-4">
                                <div class="card product-card">
                                    <?php if ($producto['imagen']): ?>
                                        <img src="<?php echo $producto['imagen']; ?>" class="card-img-top product-image" alt="<?php echo htmlspecialchars($producto['nombre']); ?>">
                                    <?php else: ?>
                                        <img src="https://via.placeholder.com/300x200?text=Sin+Imagen" class="card-img-top product-image" alt="Sin imagen">
                                    <?php endif; ?>
                                    <div class="card-body d-flex flex-column">
                                        <span class="badge bg-secondary mb-2" style="width: fit-content;"><?php echo htmlspecialchars($producto['categoria_nombre']); ?></span>
                                        <h5 class="card-title"><?php echo htmlspecialchars($producto['nombre']); ?></h5>
                                        <p class="card-text"><?php echo substr(htmlspecialchars($producto['descripcion']), 0, 100); ?>...</p>
                                        <div class="mt-auto">
                                            <div class="product-price">$<?php echo number_format($producto['precio'], 2); ?></div>
                                            <div class="product-stock">
                                                <?php if ($producto['stock'] > 0): ?>
                                                    <span class="text-success">
                                                        <i class="fas fa-check-circle"></i> 
                                                        <?php echo $producto['stock']; ?> en stock
                                                    </span>
                                                <?php else: ?>
                                                    <span class="text-danger out-of-stock">
                                                        <i class="fas fa-times-circle"></i> 
                                                        Sin stock
                                                    </span>
                                                <?php endif; ?>
                                            </div>
                                            <button class="btn btn-primary btn-add-to-cart" data-product-id="<?php echo $producto['id']; ?>">
                                                <i class="fas fa-shopping-cart"></i> Añadir al carrito
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                    
                    <!-- Paginación -->
                    <nav aria-label="Paginación de productos">
                        <ul class="pagination justify-content-center">
                            <?php if ($page > 1): ?>
                                <li class="page-item">
                                    <a class="page-link" href="?pagina=<?php echo $page - 1; ?><?php echo $categoria ? '&categoria=' . $categoria : ''; ?><?php echo $busqueda ? '&busqueda=' . urlencode($busqueda) : ''; ?><?php echo $orden ? '&orden=' . $orden : ''; ?>">Anterior</a>
                                </li>
                            <?php endif; ?>
                            
                            <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                                <li class="page-item <?php echo $i == $page ? 'active' : ''; ?>">
                                    <a class="page-link" href="?pagina=<?php echo $i; ?><?php echo $categoria ? '&categoria=' . $categoria : ''; ?><?php echo $busqueda ? '&busqueda=' . urlencode($busqueda) : ''; ?><?php echo $orden ? '&orden=' . $orden : ''; ?>"><?php echo $i; ?></a>
                                </li>
                            <?php endfor; ?>
                            
                            <?php if ($page < $totalPages): ?>
                                <li class="page-item">
                                    <a class="page-link" href="?pagina=<?php echo $page + 1; ?><?php echo $categoria ? '&categoria=' . $categoria : ''; ?><?php echo $busqueda ? '&busqueda=' . urlencode($busqueda) : ''; ?><?php echo $orden ? '&orden=' . $orden : ''; ?>">Siguiente</a>
                                </li>
                            <?php endif; ?>
                        </ul>
                    </nav>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <?php include 'includes/footer.php'; ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Función para añadir al carrito
        document.querySelectorAll('.btn-add-to-cart').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.dataset.productId;
                
                fetch('api/cart.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        product_id: productId,
                        quantity: 1
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Actualizar contador del carrito
                        updateCartCount();
                        // Mostrar mensaje de éxito
                        alert('Producto añadido al carrito');
                    } else {
                        alert('Error: ' + data.message || data.error);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Hubo un problema al añadir el producto al carrito');
                });
            });
        });

        // Función para actualizar el contador del carrito
        function updateCartCount() {
            fetch('api/cart.php')
            .then(response => response.json())
            .then(data => {
                const cartCountElement = document.querySelector('.cart-count');
                if (cartCountElement) {
                    cartCountElement.textContent = data.count || 0;
                }
            })
            .catch(error => {
                console.error('Error al actualizar el contador del carrito:', error);
            });
        }

        // Actualizar contador del carrito al cargar la página
        document.addEventListener('DOMContentLoaded', function() {
            updateCartCount();
        });
    </script>
</body>
</html>