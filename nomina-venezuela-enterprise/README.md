# Nómina Venezuela Enterprise

Sistema integral de gestión de nómina desarrollado específicamente para cumplir con las regulaciones laborales venezolanas, incluyendo cálculos de Ley Orgánica del Trabajo, los Trabajadores y las Trabajadoras (LOTTT), beneficios sociales, utilidades, vacaciones y otros componentes del régimen laboral venezolano.

## Características Principales

### 🏢 Gestión de Empleados
- Registro completo de datos personales y laborales
- Control de documentos (cédula, RIF)
- Historial laboral y contratos
- Información familiar y dependientes
- Puestos y jerarquías organizacionales

### 💰 Gestión de Nómina
- Cálculo automático de salarios y beneficios
- Conceptos configurables (asignaciones, deducciones, aportes)
- Horas extras con diferentes tipos de recargo
- Bonos y comisiones
- Préstamos a empleados
- Conversión de divisas (VES/USD)

### 🎁 Beneficios Laborales (LOTTT)
- **Prestaciones Sociales**: Cálculo de garantía, intereses y provisiones
- **Utilidades**: Distribución proporcional al tiempo de servicio
- **Vacaciones**: Días acumulados, bonificación, disfrute y pago
- **Cesantías**: Provisiones y liquidaciones
- **Bonificaciones legales**: Ley de Vivienda, Ley de Transporte, etc.

### 🔐 Seguridad y Autenticación
- Sistema de roles y permisos detallado
- Control de acceso por módulos
- Auditoría de acciones
- Sesiones seguras

### 📊 Reportes y Estadísticas
- Reportes personalizables
- Exportación a PDF y Excel
- KPIs de recursos humanos
- Análisis de costos de nómina

## Arquitectura del Sistema

```
nomina-venezuela-enterprise/
├── assets/
│   ├── css/
│   │   ├── bootstrap.min.css
│   │   └── custom.css
│   ├── js/
│   │   ├── vue.js
│   │   ├── axios.js
│   │   └── app.js
│   └── img/
├── backend/
│   ├── api/
│   │   ├── auth.php
│   │   ├── employees.php
│   │   ├── payroll.php
│   │   ├── prestaciones.php
│   │   ├── utilidades.php
│   │   ├── vacaciones.php
│   │   ├── reports.php
│   │   └── dashboard.php
│   ├── config/
│   │   ├── database.php
│   │   ├── constants.php
│   │   └── jwt.php
│   ├── core/
│   │   ├── Controller.php
│   │   ├── Model.php
│   │   ├── Auth.php
│   │   ├── PDFGenerator.php
│   │   └── CurrencyConverter.php
│   ├── modules/
│   │   ├── employees/
│   │   │   ├── EmployeeModel.php
│   │   │   └── EmployeeController.php
│   │   ├── payroll/
│   │   │   ├── PayrollModel.php
│   │   │   ├── ExtraHoursModel.php
│   │   │   ├── BonusModel.php
│   │   │   └── CommissionModel.php
│   │   ├── contributions/
│   │   │   ├── PrestacionesModel.php
│   │   │   ├── UtilidadesModel.php
│   │   │   └── VacacionesModel.php
│   │   ├── reports/
│   │   │   ├── PDFReport.php
│   │   │   └── ExcelReport.php
│   │   └── dashboard/
│   │       └── DashboardModel.php
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── dashboard.html
│   ├── employees.html
│   ├── payroll.html
│   ├── prestaciones.html
│   ├── utilidades.html
│   ├── reports.html
│   └── components/
│       ├── Sidebar.js
│       ├── Header.js
│       └── Charts.js
├── database/
│   ├── schema_completo.sql
│   └── seeds.sql
├── reports/
│   └── generated/
├── .htaccess
└── README.md
```

## Requisitos del Sistema

### Servidor
- PHP 8.0 o superior
- MySQL 5.7 o superior
- Apache o Nginx
- OpenSSL para JWT

### Características Técnicas
- Responsive Design
- Single Page Application (SPA)
- API RESTful
- Base de datos relacional
- Seguridad avanzada

## Instalación

1. Clonar el repositorio
2. Configurar el servidor web
3. Importar el esquema de la base de datos (`database/schema_completo.sql`)
4. Ejecutar los seeds (`database/seeds.sql`)
5. Configurar las credenciales de la base de datos en `backend/config/database.php`

## Configuración Inicial

### Variables de Configuración
- Tasa de cambio oficial (para conversiones VES/USD)
- Tasas de aportes patronales
- Parámetros de cálculo de beneficios
- Información de la empresa

### Usuarios por Defecto
- Usuario: `admin`
- Contraseña: `admin` (cambiar después de la primera conexión)

## Funcionalidades Específicas Venezolanas

### Cálculos Legales
- **Ley del Trabajo**: Jornada laboral, horas extras, descansos
- **Ley de Prestaciones Sociales**: Garantía, intereses, cálculo de provisiones
- **Utilidades**: Cálculo proporcional según tiempo de servicio y utilidades de la empresa
- **Vacaciones**: Acumulación de días, bonificación por disfrute, pago correspondiente

### Monitoreo y Cumplimiento
- Seguimiento de cumplimiento legal
- Alertas de vencimientos
- Reportes para entes reguladores
- Control de pagos a instituciones (IVSS, FAOV, etc.)

## Beneficios del Sistema

### Para RRHH
- Automatización de cálculos complejos
- Reducción de errores manuales
- Cumplimiento normativo garantizado
- Ahorro de tiempo en procesos repetitivos

### Para Finanzas
- Mayor precisión en cálculos financieros
- Mejor control de costos
- Visibilidad total de compromisos laborales
- Integración con sistemas contables

### Para Empleados
- Acceso a su información laboral
- Consulta de historial de pagos
- Solicitud de beneficios en línea
- Transparencia en cálculos

## Escalabilidad y SEO

El sistema ha sido diseñado pensando en la escalabilidad:

- Arquitectura modular
- API RESTful
- Base de datos optimizada
- Código limpio y documentado
- Compatible con motores de búsqueda modernos

## Seguridad

- Autenticación JWT
- Validación de entradas
- Protección contra inyecciones SQL
- Control de acceso por roles
- Auditoría de cambios

## Soporte Legal Venezolano

El sistema incluye soporte para:
- LOTT (Ley Orgánica del Trabajo)
- Ley de Prestaciones Sociales
- Ley de Vivienda
- Ley de Transporte
- Reformas constitucionales relacionadas
- Normativas del SENIAT
- Regulaciones del IVSS

---

**Nómina Venezuela Enterprise** - Solución completa para la gestión de nómina en Venezuela, desarrollada con las mejores prácticas de desarrollo web y cumplimiento legal.