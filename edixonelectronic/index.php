<?php
require_once 'config/database.php';
require_once 'includes/functions.php';

// Obtener productos destacados
$productosDestacados = getFeaturedProducts();

// Obtener todas las categorías
$categorias = getCategories();

// Obtener productos por categoría si se selecciona
$categoriaSeleccionada = isset($_GET['categoria']) ? (int)$_GET['categoria'] : null;
$productos = getProducts(12, 0, $categoriaSeleccionada);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edixon Electronic - Tienda de Electrónica</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <?php include 'includes/header.php'; ?>
    
    <!-- Jumbotron -->
    <div class="jumbotron">
        <div class="container text-center">
            <h1 class="display-4">Bienvenido a Edixon Electronic</h1>
            <p class="lead">La mejor selección de productos electrónicos al mejor precio</p>
            <a class="btn btn-light btn-lg" href="productos.php" role="button">Ver Productos</a>
        </div>
    </div>

    <!-- Categorías -->
    <div class="container mt-5">
        <h2 class="section-title">Categorías</h2>
        <div class="row">
            <?php foreach ($categorias as $categoria): ?>
                <div class="col-md-2 col-4 mb-3">
                    <a href="productos.php?categoria=<?php echo $categoria['id']; ?>" class="text-decoration-none">
                        <div class="card text-center">
                            <div class="card-body">
                                <i class="fas fa-box-open fa-2x text-primary"></i>
                                <h6 class="card-title mt-2"><?php echo htmlspecialchars($categoria['nombre']); ?></h6>
                            </div>
                        </div>
                    </a>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Productos Destacados -->
    <section class="featured-products">
        <div class="container">
            <h2 class="section-title">Productos Destacados</h2>
            <div class="row">
                <?php foreach ($productosDestacados as $producto): ?>
                    <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                        <div class="card product-card">
                            <?php if ($producto['imagen']): ?>
                                <img src="<?php echo $producto['imagen']; ?>" class="card-img-top product-image" alt="<?php echo htmlspecialchars($producto['nombre']); ?>">
                            <?php else: ?>
                                <img src="https://via.placeholder.com/300x200?text=Sin+Imagen" class="card-img-top product-image" alt="Sin imagen">
                            <?php endif; ?>
                            <div class="card-body d-flex flex-column">
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
        </div>
    </section>

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