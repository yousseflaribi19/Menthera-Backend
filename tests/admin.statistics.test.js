const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User.model');
const Session = require('../src/models/Session.model');
const mongoose = require('mongoose');

// Mock data
const mockAdminUser = {
  name: 'Admin User',
  email: 'admin@test.com',
  password: 'password123',
  role: 'admin'
};

const mockRegularUser = {
  name: 'Regular User',
  email: 'user@test.com',
  password: 'password123'
};

describe('Admin Statistics API', () => {
  let adminToken;
  let regularUser;
  let adminUser;

  beforeAll(async () => {
    // Connect to database
    // Create admin user
    adminUser = new User(mockAdminUser);
    await adminUser.save();
    
    // Create regular user
    regularUser = new User(mockRegularUser);
    await regularUser.save();
    
    // Login as admin to get token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: mockAdminUser.email,
        password: mockAdminUser.password
      });
      
    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({
      email: { $in: [mockAdminUser.email, mockRegularUser.email] }
    });
    
    await Session.deleteMany({});
    
    // Close database connection
    await mongoose.connection.close();
  });

  describe('GET /api/v1/admin/statistics/voice-messages-average', () => {
    it('should get average voice messages per user', async () => {
      const res = await request(app)
        .get('/api/v1/admin/statistics/voice-messages-average')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
        
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('averageVoiceMessagesPerUser');
      expect(res.body.data).toHaveProperty('totalVoiceMessages');
      expect(res.body.data).toHaveProperty('usersWithVoiceMessages');
    });
  });

  describe('GET /api/v1/admin/statistics/community-emotions', () => {
    it('should get community emotion trends', async () => {
      const res = await request(app)
        .get('/api/v1/admin/statistics/community-emotions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
        
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('period');
      expect(res.body.data).toHaveProperty('emotions');
    });
    
    it('should get community emotion trends for different periods', async () => {
      const periods = ['day', 'week', 'month'];
      
      for (const period of periods) {
        const res = await request(app)
          .get(`/api/v1/admin/statistics/community-emotions?period=${period}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
          
        expect(res.body.data.period).toBe(period);
      }
    });
  });

  describe('GET /api/v1/admin/statistics/user-emotions/:userId', () => {
    it('should get emotional curve for a specific user', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/statistics/user-emotions/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
        
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('userId', regularUser._id.toString());
      expect(res.body.data).toHaveProperty('emotionCurve');
      expect(res.body.data).toHaveProperty('totalDataPoints');
    });
    
    it('should return error for invalid user ID', async () => {
      const res = await request(app)
        .get('/api/v1/admin/statistics/user-emotions/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });
});