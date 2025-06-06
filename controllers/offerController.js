const category = require("../models/categoryModel")
const product = require("../models/productModel");
const categoryOffer = require("../models/categoryOfferModel");
const productOffer = require("../models/productOfferModel");
const CategoryOfferModel = require("../models/categoryOfferModel");
const ProductOfferModel = require("../models/productOfferModel");
const ObjectId = require("mongoose").Types.ObjectId

const loadCategoryOfferPage = async(req, res, next)=>{
 try {

  const categoryOfferData = await CategoryOfferModel.aggregate([
    {
      $lookup: {
        from: "categories", 
        localField: "categoryOffer.category", 
        foreignField: "_id", 
        as: "categoryDetails" 
      }
    },
    {
      $unwind: "$categoryDetails" 
    }
  ])  
  res.render("admin/categoryOffer",{categoryOfferData})
  
 } catch (error) {
  console.error("Error in loadCategoryOfferPage: ", error);
  next(error)
 }
               
}

const loadProductOfferPage = async(req, res, next)=>{
  try {
    const productOfferData = await productOffer.aggregate([
      {
        $lookup: {
          from: "products", 
          localField: "productOffer.product", 
          foreignField: "_id", 
          as: "productDetails" 
        }
      },
      {
        $unwind: "$productDetails" 
      },
      {
        $project: {
          "_id": 1, 
          "name": 1, 
          "startingDate": 1, 
          "endingDate": 1, 
          "productOffer": 1, 
          "productDetails.id": 1, 
          "productDetails.brand": 1,
          "productDetails.productName": 1, 
          "productDetails.offerStatus": 1,
          
        }
      }
    ])
  
    res.render("admin/productOffer",{productOfferData});
    
  } catch (error) {
    console.error("Error in loadProductOfferPage: ", error);
    next(error);
  }
}

const loadAddProductOffer = async(req, res, next)=>{
try {
  const productData = await product.find({},{name:1}).lean(); 
  console.log("productData",productData);

  for (let i = 0; i < productData.length; i++) {
    const productId = productData[i]._id;
    
    const offer = await productOffer.findOne({ 'productOffer.product': productId });

    if (offer) {
        productData[i].offerStatus = true;
    } else {
      productData[i].offerStatus = false;

    }
}
  res.render("admin/addProductOffer",{productData});
  
} catch (error) {
  console.error("Error in loadAddProductOffer: ",error);
  next(error)
}
}

const loadAddCategoryOffer = async(req, res, error)=>{
    try {
      const categoryData = await category.find({}, { name: 1 }).lean();

      for (let i = 0; i < categoryData.length; i++) {
      const categoryId = categoryData[i]._id;
      
      const offer = await categoryOffer.findOne({ 'categoryOffer.category': categoryId });
  
      if (offer) {
          
          categoryData[i].offerStatus = true
      } else {
          
          categoryData[i].offerStatus = false;
      }
  }
    res.render("admin/addCategoryOffer",{categoryData})
      
    } catch (error) {
      console.error("Error in loadAddCateogoryOffer: ",error);
      next(error)  
    }
}

const addingProductOffer = async (req, res, next) => {
  try {
    
    const { name, startingDate, endingDate, products, productDiscount } = req.body; 

    let discount = parseFloat(productDiscount);

    if (isNaN(discount)) {
      throw new Error('Invalid discount value');
    }
   
    const newProductOffer = new productOffer({
      name,
      startingDate,
      endingDate,
      productOffer: {
        product:products,
        discount,
      },
    });

    await newProductOffer.save();
    res.redirect("/admin/product-offers")

  } catch (error) {
    console.error('Error in addingproduct offer:', error);
    next(error)
  }
};

const addCategoryOffer = async (req, res,  next) => {
  try {

    const { name, startingDate, endingDate, category, categoryDiscount } = req.body;
    
    let discount = parseFloat(categoryDiscount);
    
    if (isNaN(discount)) {
      throw new Error('Invalid category discount value');
    }

    const newCategoryOffer = new CategoryOfferModel({
      name,
      startingDate,
      endingDate,
      categoryOffer: {
        category,
        discount,
      },
    });

    await newCategoryOffer.save();
    res.redirect("/admin/category-offers/create")
  } catch (error) {
    console.error('Error saving addcategory offer:', error);
    next(error);
  }
};

