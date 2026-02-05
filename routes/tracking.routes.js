import express from 'express';
import { updateOrderTracking, getOrderTracking, getAllOrdersTracking } from '../controllers/tracking.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get tracking for specific order (customer or admin)
router.get('/:orderId', verifyToken, getOrderTracking);

// Update tracking (admin only)
router.put('/:orderId', verifyAdmin, updateOrderTracking);

// Get all orders tracking (admin only)
router.get('/', verifyAdmin, getAllOrdersTracking);

export default router;
