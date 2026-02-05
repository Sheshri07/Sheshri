// Models folder: User schema definition (Mongoose model)
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    orderAlerts: { type: Boolean, default: true },
    productAlerts: { type: Boolean, default: true },
    customerAlerts: { type: Boolean, default: true },
    lowStockAlerts: { type: Boolean, default: true }
  }
},
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
