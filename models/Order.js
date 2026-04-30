const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  total: { type: Number, required: true },
  status: { type: String, default: 'Pending' }, // Pending, Paid, Failed
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
