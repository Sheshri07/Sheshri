import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";
import Category from "./models/Category.js";

dotenv.config();

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')  // Remove all non-word chars
        .replace(/--+/g, '-');    // Replace multiple - with single -
};

const migrate = async () => {
    try {
        console.log("⏳ Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected!");

        console.log("🔍 Fetching distinct categories from products...");
        const productCategories = await Product.aggregate([
            {
                $group: {
                    _id: "$category",
                    image: { $first: { $arrayElemAt: ["$images", 0] } }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    image: 1
                }
            }
        ]);

        console.log(`📦 Found ${productCategories.length} categories to migrate.`);

        for (const cat of productCategories) {
            if (!cat.name) continue;

            const existing = await Category.findOne({ name: cat.name });
            if (existing) {
                console.log(`⏩ Skipping ${cat.name} (already exists)`);
                continue;
            }

            const newCategory = new Category({
                name: cat.name,
                image: cat.image || "",
                slug: slugify(cat.name)
            });

            await newCategory.save();
            console.log(`✅ Migrated: ${cat.name}`);
        }

        console.log("🎉 Migration complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
};

migrate();
