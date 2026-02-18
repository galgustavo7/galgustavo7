<?php
require_once dirname(__DIR__, 2) . '/core/Model.php';

class EmployeeModel extends Model {
    protected $table = 'employees';
    
    public function getFullEmployeeInfo($id) {
        $query = "SELECT e.*, u.username, u.email, u.role, u.is_active,
                         ep.salario_base, p.nombre_cargo, d.nombre_departamento
                  FROM employees e
                  LEFT JOIN users u ON e.user_id = u.id
                  LEFT JOIN employee_positions ep ON e.id = ep.employee_id
                  LEFT JOIN positions p ON ep.position_id = p.id
                  WHERE e.id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch();
    }
    
    public function getEmployeesWithPositions() {
        $query = "SELECT e.*, p.nombre_cargo, ep.salario_base
                  FROM employees e
                  LEFT JOIN employee_positions ep ON e.id = ep.employee_id  
                  LEFT JOIN positions p ON ep.position_id = p.id
                  WHERE e.status = 'activo'
                  ORDER BY e.first_name, e.last_name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function searchEmployees($term) {
        $query = "SELECT e.*, p.nombre_cargo
                  FROM employees e
                  LEFT JOIN employee_positions ep ON e.id = ep.employee_id
                  LEFT JOIN positions p ON ep.position_id = p.id
                  WHERE e.cedula LIKE :term 
                     OR e.first_name LIKE :term 
                     OR e.last_name LIKE :term 
                     OR CONCAT(e.first_name, ' ', e.last_name) LIKE :term
                  ORDER BY e.first_name, e.last_name";
        $searchTerm = '%' . $term . '%';
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':term', $searchTerm);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function getEmployeeCountByStatus() {
        $query = "SELECT status, COUNT(*) as count FROM employees GROUP BY status";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
?>