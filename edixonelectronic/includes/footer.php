<footer class="mt-5">
    <div class="container">
        <div class="row">
            <div class="col-md-4">
                <h5>Edixon Electronic</h5>
                <p>La mejor tienda de electrónica con los precios más competitivos del mercado.</p>
            </div>
            <div class="col-md-4">
                <h5>Enlaces Rápidos</h5>
                <ul class="list-unstyled">
                    <li><a href="index.php">Inicio</a></li>
                    <li><a href="productos.php">Productos</a></li>
                    <?php if (isLoggedIn()): ?>
                        <li><a href="carrito.php">Carrito</a></li>
                        <li><a href="mis-pedidos.php">Mis Pedidos</a></li>
                    <?php else: ?>
                        <li><a href="login.php">Iniciar Sesión</a></li>
                        <li><a href="register.php">Registrarse</a></li>
                    <?php endif; ?>
                </ul>
            </div>
            <div class="col-md-4">
                <h5>Contacto</h5>
                <p>
                    <i class="fas fa-map-marker-alt"></i> Ciudad de México<br>
                    <i class="fas fa-phone"></i> +52 55 1234 5678<br>
                    <i class="fas fa-envelope"></i> contacto@edixonelectronic.com
                </p>
            </div>
        </div>
        <hr>
        <div class="text-center">
            <p>&copy; <?php echo date('Y'); ?> Edixon Electronic. Todos los derechos reservados.</p>
        </div>
    </div>
</footer>