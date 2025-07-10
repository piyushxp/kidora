const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  invoiceType: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    required: true
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  items: [{
    description: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      default: 1
    }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    required: true
  },
  payments: [{
    amount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'online'],
      required: true
    },
    receiptNumber: {
      type: String
    },
    notes: {
      type: String
    }
  }],
  isInstallment: {
    type: Boolean,
    default: false
  },
  installments: [{
    amount: {
      type: Number,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending'
    },
    paidDate: {
      type: Date
    }
  }],
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Generate invoice number
invoiceSchema.pre('save', function(next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.invoiceNumber = `INV-${year}${month}-${random}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Calculate remaining amount
invoiceSchema.methods.calculateRemainingAmount = function() {
  const totalPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
  this.paidAmount = totalPaid;
  this.remainingAmount = this.totalAmount - totalPaid;
  
  if (this.remainingAmount <= 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else {
    this.status = 'unpaid';
  }
};

module.exports = mongoose.model('Invoice', invoiceSchema); 