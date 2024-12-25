const express = require('express');
const cookieSession = require('cookie-session');
const router = express.Router();
const Transaction = require('../models/transaction');
const User = require('../models/user');

// Home route
router.get('/', async (req, res) => {
    try {
        const userId = req.session.user._id;

        // Check if user ID is valid
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).render('index', { title: 'Home', error: 'Invalid user ID' });
        }

        const totalReceived = await Transaction.aggregate([
            { $match: { user_id: userId, transaction_type: 'receive' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalLoss = await Transaction.aggregate([
            { $match: { user_id: userId, transaction_type: 'loss' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalReceivedAmount = totalReceived.length > 0 ? totalReceived[0].total : 0;
        const totalLossAmount = totalLoss.length > 0 ? totalLoss[0].total : 0;

        res.render('index', { title: 'Home', totalReceived: totalReceivedAmount, totalLoss: totalLossAmount, user, error: null });
    } catch (err) {
        res.status(500).render('index', { title: 'Home', error: 'Server error' });
    }
});

module.exports = router;
