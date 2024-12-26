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
            validator: function (value) {
                const receiveCategories = [
                    "salary", "business_revenue", "freelancing", "investments", "rental_income", "government_benefits", "gifts",
                    "inheritances", "prizes", "side_hustles", "royalties", "crowdfunding", "refunds", "grants", "scholarships",
                    "tips", "pension", "dividends", "alimony/child_support", "stock_sales", "affiliate_marketing", "consulting_fees",
                    "event_hosting", "intellectual_property", "barter_or_trade", "cryptocurrency", "reselling", "loans",
                    "partnership_shares", "carpool_income", "miscellaneous"
                ];

                const expenseCategories = [
                    "housing", "utilities", "groceries", "transportation", "healthcare", "entertainment", "dining_out", "clothing",
                    "education", "travel", "personal_care", "fitness", "insurance", "debt_repayment", "savings", "investments",
                    "technology", "gifts", "charity", "childcare", "pets", "home_improvement", "subscriptions", "legal_fees",
                    "events_and_celebrations", "professional_services", "taxes", "luxury", "hobbies", "alcohol_and_tobacco",
                    "fines_and_penalties", "miscellaneous"
                ];

                if (this.transaction_type === 'income') {
                    return receiveCategories.includes(value.toLowerCase());
                } else if (this.transaction_type === 'expense') {
                    return expenseCategories.includes(value.toLowerCase());
                }
                return false;
            },
            message: function (props) {
                return `${props.value} is not a valid category for the selected transaction type`;
            }
        }
    }
}, {
    timestamps: true
});

// transactionSchema.pre('save', function(next) {
//     if (this.isModified('transaction_date') || this.isNew) {
//         if (typeof this.transaction_date === 'string' && this.transaction_date.includes('/')) {
//             const [day, month, year] = this.transaction_date.split('/').map(Number);
//             this.transaction_date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
//         }
//     }
//     next();
// });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;