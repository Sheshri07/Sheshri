import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
// Helper to send notifications for new orders
export const sendNewOrderNotifications = async (order, user) => {
    try {
        // Create User Notification
        await Notification.create({
            user: user._id || user.id,
            title: "Order Placed!",
            message: `Your order #${order._id.toString().slice(-8)} has been placed successfully.`,
            type: "order",
            link: "/orders",
            read: false,
            relatedOrder: order._id
        });

        // Notify Admins about new order
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            if (admin.notificationPreferences?.orderAlerts !== false) {
                await Notification.create({
                    user: admin._id,
                    title: "New Order Received!",
                    message: `Order #${order._id.toString().slice(-8)} totaling ₹${order.totalPrice} has been placed.`,
                    type: "order",
                    link: `/admin/order/${order._id}`,
                    read: false,
                    relatedOrder: order._id
                });
            }
        }

        // Check for Low Stock and notify admins
        for (const item of order.orderItems) {
            const product = await Product.findById(item.product);
            if (product && product.countInStock <= 5) { // Threshold for low stock
                for (const admin of admins) {
                    if (admin.notificationPreferences?.lowStockAlerts !== false) {
                        await Notification.create({
                            user: admin._id,
                            title: "Low Stock Alert!",
                            message: `Product "${product.name}" is low in stock (${product.countInStock} remaining).`,
                            type: "tracking",
                            link: `/admin/product/${product._id}/edit`,
                            read: false
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error sending order notifications:", error);
    }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req, res, next) => {
    try {
        const {
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            customization,
        } = req.body;

        if (orderItems && orderItems.length === 0) {
            res.status(400);
            throw new Error("No order items");
        }

        // Check for sufficient stock before creating order
        for (const item of orderItems) {
            let product = await Product.findById(item.product);

            // If satisfied as main product
            if (product) {
                if (!product.inStock || product.countInStock < item.qty) {
                    res.status(400);
                    throw new Error(`Insufficient stock for product: ${product.name}`);
                }
            } else {
                // Check if it's an add-on item
                product = await Product.findOne({ "addOnItems._id": item.product });
                if (product) {
                    const addOnItem = product.addOnItems.id(item.product);
                    if (!addOnItem || !addOnItem.inStock || addOnItem.countInStock < item.qty) {
                        res.status(400);
                        throw new Error(`Insufficient stock for product: ${addOnItem ? addOnItem.name : 'Unknown Add-on'}`);
                    }
                } else {
                    res.status(404);
                    throw new Error(`Product not found: ${item.name || item.product}`);
                }
            }
        }

        const order = new Order({
            orderItems,
            user: req.user.id,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            customization,
        });

        const createdOrder = await order.save();

        // Update product stock
        for (const item of orderItems) {
            // Try updating as main product
            const updatedMain = await Product.findByIdAndUpdate(item.product, {
                $inc: { countInStock: -item.qty }
            });

            if (!updatedMain) {
                // If not found, try updating as add-on item
                await Product.findOneAndUpdate(
                    { "addOnItems._id": item.product },
                    { $inc: { "addOnItems.$.countInStock": -item.qty } }
                );
            }
        }

        // Only send notifications immediately for COD
        // Online payment notifications will be sent after payment verification

        const isOnlinePayment = paymentMethod &&
            (paymentMethod.toLowerCase() === 'online' || paymentMethod.toLowerCase() === 'razorpay');

        if (!isOnlinePayment) {
            await sendNewOrderNotifications(createdOrder, req.user);
        }

        res.status(201).json(createdOrder);
    } catch (error) {
        console.error("Order creation error:", error);
        next(error);
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate(
        "user",
        "name email"
    );

    if (order) {
        res.json(order);
    } else {
        res.status(404);
        throw new Error("Order not found");
    }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.email_address,
        };

        const updatedOrder = await order.save();

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error("Order not found");
    }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
export const updateOrderToDelivered = async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isDelivered = true;
        order.deliveredAt = Date.now();

        const updatedOrder = await order.save();

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error("Order not found");
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res, next) => {
    const orders = await Order.find({
        user: req.user.id,
        $or: [
            { paymentMethod: 'COD' },
            { isPaid: true }
        ]
    }).sort({ createdAt: -1 });
    res.json(orders);
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res, next) => {
    const orders = await Order.find({}).populate("user", "id name").sort({ createdAt: -1 });
    res.json(orders);
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
            res.status(401);
            throw new Error('Not authorized to cancel this order');
        }

        if (order.trackingStatus === 'delivered' || order.trackingStatus === 'shipped' || order.trackingStatus === 'cancelled') {
            res.status(400);
            throw new Error(`Cannot cancel order that is ${order.trackingStatus}`);
        }

        // Restore stock
        for (const item of order.orderItems) {
            const updatedMain = await Product.findByIdAndUpdate(item.product, {
                $inc: { countInStock: item.qty }
            });

            if (!updatedMain) {
                await Product.findOneAndUpdate(
                    { "addOnItems._id": item.product },
                    { $inc: { "addOnItems.$.countInStock": item.qty } }
                );
            }
        }

        order.trackingStatus = 'cancelled';

        let cancellationMessage = 'Order cancelled by user';

        // Handle Refund Logic for Paid Orders
        if (order.isPaid) {
            order.paymentResult = {
                ...order.paymentResult,
                status: 'refund_pending',
                update_time: Date.now()
            };
            cancellationMessage = 'Order cancelled. Refund initiated to original payment source.';
        }

        if (order.trackingHistory) {
            order.trackingHistory.push({
                status: 'cancelled',
                message: cancellationMessage,
                updatedBy: req.user.id
            });
        }

        const updatedOrder = await order.save();

        // Notify User
        await Notification.create({
            user: order.user,
            title: "Order Cancelled",
            message: `Your order #${order._id.toString().slice(-8)} has been cancelled.`,
            type: "order",
            link: `/track/${order._id}`,
            read: false,
            relatedOrder: order._id
        });

        // Notify Admins
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            if (admin.notificationPreferences?.orderAlerts !== false) {
                await Notification.create({
                    user: admin._id,
                    title: "Order Cancelled by User",
                    message: `Order #${order._id.toString().slice(-8)} has been cancelled by the customer.`,
                    type: "order",
                    link: `/admin/order/${order._id}`,
                    read: false,
                    relatedOrder: order._id
                });
            }
        }

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
};

// @desc    Strictly delete order and restore stock (for failed/cancelled online payments)
// @route   PUT /api/orders/:id/abandon
// @access  Private
// @desc    Update multiple orders status
// @route   PUT /api/orders/bulk-update
// @access  Private/Admin
export const updateOrdersStatus = async (req, res, next) => {
    const { orderIds, status } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        res.status(400);
        throw new Error("No orders selected");
    }

    try {
        const updateData = {};

        if (status === 'delivered') {
            updateData.isDelivered = true;
            updateData.deliveredAt = Date.now();
            updateData.trackingStatus = 'delivered';
        } else if (status === 'paid') {
            updateData.isPaid = true;
            updateData.paidAt = Date.now();
        } else if (['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery'].includes(status)) {
            updateData.trackingStatus = status;
        }

        const result = await Order.updateMany(
            { _id: { $in: orderIds } },
            { $set: updateData }
        );

        res.json({ message: `Successfully updated ${result.modifiedCount} orders`, modifiedCount: result.modifiedCount });
    } catch (error) {
        console.error("Bulk update error:", error);
        next(error);
    }
};

// @desc    Update return status
// @route   PUT /api/orders/:id/return
// @access  Private/Admin
export const updateReturnStatus = async (req, res, next) => {
    const { status, reason, adminNote } = req.body;

    console.log("Updating return status:", { id: req.params.id, status, adminNote });

    const order = await Order.findById(req.params.id);

    if (order) {
        order.returnStatus = status;
        if (reason) order.returnReason = reason;
        if (adminNote !== undefined) order.returnAdminNote = adminNote;

        if (status === 'Completed') {
            // Logic for refund could go here if integrated with payment gateway
            // For now, we assume manual refund or just tracking
            order.trackingStatus = 'returned';
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error("Order not found");
    }
};

// @desc    Get all return requests
// @route   GET /api/orders/returns/all
// @access  Private/Admin
export const getReturnRequests = async (req, res, next) => {
    try {
        const orders = await Order.find({
            returnStatus: { $in: ['Requested', 'Approved', 'Rejected', 'Completed'] }
        }).populate("user", "id name email").sort({ updatedAt: -1 });

        res.json(orders);
    } catch (error) {
        next(error);
    }
};

// @desc    Request return for an order
// @route   PUT /api/orders/:id/request-return
// @access  Private
export const requestReturn = async (req, res, next) => {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
        if (order.user.toString() !== req.user.id) {
            res.status(401);
            throw new Error('Not authorized to request return for this order');
        }

        if (order.trackingStatus !== 'delivered') {
            res.status(400);
            throw new Error('Return can only be requested for delivered orders');
        }

        // Check for 7-day return limit
        if (order.deliveredAt) {
            const deliveredDate = new Date(order.deliveredAt);
            const currentDate = new Date();
            const diffTime = Math.abs(currentDate - deliveredDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 7) {
                res.status(400);
                throw new Error('Return request can only be submitted within 7 days of delivery');
            }
        }

        if (order.returnStatus !== 'None') {
            res.status(400);
            throw new Error('Return request already exists for this order');
        }

        order.returnStatus = 'Requested';
        order.returnReason = reason;

        const updatedOrder = await order.save();

        // Notify Admins
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            if (admin.notificationPreferences?.orderAlerts !== false) {
                await Notification.create({
                    user: admin._id,
                    title: "New Return Request",
                    message: `Return requested for Order #${order._id.toString().slice(-8)}. Reason: ${reason}${order.returnAdminNote ? `. Admin Note: ${order.returnAdminNote}` : ''}`,
                    type: "order",
                    link: `/admin/returns`,
                    read: false,
                    relatedOrder: order._id
                });
            }
        }

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
};

export const abandonOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            // Restore stock
            for (const item of order.orderItems) {
                const updatedMain = await Product.findByIdAndUpdate(item.product, {
                    $inc: { countInStock: item.qty }
                });

                if (!updatedMain) {
                    await Product.findOneAndUpdate(
                        { "addOnItems._id": item.product },
                        { $inc: { "addOnItems.$.countInStock": item.qty } }
                    );
                }
            }

            // Strictly delete the order from MongoDB
            await Order.findByIdAndDelete(req.params.id);
            res.json({ message: 'Order record permanently deleted and stock restored' });
        } else {
            res.status(404);
            throw new Error('Order not found');
        }
    } catch (error) {
        next(error);
    }
};
