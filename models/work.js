const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    payment_status: {
        type: String,
        enum: ['pending', 'received'],
        required: true
    },
    work_date: {
        type: Date,
        required: true
    },
    payment_date: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            "creative",
            "technology",
            "business",
            "finance",
            "education",
            "healthcare",
            "engineering",
            "law",
            "manufacturing",
            "hospitality",
            "construction",
            "media",
            "retail",
            "customer_service",
            "transportation",
            "logistics",
            "administration",
            "sales",
            "marketing",
            "real_estate",
            "security",
            "skilled_trades",
            "maintenance",
            "agriculture",
            "food_service",
            "public_service",
            "delivery"
          ]
    }
}, {
    timestamps: true
});

const Work = mongoose.model('Work', workSchema);

module.exports = Work; 