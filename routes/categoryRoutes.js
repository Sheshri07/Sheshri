import express from "express";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../controllers/categoryController.js";
import multer from "multer";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/", getCategories);
router.post("/", upload.fields([{ name: "image", maxCount: 1 }]), createCategory);
router.put("/:id", upload.fields([{ name: "image", maxCount: 1 }]), updateCategory);
router.delete("/:id", deleteCategory);

export default router;
