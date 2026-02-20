import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./models/Order.js";
import User from "./models/User.js";
import Product from "./models/Product.js";

dotenv.config();

const debugStats = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();
        console.log("Current Year:", currentYear);

        // 1. Check User Growth
        const allUsers = await User.find({}).select('createdAt role');
        console.log(`Total Users: ${allUsers.length}`);
        console.log("Sample User Dates:", allUsers.slice(0, 5).map(u => ({ id: u._id, created: u.createdAt, role: u.role })));

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
        console.log("User Growth Aggregation:", JSON.stringify(userGrowth, null, 2));

        // 2. Check Order Status
        const totalOrders = await Order.countDocuments();
        console.log(`Total Orders: ${totalOrders}`);

        const orderStatusBreakdown = await Order.aggregate([
            {
                $group: {
                    _id: "$trackingStatus",
                    count: { $sum: 1 }
                }
            }
        ]);
        console.log("Order Status Breakdown:", JSON.stringify(orderStatusBreakdown, null, 2));

        // 3. Top Selling Products
        const topSellingProducts = await Order.aggregate([
            { $match: { trackingStatus: { $ne: "cancelled" } } },
            { $unwind: "$orderItems" },
            {
                $group: {
                    _id: "$orderItems.product",
                    name: { $first: "$orderItems.name" },
                    totalSold: { $sum: "$orderItems.qty" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);
        console.log("Top Selling Products:", JSON.stringify(topSellingProducts, null, 2));

        process.exit();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

debugStats();
