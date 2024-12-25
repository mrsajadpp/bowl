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

        // Aggregate data for full lifetime
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
        const remainingAmount = totalReceivedAmount - totalLossAmount;

        // Aggregate data for the current month
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const totalReceivedMonth = await Transaction.aggregate([
            { 
                $match: { 
                    user_id: userId, 
                    transaction_type: 'receive',
                    $expr: { 
                        $and: [
                            { $eq: [{ $month: '$transaction_date' }, currentMonth] },
                            { $eq: [{ $year: '$transaction_date' }, currentYear] }
                        ]
                    }
                } 
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalLossMonth = await Transaction.aggregate([
            { 
                $match: { 
                    user_id: userId, 
                    transaction_type: 'loss',
                    $expr: { 
                        $and: [
                            { $eq: [{ $month: '$transaction_date' }, currentMonth] },
                            { $eq: [{ $year: '$transaction_date' }, currentYear] }
                        ]
                    }
                } 
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalReceivedAmountMonth = totalReceivedMonth.length > 0 ? totalReceivedMonth[0].total : 0;
        const totalLossAmountMonth = totalLossMonth.length > 0 ? totalLossMonth[0].total : 0;
        const remainingAmountMonth = totalReceivedAmountMonth - totalLossAmountMonth;

        res.render('index', { 
            title: 'Home', 
            totalReceived: totalReceivedAmount, 
            totalLoss: totalLossAmount, 
            remainingAmount, 
            totalReceivedMonth: totalReceivedAmountMonth, 
            totalLossMonth: totalLossAmountMonth, 
            remainingAmountMonth, 
            user, 
            error: null 
        });
    } catch (err) {
        res.status(500).render('index', { title: 'Home', error: 'Server error' });
    }
});

// Route to render the transaction form
router.get('/transaction_form', (req, res) => {
    res.render('transaction_form', { title: 'Transaction Form', error: null });
});

// Route to handle form submission
router.post('/transactions', async (req, res) => {
    try {
        const { amount, transaction_type, transaction_date, note, category } = req.body;
        const userId = req.session.user._id;

        // Validate user ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).render('transaction_form', { title: 'Transaction Form', error: 'Invalid user ID' });
        }

        // Check if all required fields are provided
        if (!amount) {
            return res.status(400).render('transaction_form', { title: 'Transaction Form', error: 'Amount is required' });
        }
        if (!transaction_type) {
            return res.status(400).render('transaction_form', { title: 'Transaction Form', error: 'Transaction type is required' });
        }
        if (!transaction_date) {
            return res.status(400).render('transaction_form', { title: 'Transaction Form', error: 'Transaction date is required' });
        }
        if (!category) {
            return res.status(400).render('transaction_form', { title: 'Transaction Form', error: 'Category is required' });
        }

        const newTransaction = new Transaction({
            user_id: userId,
            amount,
            transaction_type,
            transaction_date,
            note,
            category
        });

        await newTransaction.save();
        res.redirect('/');
    } catch (err) {
        res.status(500).render('transaction_form', { title: 'Transaction Form', error: 'Server error' });
    }
});

module.exports = router;
