// Payment Gateway Configuration
// This file provides a structure for payment gateway integration
// Currently uses mock payment for testing
// Add Razorpay credentials when available

// Mock payment configuration (for testing without Razorpay account)
export const paymentConfig = {
    mode: process.env.PAYMENT_MODE || 'mock', // 'mock' or 'live'
    gateway: 'razorpay', // Payment gateway name
    currency: 'INR'
};

// Mock Razorpay instance (will be replaced with real instance)
export const createMockPaymentOrder = async (amount, orderId) => {
    // Simulate payment order creation
    return {
        id: `mock_order_${Date.now()}`,
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt: orderId,
        status: 'created'
    };
};

// Mock payment verification
export const verifyMockPayment = async (paymentData) => {
    // Simulate successful payment verification
    return {
        success: true,
        paymentId: `mock_payment_${Date.now()}`,
        orderId: paymentData.orderId,
        signature: `mock_signature_${Date.now()}`
    };
};

// Real Razorpay configuration (uncomment when you have credentials)
/*
import Razorpay from 'razorpay';

export const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

export const createRazorpayOrder = async (amount, orderId) => {
    const options = {
        amount: amount * 100,
        currency: 'INR',
        receipt: orderId,
        notes: {
            orderId: orderId
        }
    };
    
    return await razorpayInstance.orders.create(options);
};
*/

// Payment gateway helper functions
export const formatAmount = (amount) => {
    return Math.round(amount * 100); // Convert to paise
};

export const generateReceiptId = (orderId) => {
    return `receipt_${orderId}_${Date.now()}`;
};
