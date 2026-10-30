const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
  {
    queueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Queue', required: true },
    personName: { type: String, required: true, trim: true },
    // Unique sequential number within the queue (1, 2, 3 ...)
    tokenNumber: { type: Number, required: true },
    // Controls display order; swapped when manager moves token up/down
    position: { type: Number, required: true },
    status: {
      type: String,
      enum: ['waiting', 'served', 'cancelled'],
      default: 'waiting',
    },
    servedAt: { type: Date, default: null },
    // Milliseconds from createdAt → servedAt
    waitDuration: { type: Number, default: null },
  },
  { timestamps: true }
);

// Compound index for fast queue lookups and ordering
tokenSchema.index({ queueId: 1, status: 1, position: 1 });

module.exports = mongoose.model('Token', tokenSchema);
