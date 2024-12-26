const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    transaction_type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    transaction_date: {
        type: Date,
        required: true
    },
    transaction_note: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        required: true,
        validate: {
            validator: function(value) {
                const incomeCategories = ['salary', 'investment', 'other_income'];
                const expenseCategories = ['housing', 'transportation', 'food', 'utilities', 'insurance', 'healthcare', 'dining_out', 'entertainment', 'other_expense'];
                
                if (this.transaction_type === 'income') {
                    return incomeCategories.includes(value);
                } else if (this.transaction_type === 'expense') {
                    return expenseCategories.includes(value);
                }
                return false;
            },
            message: function(props) {
                return `${props.value} is not a valid category for the selected transaction type`;
            }
        }
    }
}, {
    timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;