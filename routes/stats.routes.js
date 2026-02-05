import express from "express";
import { getDashboardStats } from "../controllers/stats.js";

const router = express.Router();

router.get("/", getDashboardStats);

export default router;
