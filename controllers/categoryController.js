import Category from "../models/Category.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";
import { createError } from "../utils/error.js";
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')  // Remove all non-word chars
        .replace(/--+/g, '-');    // Replace multiple - with single -
};

export const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.status(200).json(categories);
    } catch (error) {
        next(error);
    }
};

export const createCategory = async (req, res, next) => {
    try {
        const { name } = req.body;

        if (!name) return next(createError(400, "Category name is required"));

        let imageUrl = "";
        if (req.files && req.files['image']) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "categories" },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result.secure_url);
                    }
                );
                Readable.from(req.files['image'][0].buffer).pipe(stream);
            });
            imageUrl = result;
        }

        const newCategory = new Category({
            name,
            image: imageUrl,
            slug: slugify(name, { lower: true, strict: true })
        });

        const savedCategory = await newCategory.save();
        res.status(201).json(savedCategory);
    } catch (error) {
        if (error.code === 11000) {
            return next(createError(400, "Category name already exists"));
        }
        next(error);
    }
};

export const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const category = await Category.findById(id);

        if (!category) return next(createError(404, "Category not found"));

        let updateData = {
            name: name || category.name,
            slug: name ? slugify(name, { lower: true, strict: true }) : category.slug
        };

        if (req.files && req.files['image']) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "categories" },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result.secure_url);
                    }
                );
                Readable.from(req.files['image'][0].buffer).pipe(stream);
            });
            updateData.image = result;
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        res.status(200).json(updatedCategory);
    } catch (error) {
        if (error.code === 11000) {
            return next(createError(400, "Category name already exists"));
        }
        next(error);
    }
};

export const deleteCategory = async (req, res, next) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.status(200).json("Category has been deleted.");
    } catch (error) {
        next(error);
    }
};
