const User = require("../models/userModel");
const orderModel = require("../models/orderModel")
const productModel = require("../models/productModel")
const walletModel = require("../models/walletModel")

const loadorder = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const query = req.query.q || 'All';
    const limit = 18;
    const currentPage = Math.max(page, 1);

    let filter = {};
    if (query && query.toLowerCase() !== 'all') {
      const users = await User.find({ name: { $regex: new RegExp(query, 'i') } });
      const userIDs = users.map((user) => user._id);

      if (userIDs.length > 0) {
        filter.user = { $in: userIDs };
      } else {
        switch (query) {
          case 'Delivered':
          case 'Pending':
          case 'Processing':
          case 'Shipped':
          case 'Canceled':
          case 'Returned':
            filter.status = query;
            break;
          default:
            filter.oId = query;
        }
      }
    }

    const totalOrders = await orderModel.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);
    const adjustedCurrentPage = Math.min(currentPage, totalPages || 1);
    const skip = (adjustedCurrentPage - 1) * limit;

    const orders = await orderModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .populate('user');

    res.render('admin/orders', {
      order: orders,
      currentPage: adjustedCurrentPage,
      totalPages,
      query,
    });
  } catch (error) {
    console.error('loadorder:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

const loadorderdetails = async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await orderModel.findById(id).populate({ path: 'user', model: 'User' });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.render('admin/adminorderdetails', { orders: order });
  } catch (error) {
    console.error('loadorderdetails:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

const requestAccept = async (req, res) => {
  try {
    const { orderId } = req.params; 
    const { userId } = req.body;

    const order = await orderModel.findOne({ oId: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find the pending request
    const pendingRequest = order.requests.find(
      (req) => req.status === 'Pending' && (req.type === 'Cancel' || req.type === 'Return')
    );

    if (!pendingRequest) {
      return res.status(400).json({ success: false, message: 'No pending cancel or return request found' });
    }

    // Update stock
    for (const orderItem of order.items) {
      const product = await productModel.findById(orderItem.productId);
      if (product) {
        product.countInStock += Number(orderItem.quantity);
        await product.save();
      }
    }

    // Process refund
    let userWallet = await walletModel.findOne({ user: userId });
    if (!userWallet) {
      userWallet = new walletModel({
        user: userId,
        amount: 0,
        transaction: [],
      });
    }

    const refundAmount = order.billTotal;
    userWallet.amount += refundAmount;
    userWallet.transaction.push({
      date: new Date(),
      paymentMethod: 'wallet',
      amount: refundAmount,
      paymentStatus: 'refund',
    });
    await userWallet.save();

    // Update order status and request
    order.status = pendingRequest.type === 'Cancel' ? 'Canceled' : 'Returned';
    pendingRequest.status = 'Accepted';
    await order.save();

    return res.status(200).json({ success: true, message: 'Request accepted successfully' });
  } catch (error) {
    console.error('requestAccept:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const requestCancel = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderModel.findOne({ oId: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Find and reject the pending request
    const pendingRequest = order.requests.find(
      (req) => req.status === 'Pending' && (req.type === 'Cancel' || req.type === 'Return')
    );

    if (!pendingRequest) {
      return res.status(400).json({ success: false, message: 'No pending cancel or return request found' });
    }

    pendingRequest.status = 'Rejected';
    await order.save();

    return res.status(200).json({ success: true, message: 'Request rejected successfully' });
  } catch (error) {
    console.error('requestCancel:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateorder = async (req, res) => {
  try {
    const { newStatus, orderId } = req.body;

    // Validate inputs
    if (!newStatus || !orderId) {
      return res.status(400).json({ success: false, message: 'newStatus and orderId are required' });
    }

    const order = await orderModel.findOne({ oId: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Adjust stock based on status
    if (newStatus === 'Shipped') {
      for (const orderItem of order.items) {
        const product = await productModel.findById(orderItem.productId);
        if (product) {
          if (product.countInStock < orderItem.quantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for product ${product._id}`,
            });
          }
          product.countInStock -= orderItem.quantity;
          await product.save();
        }
      }
    } else if (newStatus === 'Canceled' || newStatus === 'Returned') {
      for (const orderItem of order.items) {
        const product = await productModel.findById(orderItem.productId);
        if (product) {
          product.countInStock += Number(orderItem.quantity);
          await product.save();
        }
      }
    }

    // Update order status
    order.status = newStatus;
    const updatedOrder = await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      updatedOrder,
    });
  } catch (error) {
    console.error('updateorder:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
    updateorder,
    requestCancel,
    requestAccept,
    loadorderdetails,
    loadorder,
}