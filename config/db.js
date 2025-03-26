// config/db.js
const mongoose = require('mongoose');
const dns = require('dns');

// Set DNS server to Google's public DNS to help with resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    // Set mongoose options
    mongoose.set('strictQuery', true);
    
    // Add connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000, // Increased timeout to 15s
      socketTimeoutMS: 45000,
      family: 4  // Force IPv4
    };

    // Log connection string (without password)
    const connectionString = process.env.MONGODB_URI;
    console.log(`Attempting connection to MongoDB at: ${connectionString.replace(/\/\/.*?@/, '//***:***@')}`);
    
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    
    // Additional error diagnostics
    if (err.name === 'MongooseServerSelectionError') {
      console.error('DNS Resolution Error: Unable to resolve MongoDB hostname.');
      console.error('Please check your network connection or try an alternative connection method.');
      
      // Give a hint about possible alternative connection
      console.error('Consider using a local MongoDB instance for development:');
      console.error('MONGODB_URI=mongodb://localhost:27017/virtual-art-gallery');
    }
    
    // Don't exit when in development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('Continuing without database connection in development mode.');
      // The application will continue, but database-dependent features won't work
    }
  }
};

module.exports = connectDB;