import Banner from "../models/Banner.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";
import { createError } from "../utils/error.js";

console.log("Loading bannerController.js...");

export const getBanners = async (req, res, next) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
        res.status(200).json(banners);
    } catch (error) {
        next(error);
    }
};

export const createBanner = async (req, res, next) => {
    try {
        console.log("Creating banner. Body:", req.body);
        const { link, alt, order, isActive } = req.body;

        let imageUrl = "";
        let mobileImageUrl = "";

        if (req.files && req.files['image'] && req.files['mobileImage']) {
            // Upload Desktop Image
            const desktopResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "banners" },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result.secure_url);
                    }
                );
                Readable.from(req.files['image'][0].buffer).pipe(stream);
            });
            imageUrl = desktopResult;

            // Upload Mobile Image
            const mobileResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "banners/mobile" },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result.secure_url);
                    }
                );
                Readable.from(req.files['mobileImage'][0].buffer).pipe(stream);
            });
            mobileImageUrl = mobileResult;
        } else {
            return next(createError(400, "Both Desktop and Mobile Images are required"));
        }

        const newBanner = new Banner({
            image: imageUrl,
            mobileImage: mobileImageUrl,
            link,
            alt,
            order: order ? Number(order) : 0,
            isActive: isActive !== undefined ? isActive : true
        });

        const savedBanner = await newBanner.save();
        res.status(201).json(savedBanner);
    } catch (error) {
        next(error);
    }
};

export const updateBanner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { link, alt, order, isActive } = req.body;
        const banner = await Banner.findById(id);

        if (!banner) return next(createError(404, "Banner not found"));

        let updateData = {
            link,
            alt,
            order: order ? Number(order) : banner.order,
            isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : banner.isActive
        };

        // Handle Image Updates if files are provided
        if (req.files) {
            if (req.files['image']) {
                const desktopResult = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "banners" },
                        (error, result) => {
                            if (error) return reject(error);
                            resolve(result.secure_url);
                        }
                    );
                    Readable.from(req.files['image'][0].buffer).pipe(stream);
                });
                updateData.image = desktopResult;
            }

            if (req.files['mobileImage']) {
                const mobileResult = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "banners/mobile" },
                        (error, result) => {
                            if (error) return reject(error);
                            resolve(result.secure_url);
                        }
                    );
                    Readable.from(req.files['mobileImage'][0].buffer).pipe(stream);
                });
                updateData.mobileImage = mobileResult;
            }
        }

        const updatedBanner = await Banner.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        res.status(200).json(updatedBanner);
    } catch (error) {
        next(error);
    }
};

export const deleteBanner = async (req, res, next) => {
    try {
        await Banner.findByIdAndDelete(req.params.id);
        res.status(200).json("Banner has been deleted.");
    } catch (error) {
        next(error);
    }
};
