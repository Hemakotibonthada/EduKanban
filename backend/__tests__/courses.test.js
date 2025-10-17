const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const coursesRoutes = require('../routes/courses');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/courses', authMiddleware, coursesRoutes);

describe('Courses API Tests', () => {
  let testUser;
  let testToken;
  let testCourse;

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      username: 'coursetest',
      email: 'coursetest@example.com',
      password: 'Test1234!',
      firstName: 'Course',
      lastName: 'Test'
    });

    // Generate token
    testToken = jwt.sign(
      { userId: testUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create test course
    testCourse = await Course.create({
      userId: testUser._id,
      title: 'Test Course',
      description: 'Test course description',
      category: 'programming',
      difficulty: 'intermediate',
      estimatedDuration: '4 weeks',
      status: 'active'
    });
  });

  describe('GET /api/courses', () => {
    it('should get user courses with pagination', async () => {
      const response = await request(app)
        .get('/api/courses?limit=10&offset=0')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.courses).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it('should filter courses by status', async () => {
      const response = await request(app)
        .get('/api/courses?status=active')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.courses.forEach(course => {
        expect(course.status).toBe('active');
      });
    });

    it('should filter courses by difficulty', async () => {
      const response = await request(app)
        .get('/api/courses?difficulty=intermediate')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.courses.forEach(course => {
        expect(course.difficulty).toBe('intermediate');
      });
    });

    it('should reject request without authentication', async () => {
      await request(app)
        .get('/api/courses')
        .expect(401);
    });
  });

  describe('POST /api/courses', () => {
    it('should create a new course', async () => {
      const courseData = {
        title: 'New Test Course',
        description: 'New course description',
        category: 'web-development',
        difficulty: 'beginner',
        estimatedDuration: '2 weeks'
      };

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${testToken}`)
        .send(courseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.course.title).toBe(courseData.title);
      expect(response.body.course.userId.toString()).toBe(testUser._id.toString());
    });

    it('should reject course creation without required fields', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Incomplete Course'
          // Missing description, category, difficulty
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/courses/:id', () => {
    it('should get course by ID', async () => {
      const response = await request(app)
        .get(`/api/courses/${testCourse._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.course._id).toBe(testCourse._id.toString());
      expect(response.body.data.course.title).toBe(testCourse.title);
    });

    it('should return 404 for non-existent course', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app)
        .get(`/api/courses/${fakeId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/courses/:id', () => {
    it('should update course successfully', async () => {
      const updates = {
        title: 'Updated Course Title',
        description: 'Updated description',
        difficulty: 'advanced'
      };

      const response = await request(app)
        .put(`/api/courses/${testCourse._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.course.title).toBe(updates.title);
      expect(response.body.course.difficulty).toBe(updates.difficulty);
    });

    it('should prevent updating another user\'s course', async () => {
      // Create another user
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'Test1234!',
        firstName: 'Other',
        lastName: 'User'
      });

      const otherToken = jwt.sign(
        { userId: otherUser._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      await request(app)
        .put(`/api/courses/${testCourse._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hacked Title' })
        .expect(404);
    });
  });

  describe('POST /api/courses/:id/enroll', () => {
    let sharedCourse;

    beforeEach(async () => {
      // Create a shared course
      sharedCourse = await Course.create({
        userId: testUser._id,
        title: 'Shared Course',
        description: 'Shared course description',
        category: 'programming',
        difficulty: 'intermediate',
        estimatedDuration: '3 weeks',
        status: 'completed',
        isTemplate: true
      });
    });

    it('should enroll in a template course', async () => {
      const response = await request(app)
        .post(`/api/courses/${sharedCourse._id}/enroll`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.enrolledCourse).toBeDefined();
      expect(response.body.enrolledCourse.title).toBe(sharedCourse.title);
      expect(response.body.enrolledCourse.isTemplate).toBe(false);
    });
  });

  describe('POST /api/courses/:id/modules', () => {
    it('should add module to course', async () => {
      const moduleData = {
        title: 'New Module',
        description: 'Module description',
        duration: '2 hours',
        order: 1
      };

      const response = await request(app)
        .post(`/api/courses/${testCourse._id}/modules`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(moduleData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.module.title).toBe(moduleData.title);
    });

    it('should reject adding module without required fields', async () => {
      await request(app)
        .post(`/api/courses/${testCourse._id}/modules`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Incomplete Module' })
        .expect(400);
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      // Create multiple courses
      const coursesData = Array.from({ length: 25 }, (_, i) => ({
        userId: testUser._id,
        title: `Course ${i + 1}`,
        description: `Description ${i + 1}`,
        category: 'programming',
        difficulty: 'beginner',
        estimatedDuration: '1 week',
        status: 'active'
      }));

      await Course.insertMany(coursesData);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/courses?limit=10')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.courses.length).toBeLessThanOrEqual(10);
    });

    it('should respect offset parameter', async () => {
      const response = await request(app)
        .get('/api/courses?limit=10&offset=10')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.pagination.offset).toBe(10);
    });

    it('should enforce max limit of 100', async () => {
      const response = await request(app)
        .get('/api/courses?limit=500')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.pagination.limit).toBe(100);
    });
  });
});
