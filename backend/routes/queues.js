const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  createQueue,
  getQueues,
  getQueueById,
  deleteQueue,
  updateQueueStatus,
} = require('../controllers/queueController');
const { addToken } = require('../controllers/tokenController');
const { getAnalytics } = require('../controllers/analyticsController');

// All queue routes require authentication
router.use(auth);

router.get('/', getQueues);
router.post('/', createQueue);
router.get('/:id', getQueueById);
router.delete('/:id', deleteQueue);
router.patch('/:id/status', updateQueueStatus);

// Nested: add a person to a specific queue
router.post('/:queueId/tokens', addToken);

// Nested: analytics for a specific queue
router.get('/:queueId/analytics', getAnalytics);

module.exports = router;
