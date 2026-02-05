import Wishlist from '../models/Wishlist.js';

export const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user.id;

        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, products: [] });
        }

        if (!wishlist.products.includes(productId)) {
            wishlist.products.push(productId);
            await wishlist.save();
        }

        res.status(200).json(wishlist);
    } catch (error) {
        res.status(500).json({ message: "Error adding to wishlist", error: error.message });
    }
};

export const removeFromWishlist = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            return res.status(404).json({ message: "Wishlist not found" });
        }

        wishlist.products = wishlist.products.filter(p => p.toString() !== id);
        await wishlist.save();

        res.status(200).json(wishlist);
    } catch (error) {
        res.status(500).json({ message: "Error removing from wishlist", error: error.message });
    }
};

export const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const wishlist = await Wishlist.findOne({ user: userId }).populate('products');

        if (!wishlist) {
            return res.status(200).json({ products: [] });
        }

        res.status(200).json(wishlist);
    } catch (error) {
        res.status(500).json({ message: "Error fetching wishlist", error: error.message });
    }
};
