<?php
require_once '../includes/auth.php';
checkAdmin();

require_once '../config/database.php';
require_once '../includes/functions.php';

// Acciones CRUD
$mensaje = '';
$productoEditar = null;

// Eliminar producto
if (isset($_GET['eliminar'])) {
    $id = $_GET['eliminar'];
    $stmt = $pdo->prepare("UPDATE productos SET activo = 0 WHERE id = ?");
    if ($stmt->execute([$id])) {
        $mensaje = "Producto eliminado correctamente.";
    } else {
        $mensaje = "Error al eliminar el producto.";
    }
}

// Editar producto
if (isset($_GET['editar'])) {
    $id = $_GET['editar'];
    $stmt = $pdo->prepare("SELECT * FROM productos WHERE id = ?");
    $stmt->execute([$id]);
    $productoEditar = $stmt->fetch(PDO::FETCH_ASSOC);
}

// Guardar o actualizar producto
if ($_POST && isset($_POST['guardar_producto'])) {
    $nombre = sanitizeInput($_POST['nombre']);
    $descripcion = sanitizeInput($_POST['descripcion']);
    $precio = floatval($_POST['precio']);
    $stock = intval($_POST['stock']);
    $categoria_id = intval($_POST['categoria_id']);
    $destacado = isset($_POST['destacado']) ? 1 : 0;
    $producto_id = intval($_POST['producto_id']);
    
    // Manejo de imagen
    $imagen = '';
    if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] == 0) {
        $uploadDir = '../uploads/';
        $fileName = uniqid() . '_' . basename($_FILES['imagen']['name']);
        $uploadPath = $uploadDir . $fileName;
        
        // Validar tipo de archivo
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (in_array($_FILES['imagen']['type'], $allowedTypes)) {
            if (move_uploaded_file($_FILES['imagen']['tmp_name'], $uploadPath)) {
                $imagen = 'uploads/' . $fileName;
                
                // Si había una imagen anterior, eliminarla
                if (!empty($_POST['imagen_anterior'])) {
                    unlink('../' . $_POST['imagen_anterior']);
                }
            } else {
                $mensaje = "Error al subir la imagen.";
            }
        } else {
            $mensaje = "Tipo de archivo no permitido.";
        }
    } else {
        $imagen = $_POST['imagen_anterior'];
    }
    
    if (empty($mensaje)) {
        if ($producto_id > 0) {
            // Actualizar producto existente
            if (!empty($imagen)) {
                $stmt = $pdo->prepare("UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, categoria_id = ?, imagen = ?, destacado = ? WHERE id = ?");
                $stmt->execute([$nombre, $descripcion, $precio, $stock, $categoria_id, $imagen, $destacado, $producto_id]);
            } else {
                $stmt = $pdo->prepare("UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, categoria_id = ?, destacado = ? WHERE id = ?");
                $stmt->execute([$nombre, $descripcion, $precio, $stock, $categoria_id, $destacado, $producto_id]);
            }
            $mensaje = "Producto actualizado correctamente.";
        } else {
            // Crear nuevo producto
            if (!empty($imagen)) {
                $stmt = $pdo->prepare("INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, imagen, destacado, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$nombre, $descripcion, $precio, $stock, $categoria_id, $imagen, $destacado, $_SESSION['user_id']]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, destacado, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$nombre, $descripcion, $precio, $stock, $categoria_id, $destacado, $_SESSION['user_id']]);
            }
            $mensaje = "Producto agregado correctamente.";
        }
    }
}

// Obtener productos
$page = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
$limit = 10;
$offset = ($page - 1) * $limit;

$stmt = $pdo->prepare("SELECT p.*, c.nombre as categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.activo = 1 ORDER BY p.fecha_creacion DESC LIMIT ?, ?");
$stmt->execute([$offset, $limit]);
$productos = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Contar total de productos
$stmt = $pdo->query("SELECT COUNT(*) as total FROM productos WHERE activo = 1");
$totalProductos = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
$totalPages = ceil($totalProductos / $limit);

