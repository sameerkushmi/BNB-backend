const express = require('express');
const cors = require('cors');
const app = express();
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

dotenv.config(); // Load environment variables from .env file

// Connect to MongoDB
connectDB();

// Middleware
app.use(cookieParser());// Parse cookies
app.use(cors(
  {
    origin: process.env.CLIENT_URL, // Allow requests from this origin
    credentials: true // Allow credentials (cookies, authorization headers, etc.)
  }
));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/subscribers', require('./routes/subscriberRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/address', require('./routes/addressRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));

const port = process.env.PORT || 8080;

// Start the server
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});