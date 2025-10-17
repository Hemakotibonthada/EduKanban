// Test script to verify database and models
const mongoose = require('mongoose');
require('dotenv').config();

const testDatabase = async () => {
  try {
    console.log('🔍 Testing database connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected successfully');
    
    // Test models
    console.log('\n🔍 Testing models...');
    
    const Course = require('./models/Course');
    const CourseTemplate = require('./models/CourseTemplate');
    const ActivityLog = require('./models/ActivityLog');
    const Module = require('./models/Module');
    const Task = require('./models/Task');
    const User = require('./models/User');
    
    console.log('✅ Course model loaded');
    console.log('✅ CourseTemplate model loaded');
    console.log('✅ ActivityLog model loaded');
    console.log('✅ Module model loaded');
    console.log('✅ Task model loaded');
    console.log('✅ User model loaded');
    
    // Test CourseTemplateService
    console.log('\n🔍 Testing CourseTemplateService...');
    const CourseTemplateService = require('./services/CourseTemplateService');
    console.log('✅ CourseTemplateService loaded');
    
    console.log('\n✅ All checks passed!');
    
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

testDatabase();
