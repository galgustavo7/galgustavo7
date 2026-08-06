-- Insertar permisos por defecto
INSERT INTO permissions (role, module, can_view, can_create, can_edit, can_delete, can_approve) VALUES
('superadmin', 'employees', 1, 1, 1, 1, 1),
('superadmin', 'payroll', 1, 1, 1, 1, 1),
('superadmin', 'prestaciones', 1, 1, 1, 1, 1),
('superadmin', 'reports', 1, 1, 1, 1, 1),

('admin', 'employees', 1, 1, 1, 0, 1),
('admin', 'payroll', 1, 1, 1, 0, 1),
('admin', 'prestaciones', 1, 1, 1, 0, 0),
('admin', 'reports', 1, 0, 0, 0, 0),

('rrhh', 'employees', 1, 1, 1, 0, 0),
('rrhh', 'payroll', 1, 0, 0, 0, 0),
('rrhh', 'prestaciones', 1, 0, 1, 0, 0),
('rrhh', 'reports', 1, 0, 0, 0, 0),

('finanzas', 'employees', 1, 0, 0, 0, 0),
('finanzas', 'payroll', 1, 0, 1, 0, 1),
('finanzas', 'prestaciones', 1, 0, 1, 0, 1),
('finanzas', 'reports', 1, 1, 0, 0, 0);

-- Insertar usuario superadmin por defecto
INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES
('admin', 'admin@sistema.com', '$2y$10$YourHashedPasswordHere', 'Super', 'Admin', 'superadmin');

-- Insertar información de empresa por defecto
INSERT INTO company_info (nombre_empresa, rif, direccion, telefono, email) VALUES
('Mi Empresa C.A.', 'J-123456789', 'Dirección Principal', '0412-1234567', 'info@miempresa.com');