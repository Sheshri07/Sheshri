import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

export const getDashboardStats = async (req, res) => {
    try {
        const orders = await Order.find({ trackingStatus: { $ne: "cancelled" } });
        const productsCount = await Product.countDocuments();
        const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });

        // Calculate unique customers (users with at least one non-cancelled order)
        const customerIds = [...new Set(orders.map(order => order.user?.toString()).filter(id => id))];
        const totalCustomers = customerIds.length;

        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        const totalOrders = orders.length;

        // Monthly data for the last 6-12 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyRevenue = [];
        for (let i = 0; i <= currentMonth; i++) {
            const startDate = new Date(currentYear, i, 1);
            const endDate = new Date(currentYear, i + 1, 0);

            const monthOrders = await Order.find({
                createdAt: { $gte: startDate, $lte: endDate },
                trackingStatus: { $ne: "cancelled" }
            });

            // Previous month
            const prevMonthStartDate = new Date(currentYear, i - 1, 1);
            const prevMonthEndDate = new Date(currentYear, i, 0);
            const prevMonthOrders = await Order.find({
                createdAt: { $gte: prevMonthStartDate, $lte: prevMonthEndDate },
                trackingStatus: { $ne: "cancelled" }
            });

            const revenue = monthOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
            const prevRevenue = prevMonthOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

            monthlyRevenue.push({
                name: months[i],
                current: revenue,
                previous: prevRevenue
            });
        }

        // Sales by payment method (for pie chart)
        const paymentMethods = await Order.aggregate([
            { $match: { trackingStatus: { $ne: "cancelled" } } },
            { $group: { _id: "$paymentMethod", value: { $sum: "$totalPrice" } } }
        ]);

        const pieData = paymentMethods.map(item => ({
            name: item._id,
            value: item.value,
            color: item._id === 'Online' ? '#10B981' : item._id === 'COD' ? '#3B82F6' : '#6366F1'
        }));

        res.json({
            totalSales: totalRevenue,
            totalOrders: totalOrders,
            totalRevenue: totalRevenue,
            totalProducts: productsCount,
            totalCustomers: totalCustomers,
            totalUsers: totalUsers,
            monthlyData: monthlyRevenue,
            pieData: pieData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
