const productModel = require("../models/productModel");
const categoryModel = require('../models/categoryModel');
const userModel = require('../models/userModel');
const reviewModel = require('../models/reviewModel');
const orderModel = require("../models/orderModel")
const wishlistModel = require("../models/wishlistModel")
const productOfferModel = require("../models/productOfferModel");
const categoryOfferModel = require("../models/categoryOfferModel");
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;

const loadProduct = async (req, res) => {
    try {
        // Handle query parameter
        let query = req.query.q || '';
        if (!query || /^([a-zA-Z\d])\1*[\W\d]*$/.test(query) || /^[\*\W\d]+$/.test(query)) {
            query = 'all';
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        let products, totalProductsCount, totalPages;

        if (query === 'all') {
            // Fetch all products
            totalProductsCount = await productModel.countDocuments();
            totalPages = Math.ceil(totalProductsCount / limit);

            if (page < 1 || (totalPages > 0 && page > totalPages)) {
                return res.status(404).render('admin/error', { message: 'Page not found' });
            }

            products = await productModel
                .find()
                .populate('category')
                .skip(skip)
                .limit(limit);
        } else {
            const searchQuery = {
                $or: [
                    { name: { $regex: new RegExp(query, 'i') } },
                    { brand: { $regex: new RegExp(query, 'i') } }
                ]
            };

            totalProductsCount = await productModel.countDocuments(searchQuery);
            totalPages = Math.ceil(totalProductsCount / limit);

            if (page < 1 || (totalPages > 0 && page > totalPages)) {
                return res.status(404).render('admin/error', { message: 'Page not found' });
            }

            products = await productModel
                .find(searchQuery)
                .populate('category')
                .skip(skip)
                .limit(limit);
        }

        const categorydetails = await categoryModel.find();
        res.render('admin/viewProduct', {
            query,
            product: products,
            category: categorydetails,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error('Error in loadProduct:', error.message);
        res.status(500).render('admin/error', { message: 'An error occurred while loading products. Please try again.' });
    }
};

const addProductpage = async(req,res)=>{
    try{
        const categorydetails = await categoryModel.find({ is_active: true });

        res.render('admin/addProduct', { category: categorydetails});
    }catch(error){
        console.log(error.message);
    }
}

// Utility function to validate inputs
const validateProductData = (data) => {
    const errors = [];

    if (!data.name || !/^[A-Za-z0-9.,\s]+$/.test(data.name.trim())) {
        errors.push('Product name is required and must contain only letters, numbers, spaces, commas, or periods.');
    }

    if (!data.description || !/^\s*[A-Z][\s\S]{13,}$/.test(data.description.trim())) {
        errors.push('Description must start with a capital letter and be at least 14 characters long.');
    }

    if (!data.brand || !/^[A-Za-z0-9.,\s]+$/.test(data.brand.trim())) {
        errors.push('Brand name is required and must contain only letters, numbers, spaces, commas, or periods.');
    }

    if (!data.gender || !/^[A-Za-z0-9.,\s]+$/.test(data.gender.trim())) {
        errors.push('Gender is required and must contain only letters, numbers, spaces, commas, or periods.');
    }

    const price = parseFloat(data.price);
    if (!data.price || isNaN(price) || price <= 0 || !/^\d+(\.\d{1,2})?$/.test(data.price)) {
        errors.push('Price must be a valid positive number with up to two decimal places.');
    }

    const discountPrice = parseFloat(data.discountPrice);
    if (!data.discountPrice || isNaN(discountPrice) || discountPrice < 0 || !/^\d+(\.\d{1,2})?$/.test(data.discountPrice)) {
        errors.push('Discount price must be a valid non-negative number with up to two decimal places.');
    }
    if (discountPrice >= price) {
        errors.push('Discount price must be less than the regular price.');
    }

    const stock = parseInt(data.stock, 10);
    if (!data.stock || isNaN(stock) || stock < 0 || stock > 300) {
        errors.push('Stock must be a number between 0 and 300.');
    }

    if (!data.category || !mongoose.Types.ObjectId.isValid(data.category)) {
        errors.push('A valid category is required.');
    }

    return errors;
};

// Utility function to validate images
const validateImages = (files) => {
    const errors = [];
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const maxFiles = 3;

    if (!files || files.length === 0) {
        errors.push('At least one image is required.');
        return errors;
    }

    if (files.length > maxFiles) {
        errors.push(`You can upload a maximum of ${maxFiles} images.`);
        return errors;
    }

    files.forEach((file, index) => {
        const extension = path.extname(file.originalname).toLowerCase().slice(1);
        if (!validExtensions.includes(extension)) {
            errors.push(`Image ${index + 1} must be a valid image file (jpg, jpeg, png, gif, webp).`);
        }
    });

    return errors;
};

const addProduct = async (req, res) => {
    try {
        const validationErrors = validateProductData(req.body);
        const imageErrors = validateImages(req.files);

        if (validationErrors.length > 0 || imageErrors.length > 0) {
            const categoryDetails = await categoryModel.find();
            return res.render('admin/addProduct', {
                category: categoryDetails,
                message: [...validationErrors, ...imageErrors].join(' '),
            });
        }

        const existingProduct = await productModel.findOne({
            name: { $regex: new RegExp(`^${req.body.name.trim()}$`, 'i') },
            category: req.body.category,
        });

        if (existingProduct) {
            const categoryDetails = await categoryModel.find();
            return res.render('admin/addProduct', {
                category: categoryDetails,
                message: 'A product with the same name and category already exists.',
            });
        }

        const images = req.files.map(file => file.filename);

        const product = new productModel({
            name: req.body.name.trim(),
            description: req.body.description.trim(),
            brand: req.body.brand.trim(),
            gender: req.body.gender.trim(),
            images: images,
            countInStock: parseInt(req.body.stock, 10),
            category: req.body.category,
            price: parseFloat(req.body.price),
            discountPrice: parseFloat(req.body.discountPrice),
        });

        const savedProduct = await product.save();

        if (savedProduct) {
            return res.redirect('/admin/products');
        } else {
            throw new Error('Failed to save product.');
        }
    } catch (error) {
        console.error('Error saving product:', error);

        if (req.files) {
            req.files.forEach(file => {
                const filePath = path.join(__dirname, './public/productImages', file.filename); 
                fs.unlink(filePath, err => {
                    if (err) console.error('Error deleting file:', err);
                });
            });
        }

        const categoryDetails = await categoryModel.find();
        return res.render('admin/addProduct', {
            category: categoryDetails,
            message: 'An error occurred while saving the product. Please try again.',
        });
    }
};

const loadEdit = async (req, res) => {
    try {
        const id = req.query.id;
        const proData = await productModel.findById(id).populate('category');
        if(req.query.delete){
            proData.images = proData.images.filter(img => img.trim() !== req.query.delete.trim());
            await proData.save();
        }
        const catData = await categoryModel.find({ is_active: true });

        res.render("admin/editProduct", { catData, proData });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const editProduct = async (req, res) => {
    try {
        let existingProduct = await productModel.findById(req.query.id);
        const categorydetails = await categoryModel.find();

        if (!existingProduct) {
            return res.status(404).send('Product not found');
        }

        let existingImages = existingProduct.images && Array.isArray(existingProduct.images) ? existingProduct.images : [];

        if (req.query.delete) {
            const imageToDelete = req.query.delete;
            if (existingImages.includes(imageToDelete)) {
                existingImages = existingImages.filter(img => img !== imageToDelete);
                const imagePath = path.join(__dirname, '../public/productImages', imageToDelete);
                try {
                    await fs.unlink(imagePath);
                } catch (err) {
                    console.warn(`Failed to delete image file ${imagePath}:`, err.message);
                }
                await productModel.findByIdAndUpdate(req.query.id, { $set: { images: existingImages } });
                return res.redirect(`/admin/edit-product?id=${req.query.id}`);
            }
        }

        let newImages = [];
        if (req.files && req.files.length) {
            newImages = req.files.map(file => file.filename);
        }

        const allImages = existingImages.concat(newImages);

        if (allImages.length > 3) {
            return res.render('admin/editProduct', {
                catData: categorydetails,
                proData: existingProduct,
                message: 'Maximum 3 images per product'
            });
        }

        const updatedProduct = await productModel.findByIdAndUpdate(
            req.query.id,
            {
                $set: {
                    name: req.body.name,
                    description: req.body.description,
                    images: allImages,
                    brand: req.body.brand,
                    gender: req.body.gender,
                    category: req.body.category,
                    price: req.body.price,
                    discountPrice: req.body.discountPrice,
                    countInStock: req.body.stock,
                }
            },
            { new: true }
        );

        if (updatedProduct) {
            return res.redirect('/admin/products');
        } else {
            return res.status(500).send('Failed to update product');
        }
    } catch (error) {
        console.error('Update product error:', error.message);
        res.status(500).send('An error occurred');
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.body; 
        if (!id) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const product = await productModel.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        await productModel.findByIdAndUpdate(id, { is_deleted: true });
        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const restoreProduct = async (req, res) => {
    try {
        const { id } = req.body; 
        if (!id) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const product = await productModel.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        await productModel.findByIdAndUpdate(id, { is_deleted: false });
        res.status(200).json({ success: true, message: 'Product restored successfully' });
    } catch (error) {
        console.error('Error restoring product:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const loadProductPage = async(req,res)=>{
        try {
            const id = req.query.id;
            const userId = req.session.user_id;

            const productData = await productModel.findById(id).populate('category');
            const relatedProducts = await productModel.find({ category: productData.category }).limit(4);
            const reviewDetails = await reviewModel.find({product:productData._id}).sort({createdAt:1}).limit(3);

            const proOffer = await productOfferModel.aggregate([
                {
                  $match: {
                    'productOffer.product': productData._id,
                    'productOffer.offerStatus': true,
                    startingDate: { $lte: new Date() },
                    endingDate: { $gte: new Date() }
                  }
                },
                {
                  $group: {
                    _id: null,
                    totalDiscount: { $sum: "$productOffer.discount" }
                  }
                }
              ]);
          
              const proOfferDiscount = (proOffer.length > 0) ? proOffer[0].totalDiscount : 0;

              const result = await categoryOfferModel.aggregate([
                {
                  $match: {
                    'categoryOffer.category': productData.category._id,
                    is_active: true,
                    "categoryOffer.offerStatus": true,
                    startingDate: { $lte: new Date() },
                    endingDate: { $gte: new Date() },
                  }
                },
                {
                  $group: {
                    _id: null,
                    totalDiscount: { $sum: "$categoryOffer.discount" }
                  }
                }
              ]);
          
              const totalDis = (result.length > 0) ? result[0].totalDiscount : 0;

            var specialDiscount = 0;
            if (proOffer) {
                specialDiscount += proOfferDiscount;
            }

            if(result){
                specialDiscount += totalDis;
            }

            const isInWishlist = await isProductInWishlist(userId, id);
            console.log("isInWishlisttttt",isInWishlist);
    
            if (productData) {
                res.render('users/productDetails', {
                    product: productData,
                    category: productData.category.name,
                    relatedProducts,
                    reviewDetails,
                    isInWishlist,
                    specialDiscount
          
                });
            } else {
                res.redirect('/home');
            }
        } catch (error) {
            console.log(error.message);
            res.status(500).send("Internal Server Error");
        }
}

async function isProductInWishlist(userId, productId) {
    const wishlist = await wishlistModel.findOne({ user: userId });
    if (!wishlist) return false;
    return wishlist.product.some(product => product.toString() === productId);
}

const loadShop = async (req, res) => {
    try {
        const category = await categoryModel.find({});
        let search = req.query.q || ''; // Default to empty string
        let cate = req.query.category || '';
        let sorted = req.query.sort || '';
        let query = { is_deleted: false };

        console.log('Query Parameters:', { search, cate, sorted });

        if (search && search.toLowerCase() !== 'all') {
            const searchQuery = search;
            const searchCondition = {
                $or: [
                    { brand: { $regex: searchQuery, $options: 'i' } },
                    { name: { $regex: searchQuery, $options: 'i' } }
                ]
            };
            query = { ...query, ...searchCondition };
        }

        if (cate) {
            query.category = cate;
        }

        if (req.query.brand) {
            query.brand = req.query.brand;
        }

        if (sorted === 'outOfStock') {
            query.countInStock = 0;
        } else if (sorted === 'inStock') {
            query.countInStock = { $gt: 0 };
        }

        console.log('MongoDB Query:', query);
        const totalProductsCount = await productModel.countDocuments(query);
        console.log('Total Products Count:', totalProductsCount);

        let sortOption = {};
        switch (sorted) {
            case 'priceAsc':
                sortOption = { discountPrice: 1 };
                break;
            case 'priceDsc':
                sortOption = { discountPrice: -1 };
                break;
            case 'nameAsc':
                sortOption = { name: 1 };
                break;
            case 'nameDsc':
                sortOption = { name: -1 };
                break;
            case 'rating':
                sortOption = { rating: -1 };
                break;
            case 'newness':
                sortOption = { createdAt: -1 };
                break;
            default:
                sortOption = { name: 1 };
        }

        let page = parseInt(req.query.page) || 1;
        const limit = 6;
        const totalPages = Math.ceil(totalProductsCount / limit);
        console.log('Total Pages:', totalPages);
        if (totalPages < 2) {
            page = 1;
        }
        const skip = (page - 1) * limit;

        const products = await productModel.find(query).sort(sortOption).skip(skip).limit(limit);
        console.log('Products Fetched:', products.length);

        res.render('users/shop', {
            product: products,
            category,
            totalPages,
            currentPage: page,
            query: search,
            cate,
            sort: sorted
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const loadMenShop = async (req, res) => {
    try {
        const category = await categoryModel.find({});

        let search = req.query.q;
        let cate = req.query.category;
        let sorted = req.query.sort;

        let query = { gender: 'Men', is_deleted: { $ne: 'true' } };

        if (req.query.category) {
            query.category = req.query.category;
        }

        if (req.query.q) {
            const searchQuery = req.query.q;
            const searchCondition = {
                $or: [
                    { brand: { $regex: searchQuery, $options: 'i' } },
                    { name: { $regex: searchQuery, $options: 'i' } }
                ]
            };
            query = { ...query, ...searchCondition };
        }

        if (search === 'all' || search === 'All') {
            query = { gender: 'Men', is_deleted: { $ne: 'true' } };
        }

        let sortOption = {};

        switch (req.query.sort) {
            case 'rating':
                sortOption = { rating: -1 };
                break;
            case 'priceAsc':
                sortOption = { discountPrice: 1 };
                break;
            case 'priceDsc': 
                sortOption = { discountPrice: -1 };
                break;
            case 'newness':
                sortOption = { createdAt: -1 };
                break;
            case 'nameAsc':
                sortOption = { name: 1 };
                break;
            case 'nameDsc': 
                sortOption = { name: -1 };
                break;
            case 'outOfStock':
                query.countInStock = 0;
                break;
            case 'inStock':
                query.countInStock = { $gt: 0 };
                break;
            default:
                sortOption = { name: 1 };
                break;
        }

        let page = parseInt(req.query.page) || 1;
        const limit = 6;

        const totalProductsCount = await productModel.countDocuments(query);
        const totalPages = Math.ceil(totalProductsCount / limit);

        if (totalPages < 2) {
            page = 1;
        }

        const skip = (page - 1) * limit;

        const product = await productModel
            .find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        res.render('users/mens', { product, category, totalPages, currentPage: page, query: search, cate: cate, sort: sorted });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const loadWomenShop = async (req, res) => {
    try {
        const category = await categoryModel.find({});

        let query = { gender: 'Women', is_deleted: { $ne: 'true' } };

        if (req.query.category) {
            query.category = req.query.category;
        }

        if (req.query.q) {
            const searchQuery = req.query.q;
            const searchCondition = {
                $or: [
                    { brand: { $regex: searchQuery, $options: 'i' } },
                    { name: { $regex: searchQuery, $options: 'i' } }
                ]
            };
            query = { ...query, ...searchCondition };
        }

        let sortOption = {};

        switch (req.query.sort) {
            case 'rating':
                sortOption = { rating: -1 };
                break;
            case 'priceAsc':
                sortOption = { discountPrice: 1 };
                break;
            case 'priceDsc': 
                sortOption = { discountPrice: -1 };
                break;
            case 'newness':
                sortOption = { createdAt: -1 };
                break;
            case 'nameAsc':
                sortOption = { name: 1 };
                break;
            case 'nameDsc': 
                sortOption = { name: -1 };
                break;
            case 'outOfStock':
                query.countInStock = 0;
                break;
            case 'inStock':
                query.countInStock = { $gt: 0 };
                break;
            default:
                sortOption = { createdAt: -1 };
                break;
        }

        let page = parseInt(req.query.page) || 1;
        const limit = 6;

        const totalProductsCount = await productModel.countDocuments(query);
        const totalPages = Math.ceil(totalProductsCount / limit);
        const skip = (page - 1) * limit;

        const product = await productModel
            .find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        res.render('users/women', { product, category, totalPages, currentPage: page, query: req.query.q, cate: req.query.category, sort: req.query.sort });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const reviewProduct = async (req, res) => {
    try {

        const { name, email, text, rating, productName } = req.body;
        const user = await userModel.findOne({ email: email });
        const product = await productModel.findOne({ name: productName });

        const order = await orderModel.findOne({
            user: user._id,
            'items.name': productName,
            paymentStatus: 'Success',
            status: 'Delivered'
        });

        if (!order) {
            const productData = await productModel.findById(product._id).populate('category');
            const relatedProducts = await productModel.find({ category: productData.category }).limit(5);
            const reviewDetails = await reviewModel.find({ product: productData._id }).sort({ createdAt: 1 }).limit(3);
            
            const userId = req.session.user_id;
            const isInWishlist = await isProductInWishlist(userId, productData._id);
            console.log("isIggggnWishlist",isInWishlist);
            
            const proOffer = await productOfferModel.aggregate([
                {
                  $match: {
                    'productOffer.product': productData._id,
                    'productOffer.offerStatus': true,
                    startingDate: { $lte: new Date() },
                    endingDate: { $gte: new Date() }
                  }
                },
                {
                  $group: {
                    _id: null,
                    totalDiscount: { $sum: "$productOffer.discount" }
                  }
                }
              ]);
          
              const proOfferDiscount = (proOffer.length > 0) ? proOffer[0].totalDiscount : 0;

              const result = await categoryOfferModel.aggregate([
                {
                  $match: {
                    'categoryOffer.category': productData.category._id,
                    is_active: true,
                    "categoryOffer.offerStatus": true,
                    startingDate: { $lte: new Date() },
                    endingDate: { $gte: new Date() },
                  }
                },
                {
                  $group: {
                    _id: null,
                    totalDiscount: { $sum: "$categoryOffer.discount" }
                  }
                }
              ]);
          
            const totalDis = (result.length > 0) ? result[0].totalDiscount : 0;

            var specialDiscount = 0;
            if (proOffer) {
                specialDiscount += proOfferDiscount;
            }

            if(result){
                specialDiscount += totalDis;
            }

            return res.render('users/productDetails', {
                product: productData,
                category: productData.category.name,
                relatedProducts,
                reviewDetails,
                isInWishlist,
                specialDiscount,
                message: 'You are not purchased this product to review this product.'
            });
        }

        const userReviewExists = await reviewModel.exists({ product: product._id, email: email });
        console.log("userReviewExists",userReviewExists);
        if (userReviewExists) {

            const productData = await productModel.findById(product._id).populate('category');
            const relatedProducts = await productModel.find({ category: productData.category }).limit(5);
            const reviewDetails = await reviewModel.find({ product: productData._id }).sort({ createdAt: 1 }).limit(3);

            const userId = req.session.user_id;

            const isInWishlist = await isProductInWishlist(userId, productData._id);
            console.log("ihhhhhhsInWishlist",isInWishlist);

            const proOffer = await productOfferModel.aggregate([
                {
                  $match: {
                    'productOffer.product': productData._id,
                    'productOffer.offerStatus': true,
                    startingDate: { $lte: new Date() },
                    endingDate: { $gte: new Date() }
                  }
                },
                {
                  $group: {
                    _id: null,
                    totalDiscount: { $sum: "$productOffer.discount" }
                  }
                }
              ]);
          
              const proOfferDiscount = (proOffer.length > 0) ? proOffer[0].totalDiscount : 0;

              const result = await categoryOfferModel.aggregate([
                {
                  $match: {
                    'categoryOffer.category': productData.category._id,
                    is_active: true,
                    "categoryOffer.offerStatus": true,
                    startingDate: { $lte: new Date() },
                    endingDate: { $gte: new Date() },
                  }
                },
                {
                  $group: {
                    _id: null,
                    totalDiscount: { $sum: "$categoryOffer.discount" }
                  }
                }
              ]);
          
            const totalDis = (result.length > 0) ? result[0].totalDiscount : 0;

            var specialDiscount = 0;
            if (proOffer) {
                specialDiscount += proOfferDiscount;
            }

            if(result){
                specialDiscount += totalDis;
            }

            console.log("specialdisocunt if userreview exists",specialDiscount)

            return res.render('users/productDetails', {
                product: productData,
                category: productData.category.name,
                relatedProducts,
                reviewDetails,
                isInWishlist,
                specialDiscount,
                message: 'You have already reviewed this product.'
            });
        }
        
        const newReview = new reviewModel({
            product: product._id,
            name,
            email,
            rating,
            reviewText: text
        });

        await newReview.save();

        const reviews = await reviewModel.find({ product: product._id });
        const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
        const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

        product.rating = averageRating;
        await product.save();

        const productData = await productModel.findById(product._id).populate('category');
        const relatedProducts = await productModel.find({ category: productData.category }).limit(5);
        const reviewDetails = await reviewModel.find({ product: productData._id }).sort({ createdAt: 1 }).limit(3);

        const userId = req.session.user_id;

        const isInWishlist = await isProductInWishlist(userId, product._id);
        console.log("isInWishlist",isInWishlist);

        const proOffer = await productOfferModel.aggregate([
            {
              $match: {
                'productOffer.product': product._id,
                'productOffer.offerStatus': true,
                startingDate: { $lte: new Date() },
                endingDate: { $gte: new Date() }
              }
            },
            {
              $group: {
                _id: null,
                totalDiscount: { $sum: "$productOffer.discount" }
              }
            }
          ]);
      
          const proOfferDiscount = (proOffer.length > 0) ? proOffer[0].totalDiscount : 0;

        const result = await categoryOfferModel.aggregate([
            {
              $match: {
                'categoryOffer.category': productData.category._id,
                is_active: true,
                "categoryOffer.offerStatus": true,
                startingDate: { $lte: new Date() },
                endingDate: { $gte: new Date() },
              }
            },
            {
              $group: {
                _id: null,
                totalDiscount: { $sum: "$categoryOffer.discount" }
              }
            }
          ]);
      
        const totalDis = (result.length > 0) ? result[0].totalDiscount : 0;
            
            var specialDiscount = 0;
            if (proOffer) {
                specialDiscount += proOfferDiscount;
            }

            if (result) {
                specialDiscount += totalDis;
            }

        return res.render('users/productDetails', {
            product: productData,
            category: productData.category.name,
            relatedProducts,
            reviewDetails,
            isInWishlist,
            specialDiscount,
            message: 'Review submitted successfully.'
        });
    
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const searchProductView = async(req,res)=>{
    try{
        let query = req.query.q; 

        if (/^([a-zA-Z\d])\1*[\W\d]*$/.test(query)) {
            query = 'all';
        } 
        if (/^[\*\W\d]+$/.test(query)) {
            query = 'all';
        } 
        
        if(query === 'all'){
            const page = parseInt(req.query.page) || 1; 
            const limit = 5; 
    
            const totalProductsCount = await productModel.countDocuments();
            const totalPages = Math.ceil(totalProductsCount / limit);
    
            if (page < 1 || page > totalPages) {
                return res.status(404).send('Page not found');
            }
    
            const skip = (page - 1) * limit;
    
            const productdetails = await productModel.find().populate('category').skip(skip).limit(limit);
            const categorydetails = await categoryModel.find();
    
            res.render('admin/viewProduct', { query, product: productdetails, category: categorydetails, totalPages, currentPage: page });
        }
        else{
        const query = req.query.q; 

        const page = parseInt(req.query.page) || 1; 
        const limit = 5; 
    
        const totalProductsCount = await productModel.countDocuments();
        const totalPages = Math.ceil(totalProductsCount / limit);
    
        if (page < 1 || page > totalPages) {
                return res.status(404).send('Page not found');
        }
    
        const skip = (page - 1) * limit;

        const category = await categoryModel.find({});

        const products = await productModel.find({ 
          $and: [
            { is_deleted: false }, 
            { $or: [ 
              { name: { $regex: new RegExp(query, 'i') } }, 
              { brand: { $regex: new RegExp(query, 'i') } } 
            ] }
          ]
        }).populate('category').skip(skip).limit(limit); 
    
        res.render('admin/viewProduct', { query,product: products, category: category, totalPages, currentPage: page });
    }
    }catch(error){
        console.log(error.message);
    }
}

const getStocks = async (req, res) => {
    try {
        const query = req.query.q || ''; 
        
        if (query === 'all') {
            const category = await categoryModel.find({});
            const products = await productModel.find({}).populate('category');
            const totalProducts = await productModel.countDocuments({});
            const totalPages = Math.ceil(totalProducts / 10); 
            console.log("products in search", products);
            return res.render('admin/stocks', { 
                product: products, 
                category,
                currentPage: 1, 
                query: '', 
                totalPages: totalPages 
            });
        } else {
            const category = await categoryModel.find({});
            const products = await productModel.find({
                $and: [
                    { is_deleted: false },
                    {
                        $or: [
                            { name: { $regex: new RegExp(query, 'i') } },
                            { brand: { $regex: new RegExp(query, 'i') } }
                        ]
                    }
                ]
            }).populate('category');
            const totalProducts = await productModel.countDocuments({
                $and: [
                    { is_deleted: false },
                    {
                        $or: [
                            { name: { $regex: new RegExp(query, 'i') } },
                            { brand: { $regex: new RegExp(query, 'i') } }
                        ]
                    }
                ]
            });
            const totalPages = Math.ceil(totalProducts / 10); 
            console.log("products in search", products);
            res.render('admin/stocks', { 
                product: products, 
                category,
                currentPage: 1, 
                query: query, 
                totalPages: totalPages 
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const updateStock = async (req, res) => {
    try {
        for (const productId in req.body) {
            if (Object.hasOwnProperty.call(req.body, productId)) {
                const newStock = parseInt(req.body[productId]);
                console.log("newStock in stocks:", newStock);
                const updated = await productModel.findByIdAndUpdate(productId, { countInStock: newStock });
                console.log("updated in updatestocks:", updated);
            }
        }
        const products = await productModel.find();
        console.log("products in stock:", products);
        const category = await categoryModel.find({});
        const totalProducts = await productModel.countDocuments({}); 
        const totalPages = Math.ceil(totalProducts / 10); 

        const currentPage = 1;
        const query = ''; 

        res.render('admin/stocks', { product: products, category, totalPages: totalPages, currentPage: currentPage, query: query });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while updating stock" });
    }
};

const searchStock = async (req, res) => {
    try {
        const query = req.query.q || ''; 
        
        if (query === 'all') {
            const category = await categoryModel.find({});
            const products = await productModel.find({}).populate('category');
            const totalProducts = await productModel.countDocuments({});
            const totalPages = Math.ceil(totalProducts / 10); 
            console.log("products in search", products);
            return res.render('admin/stocks', { 
                product: products, 
                category,
                currentPage: 1, 
                query: '', 
                totalPages: totalPages 
            });
        } else {
            const category = await categoryModel.find({});
            const products = await productModel.find({
                $and: [
                    { is_deleted: false },
                    {
                        $or: [
                            { name: { $regex: new RegExp(query, 'i') } },
                            { brand: { $regex: new RegExp(query, 'i') } }
                        ]
                    }
                ]
            }).populate('category');
            const totalProducts = await productModel.countDocuments({
                $and: [
                    { is_deleted: false },
                    {
                        $or: [
                            { name: { $regex: new RegExp(query, 'i') } },
                            { brand: { $regex: new RegExp(query, 'i') } }
                        ]
                    }
                ]
            });
            const totalPages = Math.ceil(totalProducts / 10); 
            console.log("products in search", products);
            res.render('admin/stocks', { 
                product: products, 
                category,
                currentPage: 1, 
                query: query, 
                totalPages: totalPages 
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
 
module.exports = {
    loadProduct,
    addProductpage,
    addProduct,
    loadEdit,
    editProduct,
    loadProductPage,
    isProductInWishlist,
    loadShop,
    deleteProduct,
    restoreProduct,
    reviewProduct,
    searchProductView,
    loadMenShop,
    loadWomenShop,
    getStocks,
    updateStock,
    searchStock
}