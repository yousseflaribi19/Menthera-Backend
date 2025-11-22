const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { runJob } = require('../jobs/weeklySummary.job');
const ApiResponse = require('../utils/apiResponse');
const AdminController = require('../controllers/admin.controller');

const router = express.Router();

// Helper: admin-only middleware
const adminOnly = [protect, restrictTo('admin')];

// Trigger weekly summaries manually (admin only)
router.post('/admin/run-weekly-summaries', adminOnly, async (req, res, next) => {
  try {
    const result = await runJob();
    return res.json(ApiResponse.success({ generated: result.length }, 'Job exécuté'));
  } catch (err) { next(err); }
});

// Dashboard
router.get('/admin/dashboard', adminOnly, AdminController.dashboard);

// Users CRUD
router.get('/admin/users', adminOnly, AdminController.usersList);
router.get('/admin/users/:id', adminOnly, AdminController.getUser);
router.post('/admin/users', adminOnly, AdminController.createUser);
router.put('/admin/users/:id', adminOnly, AdminController.updateUser);
router.delete('/admin/users/:id', adminOnly, AdminController.deleteUser);

module.exports = router;
