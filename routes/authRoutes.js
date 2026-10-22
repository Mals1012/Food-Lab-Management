const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
// @desc    Register a new user
router.post(
  '/register',
  [
    body('username').isString().isLength({ min: 3 }).trim(),
    body('password').isString().isLength({ min: 6 }),
    body('role').optional().isIn([
      'Admin',
      'Lab Manager',
      'Lab Analyst',
      'Lab Technician',
      'Quality Manager',
      'Production Staff',
      'Production Manager',
      'Viewer'
    ])
  ],
  authController.register
);

// @route   POST /api/auth/login
// @desc    Login user & get JWT
router.post(
  '/login',
  [body('username').isString(), body('password').isString()],
  authController.login
);

// @route   GET /api/auth/me
// @desc    Get logged-in user info (protected)
router.get('/me', protect, authController.me);

module.exports = router;
