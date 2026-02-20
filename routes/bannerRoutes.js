import express from "express";
import { getBanners, createBanner, updateBanner, deleteBanner } from "../controllers/bannerController.js";
import { verifyAdmin } from "../middleware/auth.js";
import upload from "../middleware/upload.js";



const router = express.Router();

router.get("/", getBanners);
router.post("/", verifyAdmin, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'mobileImage', maxCount: 1 }]), createBanner);
router.put("/:id", verifyAdmin, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'mobileImage', maxCount: 1 }]), updateBanner);
router.delete("/:id", verifyAdmin, deleteBanner);

export default router;
