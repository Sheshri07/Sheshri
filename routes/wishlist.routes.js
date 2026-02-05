import express from 'express';
import { verifyToken } from '../utils/verifyToken.js';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlist.js';

const router = express.Router();

router.get('/', verifyToken, getWishlist);
router.post('/', verifyToken, addToWishlist);
router.delete('/:id', verifyToken, removeFromWishlist);

export default router;
