const express = require('express');
const cookieSession = require('cookie-session');
const router = express.Router();
const Transaction = require('../models/transaction');
const User = require('../models/user');
const { default: mongoose } = require('mongoose');

// Home route
router.get('/', async (req, res) => {
    try {
        const userId = req.session.user._id;

        // Check if user ID is valid
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).render('index', { title: 'Home', error: 'Invalid user ID', user: req.session.user, message: null });
        }

        // Check email verification status
        user.checkEmailVerification();

        // Aggregate data for full lifetime
        const totalReceived = await Transaction.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(userId), transaction_type: 'receive' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalLoss = await Transaction.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(userId), transaction_type: 'expense' } },
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
                    user_id: new mongoose.Types.ObjectId(userId),
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
                    user_id: new mongoose.Types.ObjectId(userId),
                    transaction_type: 'expense',
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
            error: null,
            message: null
        });
    } catch (err) {
        res.status(500).render('index', { title: 'Home', error: 'Server error', user: req.session.user, message: null });
    }
});

// Route to render the transaction form
router.get('/transaction_form', (req, res) => {
    res.render('transaction_form', { title: 'Transaction Form', error: null, form_data: {}, user: req.session.user, message: null });
});

// Route to handle form submission
router.post('/transactions', async (req, res) => {
    try {
        const { amount, transaction_type, transaction_date, note, category } = req.body;
        const userId = req.session.user._id;

        // Validate user ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).render('transaction_form', { title: 'Transaction Form', error: 'Invalid user ID', form_data: req.body, user: req.session.user, message: null });
        }

        // Check if all required fields are provided
        if (!amount) {
            return res.status(400).render('transaction_form', { title: 'Transaction Form', error: 'Amount is required', form_data: req.body, user: req.session.user, message: null });
        }
        if (!transaction_type) {
            return res.status(400).render('transaction_form', { title: 'Transaction Form', error: 'Transaction type is required', form_data: req.body, user: req.session.user, message: null });
        }
        if (!transaction_date) {
            return res.status(400).render('transaction_form', { title: 'Transaction Form', error: 'Transaction date is required', form_data: req.body, user: req.session.user, message: null });
        }
        if (!category) {
            return res.status(400).render('transaction_form', { title: 'Transaction Form', error: 'Category is required', form_data: req.body, user: req.session.user, message: null });
        }

        console.log(category);
        

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
        console.error(err);
        res.status(500).render('transaction_form', { title: 'Transaction Form', error: 'Server error', form_data: req.body, user: req.session.user, message: null });
    }
});

// Route to render the history page
router.get('/history', async (req, res) => {
    try {
        const userId = req.session.user._id;

        // Validate user ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).render('history', { title: 'History', error: 'Invalid user ID', user: req.session.user, message: null });
        }

        // Get a list of past months with transactions
        const transactions = await Transaction.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: {
                        year: { $year: '$transaction_date' },
                        month: { $month: '$transaction_date' }
                    }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } }
        ]);

        const months = transactions.map(t => ({
            year: t._id.year,
            month: t._id.month
        }));

        res.render('history', { title: 'History', months, user, error: null, message: null });
    } catch (err) {
        res.status(500).render('history', { title: 'History', error: 'Server error', user: req.session.user, message: null });
    }
});

// Route to get transaction details for a specific month and year
router.get('/history/:year/:month', async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { year, month } = req.params;

        // Validate user ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).render('history_details', { title: 'History Details', error: 'Invalid user ID', user: req.session.user, message: null });
        }

        // Get transactions for the specified month and year
        const transactions = await Transaction.find({
            user_id: new mongoose.Types.ObjectId(userId),
            $expr: {
                $and: [
                    { $eq: [{ $year: '$transaction_date' }, parseInt(year)] },
                    { $eq: [{ $month: '$transaction_date' }, parseInt(month)] }
                ]
            }
        }).sort({ transaction_date: 1 });

        // Aggregate data for the specified month
        const totalReceived = await Transaction.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId),
                    transaction_type: 'receive',
                    $expr: {
                        $and: [
                            { $eq: [{ $month: '$transaction_date' }, parseInt(month)] },
                            { $eq: [{ $year: '$transaction_date' }, parseInt(year)] }
                        ]
                    }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalLoss = await Transaction.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId),
                    transaction_type: 'expense',
                    $expr: {
                        $and: [
                            { $eq: [{ $month: '$transaction_date' }, parseInt(month)] },
                            { $eq: [{ $year: '$transaction_date' }, parseInt(year)] }
                        ]
                    }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalReceivedAmount = totalReceived.length > 0 ? totalReceived[0].total : 0;
        const totalLossAmount = totalLoss.length > 0 ? totalLoss[0].total : 0;
        const remainingAmount = totalReceivedAmount - totalLossAmount;

        // Group transactions by day and calculate daily totals
        const transactionsByDay = transactions.reduce((acc, transaction) => {
            const date = transaction.transaction_date.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = {
                    transactions: [],
                    totalReceived: 0,
                    totalLoss: 0,
                    remainingAmount: 0
                };
            }
            acc[date].transactions.push(transaction);
            if (transaction.transaction_type === 'receive') {
                acc[date].totalReceived += transaction.amount;
            } else if (transaction.transaction_type === 'expense') {
                acc[date].totalLoss += transaction.amount;
            }
            acc[date].remainingAmount = acc[date].totalReceived - acc[date].totalLoss;
            return acc;
        }, {});

        res.render('history_details', {
            title: `History for ${month}/${year}`,
            transactionsByDay,
            totalReceived: totalReceivedAmount,
            totalLoss: totalLossAmount,
            remainingAmount,
            user,
            error: null
        });
    } catch (err) {
        res.status(500).render('history_details', { title: 'History Details', error: 'Server error', user: req.session.user, message: null });
    }
});

router.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/auth/login');
});

module.exports = router;
