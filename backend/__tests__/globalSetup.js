const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

module.exports = async () => {
  // Start in-memory MongoDB server for tests
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Set environment variable for tests
  process.env.MONGODB_URI_TEST = mongoUri;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  
  console.log('🧪 Global test setup complete');
  console.log('📦 MongoDB Memory Server started:', mongoUri);
  
  // Store mongoServer instance globally for teardown
  global.__MONGOSERVER__ = mongoServer;
};
