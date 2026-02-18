<?php
// Constantes del sistema
define('APP_NAME', 'Nómina Venezuela Enterprise');
define('APP_VERSION', '1.0.0');
define('BASE_URL', 'http://localhost/nomina-venezuela-enterprise');
define('UPLOAD_PATH', '../uploads/');
define('REPORT_PATH', '../reports/generated/');

// Tasas de conversión por defecto
define('TASA_IVSS', 0.04); // 4% para trabajador
define('TASA_ISRL', 0.01); // Tasa base para ISR
define('TASA_CAJA_AHORRO', 0.01); // 1% para caja de ahorro

// Configuración de nómina
define('DIAS_LABORABLES_MES', 30);
define('HORAS_LABORALES_DIA', 8);

// Roles de usuarios
define('ROLE_SUPERADMIN', 'superadmin');
define('ROLE_ADMIN', 'admin');
define('ROLE_RRHH', 'rrhh');
define('ROLE_FINANZAS', 'finanzas');
define('ROLE_EMPLEADO', 'empleado');
?>