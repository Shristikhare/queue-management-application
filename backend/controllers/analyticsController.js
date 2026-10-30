const Token = require('../models/Token');
const Queue = require('../models/Queue');

// GET /api/queues/:queueId/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { queueId } = req.params;

    const queue = await Queue.findOne({ _id: queueId, managerId: req.user._id });
    if (!queue) return res.status(404).json({ message: 'Queue not found' });

    // ── Status breakdown ──────────────────────────────────────────────────────
    const statusAgg = await Token.aggregate([
      { $match: { queueId: queue._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const counts = { waiting: 0, served: 0, cancelled: 0 };
    statusAgg.forEach(({ _id, count }) => {
      if (_id in counts) counts[_id] = count;
    });

    // ── Average wait time (served tokens only) ────────────────────────────────
    const avgWaitAgg = await Token.aggregate([
      {
        $match: {
          queueId: queue._id,
          status: 'served',
          waitDuration: { $ne: null },
        },
      },
      { $group: { _id: null, avgMs: { $avg: '$waitDuration' } } },
    ]);
    const avgWaitMinutes = avgWaitAgg[0]
      ? Math.round(avgWaitAgg[0].avgMs / 60000)
      : 0;

    // ── Tokens per day — last 7 days ──────────────────────────────────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const tokensByDay = await Token.aggregate([
      { $match: { queueId: queue._id, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          served: {
            $sum: { $cond: [{ $eq: ['$status', 'served'] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ── Peak hours (all-time) ─────────────────────────────────────────────────
    const tokensByHour = await Token.aggregate([
      { $match: { queueId: queue._id } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      queue: {
        name: queue.name,
        status: queue.status,
        totalTokens: queue.tokenCounter,
      },
      counts,
      avgWaitMinutes,
      tokensByDay,
      tokensByHour,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
