const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim:true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        trim:true,
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('category', categorySchema);