import express from "express";
import {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  cancelOrder,
} from "../controllers/order.js";

import { verifyToken, verifyAdmin } from "../utils/verifyToken.js";

const router = express.Router();

router.route("/")
  .post(verifyToken, addOrderItems)
  .get(verifyAdmin, getOrders);

router.route("/myorders")
  .get(verifyToken, getMyOrders);

router.route("/:id")
  .get(verifyToken, getOrderById);

router.route("/:id/pay")
  .put(verifyToken, updateOrderToPaid);

router.route("/:id/deliver")
  .put(verifyAdmin, updateOrderToDelivered);

router.route("/:id/cancel")
  .put(verifyToken, cancelOrder);

export default router;
