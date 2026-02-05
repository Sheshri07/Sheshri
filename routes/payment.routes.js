import express from 'express';
import {
    createPaymentOrder,
    verifyPayment,
    handlePaymentFailure,
    getPaymentStatus
} from '../controllers/payment.js';

import { verifyToken } from '../utils/verifyToken.js';

const router = express.Router();

// Create payment order
router.post('/create', verifyToken, createPaymentOrder);

// Verify payment
router.post('/verify', verifyToken, verifyPayment);

// Handle payment failure
router.post('/failure', verifyToken, handlePaymentFailure);

// Get payment status
router.get('/status/:orderId', verifyToken, getPaymentStatus);

export default router;
