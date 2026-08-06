// Aplicación principal de Vue.js para el sistema de nómina

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar la aplicación Vue si está disponible
    if (typeof Vue !== 'undefined') {
        const app = Vue.createApp({
            data() {
                return {
                    // Datos generales de la aplicación
                    appName: 'Nómina Venezuela Enterprise',
                    currentUser: null,
                    currentView: 'dashboard',
                    notifications: [],
                    loading: false,
                    
                    // Datos para vistas específicas
                    employees: [],
                    payrollData: [],
                    selectedEmployee: null,
                    payrollPeriods: [],
                    currentPeriod: null,
                    
                    // Formularios
                    newEmployee: {
                        first_name: '',
                        last_name: '',
                        cedula: '',
                        email_corporativo: '',
                        fecha_ingreso: '',
                        cargo: '',
                        salario: ''
                    },
                    
                    newPayrollPeriod: {
                        codigo: '',
                        fecha_inicio: '',
                        fecha_fin: '',
                        tipo_periodo: 'mensual'
                    }
                }
            },
            
            methods: {
                // Autenticación
                login(username, password) {
                    this.loading = true;
                    // Simular llamada API
                    setTimeout(() => {
                        this.currentUser = { id: 1, username: username, role: 'admin' };
                        this.loading = false;
                        this.showNotification('Inicio de sesión exitoso', 'success');
                    }, 1000);
                },
                
                logout() {
                    this.currentUser = null;
                    this.currentView = 'login';
                    this.showNotification('Sesión cerrada', 'info');
                },
                
                // Navegación
                navigateTo(view) {
                    this.currentView = view;
                    this.loadViewData(view);
                },
                
                // Cargar datos según la vista
                loadViewData(view) {
                    switch(view) {
                        case 'dashboard':
                            this.loadDashboardData();
                            break;
                        case 'employees':
                            this.loadEmployees();
                            break;
                        case 'payroll':
                            this.loadPayrollData();
                            break;
                        case 'reports':
                            this.loadReports();
                            break;
                    }
                },
                
                // Métodos para cargar datos
                loadDashboardData() {
                    // Simular carga de datos del dashboard
                    console.log('Cargando datos del dashboard...');
                },
                
                loadEmployees() {
                    // Simular carga de empleados
                    this.employees = [
                        { id: 1, first_name: 'Juan', last_name: 'Pérez', cedula: 'V12345678', cargo: 'Desarrollador', salario: 2500000, status: 'activo' },
                        { id: 2, first_name: 'María', last_name: 'González', cedula: 'V87654321', cargo: 'RRHH', salario: 2200000, status: 'activo' },
                        { id: 3, first_name: 'Carlos', last_name: 'Rodríguez', cedula: 'V11223344', cargo: 'Contador', salario: 2000000, status: 'activo' }
                    ];
                },
                
                loadPayrollData() {
                    // Simular carga de datos de nómina
                    this.payrollData = [
                        { id: 1, employee_id: 1, period: 'ENE-2023', neto_pagar: 2500000, status: 'pagado' },
                        { id: 2, employee_id: 2, period: 'ENE-2023', neto_pagar: 2200000, status: 'pendiente' }
                    ];
                },
                
                loadReports() {
                    // Simular carga de reportes
                    console.log('Cargando reportes...');
                },
                
                // CRUD de empleados
                addEmployee() {
                    if (!this.validateEmployeeForm()) return;
                    
                    const employee = {
                        ...this.newEmployee,
                        id: this.employees.length + 1,
                        status: 'activo'
                    };
                    
                    this.employees.push(employee);
                    this.resetEmployeeForm();
                    this.showNotification('Empleado agregado correctamente', 'success');
                },
                
                validateEmployeeForm() {
                    if (!this.newEmployee.first_name || !this.newEmployee.last_name || !this.newEmployee.cedula) {
                        this.showNotification('Nombre, apellido y cédula son obligatorios', 'error');
                        return false;
                    }
                    return true;
                },
                
                resetEmployeeForm() {
                    this.newEmployee = {
                        first_name: '',
                        last_name: '',
                        cedula: '',
                        email_corporativo: '',
                        fecha_ingreso: '',
                        cargo: '',
                        salario: ''
                    };
                },
                
                // CRUD de períodos de nómina
                addPayrollPeriod() {
                    if (!this.validatePayrollPeriodForm()) return;
                    
                    const period = {
                        ...this.newPayrollPeriod,
                        id: this.payrollPeriods.length + 1,
                        status: 'abierto'
                    };
                    
                    this.payrollPeriods.push(period);
                    this.resetPayrollPeriodForm();
                    this.showNotification('Período de nómina agregado', 'success');
                },
                
                validatePayrollPeriodForm() {
                    if (!this.newPayrollPeriod.codigo || !this.newPayrollPeriod.fecha_inicio || !this.newPayrollPeriod.fecha_fin) {
                        this.showNotification('Código y fechas son obligatorias', 'error');
                        return false;
                    }
                    return true;
                },
                
                resetPayrollPeriodForm() {
                    this.newPayrollPeriod = {
                        codigo: '',
                        fecha_inicio: '',
                        fecha_fin: '',
                        tipo_periodo: 'mensual'
                    };
                },
                
                // Funcionalidades de nómina
                calculatePayroll(periodId) {
                    this.showNotification(`Calculando nómina para período ${periodId}`, 'info');
                    // Lógica para calcular nómina
                },
                
                processPayroll(periodId) {
                    this.showNotification(`Procesando nómina para período ${periodId}`, 'info');
                    // Lógica para procesar nómina
                },
                
                // Notificaciones
                showNotification(message, type = 'info') {
                    const notification = {
                        id: Date.now(),
                        message,
                        type,
                        timestamp: new Date()
                    };
                    
                    this.notifications.unshift(notification);
                    
                    // Eliminar notificaciones antiguas después de 5 segundos
                    setTimeout(() => {
                        this.removeNotification(notification.id);
                    }, 5000);
                },
                
                removeNotification(id) {
                    this.notifications = this.notifications.filter(notif => notif.id !== id);
                },
                
                // Utilidades
                formatDate(dateString) {
                    if (!dateString) return '';
                    const options = { year: 'numeric', month: 'short', day: 'numeric' };
                    return new Date(dateString).toLocaleDateString('es-VE', options);
                },
                
                formatCurrency(amount, currency = 'VES') {
                    if (!amount) return '0,00 ' + currency;
                    return new Intl.NumberFormat('es-VE', {
                        style: 'currency',
                        currency: currency,
                        minimumFractionDigits: 2
                    }).format(amount);
                },
                
                getStatusClass(status) {
                    const statusClasses = {
                        'activo': 'status-activo',
                        'inactivo': 'status-inactivo',
                        'pendiente': 'status-pendiente',
                        'aprobado': 'status-aprobado',
                        'procesando': 'status-procesando'
                    };
                    return statusClasses[status] || 'status-inactivo';
                }
            },
            
            computed: {
                isLoggedIn() {
                    return !!this.currentUser;
                },
                
                totalEmployees() {
                    return this.employees.length;
                },
                
                activeEmployees() {
                    return this.employees.filter(emp => emp.status === 'activo').length;
                },
                
                totalPayroll() {
                    return this.payrollData.reduce((sum, item) => sum + parseFloat(item.neto_pagar || 0), 0);
                }
            }
        });
        
        // Montar la aplicación
        app.mount('#app');
    } else {
        console.error('Vue.js no está cargado. Por favor incluya Vue.js antes de este script.');
    }
});

