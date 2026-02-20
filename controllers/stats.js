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

        // Top Selling Products
        const topSellingProducts = await Order.aggregate([
            { $match: { trackingStatus: { $ne: "cancelled" } } },
            { $unwind: "$orderItems" },
            {
                $group: {
                    _id: "$orderItems.product",
                    name: { $first: "$orderItems.name" },
                    image: { $first: "$orderItems.image" },
                    price: { $first: "$orderItems.price" },
                    totalSold: { $sum: "$orderItems.qty" },
                    revenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        // User Growth (New users per month for current year)
        const userGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(currentYear, 0, 1),
                        $lte: new Date(currentYear, 11, 31)
                    },
                    role: { $ne: "admin" }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const userGrowthData = months.map((month, index) => {
            const found = userGrowth.find(usage => usage._id === (index + 1));
            return {
                name: month,
                users: found ? found.count : 0
            };
        });

        // Order Status Breakdown
        const orderStatusBreakdown = await Order.aggregate([
            {
                $group: {
                    _id: "$trackingStatus",
                    count: { $sum: 1 }
                }
            }
        ]);

        const statusColors = {
            "pending": "#F59E0B",
            "confirmed": "#3B82F6",
            "processing": "#6366F1",
            "shipped": "#8B5CF6",
            "Out for delivery": "#EC4899",
            "delivered": "#10B981",
            "cancelled": "#EF4444"
        };

        const orderStatusData = orderStatusBreakdown.map(status => ({
            name: status._id.charAt(0).toUpperCase() + status._id.slice(1),
            value: status.count,
            color: statusColors[status._id] || "#9CA3AF"
        }));

        // Low Stock Alerts (Products with less than 10 items)
        const lowStockProducts = await Product.find({
            countInStock: { $lt: 10, $gt: 0 }
        })
            .select('name countInStock images price category')
            .limit(5);

        const responseData = {
            totalSales: totalRevenue,
            totalOrders: totalOrders,
            totalRevenue: totalRevenue,
            totalProducts: productsCount,
            totalCustomers: totalCustomers,
            totalUsers: totalUsers,
            monthlyData: monthlyRevenue,
            pieData: pieData,
            topSellingProducts,
            userGrowth: userGrowthData,
            orderStatusData,
            lowStockProducts
        };


        res.json(responseData);
    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ message: error.message });
    }
};
