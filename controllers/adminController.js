const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const orderModel = require("../models/orderModel")
const productModel = require("../models/productModel")
const bestSelling = require("../controllers/bestSelling");

const loadLogin = async (req, res) => {
    try {
        return res.render('admin/login');
    } catch (error) {
        console.error("Error in loadLogin:", error.message);
        return res.status(500).send('Internal Server Error');
    }
};

const verifyLogin = async(req,res)=>{
    try{
     const email = req.body.email;
     const password = req.body.password;
     const userData = await User.findOne({email:email});

     if(userData){
        const passwordMatch = await bcrypt.compare(password,userData.password);

            if(passwordMatch){
                if(userData.is_admin === 0){
                    res.render('admin/login',{message:"Email and password is incorrect"});
                }
                else{
                    req.session.user_id = userData._id;
                    res.redirect('/admin/dashboard');
                }
            }
            else{
                res.render('admin/login',{message:"Email and password is incorrect"});
            }
       }
      else{
        res.render('admin/login',{message:"Email and password is incorrect"});
     }

    } catch (error){
        console.log(error.message);
    }
}

const getDashboard = async(req,res)=>{
try{
  const userData = await User.findById({_id:req.session.user_id});
  const users = await User.find();
  const products = await productModel.find();
  const usersCount = await User.find().countDocuments();
  const productsCount = await productModel.find().countDocuments();

  const confirmedOrders = await orderModel.aggregate([
    { $match: { status: "Pending" } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalRevenue: { $sum: "$billTotal" },
      },
    },
  ]).exec();

  const ordersCount = await orderModel.find({
    status: "Pending",
  }).countDocuments();

  // best selling
  let bestSellingProducts = await bestSelling.getBestSellingProducts();
  let bestSellingBrands = await bestSelling.getBestSellingBrands();
  let bestSellingCategories = await bestSelling.getBestSellingCategories();

  res.render("admin/home", {
    users,
    products,
    usersCount,
    ordersCount,
    productsCount,
    bestSellingBrands,
    bestSellingProducts,
    bestSellingCategories,
    totalRevenue: confirmedOrders[0] ? confirmedOrders[0].totalRevenue : 0,
    admin: userData,
  });
    } catch (error){
        console.log(error.message);
    }
}

const getBestSelling = async(req,res)=>{
  try{
    const userData = await User.findById({_id:req.session.user_id});
    const users = await User.find();
    const products = await productModel.find();
    const usersCount = await User.find().countDocuments();
    const productsCount = await productModel.find().countDocuments();
  
    const confirmedOrders = await orderModel.aggregate([
      { $match: { status: "Pending" } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalRevenue: { $sum: "$billTotal" },
        },
      },
    ]).exec();
  
    const ordersCount = await orderModel.find({
      status: "Pending",
    }).countDocuments();
  
    // best selling
    let bestSellingProducts = await bestSelling.getBestSellingProducts();
    let bestSellingBrands = await bestSelling.getBestSellingBrands();
    let bestSellingCategories = await bestSelling.getBestSellingCategories();
  
    res.render("admin/homeTwo", {
      users,
      products,
      usersCount,
      ordersCount,
      productsCount,
      bestSellingBrands,
      bestSellingProducts,
      bestSellingCategories,
      totalRevenue: confirmedOrders[0] ? confirmedOrders[0].totalRevenue : 0,
      admin: userData,
    });
      } catch (error){
          console.log(error.message);
      }
}

