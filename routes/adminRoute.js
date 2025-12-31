const express = require("express");
const adminRouter = express.Router(); 
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/adminAuth");

// Controllers
const adminController = require("../controllers/adminController");
const productController = require("../controllers/productController");
const categoryController = require("../controllers/categoryController");
const couponController = require("../controllers/couponController");
const offerController = require("../controllers/offerController");
const orderController = require("../controllers/orderController");
const salesReportController = require("../controllers/salesReportController");

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./public/productImages"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    extname && mimetype ? cb(null, true) : cb("Error: Images only!");
  },
});

// Middleware
adminRouter.use(express.json());
adminRouter.use(express.urlencoded({ extended: true }));
adminRouter.use(express.static("public"));
adminRouter.use((req, res, next) => {
  res.set("Cache-Control", "no-store,no-cache,must-revalidate,private");
  next();
});

// ========================= Admin Auth ===============================
adminRouter.route("/")
  .get(auth.isLogout, adminController.loadLogin)
  .post(adminController.verifyLogin);

adminRouter.get("/dashboard",auth.isLogin, adminController.getDashboard);

adminRouter
  .get("/best-selling", auth.isLogin, adminController.getBestSelling)
  .get("/chart", auth.isLogin, adminController.getChartData)
  .get("/logout", auth.isLogin, adminController.logout);

// ======================== Customer Management =======================
adminRouter.get("/customers", auth.isLogin, adminController.customersList);
adminRouter.patch("/users/:userId/block", auth.isLogin, adminController.blockUser);
adminRouter.patch("/users/:userId/unblock", auth.isLogin, adminController.unblockUser);

// ======================== Category Management ========================
adminRouter.route("/categories")
  .get(auth.isLogin, categoryController.loadCategory)
  .post(auth.isLogin, categoryController.createCategory);

adminRouter.route("/categories/:categoryId")
    .get(auth.isLogin, categoryController.editCategoryLoad)
    .patch(auth.isLogin, categoryController.updateCate)
    .delete(auth.isLogin, categoryController.deleteCategory)
    .put(auth.isLogin, categoryController.restoreCategory); 

// ======================== Product Management ==========================
adminRouter.get('/products',productController.loadProduct);
adminRouter.route("/add-product")
  .get(auth.isLogin, productController.addProductpage)
  .post(auth.isLogin, upload.array("images", 3), productController.addProduct);

adminRouter.get("/products/search", auth.isLogin, productController.searchProductView);
adminRouter.get("/products/edit",auth.isLogin, productController.loadEdit);
adminRouter.post("/edit-product",auth.isLogin, upload.array("images", 3), productController.editProduct);
adminRouter.post('/delete', auth.isLogin, productController.deleteProduct);
adminRouter.post('/restore', auth.isLogin, productController.restoreProduct);

// ========================== Stock Management ===========================
adminRouter.get("/stocks", auth.isLogin, productController.getStocks);
adminRouter.get("/stocks/search", auth.isLogin, productController.searchStock);
adminRouter.post("/stocks/update", auth.isLogin, productController.updateStock);

// ========================== Order Management ============================
adminRouter.get("/orders", auth.isLogin, orderController.loadorder);
adminRouter.get("/orders/details", auth.isLogin, orderController.loadorderdetails);
adminRouter.patch("/orders/:orderId/status", auth.isLogin, orderController.updateorder);
adminRouter.post("/orders/:orderId/cancel/accept", auth.isLogin, orderController.requestAccept);
adminRouter.post("/orders/:orderId/cancel/reject", auth.isLogin, orderController.requestCancel);

// ========================== Coupon Management ============================
adminRouter.get("/coupons/create", auth.isLogin, couponController.loadcreatecoupon);
adminRouter.route("/coupons")
  .get(auth.isLogin, couponController.listCoupons)
  .post(auth.isLogin, couponController.createCoupon);
adminRouter.delete("/coupons/togglecoupon", auth.isLogin, couponController.deleteCouponStatus);

// ========================== Category Offer Management ==========================
adminRouter.route("/category-offers")
  .get(auth.isLogin, offerController.loadCategoryOfferPage)
  .post(auth.isLogin, offerController.addCategoryOffer);

adminRouter.route("/category-offers/:id")
  .delete(auth.isLogin, offerController.deleteCategoryOffer)
  .patch(auth.isLogin, offerController.restoreCategoryOffer)
  .put(auth.isLogin, offerController.updateCategoryOffer);

adminRouter.get("/category-offers/create", auth.isLogin, offerController.loadAddCategoryOffer);
adminRouter.get("/category-offers/edit", auth.isLogin, offerController.loadEditCategoryOffer);

// ============================ Product Offer Management ==========================
adminRouter.route("/product-offers")
  .get(auth.isLogin, offerController.loadProductOfferPage)
  .post(auth.isLogin, offerController.addingProductOffer);

adminRouter.post("/product-offers/update",auth.isLogin, offerController.updateProductOffer);
adminRouter.patch("/product-offers/:id/block", auth.isLogin, offerController.deleteProductOffer);
adminRouter.patch("/product-offers/:id/unblock", auth.isLogin, offerController.restoreProductOffer);
adminRouter.get("/product-offers/create", auth.isLogin, offerController.loadAddProductOffer);
adminRouter.get("/product-offers/edit", auth.isLogin, offerController.loadEditProductOffer);

// ============================ Sales Report Management ==============================
adminRouter.get("/sales-reports", auth.isLogin, salesReportController.loadSalesReport);
adminRouter.post("/sales-reports/filter", auth.isLogin, salesReportController.filterReport);
adminRouter.post("/sales-reports/custom", auth.isLogin, salesReportController.filterCustomDateOrder);

// ============================== Catch-All ===========================================
adminRouter.use("*", (req, res) => {
  res.redirect("/admin");
});

module.exports = adminRouter;