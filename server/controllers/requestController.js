const mongoose = require('mongoose');
const HelpRequest = require('../models/HelpRequest');
const { getRequests, saveRequests } = require('../utils/storage');

// @desc    Create a new help request & store persistently
// @route   POST /api/requests
// @access  Private (Student)
const createRequest = async (req, res) => {
  try {
    const { helpType, description } = req.body;

    if (!helpType) {
      return res.status(400).json({ message: 'Help type is required.' });
    }

    const validTypes = ['Technical Issue', 'Need Explanation', 'Equipment Problem', 'Other'];
    if (!validTypes.includes(helpType)) {
      return res.status(400).json({ message: 'Invalid help type specified.' });
    }

    const studentId = (req.user._id || req.user.id).toString();
    const studentName = req.user.name || 'Anonymous Student';
    const isDbConnected = mongoose.connection.readyState === 1;

    let newRequest;

    if (isDbConnected) {
      newRequest = await HelpRequest.create({
        studentId,
        studentName,
        helpType,
        description: description ? description.trim() : '',
        status: 'waiting',
        createdAt: new Date(),
        solution: ''
      });
    } else {
      newRequest = {
        _id: new mongoose.Types.ObjectId().toString(),
        studentId,
        studentName,
        helpType,
        description: description ? description.trim() : '',
        status: 'waiting',
        createdAt: new Date().toISOString(),
        acceptedAt: null,
        resolvedAt: null,
        solution: ''
      };
    }

    // Optional local cache backup (fails gracefully in cloud containers)
    try {
      const diskRequests = getRequests();
      const diskRequest = {
        _id: (newRequest._id || newRequest.id).toString(),
        studentId: newRequest.studentId.toString(),
        studentName: newRequest.studentName,
        helpType: newRequest.helpType,
        description: newRequest.description || '',
        status: 'waiting',
        createdAt: newRequest.createdAt ? new Date(newRequest.createdAt).toISOString() : new Date().toISOString(),
        acceptedAt: null,
        resolvedAt: null,
        solution: ''
      };
      diskRequests.push(diskRequest);
      saveRequests(diskRequests);
    } catch (e) {}

    return res.status(201).json(newRequest);
  } catch (error) {
    console.error('Create request error:', error);
    return res.status(500).json({ message: 'Failed to create help request: ' + error.message });
  }
};

// @desc    Get student's own requests
// @route   GET /api/requests/my
// @access  Private (Student)
const getMyRequests = async (req, res) => {
  try {
    const studentId = (req.user._id || req.user.id).toString();
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const requests = await HelpRequest.find({ studentId }).sort({ createdAt: -1 });
      return res.status(200).json(requests);
    } else {
      const allRequests = getRequests();
      const myRequests = allRequests
        .filter((r) => r.studentId === studentId && r.studentName !== 'Student User')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json(myRequests);
    }
  } catch (error) {
    console.error('Get my requests error:', error);
    return res.status(500).json({ message: 'Failed to fetch your requests: ' + error.message });
  }
};

// @desc    Get active requests (waiting & in-progress) ordered by longest waiting first
// @route   GET /api/requests/active
// @access  Private (Faculty)
const getActiveRequests = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const activeRequests = await HelpRequest.find({
        status: { $in: ['waiting', 'in-progress'] },
        studentName: { $ne: 'Student User' }
      }).sort({ createdAt: 1 });
      return res.status(200).json(activeRequests);
    } else {
      const allRequests = getRequests();
      const activeRequests = allRequests
        .filter(
          (r) =>
            (r.status === 'waiting' || r.status === 'in-progress') &&
            r.studentName !== 'Student User'
        )
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return res.status(200).json(activeRequests);
    }
  } catch (error) {
    console.error('Get active requests error:', error);
    return res.status(500).json({ message: 'Failed to fetch active requests: ' + error.message });
  }
};

