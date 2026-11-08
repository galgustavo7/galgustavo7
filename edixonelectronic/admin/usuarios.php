<?php
require_once '../includes/auth.php';
checkAdmin();

require_once '../config/database.php';
require_once '../includes/functions.php';

// Acciones CRUD
$mensaje = '';
$usuarioEditar = null;

// Eliminar usuario
if (isset($_GET['eliminar'])) {
    $id = $_GET['eliminar'];
    $stmt = $pdo->prepare("UPDATE usuarios SET activo = 0 WHERE id = ?");
    if ($stmt->execute([$id])) {
        $mensaje = "Usuario desactivado correctamente.";
    } else {
        $mensaje = "Error al desactivar el usuario.";
    }
}

// Activar usuario
if (isset($_GET['activar'])) {
    $id = $_GET['activar'];
    $stmt = $pdo->prepare("UPDATE usuarios SET activo = 1 WHERE id = ?");
    if ($stmt->execute([$id])) {
        $mensaje = "Usuario activado correctamente.";
    } else {
        $mensaje = "Error al activar el usuario.";
    }
}

// Editar usuario
if (isset($_GET['editar'])) {
    $id = $_GET['editar'];
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE id = ?");
    $stmt->execute([$id]);
    $usuarioEditar = $stmt->fetch(PDO::FETCH_ASSOC);
}

// Guardar o actualizar usuario
if ($_POST && isset($_POST['guardar_usuario'])) {
    $nombre = sanitizeInput($_POST['nombre']);
    $email = sanitizeInput($_POST['email']);
    $rol = sanitizeInput($_POST['rol']);
    $activo = isset($_POST['activo']) ? 1 : 0;
    $usuario_id = intval($_POST['usuario_id']);
    
    // Verificar si el email ya existe (excepto para el usuario actual)
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ? AND id != ?");
    $stmt->execute([$email, $usuario_id]);
    if ($stmt->rowCount() > 0) {
        $mensaje = "El email ya está registrado por otro usuario.";
    } else {
        if ($usuario_id > 0) {
            // Actualizar usuario existente
            if (!empty($_POST['password'])) {
                $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("UPDATE usuarios SET nombre = ?, email = ?, rol = ?, activo = ?, password = ? WHERE id = ?");
                $stmt->execute([$nombre, $email, $rol, $activo, $password, $usuario_id]);
            } else {
                $stmt = $pdo->prepare("UPDATE usuarios SET nombre = ?, email = ?, rol = ?, activo = ? WHERE id = ?");
                $stmt->execute([$nombre, $email, $rol, $activo, $usuario_id]);
            }
            $mensaje = "Usuario actualizado correctamente.";
        } else {
            // Crear nuevo usuario
            $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$nombre, $email, $password, $rol, $activo]);
            $mensaje = "Usuario agregado correctamente.";
        }
    }
}

// Obtener usuarios
$page = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
$limit = 10;
$offset = ($page - 1) * $limit;

