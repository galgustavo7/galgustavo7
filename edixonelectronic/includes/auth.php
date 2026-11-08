<?php
session_start();

require_once '../config/database.php';

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function checkLogin() {
    if (!isLoggedIn()) {
        header('Location: ../login.php');
        exit();
    }
}

function isAdmin() {
    return isset($_SESSION['rol']) && $_SESSION['rol'] === 'admin';
}

function checkAdmin() {
    if (!isAdmin()) {
        header('Location: ../index.php');
        exit();
    }
}

function getUserInfo($id) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}
?>