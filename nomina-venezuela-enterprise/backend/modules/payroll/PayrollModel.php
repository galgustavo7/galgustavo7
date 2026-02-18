<?php
require_once dirname(__DIR__, 2) . '/core/Model.php';

class PayrollModel extends Model {
    protected $table = 'payroll_details';
    
    public function getPayrollByPeriod($periodId) {
        $query = "SELECT pd.*, e.first_name, e.last_name, e.cedula, ep.salario_base
                  FROM payroll_details pd
                  JOIN employees e ON pd.employee_id = e.id
                  LEFT JOIN employee_positions ep ON e.id = ep.employee_id
                  WHERE pd.period_id = :period_id
                  ORDER BY e.first_name, e.last_name";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':period_id', $periodId);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function calculatePayrollForEmployee($employeeId, $periodId) {
        // Obtener información del empleado y periodo
        $employeeQuery = "SELECT e.*, ep.salario_base, ep.tipo_pago
                          FROM employees e
                          LEFT JOIN employee_positions ep ON e.id = ep.employee_id
                          WHERE e.id = :employee_id AND ep.fecha_fin IS NULL";
        $empStmt = $this->conn->prepare($employeeQuery);
        $empStmt->bindParam(':employee_id', $employeeId);
        $empStmt->execute();
        $employee = $empStmt->fetch();
        
        $periodQuery = "SELECT * FROM payroll_periods WHERE id = :period_id";
        $perStmt = $this->conn->prepare($periodQuery);
        $perStmt->bindParam(':period_id', $periodId);
        $perStmt->execute();
        $period = $perStmt->fetch();
        
        // Calcular días laborados y ausencias
        $totalDays = (strtotime($period['fecha_fin']) - strtotime($period['fecha_inicio'])) / (60 * 60 * 24) + 1;
        $workedDays = $employee['dias_laborados'] ?? $totalDays;  // Suponiendo que ya está calculado
        
        // Calcular salario diario
        $dailySalary = 0;
        if ($employee['tipo_pago'] === 'mensual') {
            $dailySalary = $employee['salario_base'] / 30;
        } else {
            $dailySalary = $employee['salario_base'];
        }
        
        // Obtener conceptos de nómina
        $conceptsQuery = "SELECT * FROM payroll_concepts WHERE activo = 1 ORDER BY orden ASC";
        $conceptStmt = $this->conn->prepare($conceptsQuery);
        $conceptStmt->execute();
        $concepts = $conceptStmt->fetchAll();
        
        // Calcular asignaciones
        $allowances = [];
        $totalAllowances = 0;
        foreach ($concepts as $concept) {
            if ($concept['tipo'] === 'asignacion') {
                $amount = $this->calculateConceptAmount($concept, $employee, $dailySalary, $workedDays);
                if ($amount > 0) {
                    $allowances[$concept['codigo']] = [
                        'nombre' => $concept['nombre'],
                        'monto' => $amount
                    ];
                    $totalAllowances += $amount;
                }
            }
        }
        
        // Calcular deducciones
        $deductions = [];
        $totalDeductions = 0;
        foreach ($concepts as $concept) {
            if ($concept['tipo'] === 'deduccion') {
                $amount = $this->calculateConceptAmount($concept, $employee, $dailySalary, $workedDays);
                if ($amount > 0) {
                    $deductions[$concept['codigo']] = [
                        'nombre' => $concept['nombre'],
                        'monto' => $amount
                    ];
                    $totalDeductions += $amount;
                }
            }
        }
        
        // Calcular aportes patronales
        $employerContributions = [];
        $totalEmployerContributions = 0;
        foreach ($concepts as $concept) {
            if ($concept['tipo'] === 'aporte') {
                $amount = $this->calculateConceptAmount($concept, $employee, $dailySalary, $workedDays);
                if ($amount > 0) {
                    $employerContributions[$concept['codigo']] = [
                        'nombre' => $concept['nombre'],
                        'monto' => $amount
                    ];
                    $totalEmployerContributions += $amount;
                }
            }
        }
        
        // Calcular horas extras
        $extraHoursQuery = "SELECT * FROM extra_hours 
                           WHERE employee_id = :employee_id 
                           AND fecha BETWEEN :start_date AND :end_date
                           AND status = 'aprobado'";
        $ehStmt = $this->conn->prepare($extraHoursQuery);
        $ehStmt->bindParam(':employee_id', $employeeId);
        $ehStmt->bindParam(':start_date', $period['fecha_inicio']);
        $ehStmt->bindParam(':end_date', $period['fecha_fin']);
        $ehStmt->execute();
        $extraHours = $ehStmt->fetchAll();
        
        $extraHoursTotal = 0;
        foreach ($extraHours as $hour) {
            $hourValue = $dailySalary / 8; // Valor por hora
            
            // Horas diurnas
            $extraHoursTotal += ($hour['horas_diurnas'] * $hourValue * (1 + $hour['recargo_diurno'] / 100));
            
            // Horas nocturnas
            $extraHoursTotal += ($hour['horas_nocturnas'] * $hourValue * (1 + $hour['recargo_nocturno'] / 100));
            
            // Horas feriadas
            $extraHoursTotal += ($hour['horas_feriado'] * $hourValue * (1 + $hour['recargo_feriado'] / 100));
        }
        
        // Calcular bonos
        $bonusQuery = "SELECT SUM(monto) as total_bonus 
                      FROM bonuses 
                      WHERE employee_id = :employee_id 
                      AND status = 'activo'
                      AND (periodicidad = 'unico' OR periodicidad = 'mensual')";
        $bStmt = $this->conn->prepare($bonusQuery);
        $bStmt->bindParam(':employee_id', $employeeId);
        $bStmt->execute();
        $bonuses = $bStmt->fetch();
        $bonusTotal = $bonuses['total_bonus'] ?? 0;
        
        // Calcular préstamos pendientes
        $loanQuery = "SELECT SUM(monto_cuota) as total_loan 
                     FROM loans 
                     WHERE employee_id = :employee_id 
                     AND status = 'activo'
                     AND cuotas_pagadas < numero_cuotas";
        $lStmt = $this->conn->prepare($loanQuery);
        $lStmt->bindParam(':employee_id', $employeeId);
        $lStmt->execute();
        $loans = $lStmt->fetch();
        $loanTotal = $loans['total_loan'] ?? 0;
        
        // Calcular neto a pagar
        $grossSalary = ($dailySalary * $workedDays) + $totalAllowances + $extraHoursTotal + $bonusTotal;
        $netToPay = $grossSalary - $totalDeductions - $loanTotal;
        
        // Preparar datos para guardar
        $payrollData = [
            'period_id' => $periodId,
            'employee_id' => $employeeId,
            'dias_laborados' => $workedDays,
            'salario_base' => $employee['salario_base'],
            'salario_diario' => $dailySalary,
            'asignaciones_detalle' => json_encode($allowances),
            'deducciones_detalle' => json_encode($deductions),
            'total_asignaciones' => $totalAllowances + $extraHoursTotal + $bonusTotal,
            'total_deducciones' => $totalDeductions + $loanTotal,
            'total_aportes_patrono' => $totalEmployerContributions,
            'neto_pagar' => $netToPay,
            'status' => 'calculado'
        ];
        
        return $payrollData;
    }
    
