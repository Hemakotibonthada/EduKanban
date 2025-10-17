const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('../routes/auth');
const User = require('../models/User');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication API Tests', () => {
  
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test1234!',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.token).toBeDefined();

      // Verify user exists in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.email).toBe(userData.email);
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'weak', // Too short
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        username: 'testuser3',
        email: 'duplicate@example.com',
        password: 'Test1234!',
        firstName: 'Test',
        lastName: 'User'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, username: 'different' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('exist');
    });

    it('should reject duplicate username registration', async () => {
      const userData = {
        username: 'uniqueuser',
        email: 'unique@example.com',
        password: 'Test1234!',
        firstName: 'Test',
        lastName: 'User'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Duplicate username
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, email: 'different@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'incomplete@example.com',
          password: 'Test1234!'
          // Missing username, firstName, lastName
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'logintest',
          email: 'login@example.com',
          password: 'Test1234!',
          firstName: 'Login',
          lastName: 'Test'
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Test1234!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('login@example.com');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test1234!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com'
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'resetuser',
          email: 'reset@example.com',
          password: 'Test1234!',
          firstName: 'Reset',
          lastName: 'User'
        });
    });

    it('should send password reset for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'reset@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('sent');

      // Verify reset token was created
      const user = await User.findOne({ email: 'reset@example.com' });
      expect(user.resetPasswordToken).toBeDefined();
      expect(user.resetPasswordExpires).toBeDefined();
    });

    it('should return success even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Password Validation', () => {
    it('should enforce minimum 8 character password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'shortpass',
          email: 'short@example.com',
          password: 'Test12!', // 7 characters
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require uppercase letter in password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'nouppercase',
          email: 'noupper@example.com',
          password: 'test1234!', // No uppercase
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require lowercase letter in password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'nolowercase',
          email: 'nolower@example.com',
          password: 'TEST1234!', // No lowercase
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require number in password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'nonumber',
          email: 'nonumber@example.com',
          password: 'TestTest!', // No number
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