$stmt = $pdo->prepare("SELECT * FROM usuarios ORDER BY fecha_registro DESC LIMIT ?, ?");
$stmt->execute([$offset, $limit]);
$usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Contar total de usuarios
$stmt = $pdo->query("SELECT COUNT(*) as total FROM usuarios");
$totalUsuarios = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
$totalPages = ceil($totalUsuarios / $limit);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Usuarios - Panel de Administración</title>
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
                        <?php echo $usuarioEditar ? 'Editar Usuario' : 'Gestión de Usuarios'; ?>
                    </h1>
                </div>

                <?php if (!empty($mensaje)): ?>
                    <div class="alert alert-info"><?php echo $mensaje; ?></div>
                <?php endif; ?>

                <?php if ($usuarioEditar): ?>
                    <!-- Formulario de edición -->
                    <div class="card">
                        <div class="card-body">
                            <form method="post">
                                <input type="hidden" name="usuario_id" value="<?php echo $usuarioEditar['id']; ?>">
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="nombre" class="form-label">Nombre</label>
                                            <input type="text" class="form-control" id="nombre" name="nombre" value="<?php echo htmlspecialchars($usuarioEditar['nombre']); ?>" required>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="email" class="form-label">Email</label>
                                            <input type="email" class="form-control" id="email" name="email" value="<?php echo htmlspecialchars($usuarioEditar['email']); ?>" required>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="rol" class="form-label">Rol</label>
                                            <select class="form-control" id="rol" name="rol">
                                                <option value="usuario" <?php echo $usuarioEditar['rol'] == 'usuario' ? 'selected' : ''; ?>>Usuario</option>
                                                <option value="admin" <?php echo $usuarioEditar['rol'] == 'admin' ? 'selected' : ''; ?>>Administrador</option>
                                            </select>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="password" class="form-label">Contraseña (dejar vacío para mantener la actual)</label>
                                            <input type="password" class="form-control" id="password" name="password">
                                        </div>
                                        
                                        <div class="mb-3">
                                            <div class="form-check">
                                                <input type="checkbox" class="form-check-input" id="activo" name="activo" <?php echo $usuarioEditar['activo'] ? 'checked' : ''; ?>>
                                                <label class="form-check-label" for="activo">Activo</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mt-3">
                                    <button type="submit" name="guardar_usuario" class="btn btn-primary">Guardar Cambios</button>
                                    <a href="usuarios.php" class="btn btn-secondary">Cancelar</a>
                                </div>
                            </form>
                        </div>
                    </div>
                <?php else: ?>
                    <!-- Botón para agregar nuevo usuario -->
                    <div class="mb-3">
                        <a href="usuarios.php?accion=nuevo" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Agregar Usuario
                        </a>
                    </div>
                    
                    <!-- Formulario para nuevo usuario -->
                    <?php if (isset($_GET['accion']) && $_GET['accion'] == 'nuevo'): ?>
                    <div class="card mb-4">
                        <div class="card-body">
                            <h5>Agregar Nuevo Usuario</h5>
                            <form method="post">
                                <input type="hidden" name="usuario_id" value="0">
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="nombre_nuevo" class="form-label">Nombre</label>
                                            <input type="text" class="form-control" id="nombre_nuevo" name="nombre" required>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="email_nuevo" class="form-label">Email</label>
                                            <input type="email" class="form-control" id="email_nuevo" name="email" required>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="rol_nuevo" class="form-label">Rol</label>
                                            <select class="form-control" id="rol_nuevo" name="rol">
                                                <option value="usuario">Usuario</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="password_nuevo" class="form-label">Contraseña</label>
                                            <input type="password" class="form-control" id="password_nuevo" name="password" required>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mt-3">
                                    <button type="submit" name="guardar_usuario" class="btn btn-primary">Agregar Usuario</button>
                                    <a href="usuarios.php" class="btn btn-secondary">Cancelar</a>
                                </div>
                            </form>
                        </div>
                    </div>
                    <?php endif; ?>
                    
                    <!-- Lista de usuarios -->
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Registro</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($usuarios as $usuario): ?>
                                <tr>
                                    <td><?php echo $usuario['id']; ?></td>
                                    <td><?php echo htmlspecialchars($usuario['nombre']); ?></td>
                                    <td><?php echo htmlspecialchars($usuario['email']); ?></td>
                                    <td>
                                        <span class="badge 
                                            <?php 
                                                echo $usuario['rol'] === 'admin' ? 'bg-danger' : 'bg-success'; 
                                            ?>
                                        ">
                                            <?php echo ucfirst($usuario['rol']); ?>
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge 
                                            <?php 
                                                echo $usuario['activo'] ? 'bg-success' : 'bg-secondary'; 
                                            ?>
                                        ">
                                            <?php echo $usuario['activo'] ? 'Activo' : 'Inactivo'; ?>
                                        </span>
                                    </td>
                                    <td><?php echo date('d/m/Y', strtotime($usuario['fecha_registro'])); ?></td>
                                    <td>
                                        <a href="?editar=<?php echo $usuario['id']; ?>" class="btn btn-sm btn-primary">
                                            <i class="fas fa-edit"></i>
                                        </a>
                                        <?php if ($usuario['activo']): ?>
                                            <a href="?eliminar=<?php echo $usuario['id']; ?>" class="btn btn-sm btn-warning" onclick="return confirm('¿Está seguro de desactivar este usuario?')">
                                                <i class="fas fa-user-slash"></i>
                                            </a>
                                        <?php else: ?>
                                            <a href="?activar=<?php echo $usuario['id']; ?>" class="btn btn-sm btn-success" onclick="return confirm('¿Está seguro de activar este usuario?')">
                                                <i class="fas fa-user-check"></i>
                                            </a>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>

                    <!-- Paginación -->
                    <nav aria-label="Paginación de usuarios">
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