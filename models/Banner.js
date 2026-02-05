import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    mobileImage: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: false
    },
    alt: {
        type: String,
        required: false
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default mongoose.model('Banner', bannerSchema);
