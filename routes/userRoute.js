const express = require("express");
const userRouter = express.Router();

// Middlewares
const auth = require("../middleware/userAuth");

// Controllers
const userController = require("../controllers/userController");
const productController = require("../controllers/productController");
const cartController = require("../controllers/cartController");
const checkoutController = require("../controllers/checkoutController");
const wishlistController = require("../controllers/wishlistController");

// Body parsing middleware
userRouter.use(express.json());
userRouter.use(express.urlencoded({ extended: true }));
// Static files
userRouter.use(express.static('public'));

// Disable caching
userRouter.use((req, res, next) => {
  res.set('Cache-Control', 'no-store,no-cache,must-revalidate,private');
  next();
});

// -------------------- Authentication Routes --------------------
userRouter.route('/register')
  .get(auth.isLogout, userController.loadRegister)
  .post(userController.insertUser);

userRouter.route('/verify-otp')
  .get(auth.isLogout, userController.loadOtp)
  .post(userController.getOtp);

userRouter.post('/resend-otp', userController.resendOtp);
userRouter.get(['/', '/landPage'], auth.isLogout, userController.loadLandPage);

userRouter.route('/login')
  .get(auth.isLogout, userController.loginLoad)
  .post(userController.verifyLogin);

userRouter.get('/logout', auth.isLogin, userController.userLogout);

// -------------------- Product Routes --------------------
userRouter.get('/home', userController.loadHome);
userRouter.get('/shop', productController.loadShop);
userRouter.get('/mens', productController.loadMenShop);
userRouter.get('/women', productController.loadWomenShop);

userRouter.route('/product-details')
  .get(productController.loadProductPage)
  .post(auth.isLogin, productController.reviewProduct);

// -------------------- Password Routes --------------------
userRouter.route('/forgot-password')
  .get(auth.isLogout, userController.forgetPasswordLoad)
  .post(userController.resetPassword);

userRouter.route('/forgot')
  .get(auth.isLogout, userController.forgetLoad)
  .post(userController.forgetverify);

userRouter.post('/reset-password', userController.resetPassword);

// -------------------- Profile & Address --------------------
userRouter.route('/user-profile')
  .get(auth.isLogin, userController.loadUserProfile)
  .post(auth.isLogin, userController.editProfile);

userRouter.route('/add-address')
  .get(auth.isLogin, userController.loadAddAddress)
  .post(auth.isLogin, userController.addAddress);

userRouter.route('/edit-address')
  .get(auth.isLogin, userController.loadEditAddress)
  .post(auth.isLogin, userController.editAddress);

userRouter.post('/delete-address', auth.isLogin, userController.deleteAddress);

// -------------------- Cart --------------------
userRouter.get('/cart', auth.isLogin, cartController.loadAndShowCart);
userRouter.get('/cart/add-coupon', auth.isLogin, cartController.addCouponToCart);
userRouter.get('/cart/remove-coupon', auth.isLogin, cartController.removeCouponFromCart);
userRouter.post('/cart/add', auth.isLogin, cartController.addTocart);
userRouter.post('/cart/increase', auth.isLogin, cartController.increaseQuantity);
userRouter.post('/cart/decrease', auth.isLogin, cartController.decreaseQuantity);
userRouter.post('/cart/delete', auth.isLogin, cartController.deleteCart);

// -------------------- Checkout --------------------
userRouter.route('/checkout')
  .get(auth.isLogin, checkoutController.loadCheckout)
  .post(auth.isLogin, checkoutController.postCheckout);

userRouter.post('/checkout/update-payment', auth.isLogin, checkoutController.updatepaymentStatus);
userRouter.post('/checkout/repay', auth.isLogin, checkoutController.repayAmountNow);

// -------------------- Orders --------------------
userRouter.get('/order-confirmed', auth.isLogin, checkoutController.loadOrderConfirmed);
userRouter.get('/order-details', auth.isLogin, checkoutController.loadOrderDetails);

userRouter.post('/order/cancel', auth.isLogin, userController.cancelOrder);
userRouter.post('/order/return', auth.isLogin, userController.returnOrder);

// -------------------- Wishlist --------------------
userRouter.get('/wishlist', auth.isLogin, wishlistController.loadWishlist);
userRouter.get('/wishlist/add', auth.isLogin, wishlistController.addToWishlist);
userRouter.get('/wishlist/remove', auth.isLogin, wishlistController.removeWishlist);

// -------------------- Referrals --------------------
userRouter.get('/referrals', auth.isLogin, userController.getReferrals);
userRouter.post('/wallet/reward-referral', auth.isLogin, userController.rewardReferralToWallet);

// -------------------- Invoice --------------------
userRouter.get('/invoice', auth.isLogin, userController.loadInvoice);
userRouter.get('/invoice/pdf', auth.isLogin, checkoutController.invoice);

// -------------------- Error Handling --------------------
userRouter.use((err, req, res, next) => {
  console.error("Original Error:", err);
  res.status(500).send(`Something went wrong! Error: ${err.message}`);
});

module.exports = userRouter; 
