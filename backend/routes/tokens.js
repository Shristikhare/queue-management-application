const router = require('express').Router();
const auth = require('../middleware/auth');
const { moveToken, serveToken, cancelToken } = require('../controllers/tokenController');

// All token action routes require authentication
router.use(auth);

router.patch('/:id/move', moveToken);
router.patch('/:id/serve', serveToken);
router.patch('/:id/cancel', cancelToken);

module.exports = router;
