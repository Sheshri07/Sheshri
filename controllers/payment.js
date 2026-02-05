import Order from '../models/Order.js';
import { createMockPaymentOrder, verifyMockPayment, paymentConfig } from '../config/payment.js';
import { createPaymentNotification, createOrderNotification } from '../services/notificationService.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
}

// Create payment order
export const createPaymentOrder = async (req, res) => {
    try {
        const { amount, orderId } = req.body;

        if (!amount || !orderId) {
            return res.status(400).json({ message: 'Amount and order ID are required' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Use Razorpay if configured and available
        if (razorpayInstance) {
            const razorpayOrder = await razorpayInstance.orders.create({
                amount: Math.round(amount * 100), // Amount in paise
                currency: 'INR',
                receipt: orderId
            });

            res.json({
                success: true,
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                key: process.env.RAZORPAY_KEY_ID,
                mode: 'live'
            });
        } else if (paymentConfig.mode === 'mock') {
            const paymentOrder = await createMockPaymentOrder(amount, orderId);
            res.json({
                success: true,
                orderId: paymentOrder.id,
                amount: paymentOrder.amount,
                currency: paymentOrder.currency,
                mode: 'mock'
            });
        } else {
            res.status(500).json({ message: 'Payment gateway not configured' });
        }
    } catch (error) {
        console.error('Create Payment Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Verify payment
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        let isValid = false;
        let paymentId = razorpay_payment_id;

        if (razorpayInstance && razorpay_signature) {
            // Verify Signature
            const sign = razorpay_order_id + '|' + razorpay_payment_id;
            const expectedSign = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(sign.toString())
                .digest('hex');

            if (razorpay_signature === expectedSign) {
                isValid = true;
            }
        } else if (paymentConfig.mode === 'mock') {
            const verification = await verifyMockPayment({
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                signature: razorpay_signature
            });
            if (verification.success) isValid = true;
            paymentId = verification.paymentId;
        }

        if (isValid) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.paymentResult = {
                id: paymentId,
                status: 'completed',
                update_time: Date.now(),
                razorpay_order_id,
                // Capture method if available
                payment_method: 'razorpay'
            };

            // Add tracking
            order.trackingHistory.push({
                status: 'pending',
                message: 'Order placed and payment received',
                location: 'Online',
                timestamp: new Date()
            });

            await order.save();
            await createPaymentNotification(order.user, order, 'success');
            await createOrderNotification(order.user, order, 'order_created');

            res.json({ success: true, message: 'Payment verified', order });
        } else {
            res.status(400).json({ message: 'Invalid payment signature' });
        }

    } catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Handle payment failure
export const handlePaymentFailure = async (req, res) => {
    try {
        const { orderId, error } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Create failure notification
        await createPaymentNotification(order.user, order, 'failure');

        res.json({ message: 'Payment failure recorded' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get payment status
export const getPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId).select('isPaid paidAt paymentResult paymentMethod');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({
            isPaid: order.isPaid,
            paidAt: order.paidAt,
            paymentMethod: order.paymentMethod,
            paymentResult: order.paymentResult
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
