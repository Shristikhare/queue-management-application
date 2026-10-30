const Token = require('../models/Token');
const Queue = require('../models/Queue');

// POST /api/queues/:queueId/tokens  — add a person, generate token
exports.addToken = async (req, res) => {
  try {
    const { personName } = req.body;
    const { queueId } = req.params;

    if (!personName || !personName.trim()) {
      return res.status(400).json({ message: 'Person name is required' });
    }

    // Verify ownership
    const queue = await Queue.findOne({ _id: queueId, managerId: req.user._id });
    if (!queue) return res.status(404).json({ message: 'Queue not found' });
    if (queue.status === 'closed') {
      return res.status(400).json({ message: 'Queue is closed — cannot add tokens' });
    }

    // Atomically increment the token counter so concurrent adds stay unique
    const updatedQueue = await Queue.findByIdAndUpdate(
      queueId,
      { $inc: { tokenCounter: 1 } },
      { new: true }
    );

    // Place the new token at the end of the waiting list
    const lastToken = await Token.findOne({ queueId, status: 'waiting' }).sort({ position: -1 });
    const position = lastToken ? lastToken.position + 1 : 1;

    const token = await Token.create({
      queueId,
      personName: personName.trim(),
      tokenNumber: updatedQueue.tokenCounter,
      position,
    });

    res.status(201).json(token);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/tokens/:id/move  — move token up or down by swapping positions
exports.moveToken = async (req, res) => {
  try {
    const { direction } = req.body; // 'up' | 'down'
    if (!['up', 'down'].includes(direction)) {
      return res.status(400).json({ message: "Direction must be 'up' or 'down'" });
    }

    const token = await Token.findById(req.params.id);
    if (!token || token.status !== 'waiting') {
      return res.status(404).json({ message: 'Token not found or not in waiting state' });
    }

    // Verify queue ownership
    const queue = await Queue.findOne({ _id: token.queueId, managerId: req.user._id });
    if (!queue) return res.status(403).json({ message: 'Not authorised' });

    // Find the adjacent waiting token to swap with
    let swapToken;
    if (direction === 'up') {
      swapToken = await Token.findOne({
        queueId: token.queueId,
        status: 'waiting',
        position: { $lt: token.position },
      }).sort({ position: -1 }); // closest one above
    } else {
      swapToken = await Token.findOne({
        queueId: token.queueId,
        status: 'waiting',
        position: { $gt: token.position },
      }).sort({ position: 1 }); // closest one below
    }

    if (!swapToken) {
      return res.status(400).json({ message: `Token is already at the ${direction === 'up' ? 'top' : 'bottom'}` });
    }

    // Swap positions
    const temp = token.position;
    token.position = swapToken.position;
    swapToken.position = temp;

    await token.save();
    await swapToken.save();

    res.json({ message: 'Token moved', token, swapToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/tokens/:id/serve  — assign token for service (marks as served)
exports.serveToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token || token.status !== 'waiting') {
      return res.status(404).json({ message: 'Token not found or already processed' });
    }

    const queue = await Queue.findOne({ _id: token.queueId, managerId: req.user._id });
    if (!queue) return res.status(403).json({ message: 'Not authorised' });

    const now = new Date();
    token.status = 'served';
    token.servedAt = now;
    token.waitDuration = now - token.createdAt; // milliseconds

    await token.save();
    res.json(token);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/tokens/:id/cancel  — cancel a token
exports.cancelToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token || token.status !== 'waiting') {
      return res.status(404).json({ message: 'Token not found or already processed' });
    }

    const queue = await Queue.findOne({ _id: token.queueId, managerId: req.user._id });
    if (!queue) return res.status(403).json({ message: 'Not authorised' });

    token.status = 'cancelled';
    await token.save();

    res.json(token);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
