const express = require('express');
const router = express.Router();
const {
  createRequest,
  getMyRequests,
  getActiveRequests,
  acceptRequest,
  resolveRequest,
  getHistoryRequests
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

// All request routes require authentication
router.use(protect);

router.post('/', createRequest);
router.get('/my', getMyRequests);
router.get('/active', getActiveRequests);
router.patch('/:id/accept', acceptRequest);
router.patch('/:id/resolve', resolveRequest);
router.get('/history', getHistoryRequests);

module.exports = router;
