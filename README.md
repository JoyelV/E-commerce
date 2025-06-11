# E-commerce Website
This is a full-stack E-commerce website built using **Node.js**, **Express.js**, and **MongoDB** for the backend, with **EJS**, **HTML**, **CSS**, and **JavaScript** for the frontend. The application supports user and admin functionalities, including product browsing, cart management, order processing, coupon and offer systems, and sales reporting.

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Dependencies](#dependencies)
- [License](#license)

## Features
- **User Features:**
  - User registration, login, and Google OAuth authentication.
  - Product browsing, filtering, and detailed product views.
  - Cart and wishlist management.
  - Address management and order placement with Razorpay payment integration.
  - Coupon application and product/category-specific offers.
  - Order history, invoice generation, and user profile management.
  - Email verification and password reset functionality.

- **Admin Features:**
  - Manage products, categories, and stocks.
  - Create and manage coupons, product offers, and category offers.
  - View and update order statuses.
  - Generate and view sales reports.
  - Manage customer accounts.

- **Security:**
  - Password hashing with `bcryptjs`.
  - JWT-based authentication for secure sessions.
  - Middleware for user and admin authentication.
  - Secure OTP generation for verification.

## Technologies Used
- **Backend:**
  - Node.js
  - Express.js
  - MongoDB (with Mongoose ORM)
  - Razorpay for payments
  - Nodemailer for email notifications
  - Passport.js for Google OAuth authentication

- **Frontend:**
  - EJS (Embedded JavaScript) templating
  - HTML, CSS, JavaScript
  - Responsive design for user and admin views

- **Other Libraries:**
  - `bcryptjs` for password hashing
  - `jsonwebtoken` for authentication
  - `multer` and `express-fileupload` for file uploads
  - `easyinvoice` for generating invoices
  - `express-validator` for input validation

## Project Structure
```
├── public/                   # Static assets (images, CSS, JS)
├── routes/                   # Route definitions
│   ├── adminRoute.js         # Admin-related routes
│   ├── userRoute.js          # User-related routes
├── middleware/               # Custom middleware
│   ├── adminAuth.js          # Admin authentication middleware
│   ├── userAuth.js           # User authentication middleware
├── models/                   # MongoDB schemas
│   ├── addressModel.js       # Address schema
│   ├── cartModel.js          # Cart schema
│   ├── categoryModel.js      # Category schema
│   ├── categoryOfferModel.js # Category offer schema
│   ├── couponModel.js        # Coupon schema
│   ├── orderModel.js         # Order schema
│   ├── productModel.js       # Product schema
│   ├── productOfferModel.js  # Product offer schema
│   ├── reviewModel.js        # Review schema
│   ├── userModel.js          # User schema
│   ├── walletModel.js        # Wallet schema
│   ├── wishlistModel.js      # Wishlist schema
├── config/                   # Configuration files
│   ├── config.js             # General configuration
│   ├── passportConfig.js     # Passport.js configuration
├── controllers/              # Business logic
│   ├── adminController.js    # Admin-related controllers
│   ├── cartController.js     # Cart operations
│   ├── categoryController.js # Category management
│   ├── checkoutController.js # Checkout process
│   ├── couponController.js   # Coupon management
│   ├── offerController.js    # Offer management
│   ├── orderController.js    # Order processing
│   ├── productController.js  # Product management
│   ├── salesReportController.js # Sales report generation
│   ├── userController.js     # User-related controllers
│   ├── wishlistController.js # Wishlist operations
├── views/                    # EJS templates
│   ├── admin/                # Admin views
│   │   ├── adminassets/      # Admin static assets
│   │   ├── 404.ejs           # Admin 404 page
│   │   ├── addCategoryOffer.ejs
│   │   ├── addProduct.ejs
│   │   ├── addProductOffer.ejs
│   │   ├── adminorderdetails.ejs
│   │   ├── category.ejs
│   │   ├── categoryOffer.ejs
│   │   ├── createCoupon.ejs
│   │   ├── customers.ejs
│   │   ├── editCategory.ejs
│   │   ├── editCategoryOffer.ejs
│   │   ├── editProduct.ejs
│   │   ├── editProductOffer.ejs
│   │   ├── error.ejs
│   │   ├── forget.ejs
│   │   ├── forgetPassword.ejs
│   │   ├── login.ejs
│   │   ├── orders.ejs
│   │   ├── productOffer.ejs
│   │   ├── salesReport.ejs
│   │   ├── stocks.ejs
│   │   ├── viewProduct.ejs
│   └── users/                # User views
│       ├── 404.ejs           # User 404 page
│       ├── addAddress.ejs
│       ├── cart.ejs
│       ├── checkout.ejs
│       ├── editAddress.ejs
│       ├── emailVerified.ejs
│       ├── error.ejs
│       ├── forget.ejs
│       ├── forgetPassword.ejs
│       ├── home.ejs
│       ├── invoice.ejs
│       ├── landingPage.ejs
│       ├── login.ejs
│       ├── manage.ejs
│       ├── mens.ejs
│       ├── orderconfirmed.ejs
│       ├── orderdetails.ejs
│       ├── productDetails.ejs
│       ├── referrals.ejs
│       ├── registration.ejs
│       ├── resetPassword.ejs
│       ├── shop.ejs
│       ├── style.css
│       ├── success.ejs
│       ├── userProfile.ejs
│       ├── verification.ejs
│       ├── verifyOTP.ejs
│       ├── wishlist.ejs
│       ├── women.ejs
├── .env                      # Environment variables
├── .gitignore                # Git ignore file
├── index.js                  # Application entry point
├── package-lock.json         # Dependency lock file
├── package.json              # Project metadata and dependencies
├── README.md                 # Project documentation
```

## Installation
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ums
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and configure the following variables:
   ```env
   PORT=3000
   MONGODB_URI=<your-mongodb-connection-string>
   JWT_SECRET=<your-jwt-secret>
   RAZORPAY_KEY_ID=<your-razorpay-key-id>
   RAZORPAY_KEY_SECRET=<your-razorpay-key-secret>
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   NODEMAILER_EMAIL=<your-email>
   NODEMAILER_PASS=<your-email-password>
   SESSION_SECRET=<your-session-secret>
   ```

4. **Start the application:**
   ```bash
   npm start
   ```

5. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`.

## Usage
- **User Flow:**
  - Register or log in (via email or Google OAuth).
  - Browse products, add to cart or wishlist, and apply coupons/offers.
  - Proceed to checkout, add addresses, and complete payment via Razorpay.
  - View order history, manage profile, and download invoices.

- **Admin Flow:**
  - Log in to the admin panel (`/admin`).
  - Manage products, categories, coupons, and offers.
  - View and update customer orders and generate sales reports.

## Environment Variables
The `.env` file should include:
- `PORT`: Port for the server (default: 3000).
- `MONGODB_URI`: MongoDB connection string.
- `JWT_SECRET`: Secret for JWT token generation.
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`: Razorpay API credentials.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Google OAuth credentials.
- `NODEMAILER_EMAIL` and `NODEMAILER_PASS`: Email credentials for Nodemailer.
- `SESSION_SECRET`: Secret for session management.

## Scripts
- `npm start`: Runs the application with `nodemon` for development.
- `npm run build`: Placeholder script (no build step required for EJS).
- `npm run vercel-build`: Installs dependencies for Vercel deployment.

## Dependencies
Key dependencies include:
- `express`: Web framework for Node.js
- `mongoose`: MongoDB object modeling
- `ejs`: Templating engine
- `razorpay`: Payment gateway integration
- `passport` and `passport-google-oauth20`: Authentication
- `nodemailer`: Email notifications
- `bcryptjs` and `jsonwebtoken`: Security
- `easyinvoice`: Invoice generation
- Full list available in `package.json`.

## License
This project is licensed under the ISC License.
---