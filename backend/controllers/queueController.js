const Queue = require('../models/Queue');
const Token = require('../models/Token');

// POST /api/queues
exports.createQueue = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Queue name is required' });
    }

    const queue = await Queue.create({ name: name.trim(), managerId: req.user._id });
    res.status(201).json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/queues
exports.getQueues = async (req, res) => {
  try {
    const queues = await Queue.find({ managerId: req.user._id }).sort({ createdAt: -1 });

    // Attach live waiting count to each queue card
    const queuesWithCounts = await Promise.all(
      queues.map(async (queue) => {
        const waitingCount = await Token.countDocuments({
          queueId: queue._id,
          status: 'waiting',
        });
        return { ...queue.toObject(), waitingCount };
      })
    );

    res.json(queuesWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/queues/:id
exports.getQueueById = async (req, res) => {
  try {
    const queue = await Queue.findOne({ _id: req.params.id, managerId: req.user._id });
    if (!queue) return res.status(404).json({ message: 'Queue not found' });

    // Only return waiting tokens, ordered by position
    const tokens = await Token.find({ queueId: queue._id, status: 'waiting' }).sort({
      position: 1,
    });

    res.json({ queue, tokens });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/queues/:id
exports.deleteQueue = async (req, res) => {
  try {
    const queue = await Queue.findOne({ _id: req.params.id, managerId: req.user._id });
    if (!queue) return res.status(404).json({ message: 'Queue not found' });

    await Token.deleteMany({ queueId: queue._id });
    await Queue.deleteOne({ _id: queue._id });

    res.json({ message: 'Queue deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/queues/:id/status
exports.updateQueueStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const queue = await Queue.findOneAndUpdate(
      { _id: req.params.id, managerId: req.user._id },
      { status },
      { new: true }
    );
    if (!queue) return res.status(404).json({ message: 'Queue not found' });

    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
