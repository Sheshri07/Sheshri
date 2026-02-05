import Product from "../models/Product.js";
import { createError } from "../utils/error.js";



export const getAllProducts = async (req, res, next) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        next(error);
    }
};

export const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if ID is valid ObjectId to avoid cast error
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            const product = await Product.findById(id);
            if (product) {
                return res.status(200).json(product);
            }
        }

        return next(createError(404, "Product not found"));
    } catch (error) {
        next(error);
    }
};

import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

export const createProduct = async (req, res, next) => {
    try {
        const {
            name, description, price, category, subcategory, sizes, originalPrice, countInStock, inStock, addOnItems,
            styleNo, designNo, color, fabric, work, packContains, manufacturedBy, productSpeciality, styleTips, fitTips
        } = req.body;

        const imageUrls = [];
        if (req.files && req.files["images"] && req.files["images"].length > 0) {
            const uploadPromises = req.files["images"].map((file) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "products" },
                        (error, result) => {
                            if (error) return reject(error);
                            resolve(result.secure_url);
                        }
                    );
                    Readable.from(file.buffer).pipe(stream);
                });
            });

            const uploadedImages = await Promise.all(uploadPromises);
            imageUrls.push(...uploadedImages);
        }

        let videoUrl = "";
        if (req.files && req.files["video"] && req.files["video"].length > 0) {
            const videoFile = req.files["video"][0];
            videoUrl = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "products_videos", resource_type: "video" },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result.secure_url);
                    }
                );
                Readable.from(videoFile.buffer).pipe(stream);
            });
        }

        let finalSizes = sizes;
        if (sizes && !Array.isArray(sizes)) {
            finalSizes = [sizes];
        }

        // Parse add-on items if provided
        let parsedAddOnItems = [];
        if (addOnItems) {
            try {
                parsedAddOnItems = typeof addOnItems === 'string' ? JSON.parse(addOnItems) : addOnItems;
                // Validate max 6 items
                if (parsedAddOnItems.length > 6) {
                    return next(createError(400, "Maximum 6 add-on items allowed per product"));
                }

                // Handle Add-on Images
                // We expect files with keys like "addOnItemImages-0", "addOnItemImages-1", etc.
                const addOnImagePromises = parsedAddOnItems.map(async (item, index) => {
                    const fileKey = `addOnItemImages-${index}`;
                    let newImageUrls = [];

                    if (req.files && req.files[fileKey] && req.files[fileKey].length > 0) {
                        const uploadPromises = req.files[fileKey].map(file => {
                            return new Promise((resolve, reject) => {
                                const stream = cloudinary.uploader.upload_stream(
                                    { folder: "products/addons" },
                                    (error, result) => {
                                        if (error) return reject(error);
                                        resolve(result.secure_url);
                                    }
                                );
                                Readable.from(file.buffer).pipe(stream);
                            });
                        });
                        newImageUrls = await Promise.all(uploadPromises);
                    }

                    // Merge with existing images if they exist (passed from frontend as strings ideally, usually inside item.images)
                    // Note: In create, usually empty, but good practice.
                    // Important: The item might have 'image' from legacy or 'images' from new schema.
                    // We normalize to 'images'.
                    const existingImages = item.images || (item.image ? [item.image] : []) || [];

                    return { ...item, images: [...existingImages, ...newImageUrls] };
                });

                parsedAddOnItems = await Promise.all(addOnImagePromises);

            } catch (err) {
                return next(createError(400, "Invalid add-on items format" + err.message));
            }
        }

        const newProduct = new Product({
            name,
            description,
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            images: imageUrls,
            video: videoUrl,
            category,
            subcategory,
            sizes: (finalSizes && finalSizes.length > 0) ? finalSizes : ["XS", "S", "M", "L", "XL"],
            countInStock: Number(countInStock) || 0,
            inStock: inStock === "true" || inStock === true,
            addOnItems: parsedAddOnItems,
            styleNo,
            designNo,
            color,
            fabric,
            work,
            packContains,
            manufacturedBy,
            productSpeciality,
            styleTips,
            fitTips,
        });

        const savedProduct = await newProduct.save();
        res.status(200).json(savedProduct);
    } catch (err) {
        next(err);
    }
};

