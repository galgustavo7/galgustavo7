CREATE DATABASE nomina_ve_enterprise;
USE nomina_ve_enterprise;

-- ==============================================
-- TABLAS DE SEGURIDAD Y AUTENTICACIÓN
-- ==============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role ENUM('admin', 'rrhh', 'finanzas', 'empleado', 'superadmin') DEFAULT 'empleado',
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    can_view BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_approve BOOLEAN DEFAULT FALSE,
    UNIQUE KEY unique_role_module (role, module)
);

CREATE TABLE sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    token VARCHAR(512) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(50),
    module VARCHAR(50),
    record_id INT,
    old_data JSON,
    new_data JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==============================================
-- TABLAS DE RECURSOS HUMANOS (MEJORADAS)
-- ==============================================
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    rif VARCHAR(20) UNIQUE,
    fecha_nacimiento DATE,
    lugar_nacimiento VARCHAR(200),
    nacionalidad ENUM('V', 'E') DEFAULT 'V',
    estado_civil ENUM('soltero', 'casado', 'divorciado', 'viudo') DEFAULT 'soltero',
    sexo ENUM('M', 'F') DEFAULT 'M',
    direccion TEXT,
    telefono_habitacion VARCHAR(20),
    telefono_movil VARCHAR(20),
    email_personal VARCHAR(100),
    email_corporativo VARCHAR(100),
    nivel_instruccion VARCHAR(100),
    profesion VARCHAR(100),
    fecha_ingreso DATE NOT NULL,
    fecha_egreso DATE,
    tipo_contrato ENUM('fijo', 'indefinido', 'temporal', 'obra') DEFAULT 'indefinido',
    status ENUM('activo', 'suspendido', 'retirado', 'vacaciones') DEFAULT 'activo',
    cuenta_bancaria VARCHAR(30),
    banco VARCHAR(100),
    tipo_cuenta ENUM('ahorro', 'corriente') DEFAULT 'ahorro',
    moneda_pago ENUM('VES', 'USD') DEFAULT 'VES',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE family_info (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    nombre VARCHAR(200),
    parentesco VARCHAR(50),
    fecha_nacimiento DATE,
    cedula VARCHAR(20),
    porcentaje_carga INT DEFAULT 0,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE positions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(20) UNIQUE,
    nombre_cargo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    nivel VARCHAR(50),
    departamento VARCHAR(100),
    salario_base_min DECIMAL(12,2),
    salario_base_max DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee_positions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    position_id INT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    salario_base DECIMAL(12,2) NOT NULL,
    moneda ENUM('VES', 'USD') DEFAULT 'VES',
    tipo_pago ENUM('diario', 'mensual') DEFAULT 'mensual',
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (position_id) REFERENCES positions(id)
);

-- ==============================================
-- TABLAS DE NÓMINA (COMPLETAS)
-- ==============================================
CREATE TABLE payroll_periods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(20) UNIQUE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    tipo_periodo ENUM('semanal', 'quincenal', 'mensual') DEFAULT 'mensual',
    fecha_pago DATE,
    status ENUM('abierto', 'procesando', 'cerrado', 'anulado') DEFAULT 'abierto',
    created_by INT,
    approved_by INT,
    fecha_aprobacion DATETIME,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- CONCEPTOS DE NÓMINA (Configurables)
CREATE TABLE payroll_concepts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(20) UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('asignacion', 'deduccion', 'aporte') NOT NULL,
    formula TEXT,
    base_calculo VARCHAR(50),
    porcentaje DECIMAL(5,2),
    afecta_islr BOOLEAN DEFAULT TRUE,
    afecta_sso BOOLEAN DEFAULT TRUE,
    afecta_prestaciones BOOLEAN DEFAULT TRUE,
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HORAS EXTRAS
CREATE TABLE extra_hours (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    fecha DATE NOT NULL,
    horas_diurnas DECIMAL(5,2) DEFAULT 0,
    horas_nocturnas DECIMAL(5,2) DEFAULT 0,
    horas_feriado DECIMAL(5,2) DEFAULT 0,
    horas_descanso DECIMAL(5,2) DEFAULT 0,
    recargo_diurno DECIMAL(5,2) DEFAULT 50,  -- 50% sobre hora normal
    recargo_nocturno DECIMAL(5,2) DEFAULT 60, -- 60% sobre hora normal
    recargo_feriado DECIMAL(5,2) DEFAULT 100, -- 100% sobre hora normal
    justificacion TEXT,
    aprobado_por INT,
    status ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (aprobado_por) REFERENCES users(id)
);

-- BONOS Y ASIGNACIONES ESPECIALES
CREATE TABLE bonuses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    tipo_bono VARCHAR(100),
    concepto VARCHAR(200),
    monto DECIMAL(12,2),
    moneda ENUM('VES', 'USD') DEFAULT 'VES',
    fecha_asignacion DATE,
    fecha_pago DATE,
    periodicidad ENUM('unico', 'mensual', 'trimestral', 'anual') DEFAULT 'unico',
    aprobado_por INT,
    status ENUM('activo', 'pagado', 'anulado') DEFAULT 'activo',
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (aprobado_por) REFERENCES users(id)
);

