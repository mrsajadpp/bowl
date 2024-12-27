const express = require('express');
const cookieSession = require('cookie-session');
const router = express.Router();
const Transaction = require('../models/transaction');
const User = require('../models/user');
const { default: mongoose } = require('mongoose');


router.get('/', async (req, res) => {
    try {
        res.status(500).render('index/index', {
            title: 'Bowl - Manage Your Finances Easily',
            metaDescription: 'Bowl helps you manage your finances effortlessly. Track your income and expenses with ease, and make smarter financial decisions.',
            layout: 'index_layout', error: null, message: null, auth_page: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('index/index', {
            title: 'Bowl - Manage Your Finances Easily',
            metaDescription: 'Bowl helps you manage your finances effortlessly. Track your income and expenses with ease, and make smarter financial decisions.',
            error: 'Server error', message: null, auth_page: true
        });
    }
});

router.get('/about', async (req, res) => {
    try {
        res.status(500).render('index/about', {
            title: 'About Bowl - Learn More About Us',
            metaDescription: 'Learn more about Bowl, the financial management platform designed to help you track and optimize your spending and income.',
            layout: 'index_layout', error: null, message: null, auth_page: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('index/about', {
            title: 'About Bowl - Learn More About Us',
            metaDescription: 'Learn more about Bowl, the financial management platform designed to help you track and optimize your spending and income.',
            error: 'Server error', message: null, auth_page: true
        });
    }
});

router.get('/terms-and-conditions', async (req, res) => {
    try {
        res.status(500).render('index/terms_and_conditions', {
            title: 'Terms and Conditions - Bowl',
            metaDescription: 'Read the terms and conditions for using the Bowl platform. These terms govern your use of our website and financial management services.',
            layout: 'index_layout', error: null, message: null, auth_page: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('index/terms_and_conditions', {
            title: 'Terms and Conditions - Bowl',
            metaDescription: 'Read the terms and conditions for using the Bowl platform. These terms govern your use of our website and financial management services.',
            error: 'Server error', message: null, auth_page: true
        });
    }
});

router.get('/privacy-policy', async (req, res) => {
    try {
        res.status(500).render('index/privacy_policy', {
            title: 'Privacy Policy - Bowl',
            metaDescription: 'Read Bowl’s privacy policy to understand how we collect, use, and protect your personal information while using our financial management platform.',
            layout: 'index_layout', error: null, message: null, auth_page: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('index/privacy_policy', {
            title: 'Privacy Policy - Bowl',
            metaDescription: 'Read Bowl’s privacy policy to understand how we collect, use, and protect your personal information while using our financial management platform.',
            error: 'Server error', message: null, auth_page: true
        });
    }
});


module.exports = router;
