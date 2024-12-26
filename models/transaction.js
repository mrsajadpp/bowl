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
                const incomeCategories = [
                    "Housing", "Utilities", "Groceries", "Transportation", "Healthcare", "Entertainment", "Dining_Out", "Clothing",
                    "Education", "Travel", "Personal_Care", "Fitness", "Insurance", "Debt_Repayment", "Savings", "Investments",
                    "Technology", "Gifts", "Charity", "Childcare", "Pets", "Home_Improvement", "Subscriptions", "Legal_Fees",
                    "Events_and_Celebrations", "Professional_Services", "Taxes", "Luxury", "Hobbies", "Alcohol_and_Tobacco",
                    "Fines_and_Penalties", "Miscellaneous"
                ];
                const expenseCategories = [
                    "Salary", "Business_Revenue", "Freelancing", "Investments", "Rental_Income", "Government_Benefits", "Gifts",
                    "Inheritances", "Prizes", "Side_Hustles", "Royalties", "Crowdfunding", "Refunds", "Grants", "Scholarships",
                    "Tips", "Pension", "Dividends", "Alimony/Child_Support", "Stock_Sales", "Affiliate_Marketing", "Consulting_Fees",
                    "Event_Hosting", "Intellectual_Property", "Barter_or_Trade", "Cryptocurrency", "Reselling", "Loans",
                    "Partnership_Shares", "Carpool_Income", "Miscellaneous"
                ];
                
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