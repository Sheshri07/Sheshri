import express from 'express';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification
} from '../controllers/notification.js';

import { verifyToken } from '../utils/verifyToken.js';

const router = express.Router();

// Get user's notifications
router.get('/', verifyToken, getUserNotifications);

// Get unread count
router.get('/unread/count', verifyToken, getUnreadCount);

// Mark notification as read
router.put('/:id/read', verifyToken, markAsRead);

// Mark all as read
router.put('/read-all', verifyToken, markAllAsRead);

// Delete notification
router.delete('/:id', verifyToken, deleteNotification);

export default router;