// Obtener categorías
$categorias = getCategories();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Productos - Panel de Administración</title>
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
                    <h1 class="h2">
                        <?php echo $productoEditar ? 'Editar Producto' : 'Gestión de Productos'; ?>
                    </h1>
                </div>

                <?php if (!empty($mensaje)): ?>
                    <div class="alert alert-info"><?php echo $mensaje; ?></div>
                <?php endif; ?>

                <?php if ($productoEditar): ?>
                    <!-- Formulario de edición -->
                    <div class="card">
                        <div class="card-body">
                            <form method="post" enctype="multipart/form-data">
                                <input type="hidden" name="producto_id" value="<?php echo $productoEditar['id']; ?>">
                                <input type="hidden" name="imagen_anterior" value="<?php echo $productoEditar['imagen']; ?>">
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="nombre" class="form-label">Nombre</label>
                                            <input type="text" class="form-control" id="nombre" name="nombre" value="<?php echo htmlspecialchars($productoEditar['nombre']); ?>" required>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="descripcion" class="form-label">Descripción</label>
                                            <textarea class="form-control" id="descripcion" name="descripcion" rows="3"><?php echo htmlspecialchars($productoEditar['descripcion']); ?></textarea>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="precio" class="form-label">Precio</label>
                                            <input type="number" step="0.01" class="form-control" id="precio" name="precio" value="<?php echo $productoEditar['precio']; ?>" required>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="stock" class="form-label">Stock</label>
                                            <input type="number" class="form-control" id="stock" name="stock" value="<?php echo $productoEditar['stock']; ?>" required>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="categoria_id" class="form-label">Categoría</label>
                                            <select class="form-control" id="categoria_id" name="categoria_id">
                                                <option value="">Seleccionar categoría</option>
                                                <?php foreach ($categorias as $categoria): ?>
                                                    <option value="<?php echo $categoria['id']; ?>" <?php echo $categoria['id'] == $productoEditar['categoria_id'] ? 'selected' : ''; ?>>
                                                        <?php echo htmlspecialchars($categoria['nombre']); ?>
                                                    </option>
                                                <?php endforeach; ?>
                                            </select>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <div class="form-check">
                                                <input type="checkbox" class="form-check-input" id="destacado" name="destacado" <?php echo $productoEditar['destacado'] ? 'checked' : ''; ?>>
                                                <label class="form-check-label" for="destacado">Destacado</label>
                                            </div>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="imagen" class="form-label">Imagen</label>
                                            <?php if ($productoEditar['imagen']): ?>
                                                <div class="mb-2">
                                                    <img src="../<?php echo $productoEditar['imagen']; ?>" alt="Imagen actual" style="max-width: 200px;">
                                                </div>
                                            <?php endif; ?>
                                            <input type="file" class="form-control" id="imagen" name="imagen" accept="image/*">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mt-3">
                                    <button type="submit" name="guardar_producto" class="btn btn-primary">Guardar Cambios</button>
                                    <a href="productos-admin.php" class="btn btn-secondary">Cancelar</a>
                                </div>
                            </form>
                        </div>
                    </div>
                <?php else: ?>
                    <!-- Botón para agregar nuevo producto -->
                    <div class="mb-3">
                        <a href="productos-admin.php?accion=nuevo" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Agregar Producto
                        </a>
                    </div>
                    
                    <!-- Formulario para nuevo producto -->
                    <?php if (isset($_GET['accion']) && $_GET['accion'] == 'nuevo'): ?>
                    <div class="card mb-4">
                        <div class="card-body">
                            <h5>Agregar Nuevo Producto</h5>
                            <form method="post" enctype="multipart/form-data">
                                <input type="hidden" name="producto_id" value="0">
                                <input type="hidden" name="imagen_anterior" value="">
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="nombre_nuevo" class="form-label">Nombre</label>
                                            <input type="text" class="form-control" id="nombre_nuevo" name="nombre" required>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="descripcion_nuevo" class="form-label">Descripción</label>
                                            <textarea class="form-control" id="descripcion_nuevo" name="descripcion" rows="3"></textarea>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="precio_nuevo" class="form-label">Precio</label>
                                            <input type="number" step="0.01" class="form-control" id="precio_nuevo" name="precio" required>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="stock_nuevo" class="form-label">Stock</label>
                                            <input type="number" class="form-control" id="stock_nuevo" name="stock" required>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="categoria_id_nuevo" class="form-label">Categoría</label>
                                            <select class="form-control" id="categoria_id_nuevo" name="categoria_id">
                                                <option value="">Seleccionar categoría</option>
                                                <?php foreach ($categorias as $categoria): ?>
                                                    <option value="<?php echo $categoria['id']; ?>">
                                                        <?php echo htmlspecialchars($categoria['nombre']); ?>
                                                    </option>
                                                <?php endforeach; ?>
                                            </select>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <div class="form-check">
                                                <input type="checkbox" class="form-check-input" id="destacado_nuevo" name="destacado">
                                                <label class="form-check-label" for="destacado_nuevo">Destacado</label>
                                            </div>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="imagen_nuevo" class="form-label">Imagen</label>
                                            <input type="file" class="form-control" id="imagen_nuevo" name="imagen" accept="image/*">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mt-3">
                                    <button type="submit" name="guardar_producto" class="btn btn-primary">Agregar Producto</button>
                                    <a href="productos-admin.php" class="btn btn-secondary">Cancelar</a>
                                </div>
                            </form>
                        </div>
                    </div>
                    <?php endif; ?>
                    
                    <!-- Lista de productos -->
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Categoría</th>
                                    <th>Precio</th>
                                    <th>Stock</th>
                                    <th>Destacado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($productos as $producto): ?>
                                <tr>
                                    <td><?php echo $producto['id']; ?></td>
                                    <td><?php echo htmlspecialchars($producto['nombre']); ?></td>
                                    <td><?php echo htmlspecialchars($producto['categoria_nombre']); ?></td>
                                    <td>$<?php echo number_format($producto['precio'], 2); ?></td>
                                    <td>
                                        <span class="badge <?php echo $producto['stock'] <= $producto['stock_minimo'] ? 'bg-danger' : 'bg-success'; ?>">
                                            <?php echo $producto['stock']; ?>
                                        </span>
                                    </td>
                                    <td>
                                        <?php if ($producto['destacado']): ?>
                                            <i class="fas fa-star text-warning"></i> Sí
                                        <?php else: ?>
                                            <i class="far fa-star"></i> No
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <a href="?editar=<?php echo $producto['id']; ?>" class="btn btn-sm btn-primary">
                                            <i class="fas fa-edit"></i>
                                        </a>
                                        <a href="?eliminar=<?php echo $producto['id']; ?>" class="btn btn-sm btn-danger" onclick="return confirm('¿Está seguro de eliminar este producto?')">
                                            <i class="fas fa-trash"></i>
                                        </a>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>

                    <!-- Paginación -->
                    <nav aria-label="Paginación de productos">
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