const mongoose = require('mongoose');

// Payment and subscription tracking schema (future-ready)
const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionId: {
    type: String,
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  plan: {
    type: String,
    enum: ['free', 'premium', 'pro'],
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly', 'lifetime'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    required: true
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'crypto']
    },
    provider: {
      type: String // Stripe, PayPal, etc.
    },
    last4: {
      type: String
    },
    brand: {
      type: String
    }
  },
  invoice: {
    invoiceId: {
      type: String
    },
    invoiceUrl: {
      type: String
    },
    pdfUrl: {
      type: String
    }
  },
  subscription: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    renewalDate: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String
    }
  },
  refund: {
    refundId: {
      type: String
    },
    refundAmount: {
      type: Number
    },
    refundReason: {
      type: String
    },
    refundedAt: {
      type: Date
    }
  },
  metadata: {
    couponCode: {
      type: String
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    processingFee: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for payment tracking and reporting
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ subscriptionId: 1 });
paymentSchema.index({ plan: 1, status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);