const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transaction_date: {
        type: Date,
        required: true
    },
    transaction_type: {
        type: String,
        enum: ['loss', 'receive'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    transaction_note: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);