    private function calculateConceptAmount($concept, $employee, $dailySalary, $workedDays) {
        $amount = 0;
        
        switch ($concept['base_calculo']) {
            case 'salario_base':
                $amount = $employee['salario_base'];
                break;
            case 'salario_diario':
                $amount = $dailySalary;
                break;
            case 'dias_trabajados':
                $amount = $dailySalary * $workedDays;
                break;
            case 'porcentaje_salario':
                $amount = $employee['salario_base'] * ($concept['porcentaje'] / 100);
                break;
            case 'porcentaje_diario':
                $amount = $dailySalary * ($concept['porcentaje'] / 100);
                break;
            case 'monto_fijo':
                $amount = $concept['porcentaje']; // En este caso, usar el campo porcentaje como monto fijo
                break;
            default:
                $amount = 0;
        }
        
        if ($concept['formula']) {
            // Aquí se podría implementar una lógica más compleja para evaluar fórmulas
            // Por ahora, simplemente aplicamos el cálculo básico
        }
        
        return $amount;
    }
    
    public function getPayrollSummaryByPeriod($periodId) {
        $query = "SELECT 
                    COUNT(*) as total_employees,
                    SUM(neto_pagar) as total_payroll,
                    AVG(neto_pagar) as avg_salary,
                    SUM(total_asignaciones) as total_allowances,
                    SUM(total_deducciones) as total_deductions
                  FROM payroll_details 
                  WHERE period_id = :period_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':period_id', $periodId);
        $stmt->execute();
        return $stmt->fetch();
    }
}
?>