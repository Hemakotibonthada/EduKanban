module.exports = async () => {
  // Stop MongoDB Memory Server
  if (global.__MONGOSERVER__) {
    await global.__MONGOSERVER__.stop();
    console.log('🧹 MongoDB Memory Server stopped');
  }
  
  console.log('🧪 Global test teardown complete');
};
