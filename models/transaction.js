const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new mongoose.Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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
