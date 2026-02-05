import Order from '../models/Order.js';
import { createTrackingNotification } from '../services/notificationService.js';

// Update order tracking status
export const updateOrderTracking = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, message, location, trackingNumber, courierPartner, estimatedDelivery } = req.body;

        console.log('UPDATING TRACKING - Order ID:', orderId);
        console.log('Update Data:', req.body);

        const order = await Order.findById(orderId);
        if (!order) {
            console.log('Order not found for ID:', orderId);
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update tracking status
        order.trackingStatus = status;

        // Add to tracking history
        order.trackingHistory.push({
            status,
            message: message || `Order status updated to ${status}`,
            location: location || '',
            timestamp: new Date(),
            updatedBy: req.user.id
        });

        // Update optional fields if provided
        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (courierPartner) order.courierPartner = courierPartner;
        if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;

        // Update delivery status if delivered
        if (status === 'delivered') {
            order.isDelivered = true;
            order.deliveredAt = new Date();
            order.actualDelivery = new Date();
        }

        console.log('Attempting to save order updates...');
        await order.save();
        console.log('Order saved successfully');

        // Create notification for customer
        try {
            if (order.user) {
                await createTrackingNotification(order.user, order, status);
            }
        } catch (notifError) {
            console.error('Non-blocking notification error:', notifError);
            // Don't fail the request if only notification fails
        }

        res.json({ message: 'Tracking updated successfully', order });
    } catch (error) {
        console.error('FATAL ERROR in updateOrderTracking:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            console.error('Validation errors:', messages);
            return res.status(400).json({ message: `Validation Error: ${messages.join(', ')}` });
        }
        res.status(500).json({ message: error.message || 'Server error while updating tracking' });
    }
};

// Get order tracking information
export const getOrderTracking = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate('trackingHistory.updatedBy', 'name username')
            .select('trackingStatus trackingHistory trackingNumber courierPartner estimatedDelivery actualDelivery orderItems totalPrice createdAt');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user is authorized to view this order
        if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all orders with tracking for admin
export const getAllOrdersTracking = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .select('trackingStatus trackingNumber courierPartner estimatedDelivery user totalPrice createdAt')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
