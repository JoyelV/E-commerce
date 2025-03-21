const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    description:{
        type:String,
        required:true,
        trim:true,
    },
    is_active:{
        type:Boolean,
        default:true
    }
});

module.exports = mongoose.model('category',categorySchema);