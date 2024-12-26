const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const expenseCategories = [
    "Housing", "Utilities", "Groceries", "Transportation", "Healthcare", "Entertainment", "Dining Out", "Clothing",
    "Education", "Travel", "Personal Care", "Fitness", "Insurance", "Debt Repayment", "Savings", "Investments",
    "Technology", "Gifts", "Charity", "Childcare", "Pets", "Home Improvement", "Subscriptions", "Legal Fees",
    "Events & Celebrations", "Professional Services", "Taxes", "Luxury", "Hobbies", "Alcohol & Tobacco",
    "Fines & Penalties", "Miscellaneous"
];

const receiveCategories = [
    "Salary", "Business Revenue", "Freelancing", "Investments", "Rental Income", "Government Benefits", "Gifts",
    "Inheritances", "Prizes", "Side Hustles", "Royalties", "Crowdfunding", "Refunds", "Grants", "Scholarships",
    "Tips", "Pension", "Dividends", "Alimony/Child Support", "Stock Sales", "Affiliate Marketing", "Consulting Fees",
    "Event Hosting", "Intellectual Property", "Barter or Trade", "Cryptocurrency", "Reselling", "Loans",
    "Partnership Shares", "Carpool Income", "Miscellaneous"
];

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
        enum: ['expense', 'receive'],
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
        required: true,
        validate: {
            validator: function(value) {
                if (this.transaction_type === 'expense') {
                    return expenseCategories.includes(value);
                } else if (this.transaction_type === 'receive') {
                    return receiveCategories.includes(value);
                }
                return false;
            },
            message: props => `${props.value} is not a valid category for the transaction type ${props.instance.transaction_type}`
        }
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);
