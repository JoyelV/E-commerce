const order = require("../models/orderModel");
const user = require("../models/userModel");
const product = require("../models/productModel");

const loadSalesReport = async (req, res, next) => {
  try {
    const salesData = await order.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $sort: { orderDate: -1 } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productNew",
        },
      },
      { $unwind: "$productNew" },
      { $match: { status: "Delivered" } },
      {
        $project: {
          oId: 1,
          "user.name": 1,
          "user._id": 1,
          "productNew.name": 1,
          "productNew.price": 1,
          "productNew.discountPrice": 1,
          billTotal: 1,
          orderDate: 1,
          paymentMethod: 1,
          coupon: 1,
          "items.productPrice": 1,
          status: 1,
          "items.quantity": 1,
        },
      },
    ]);

    // Calculate metrics
    const totalCustomers = [...new Set(salesData.map((sale) => sale.user._id.toString()))].length;
    const totalOrders = [...new Set(salesData.map((sale) => sale.oId.toString()))].length;
    const totalQuantity = salesData.reduce((sum, sale) => sum + sale.items.quantity, 0);
    const totalOrderValue = salesData.reduce((sum, sale) => sum + sale.billTotal, 0);

    res.render("admin/salesReport", {
      salesData,
      totalCustomers,
      totalOrders,
      totalQuantity,
      totalOrderValue,
      timePeriod: "all",
      startingDate: null,
      endingDate: null,
    });
  } catch (error) {
    console.error("Error in loadSalesReport: ", error);
    next(error);
  }
};

const filterReport = async (req, res, next) => {
  try {
    const receivedData = req.body.timePeriod;
    let startDate, endDate;

    if (receivedData === "week") {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - startDate.getDay());

      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    } else if (receivedData === "month") {
      startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
    } else if (receivedData === "year") {
      startDate = new Date();
      startDate.setMonth(0);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date();
      endDate.setMonth(11);
      endDate.setDate(31);
      endDate.setHours(23, 59, 59, 999);
    } else if (receivedData === "day") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setDate(today.getDate() + 1);
    } else if (receivedData === "all") {
      startDate = null;
      endDate = null;
    } else {
      throw new Error("Invalid time period");
    }

    let salesData;

    const basePipeline = [
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $sort: { orderDate: -1 } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productNew",
        },
      },
      { $unwind: "$productNew" },
      { $match: { status: "Delivered" } },
      {
        $project: {
          oId: 1,
          "user.name": 1,
          "user._id": 1,
          "productNew.name": 1,
          "productNew.price": 1,
          "productNew.discountPrice": 1,
          billTotal: 1,
          orderDate: 1,
          paymentMethod: 1,
          coupon: 1,
          "items.productPrice": 1,
          status: 1,
          "items.quantity": 1,
        },
      },
    ];

    if (receivedData === "all") {
      salesData = await order.aggregate(basePipeline);
    } else {
      salesData = await order.aggregate([
        {
          $match: { orderDate: { $gte: startDate, $lte: endDate } },
        },
        ...basePipeline,
      ]);
    }

    // Calculate metrics
    const totalCustomers = [...new Set(salesData.map((sale) => sale.user._id.toString()))].length;
    const totalOrders = [...new Set(salesData.map((sale) => sale.oId.toString()))].length;
    const totalQuantity = salesData.reduce((sum, sale) => sum + sale.items.quantity, 0);
    const totalOrderValue = salesData.reduce((sum, sale) => sum + sale.billTotal, 0);

    res.render("admin/salesReport", {
      salesData,
      totalCustomers,
      totalOrders,
      totalQuantity,
      totalOrderValue,
      timePeriod: receivedData,
      startingDate: null,
      endingDate: null,
    });
  } catch (error) {
    console.error("Error in filterReport: ", error);
    next(error);
  }
};

const filterCustomDateOrder = async (req, res, next) => {
  try {
    const { startingDate, endingDate } = req.body;

    const startDate = new Date(startingDate);
    const endDate = new Date(endingDate);
    endDate.setDate(endDate.getDate() + 1);

    const salesData = await order.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $match: {
          orderDate: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      { $unwind: "$user" },
      { $sort: { orderDate: -1 } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productNew",
        },
      },
      { $unwind: "$productNew" },
      { $match: { status: "Delivered" } },
      {
        $project: {
          oId: 1,
          "user.name": 1,
          "user._id": 1,
          "productNew.name": 1,
          "productNew.price": 1,
          "productNew.discountPrice": 1,
          billTotal: 1,
          orderDate: 1,
          paymentMethod: 1,
          coupon: 1,
          "items.productPrice": 1,
          status: 1,
          "items.quantity": 1,
        },
      },
    ]);

    // Calculate metrics
    const totalCustomers = [...new Set(salesData.map((sale) => sale.user._id.toString()))].length;
    const totalOrders = [...new Set(salesData.map((sale) => sale.oId.toString()))].length;
    const totalQuantity = salesData.reduce((sum, sale) => sum + sale.items.quantity, 0);
    const totalOrderValue = salesData.reduce((sum, sale) => sum + sale.billTotal, 0);

    res.render("admin/salesReport", {
      salesData,
      totalCustomers,
      totalOrders,
      totalQuantity,
      totalOrderValue,
      timePeriod: null,
      startingDate,
      endingDate,
    });
  } catch (error) {
    console.error("Error in filterCustomDateOrder: ", error);
    next(error);
  }
};

module.exports = {
  loadSalesReport,
  filterReport,
  filterCustomDateOrder,
};