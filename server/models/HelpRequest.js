const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  helpType: {
    type: String,
    required: true,
    enum: ['Technical Issue', 'Need Explanation', 'Equipment Problem', 'Other']
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'resolved'],
    default: 'waiting'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  solution: {
    type: String,
    default: '',
    trim: true
  }
});

module.exports = mongoose.model('HelpRequest', helpRequestSchema);
