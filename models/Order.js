import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        orderItems: [
            {
                name: { type: String, required: true },
                qty: { type: Number, required: true },
                image: { type: String, required: true },
                price: { type: Number, required: true },
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                size: { type: String },
                stitchingDetails: {
                    option: { type: String }, // 'Unstitched', 'Stitched'
                    stitchingSize: { type: String },
                    padding: { type: String }, // 'Yes', 'No'
                    blouseDesign: { type: String }
                },
                sareeAddOns: {
                    preDrape: { type: Boolean, default: false },
                    petticoat: { type: Boolean, default: false }
                },
            },
        ],
        shippingAddress: {
            name: { type: String },
            phone: { type: String },
            address: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, required: true },
        },
        customization: {
            type: String,
        },
        paymentMethod: {
            type: String,
            required: true,
        },
        paymentResult: {
            id: { type: String },
            status: { type: String },
            update_time: { type: String },
            email_address: { type: String },
        },
        itemsPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        taxPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        shippingPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        totalPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        isPaid: {
            type: Boolean,
            required: true,
            default: false,
        },
        paidAt: {
            type: Date,
        },
        isDelivered: {
            type: Boolean,
            required: true,
            default: false,
        },
        deliveredAt: {
            type: Date,
        },
        trackingStatus: {
            type: String,
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'Out for delivery', 'delivered', 'cancelled'],
            default: 'pending'
        },
        trackingHistory: [{
            status: String,
            message: String,
            location: String,
            timestamp: { type: Date, default: Date.now },
            updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }],
        trackingNumber: {
            type: String
        },
        courierPartner: {
            type: String
        },
        estimatedDelivery: {
            type: Date
        },
        actualDelivery: {
            type: Date
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Order", orderSchema);
