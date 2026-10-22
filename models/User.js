const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: [
      'Admin',
      'Lab Manager',
      'Lab Analyst',
      'Lab Technician',
      'Quality Manager',
      'Production Staff',
      'Production Manager',
      'Viewer'
    ],
    default: 'Viewer'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