const getChartData = async(req,res)=>{
  try {
    let timeBaseForSalesChart = req.query.salesChart;
    let timeBaseForOrderNoChart = req.query.orderChart;
    let timeBaseForOrderTypeChart = req.query.orderType;
    let timeBaseForCategoryBasedChart = req.query.categoryChart;

    function getDatesAndQueryData(timeBaseForChart, chartType) {
      let startDate, endDate;

      let groupingQuery, sortQuery;

      if (timeBaseForChart === "yearly") {
        startDate = new Date(new Date().getFullYear(), 0, 1);

        endDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);

        groupingQuery = {
          _id: {
            month: { $month: { $toDate: "$createdAt" } },
            year: { $year: { $toDate: "$createdAt" } },
          },
          totalSales: { $sum: "$billTotal" },
          totalOrder: { $sum: 1 },
        };

        sortQuery = { "_id.year": 1, "_id.month": 1 };
      }

      if (timeBaseForChart === "weekly") {
        startDate = new Date();

        endDate = new Date();

        const timezoneOffset = startDate.getTimezoneOffset();

        startDate.setDate(startDate.getDate() - 6);

        startDate.setUTCHours(0, 0, 0, 0);

        startDate.setUTCMinutes(startDate.getUTCMinutes() + timezoneOffset);

        endDate.setUTCHours(0, 0, 0, 0);

        endDate.setDate(endDate.getDate() + 1);

        endDate.setUTCMinutes(endDate.getUTCMinutes() + timezoneOffset);

        groupingQuery = {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalSales: { $sum: "$billTotal" },
          totalOrder: { $sum: 1 },
        };

        sortQuery = { _id: 1 };
      }

      if (timeBaseForChart === "daily") {
        startDate = new Date();
        endDate = new Date();

        const timezoneOffset = startDate.getTimezoneOffset();

        startDate.setUTCHours(0, 0, 0, 0);

        endDate.setUTCHours(0, 0, 0, 0);

        endDate.setDate(endDate.getDate() + 1);

        startDate.setUTCMinutes(startDate.getUTCMinutes() + timezoneOffset);

        endDate.setUTCMinutes(endDate.getUTCMinutes() + timezoneOffset);

        groupingQuery = {
          _id: { $hour: "$createdAt" },
          totalSales: { $sum: "$totalPrice" },
          totalOrder: { $sum: 1 },
        };

        sortQuery = { "_id.hour": 1 };
      }

      if (chartType === "sales") {
        return { groupingQuery, sortQuery, startDate, endDate };
      } else if (chartType === "orderType") {
        return { startDate, endDate };
      } else if (chartType === "categoryBasedChart") {
        return { startDate, endDate };
      } else if (chartType === "orderNoChart") {
        return { groupingQuery, sortQuery, startDate, endDate };
      }
    }

    const salesChartInfo = getDatesAndQueryData(
      timeBaseForSalesChart,
      "sales"
    );

    const orderChartInfo = getDatesAndQueryData(
      timeBaseForOrderTypeChart,
      "orderType"
    );

    const categoryBasedChartInfo = getDatesAndQueryData(
      timeBaseForCategoryBasedChart,
      "categoryBasedChart"
    );

    const orderNoChartInfo = getDatesAndQueryData(
      timeBaseForOrderNoChart,
      "orderNoChart"
    );

    let salesChartData = await orderModel.aggregate([
      {
        $match: {
          $and: [
            {
              createdAt: {
                $gte: salesChartInfo.startDate,
                $lte: salesChartInfo.endDate,
              },
              status: {
                $nin: ["Cancelled", "Failed", "Refunded"],
              },
            },
            {
              paymentStatus: {
                $nin:['Pending', 'Processing','Canceled', 'Returned'],
              },
            },
          ],
        },
      },

      {
        $group: salesChartInfo.groupingQuery,
      },
      {
        $sort: salesChartInfo.sortQuery,
      },
    ]).exec();

    let orderNoChartData = await orderModel.aggregate([
      {
        $match: {
          $and: [
            {
              createdAt: {
                $gte: orderNoChartInfo.startDate,
                $lte: orderNoChartInfo.endDate,
              },
              status: {
                $nin: ['Canceled', 'Returned'],
              },
            },
            {
              paymentStatus: {
                $nin: ["Pending", "Failed", "Refunded", "Cancelled"],
              },
            },
          ],
        },
      },

      {
        $group: orderNoChartInfo.groupingQuery,
      },
      {
        $sort: orderNoChartInfo.sortQuery,
      },
    ]).exec();

    let orderChartData = await orderModel.aggregate([
      {
        $match: {
          $and: [
            {
              createdAt: {
                $gte: orderChartInfo.startDate,
                $lte: orderChartInfo.endDate,
              },
              status: {
                $nin: ['Pending', 'Processing','Canceled', 'Returned'],
              },
            },
            {
              paymentStatus: {
                $nin: ["Pending", "Refunded", "Cancelled","Failed"],
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          totalOrder: { $sum: 1 },
        },
      },
    ]).exec();

    console.log(orderChartData);

    let categoryWiseChartData = await orderModel.aggregate([
      {
        $match: {
          $and: [
            {
              createdAt: {
                $gte: categoryBasedChartInfo.startDate,
                $lte: categoryBasedChartInfo.endDate,
              },
              status: {
                $nin: ['Pending', 'Processing','Canceled', 'Returned'],
              },
            },
            {
              paymentStatus: {
                $nin: ['Pending', 'Failed'],
              },
            },
          ],
        },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $unwind: "$productInfo",
      },
      {
        $replaceRoot: {
          newRoot: "$productInfo",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "catInfo",
        },
      },
      {
        $addFields: {
          categoryInfo: { $arrayElemAt: ["$catInfo", 0] },
        },
      },
      {
        $project: {
          catInfo: 0,
        },
      },
      {
        $addFields: {
          catName: "$categoryInfo.name",
        },
      },
      {
        $group: {
          _id: "$catName",
          count: { $sum: 1 },
        },
      },
    ]).exec();

    let saleChartInfo = {
      timeBasis: timeBaseForSalesChart,
      data: salesChartData,
    };

    let orderTypeChartInfo = {
      timeBasis: timeBaseForOrderTypeChart,
      data: orderChartData,
    };

    let categoryChartInfo = {
      timeBasis: timeBaseForOrderTypeChart,
      data: categoryWiseChartData,
    };

    let orderQuantityChartInfo = {
      timeBasis: timeBaseForOrderNoChart,
      data: orderNoChartData,
    };

    return res
      .status(200)
      .json({
        saleChartInfo,
        orderTypeChartInfo,
        categoryChartInfo,
        orderQuantityChartInfo,
      });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

const logout = async(req,res)=>{
    try{
       req.session.destroy();
       res.redirect('/admin/');
    } catch (error){
        console.log(error.message); 
    }
}

const customersList = async(req,res)=>{
    try{
      const usersData = await User.find({is_admin:0})
      res.render('admin/customers',{users:usersData});
    }catch(error){
        console.log(error.message);
    }
}

const blockUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.block === '1') {
            return res.status(400).json({ message: 'User is already blocked' });
        }
        await User.findByIdAndUpdate(userId, { block: '1' }, { new: true });
        res.status(200).json({ message: 'User blocked successfully' });
    } catch (error) {
        console.error('Error in blockUser:', error.message);
        res.status(500).json({ message: 'Server error while blocking user' });
    }
};

const unblockUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.block === '0') {
            return res.status(400).json({ message: 'User is already unblocked' });
        }
        await User.findByIdAndUpdate(userId, { block: '0' }, { new: true });
        res.status(200).json({ message: 'User unblocked successfully' });
    } catch (error) {
        console.error('Error in unblockUser:', error.message);
        res.status(500).json({ message: 'Server error while unblocking user' });
    }
};

module.exports = {
    loadLogin,
    verifyLogin,
    getDashboard,
    getBestSelling,
    logout,
    customersList,
    blockUser,
    unblockUser,
    getChartData
}