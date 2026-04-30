const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Initialize Razorpay
// Replace with your actual keys or use environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET',
});

// Create Order (Backend to Razorpay)
router.post('/create', protect, async (req, res) => {
  try {
    const { items, total } = req.body;

    // Create a new order in MongoDB first with Pending status
    const newOrder = await Order.create({
      userId: req.user.id,
      items,
      total,
      status: 'Pending'
    });

    const options = {
      amount: Math.round(total * 100), // amount in the smallest currency unit
      currency: "INR",
      receipt: `receipt_order_${newOrder._id}`,
    };

    const order = await razorpay.orders.create(options);

    // Update order with Razorpay Order ID
    newOrder.razorpayOrderId = order.id;
    await newOrder.save();

    res.json({ order, mongoOrderId: newOrder._id });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// Verify Payment
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, mongoOrderId } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is verified
      const order = await Order.findById(mongoOrderId);
      if (order) {
        order.status = 'Paid';
        order.razorpayPaymentId = razorpay_payment_id;
        await order.save();
        res.json({ message: "Payment verified successfully", order });
      } else {
        res.status(404).json({ message: "Order not found in DB" });
      }
    } else {
      res.status(400).json({ message: "Invalid signature sent!" });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
});

module.exports = router;
