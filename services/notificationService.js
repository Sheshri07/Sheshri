import Notification from '../models/Notification.js';

// Create notification for order events
export const createOrderNotification = async (userId, order, type = 'order') => {
    try {
        let title, message;

        switch (type) {
            case 'order_created':
                title = 'Order Placed Successfully';
                message = `Your order #${order._id.toString().slice(-8)} has been placed successfully!`;
                break;
            case 'order_confirmed':
                title = 'Order Confirmed';
                message = `Your order #${order._id.toString().slice(-8)} has been confirmed and is being processed.`;
                break;
            case 'payment_success':
                title = 'Payment Successful';
                message = `Payment of ₹${order.totalPrice} received for order #${order._id.toString().slice(-8)}`;
                break;
            default:
                title = 'Order Update';
                message = `Update on your order #${order._id.toString().slice(-8)}`;
        }

        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type: 'order',
            link: `/track/${order._id}`,
            relatedOrder: order._id
        });

        return notification;
    } catch (error) {
        console.error('Error creating order notification:', error);
    }
};

// Create notification for tracking updates
export const createTrackingNotification = async (userId, order, status) => {
    try {
        let title, message;

        switch (status) {
            case 'confirmed':
                title = 'Order Confirmed';
                message = `Your order has been confirmed and is being prepared for shipment.`;
                break;
            case 'processing':
                title = 'Order Processing';
                message = `Your order is being processed and will be shipped soon.`;
                break;
            case 'shipped':
                title = 'Order Shipped!';
                message = `Your order has been shipped! Tracking number: ${order.trackingNumber || 'Will be updated soon'}`;
                break;
            case 'out_for_delivery':
                title = 'Out for Delivery';
                message = `Your order is out for delivery and will reach you soon!`;
                break;
            case 'delivered':
                title = 'Order Delivered';
                message = `Your order has been delivered. Thank you for shopping with us!`;
                break;
            case 'cancelled':
                title = 'Order Cancelled';
                message = `Your order has been cancelled.`;
                break;
            default:
                title = 'Order Status Update';
                message = `Your order status has been updated.`;
        }

        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type: 'tracking',
            link: `/track/${order._id}`,
            relatedOrder: order._id
        });

        return notification;
    } catch (error) {
        console.error('Error creating tracking notification:', error);
    }
};

// Create notification for payment events
export const createPaymentNotification = async (userId, order, status) => {
    try {
        let title, message;

        if (status === 'success') {
            title = 'Payment Successful';
            message = `Payment of ₹${order.totalPrice} received successfully!`;
        } else {
            title = 'Payment Failed';
            message = `Payment for order #${order._id.toString().slice(-8)} failed. Please try again.`;
        }

        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type: 'payment',
            link: `/order/${order._id}`,
            relatedOrder: order._id
        });

        return notification;
    } catch (error) {
        console.error('Error creating payment notification:', error);
    }
};
