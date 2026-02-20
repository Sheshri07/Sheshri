import express from "express";
import {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  cancelOrder,
  abandonOrder,
  updateOrdersStatus,
  getReturnRequests,
  updateReturnStatus,
  requestReturn
} from "../controllers/order.js";

import { verifyToken, verifyAdmin } from "../utils/verifyToken.js";

// Mapping middleware to match previous naming convention if needed, 
// or updating routes to use verifyToken/verifyAdmin
const protect = verifyToken;
const admin = verifyAdmin;

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

router.route('/bulk-update').put(protect, admin, updateOrdersStatus);
router.route('/returns/all').get(protect, admin, getReturnRequests);
router.route('/:id/return').put(protect, admin, updateReturnStatus);
router.route('/:id/request-return').put(protect, requestReturn);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);

router.route("/:id/cancel")
  .put(verifyToken, cancelOrder);

router.route("/:id/abandon")
  .put(verifyToken, abandonOrder);

export default router;
