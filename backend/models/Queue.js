const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    // Auto-incrementing counter — gives each person a unique token number per queue
    tokenCounter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

queueSchema.index({ managerId: 1, createdAt: -1 });

module.exports = mongoose.model('Queue', queueSchema);
