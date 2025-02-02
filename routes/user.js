const express = require('express');
const cookieSession = require('cookie-session');
const router = express.Router();
const Transaction = require('../models/transaction');
const logger = require('../logger');
const User = require('../models/user');
const { default: mongoose } = require('mongoose');


function convertToISO(dateString) {
    const [day, month, year] = dateString.split('/');  // Split the string into day, month, and year
    // Construct the ISO string with 00:00:00.000Z time
    const isoDateString = `${year}-${month}-${day}T00:00:00.000Z`;
    return isoDateString;  // Return the ISO formatted string
}

// Home route
router.get('/home', async (req, res) => {
    try {
        const userId = req.session.user._id;

        // Check if user ID is valid
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).render('index', { title: 'Home', error: 'Invalid user ID', user: req.session.user, message: null, auth_page: null });
        }

        // Check email verification status
        user.checkEmailVerification();

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Start of today
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // End of today

        // Aggregate data for today
        const totalReceivedToday = await Transaction.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId),
                    transaction_type: 'income',
                    transaction_date: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalLossToday = await Transaction.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId),
                    transaction_type: 'expense',
                    transaction_date: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalReceivedAmountToday = totalReceivedToday.length > 0 ? totalReceivedToday[0].total : 0;
        const totalLossAmountToday = totalLossToday.length > 0 ? totalLossToday[0].total : 0;
        const remainingAmountToday = totalReceivedAmountToday - totalLossAmountToday;

        // Aggregate data for full lifetime
        const totalReceived = await Transaction.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(userId), transaction_type: 'income' } },
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

        const lastMonth = new Date().getMonth() + 1;
        const lastMonthYear = new Date().getFullYear();

        const totalReceivedMonth = await Transaction.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId),
                    transaction_type: 'income',
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

        // Most spent category this month
        const mostSpentCategoryThisMonth = await Transaction.aggregate([
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
            { $group: { _id: '$category', total: { $sum: '$amount' } } },
            { $sort: { total: -1 } },
            { $limit: 1 }
        ]);

        const mostSpentCategory = mostSpentCategoryThisMonth.length > 0 ? mostSpentCategoryThisMonth[0] : { _id: null, total: 0 };

        // Most received category last month
        const mostReceivedCategoryLastMonth = await Transaction.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId),
                    transaction_type: 'income',
                    $expr: {
                        $and: [
                            { $eq: [{ $month: '$transaction_date' }, lastMonth] },
                            { $eq: [{ $year: '$transaction_date' }, lastMonthYear] }
                        ]
                    }
                }
            },
            { $group: { _id: '$category', total: { $sum: '$amount' } } },
            { $sort: { total: -1 } },
            { $limit: 1 }
        ]);

        const mostReceivedCategory = mostReceivedCategoryLastMonth.length > 0 ? mostReceivedCategoryLastMonth[0] : { _id: null, total: 0 };

        res.render('index', {
            title: 'Home',
            totalReceived: totalReceivedAmount,
            totalLoss: totalLossAmount,
            remainingAmount,
            mostSpentCategoryThisMonth: mostSpentCategory._id,
            mostSpentCategoryAmount: mostSpentCategory.total,
            mostReceivedCategoryLastMonth: mostReceivedCategory._id,
            mostReceivedCategoryAmount: mostReceivedCategory.total,
            totalReceivedMonth: totalReceivedAmountMonth,
            totalLossMonth: totalLossAmountMonth,
            remainingAmountMonth,
            totalReceivedToday: totalReceivedAmountToday,
            totalLossToday: totalLossAmountToday,
            remainingAmountToday,
            user,
            error: null,
            message: null,
            auth_page: null
        });
    } catch (err) {
        console.log(err);
        logger.logError(err);
        res.status(500).render('index', { title: 'Home', error: 'Server error', user: req.session.user, message: null, auth_page: null });
    }
});

// Route to render the transaction form
router.get('/transaction_form', (req, res) => {
    res.render('transaction_form', { title: 'Transaction Form', error: null, form_data: {}, user: req.session.user, message: null, auth_page: null });
});

router.post('/transactions', async (req, res) => {
    try {
        const { transaction_date } = req.body;
        const userId = req.session.user._id;

        // Validate user ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).render('transaction_form', {
                title: 'Transaction Form',
                error: 'Invalid user ID',
                form_data: req.body,
                user: req.session.user,
                message: null,
                auth_page: null
            });
        }

        // Validate transaction date
        if (!transaction_date) {
            return res.status(400).render('transaction_form', {
                title: 'Transaction Form',
                error: 'Transaction date is required',
                form_data: req.body,
                user: req.session.user,
                message: null,
                auth_page: null
            });
        }

        // Validate and save each transaction entry
        const transactions = Array.isArray(req.body.amount)
            ? req.body.amount.map((_, index) => ({
                amount: req.body.amount[index],
                transaction_type: req.body.transaction_type[index],
                // Make transaction_note optional with default empty string
                transaction_note: req.body.transaction_note ? req.body.transaction_note[index] || '' : '',
                category: req.body.category[index]
            }))
            : [{
                amount: req.body.amount,
                transaction_type: req.body.transaction_type,
                // Make transaction_note optional with default empty string
                transaction_note: req.body.transaction_note || '',
                category: req.body.category
            }];

        // Validate required fields and save transactions
        for (const transaction of transactions) {
            if (!transaction.amount || !transaction.transaction_type || !transaction.category) {
                return res.status(400).render('transaction_form', {
                    title: 'Transaction Form',
                    error: 'Amount, type, and category are required for each transaction',
                    form_data: req.body,
                    user: req.session.user,
                    message: null,
                    auth_page: null
                });
            }

            const newTransaction = new Transaction({
                user_id: userId,
                amount: transaction.amount,
                transaction_type: transaction.transaction_type,
                transaction_date: convertToISO(transaction_date),
                transaction_note: transaction.transaction_note,
                category: transaction.category
            });

            await newTransaction.save();
        }

        res.redirect('/app/home');
    } catch (err) {
        console.error(err);
        logger.logError(err);
        res.status(500).render('transaction_form', {
            title: 'Transaction Form',
            error: 'Server error',
            form_data: req.body,
            user: req.session.user,
            message: null,
            auth_page: null
        });
    }
});


// Route to render the history page
router.get('/history', async (req, res) => {
    try {
        const userId = req.session.user._id;

        // Validate user ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).render('history', { title: 'History', error: 'Invalid user ID', user: req.session.user, message: null, auth_page: null });
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

        res.render('history', { title: 'History', months, user, error: null, message: null, auth_page: null });
    } catch (err) {
        logger.logError(err);
        res.status(500).render('history', { title: 'History', error: 'Server error', user: req.session.user, message: null, auth_page: null });
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
            return res.status(400).render('history_details', { title: 'History Details', error: 'Invalid user ID', user: req.session.user, message: null, auth_page: null });
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
                    transaction_type: 'income',
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
            if (transaction.transaction_type === 'income') {
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
            error: null,
            message: null,
            auth_page: null
        });
    } catch (err) {
        logger.logError(err);
        res.status(500).render('history_details', { title: 'History Details', error: 'Server error', user: req.session.user, message: null, auth_page: null });
    }
});

router.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/auth/login');
});

module.exports = router;
