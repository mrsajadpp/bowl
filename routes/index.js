const express = require('express');
const cookieSession = require('cookie-session');
const router = express.Router();
const Transaction = require('../models/transaction');
const User = require('../models/user');
const { default: mongoose } = require('mongoose');


router.get('/', async (req, res) => {
    try {
        res.status(500).render('index/index', { title: 'Bowl.', layout: 'index_layout', error: null, message: null, auth_page: true });
    } catch (err) {
        console.error(err);
        res.status(500).render('index/index', { title: 'Bowl.', error: 'Server error', message: null, auth_page: true });
    }
});

router.get('/about', async (req, res) => {
    try {
        res.status(500).render('index/about', { title: 'Bowl.', layout: 'index_layout', error: null, message: null, auth_page: true });
    } catch (err) {
        console.error(err);
        res.status(500).render('index/about', { title: 'Bowl.', error: 'Server error', message: null, auth_page: true });
    }
});

router.get('/terms-and-conditions', async (req, res) => {
    try {
        res.status(500).render('index/terms_and_conditions', { title: 'Bowl.', layout: 'index_layout', error: null, message: null, auth_page: true });
    } catch (err) {
        console.error(err);
        res.status(500).render('index/terms_and_conditions', { title: 'Bowl.', error: 'Server error', message: null, auth_page: true });
    }
});

router.get('/privacy-policy', async (req, res) => {
    try {
        res.status(500).render('index/privacy_policy', { title: 'Bowl.', layout: 'index_layout', error: null, message: null, auth_page: true });
    } catch (err) {
        console.error(err);
        res.status(500).render('index/privacy_policy', { title: 'Bowl.', error: 'Server error', message: null, auth_page: true });
    }
});


module.exports = router;
