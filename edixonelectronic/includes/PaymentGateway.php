<?php
class PaymentGateway {
    private $apiKey;
    private $apiSecret;
    private $sandboxMode;

    public function __construct($apiKey = '', $apiSecret = '', $sandboxMode = true) {
        $this->apiKey = $apiKey;
        $this->apiSecret = $apiSecret;
        $this->sandboxMode = $sandboxMode;
    }

    public function createPayment($amount, $currency = 'MXN', $orderId, $description = '') {
        // Simulación de procesamiento de pago
        // En una implementación real, aquí se integraría con un servicio de pago como Stripe, PayPal, etc.
        
        $paymentData = [
            'amount' => $amount,
            'currency' => $currency,
            'order_id' => $orderId,
            'description' => $description,
            'timestamp' => date('Y-m-d H:i:s'),
            'payment_method' => 'credit_card', // Método predeterminado para simulación
            'status' => 'pending'
        ];

        // Simular proceso de pago exitoso
        $paymentResult = [
            'success' => true,
            'transaction_id' => 'TXN_' . strtoupper(substr(md5(uniqid()), 0, 12)),
            'status' => 'approved',
            'payment_data' => $paymentData
        ];

        return $paymentResult;
    }

    public function validatePayment($paymentId) {
        // Simulación de validación de pago
        return [
            'valid' => true,
            'payment_id' => $paymentId,
            'status' => 'completed'
        ];
    }

    public function refundPayment($transactionId, $amount = null) {
        // Simulación de reembolso
        return [
            'success' => true,
            'refund_id' => 'REF_' . strtoupper(substr(md5(uniqid()), 0, 12)),
            'status' => 'refunded',
            'transaction_id' => $transactionId
        ];
    }

    public function getSupportedCurrencies() {
        return ['USD', 'EUR', 'MXN', 'CAD', 'GBP', 'JPY'];
    }

    public function calculateFees($amount) {
        // Comisión del 3.5% + $0.30 por transacción (similar a Stripe)
        return ($amount * 0.035) + 0.30;
    }
}
?>