// Funciones auxiliares globales
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed');
    
    const mainContent = document.querySelector('.main-content');
    mainContent.classList.toggle('expanded');
}

function searchTable(inputId, tableId) {
    const input = document.getElementById(inputId);
    const filter = input.value.toUpperCase();
    const table = document.getElementById(tableId);
    const rows = table.getElementsByTagName('tr');
    
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        let found = false;
        
        for (let j = 0; j < cells.length; j++) {
            if (cells[j]) {
                const txtValue = cells[j].textContent || cells[j].innerText;
                if (txtValue.toUpperCase().indexOf(filter) > -1) {
                    found = true;
                    break;
                }
            }
        }
        
        rows[i].style.display = found ? '' : 'none';
    }
}

// Función para exportar tabla a CSV
function exportTableToCSV(filename) {
    const csv = [];
    const rows = document.querySelectorAll('table tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = [], cols = rows[i].querySelectorAll('td, th');
        
        for (let j = 0; j < cols.length; j++) 
            row.push(cols[j].innerText);
        
        csv.push(row.join(','));        
    }
    
    downloadCSV(csv.join('\n'), filename);
}

function downloadCSV(csv, filename) {
    const csvFile = new Blob([csv], { type: 'text/csv' });
    const downloadLink = document.createElement('a');
    
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = 'none';
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
}