// @desc    Faculty accepts a request (Take Request)
// @route   PATCH /api/requests/:id/accept
// @access  Private (Faculty)
const acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const isDbConnected = mongoose.connection.readyState === 1;
    const acceptedAt = new Date().toISOString();

    let updatedRequest;

    if (isDbConnected) {
      const request = await HelpRequest.findById(id);
      if (!request) {
        return res.status(404).json({ message: 'Help request not found.' });
      }

      if (request.status === 'resolved') {
        return res.status(400).json({ message: 'Request is already resolved.' });
      }

      request.status = 'in-progress';
      request.acceptedAt = new Date();
      await request.save();
      updatedRequest = request;
    } else {
      const allRequests = getRequests();
      const index = allRequests.findIndex((r) => r._id === id || r._id.toString() === id);
      if (index === -1) {
        return res.status(404).json({ message: 'Help request not found.' });
      }
      allRequests[index].status = 'in-progress';
      allRequests[index].acceptedAt = acceptedAt;
      saveRequests(allRequests);
      updatedRequest = allRequests[index];
    }

    // Optional local cache sync
    try {
      const allRequests = getRequests();
      const index = allRequests.findIndex((r) => r._id === id || r._id.toString() === id);
      if (index !== -1) {
        allRequests[index].status = 'in-progress';
        allRequests[index].acceptedAt = acceptedAt;
        saveRequests(allRequests);
      }
    } catch (e) {}

    return res.status(200).json(updatedRequest);
  } catch (error) {
    console.error('Accept request error:', error);
    return res.status(500).json({ message: 'Failed to accept request: ' + error.message });
  }
};

// @desc    Faculty marks request as resolved with solution
// @route   PATCH /api/requests/:id/resolve
// @access  Private (Faculty)
const resolveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { solution } = req.body || {};
    const isDbConnected = mongoose.connection.readyState === 1;
    const resolvedAt = new Date().toISOString();
    const cleanSolution = solution ? solution.trim() : '';

    let updatedRequest;

    if (isDbConnected) {
      const request = await HelpRequest.findById(id);
      if (!request) {
        return res.status(404).json({ message: 'Help request not found.' });
      }

      request.status = 'resolved';
      request.resolvedAt = new Date();
      request.solution = cleanSolution;
      await request.save();
      updatedRequest = request;
    } else {
      const allRequests = getRequests();
      const index = allRequests.findIndex((r) => r._id === id || r._id.toString() === id);
      if (index === -1) {
        return res.status(404).json({ message: 'Help request not found.' });
      }
      allRequests[index].status = 'resolved';
      allRequests[index].resolvedAt = resolvedAt;
      allRequests[index].solution = cleanSolution;
      saveRequests(allRequests);
      updatedRequest = allRequests[index];
    }

    // Optional local cache sync
    try {
      const allRequests = getRequests();
      const index = allRequests.findIndex((r) => r._id === id || r._id.toString() === id);
      if (index !== -1) {
        allRequests[index].status = 'resolved';
        allRequests[index].resolvedAt = resolvedAt;
        allRequests[index].solution = cleanSolution;
        saveRequests(allRequests);
      }
    } catch (e) {}

    return res.status(200).json(updatedRequest);
  } catch (error) {
    console.error('Resolve request error:', error);
    return res.status(500).json({ message: 'Failed to resolve request: ' + error.message });
  }
};

// @desc    Get request history (resolved requests)
// @route   GET /api/requests/history
// @access  Private (Faculty)
const getHistoryRequests = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const history = await HelpRequest.find({
        status: 'resolved',
        studentName: { $ne: 'Student User' }
      }).sort({ resolvedAt: -1, createdAt: -1 });
      return res.status(200).json(history);
    } else {
      const allRequests = getRequests();
      const history = allRequests
        .filter((r) => r.status === 'resolved' && r.studentName !== 'Student User')
        .sort((a, b) => new Date(b.resolvedAt || b.createdAt) - new Date(a.resolvedAt || a.createdAt));
      return res.status(200).json(history);
    }
  } catch (error) {
    console.error('Get history requests error:', error);
    return res.status(500).json({ message: 'Failed to fetch history: ' + error.message });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getActiveRequests,
  acceptRequest,
  resolveRequest,
  getHistoryRequests
};
