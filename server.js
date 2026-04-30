const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/snacksdb', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
    
    // Seed Sample Products
    const Product = require('./models/Product');
    // Drop the collection to force re-seed with the new products
    await Product.deleteMany({});
    
    console.log('Inserting new products...');
    await Product.insertMany([
      {
        name: 'Spicy Potato Chips',
        price: 80,
        image: 'https://images.unsplash.com/photo-1599598425947-330026211100?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        category: 'Chips'
      },
      {
        name: 'Masala Vada',
        price: 50,
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        category: 'Vada'
      },
      {
        name: 'Crispy Veg Pakoda',
        price: 120,
        image: 'https://images.unsplash.com/photo-1628151015968-3a4429e9ef04?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        category: 'Pakoda'
      },
      {
        name: 'Punjabi Samosa',
        price: 60,
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        category: 'Samosa'
      },
      {
        name: 'Ribbon Pakoda / Mini Thattai',
        price: 100,
        image: 'https://images.unsplash.com/photo-1599598425947-330026211100?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        category: 'Murukku'
      }
    ]);
    console.log('Products inserted successfully');

  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