export const updateProduct = async (req, res, next) => {
    try {
        const {
            name, description, price, category, subcategory, sizes, originalPrice, countInStock, inStock, addOnItems,
            styleNo, designNo, color, fabric, work, packContains, manufacturedBy, productSpeciality, styleTips, fitTips
        } = req.body;

        // Handle Images
        let updatedImages = [];

        // 1. Keep existing images (passed as strings in body)
        if (req.body.images) {
            if (Array.isArray(req.body.images)) {
                updatedImages = [...req.body.images];
            } else {
                updatedImages = [req.body.images];
            }
        }

        // 2. Add new uploaded images
        if (req.files && req.files["images"] && req.files["images"].length > 0) {
            const uploadPromises = req.files["images"].map((file) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "products" },
                        (error, result) => {
                            if (error) return reject(error);
                            resolve(result.secure_url);
                        }
                    );
                    Readable.from(file.buffer).pipe(stream);
                });
            });
            const newImageUrls = await Promise.all(uploadPromises);
            updatedImages.push(...newImageUrls);
        }

        // Handle Video
        let updatedVideo = req.body.video; // Keep existing video if passed
        if (req.files && req.files["video"] && req.files["video"].length > 0) {
            const videoFile = req.files["video"][0];
            updatedVideo = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "products_videos", resource_type: "video" },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result.secure_url);
                    }
                );
                Readable.from(videoFile.buffer).pipe(stream);
            });
        }

        let finalSizes = sizes;
        if (sizes && !Array.isArray(sizes)) {
            finalSizes = [sizes];
        }

        // Parse add-on items if provided
        let parsedAddOnItems = undefined;
        if (addOnItems !== undefined) {
            try {
                parsedAddOnItems = typeof addOnItems === 'string' ? JSON.parse(addOnItems) : addOnItems;
                // Validate max 6 items
                if (parsedAddOnItems.length > 6) {
                    return next(createError(400, "Maximum 6 add-on items allowed per product"));
                }

                // Handle Add-on Images (New uploads)
                const addOnImagePromises = parsedAddOnItems.map(async (item, index) => {
                    const fileKey = `addOnItemImages-${index}`;
                    let newImageUrls = [];

                    if (req.files && req.files[fileKey] && req.files[fileKey].length > 0) {
                        const uploadPromises = req.files[fileKey].map(file => {
                            return new Promise((resolve, reject) => {
                                const stream = cloudinary.uploader.upload_stream(
                                    { folder: "products/addons" },
                                    (error, result) => {
                                        if (error) return reject(error);
                                        resolve(result.secure_url);
                                    }
                                );
                                Readable.from(file.buffer).pipe(stream);
                            });
                        });
                        newImageUrls = await Promise.all(uploadPromises);
                    }

                    // Existing logic might pass 'images' array in body if not changing anything
                    // The 'item' from JSON.parse(addOnItems) contains the existing data
                    const existingImages = item.images || (item.image ? [item.image] : []) || [];

                    return { ...item, images: [...existingImages, ...newImageUrls] };
                });

                parsedAddOnItems = await Promise.all(addOnImagePromises);

            } catch (err) {
                return next(createError(400, "Invalid add-on items format"));
            }
        }

        const updatedProductData = {
            name,
            description,
            price: price !== undefined ? Number(price) : undefined,
            originalPrice: originalPrice !== undefined && originalPrice !== "" ? Number(originalPrice) : undefined,
            category,
            subcategory,
            sizes: (finalSizes && finalSizes.length > 0) ? finalSizes : undefined,
            images: updatedImages.length > 0 ? updatedImages : undefined,
            video: updatedVideo,
            countInStock: countInStock !== undefined ? Number(countInStock) : undefined,
            inStock: inStock !== undefined ? (inStock === "true" || inStock === true) : undefined,
            addOnItems: parsedAddOnItems,
            styleNo,
            designNo,
            color,
            fabric,
            work,
            packContains,
            manufacturedBy,
            productSpeciality,
            styleTips,
            fitTips,
        };

        // Remove undefined fields to avoid overwriting with undefined
        Object.keys(updatedProductData).forEach(key => {
            if (updatedProductData[key] === undefined) {
                delete updatedProductData[key];
            }
        });

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updatedProductData },
            { new: true }
        );

        if (!updatedProduct) {
            return next(createError(404, "Product not found"));
        }

        res.status(200).json(updatedProduct);
    } catch (err) {
        next(err);
    }
};

export const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return next(createError(404, "Product not found"));
        }
        res.status(200).json("Product has been deleted.");
    } catch (err) {
        next(err);
    }
};

export const getDistinctCategories = async (req, res, next) => {
    try {
        const categories = await Product.aggregate([
            {
                $group: {
                    _id: "$category",
                    image: { $first: { $arrayElemAt: ["$images", 0] } },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    image: 1,
                    count: 1
                }
            }
        ]);
        res.status(200).json(categories);
    } catch (err) {
        next(err);
    }
};

export const getDistinctSubcategories = async (req, res, next) => {
    try {
        const subcategories = await Product.distinct("subcategory");
        res.status(200).json(subcategories.filter(s => s)); // Filter out empty/null
    } catch (err) {
        next(err);
    }
};