-- COMISIONES
CREATE TABLE commissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    venta_id VARCHAR(50),
    cliente VARCHAR(200),
    monto_venta DECIMAL(12,2),
    porcentaje_comision DECIMAL(5,2),
    monto_comision DECIMAL(12,2),
    moneda ENUM('VES', 'USD') DEFAULT 'VES',
    fecha_venta DATE,
    fecha_pago DATE,
    status ENUM('pendiente', 'pagada', 'anulada') DEFAULT 'pendiente',
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- PRÉSTAMOS A EMPLEADOS
CREATE TABLE loans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    monto_total DECIMAL(12,2),
    monto_cuota DECIMAL(12,2),
    numero_cuotas INT,
    cuotas_pagadas INT DEFAULT 0,
    fecha_inicio DATE,
    fecha_fin DATE,
    interes DECIMAL(5,2) DEFAULT 0,
    motivo TEXT,
    garantia TEXT,
    aprobado_por INT,
    status ENUM('activo', 'pagado', 'suspendido') DEFAULT 'activo',
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (aprobado_por) REFERENCES users(id)
);

-- DETALLE DE NÓMINA (COMPLETO)
CREATE TABLE payroll_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    period_id INT,
    employee_id INT,
    dias_laborados INT DEFAULT 30,
    dias_ausentes INT DEFAULT 0,
    dias_permiso INT DEFAULT 0,
    salario_base DECIMAL(12,2),
    salario_diario DECIMAL(12,2),
    asignaciones_detalle JSON,
    deducciones_detalle JSON,
    total_asignaciones DECIMAL(12,2),
    total_deducciones DECIMAL(12,2),
    total_aportes_patrono DECIMAL(12,2),
    neto_pagar DECIMAL(12,2),
    neto_en_dolares DECIMAL(12,2),
    tasa_cambio DECIMAL(12,2),
    moneda_pago ENUM('VES', 'USD') DEFAULT 'VES',
    referencia_pago VARCHAR(100),
    fecha_pago DATETIME,
    pagado_por INT,
    status ENUM('calculado', 'aprobado', 'pagado', 'anulado') DEFAULT 'calculado',
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES payroll_periods(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (pagado_por) REFERENCES users(id)
);

-- ==============================================
-- TABLAS DE BENEFICIOS LABORALES (LOTTT)
-- ==============================================

-- PRESTACIONES SOCIALES
CREATE TABLE prestaciones_sociales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    periodo_inicio DATE,
    periodo_fin DATE,
    salario_integral DECIMAL(12,2),
    dias_acumulados INT,
    monto_garantia DECIMAL(12,2),
    intereses_generados DECIMAL(12,2),
    monto_total DECIMAL(12,2),
    fecha_calculo DATE,
    status ENUM('activo', 'liquidado') DEFAULT 'activo',
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- HISTÓRICO DE PRESTACIONES (MENSUAL)
CREATE TABLE prestaciones_historico (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    mes INT,
    anio INT,
    salario_base DECIMAL(12,2),
    alicuota_utilidades DECIMAL(12,2),
    alicuota_vacaciones DECIMAL(12,2),
    salario_integral DECIMAL(12,2),
    dias_ganados INT,
    acumulado_dias INT,
    monto_acumulado DECIMAL(12,2),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- UTILIDADES
CREATE TABLE utilidades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    anio INT,
    meses_trabajados INT,
    dias_trabajados INT,
    salario_promedio DECIMAL(12,2),
    dias_utilidad INT,
    monto_bruto DECIMAL(12,2),
    deducciones JSON,
    monto_neto DECIMAL(12,2),
    fecha_pago DATE,
    status ENUM('calculado', 'pagado', 'anulado') DEFAULT 'calculado',
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- VACACIONES
CREATE TABLE vacaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    periodo_inicio DATE,
    periodo_fin DATE,
    dias_vacaciones INT DEFAULT 15,
    dias_adicionales INT DEFAULT 0,
    total_dias INT,
    fecha_inicio_vacaciones DATE,
    fecha_fin_vacaciones DATE,
    bono_vacacional DECIMAL(12,2),
    monto_pagar DECIMAL(12,2),
    fecha_pago DATE,
    status ENUM('planificada', 'disfrutada', 'pagada', 'diferida') DEFAULT 'planificada',
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- ==============================================
-- TABLAS DE REPORTES Y ESTADÍSTICAS
-- ==============================================
CREATE TABLE report_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(200),
    tipo ENUM('pdf', 'excel'),
    modulo VARCHAR(50),
    configuracion JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE generated_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_id INT,
    nombre_archivo VARCHAR(200),
    ruta_archivo VARCHAR(500),
    parametros JSON,
    generado_por INT,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES report_templates(id),
    FOREIGN KEY (generado_por) REFERENCES users(id)
);

-- ==============================================
-- TABLAS DE CONFIGURACIÓN
-- ==============================================
CREATE TABLE company_info (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_empresa VARCHAR(200),
    rif VARCHAR(20),
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    logo VARCHAR(500),
    patrono VARCHAR(200),
    representante_legal VARCHAR(200),
    registro_ivss VARCHAR(50),
    registro_inces VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exchange_rates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moneda_origen VARCHAR(3) DEFAULT 'USD',
    moneda_destino VARCHAR(3) DEFAULT 'VES',
    tasa DECIMAL(12,4),
    fecha DATE,
    fuente VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(100) UNIQUE,
    valor TEXT,
    descripcion TEXT,
    tipo VARCHAR(50)
);