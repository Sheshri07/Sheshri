import express from "express";
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getDistinctCategories,
    getDistinctSubcategories
} from "../controllers/product.js";
import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/categories", getDistinctCategories);
router.get("/subcategories", getDistinctSubcategories);
router.get("/:id", getProductById);

import upload from "../middleware/upload.js";

// Admin Routes
router.post(
    "/",
    (req, res, next) => {
        // console.log("Incoming POST product request"); 
        next();
    },
    verifyAdmin,
    upload.fields([
        { name: "images", maxCount: 10 },
        { name: "video", maxCount: 1 },
        { name: "addOnItemImages-0", maxCount: 5 },
        { name: "addOnItemImages-1", maxCount: 5 },
        { name: "addOnItemImages-2", maxCount: 5 },
        { name: "addOnItemImages-3", maxCount: 5 },
        { name: "addOnItemImages-4", maxCount: 5 },
        { name: "addOnItemImages-5", maxCount: 5 },
    ]),
    createProduct
);
router.put(
    "/:id",
    verifyAdmin,
    upload.fields([
        { name: "images", maxCount: 10 },
        { name: "video", maxCount: 1 },
        { name: "addOnItemImages-0", maxCount: 5 },
        { name: "addOnItemImages-1", maxCount: 5 },
        { name: "addOnItemImages-2", maxCount: 5 },
        { name: "addOnItemImages-3", maxCount: 5 },
        { name: "addOnItemImages-4", maxCount: 5 },
        { name: "addOnItemImages-5", maxCount: 5 },
    ]),
    updateProduct
);
router.delete("/:id", verifyAdmin, deleteProduct);

export default router;