const deleteProductOffer = async (req, res) => {
  try {
    const prodId = req.params.id;
    console.log("productid in delete", prodId);
    const productOffer = await ProductOfferModel.findById(prodId);
    if (!productOffer) {
      console.log("Product offer not found for ID:", prodId);
      return res.status(404).json({ message: "Product offer not found", success: false });
    }

    const updatedOffer = await ProductOfferModel.findByIdAndUpdate(
      prodId,
      { $set: { 'productOffer.offerStatus': false } }, 
      { new: true, runValidators: true }
    );

    console.log("productOfferModel:", updatedOffer.productOffer.offerStatus);
    return res.status(200).json({ message: "Product offer deleted successfully", success: true });
  } catch (error) {
    console.error("Error in deleteProductOffer:", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

const restoreProductOffer = async (req, res) => {
  try {
    const prodId = req.params.id;
    console.log("productid in restore:", prodId);
    const productOffer = await ProductOfferModel.findById(prodId);
    if (!productOffer) {
      return res.status(404).json({ message: "Product offer not found", success: false });
    }

    const updatedOffer = await ProductOfferModel.findByIdAndUpdate(
      prodId,
      { $set: { 'productOffer.offerStatus': true } }, 
      { new: true, runValidators: true }
    );

    console.log("productOfferModel:", updatedOffer.productOffer.offerStatus);
    return res.status(200).json({ message: "Product offer restored successfully", success: true });
  } catch (error) {
    console.error("Error in restoreProductOffer:", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

const updateCategoryOffer = async (req, res, next) => {
  try {
    const offerId = req.params.id;
    const { name, startingDate, endingDate, category, categoryDiscount } = req.body;

    if (!name || !startingDate || !endingDate || !category || !categoryDiscount) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const updateOffer = await categoryOffer.updateOne(
      { _id: new ObjectId(offerId) },
      {
        $set: {
          name,
          startingDate: new Date(startingDate),
          endingDate: new Date(endingDate),
          'categoryOffer.discount': Number(categoryDiscount),
          'categoryOffer.category': new ObjectId(category)
        }
      }
    );

    if (updateOffer.modifiedCount === 1) {
      return res.status(200).json({ 
        success: true, 
        message: 'Category offer updated successfully',
        redirect: '/admin/category-offers'
      });
    } else {
      return res.status(404).json({ 
        success: false, 
        message: 'Category offer not found or no changes made',
        redirect: '/admin/category-offers'
      });
    }
  } catch (error) {
    console.error("Error in updateCategoryOffer:", error);
    next(error);
  }
};

const deleteCategoryOffer = async (req, res, next) => {
  try {
    const offerId = req.params.id;
    
    const result = await categoryOffer.findByIdAndUpdate(
      new ObjectId(offerId),
      { is_active: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category offer not found',
        redirect: '/admin/category-offers'
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Category offer deactivated successfully',
      redirect: '/admin/category-offers'
    });
  } catch (error) {
    console.error("Error in deleteCategoryOffer:", error);
    next(error);
  }
};

const restoreCategoryOffer = async (req, res, next) => {
  try {
    const offerId = req.params.id;
    
    const result = await categoryOffer.findByIdAndUpdate(
      new ObjectId(offerId),
      { is_active: true },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category offer not found',
        redirect: '/admin/category-offers'
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Category offer restored successfully',
      redirect: '/admin/category-offers'
    });
  } catch (error) {
    console.error("Error in restoreCategoryOffer:", error);
    next(error);
  }
};

const loadEditProductOffer = async (req, res, next)=>{
  try {
    const offerId = req.query.id;
    const receivedProductId = req.query.prdId;

    const prdOfferData = await productOffer.findById(offerId).lean();
    const productData = await product.find({},{name:1}).lean();
    const thatProduct = await product.findById(receivedProductId).lean()
    const name = thatProduct.name
    prdOfferData.productOffer.product.name = name;

    for (let i = 0; i < productData.length; i++) {
      const productId = productData[i]._id;
      
      const offer = await productOffer.findOne({ 'productOffer.product': productId });
  
      if (offer) {
         if(productData[i]._id.toString() === receivedProductId.toString()){
 
             productData[i].offerStatus = false
         }else{
             productData[i].offerStatus = true
         }
          
      } else {
        
          productData[i].offerStatus = false
      }
  }
    res.render("admin/editProductOffer",{prdOfferData, productData}) 
  } catch (error) {
    console.error("Error in loadEditProductOffer : ",error);
    next(error); 
  }
}

const loadEditCategoryOffer = async(req, res, next)=>{
try {
  const categoryData = await category.find({}, { name: 1 }).lean();
  const offerId = req.query.id;
  const receivedCatId = req.query.catId
  const offerDetails = await categoryOffer.findById(offerId).lean()
  const thatCategory = await category.findById(receivedCatId).lean()
  const name = thatCategory.name;
  offerDetails.categoryOffer.categoryName = name;

  for (let i = 0; i < categoryData.length; i++) {
  const categoryId = categoryData[i]._id;
  
  const offer = await categoryOffer.findOne({ 'categoryOffer.category': categoryId });

  if (offer) {
      if(categoryData[i]._id.toString() === receivedCatId.toString()){
        categoryData[i].offerStatus = false;
      }else{
        categoryData[i].offerStatus = true
      }
     
  } else { 
      categoryData[i].offerStatus = false;
  }
}
  res.render("admin/editCategoryOffer",{categoryData, offerDetails})
  
} catch (error) {
  console.error("Error in loadEditCategoryOffer: ", error);
  next(error)
}
}

const updateProductOffer = async(req, res, next)=>{
  try {

    const offerId = req.query.offerId
    const { name, startingDate, endingDate, product, discount } = req.body
    const updateOffer = await productOffer.updateOne(
      {_id:new ObjectId(offerId)},
      {
        $set: {
          "name": name,
          "startingDate": new Date(startingDate), 
          "endingDate": new Date(endingDate), 
          "productOffer.discount": discount,
          "productOffer.product": new ObjectId(product)
        }
      }
  )

  if(updateOffer.modifiedCount === 1){
        res.redirect('/admin/product-offers')
  }else{
        console.log("offer is not updated")
        res.redirect("/admin/product-offers")
  }                                            
  } catch (error) {
    console.error("Error in updateProductOffer: ", error);
    next(error);
  }
}

module.exports = {
  loadCategoryOfferPage,
  loadProductOfferPage,
  loadAddProductOffer,
  loadAddCategoryOffer,
  restoreProductOffer,
  addingProductOffer,
  addCategoryOffer,
  deleteProductOffer,
  loadEditProductOffer,
  loadEditCategoryOffer,
  updateProductOffer,
  updateCategoryOffer,
  deleteCategoryOffer,
  restoreCategoryOffer
}