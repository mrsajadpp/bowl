const express = require('express');
const cookieSession = require('cookie-session');
const router = express.Router();
const Transaction = require('../models/transaction');
const User = require('../models/user');
const { default: mongoose } = require('mongoose');


router.get('/', async (req, res) => {
    try {
        res.render('index/index', {
            layout: 'index_layout',
            title: 'Bowl - Manage Your Finances Easily',
            metaDescription: 'Bowl helps you manage your finances effortlessly. Track your income and expenses with ease, and make smarter financial decisions.',
            error: null, message: null, auth_page: true, req: req
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('index/index', {
            title: 'Bowl - Manage Your Finances Easily',
            metaDescription: 'Bowl helps you manage your finances effortlessly. Track your income and expenses with ease, and make smarter financial decisions.',
            error: 'Server error', message: null, auth_page: true, req: req
        });
    }
});

router.get('/about', async (req, res) => {
    try {
        res.render('index/about', {
            title: 'About Bowl - Learn More About Us',
            metaDescription: 'Learn more about Bowl, the financial management platform designed to help you track and optimize your spending and income.',
            layout: 'index_layout', error: null, message: null, auth_page: true, req: req
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('index/about', {
            title: 'About Bowl - Learn More About Us',
            metaDescription: 'Learn more about Bowl, the financial management platform designed to help you track and optimize your spending and income.',
            error: 'Server error', message: null, auth_page: true, req: req
        });
    }
});

router.get('/terms-and-conditions', async (req, res) => {
    try {
        res.render('index/terms_and_conditions', {
            title: 'Terms and Conditions - Bowl',
            metaDescription: 'Read the terms and conditions for using the Bowl platform. These terms govern your use of our website and financial management services.',
            layout: 'index_layout', error: null, message: null, auth_page: true, req: req
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('index/terms_and_conditions', {
            title: 'Terms and Conditions - Bowl',
            metaDescription: 'Read the terms and conditions for using the Bowl platform. These terms govern your use of our website and financial management services.',
            error: 'Server error', message: null, auth_page: true, req: req
        });
    }
});

router.get('/privacy-policy', async (req, res) => {
    try {
        res.render('index/privacy_policy', {
            title: 'Privacy Policy - Bowl',
            metaDescription: 'Read Bowl’s privacy policy to understand how we collect, use, and protect your personal information while using our financial management platform.',
            layout: 'index_layout', error: null, message: null, auth_page: true, req: req
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('index/privacy_policy', {
            title: 'Privacy Policy - Bowl',
            metaDescription: 'Read Bowl’s privacy policy to understand how we collect, use, and protect your personal information while using our financial management platform.',
            error: 'Server error', message: null, auth_page: true, req: req
        });
    }
});


// Sitemap route
router.get('/sitemap.xml', (req, res) => {
    try {
        const urls = [
            { loc: 'https://bowl.grovixlab.com/', priority: 1.0 },
            { loc: 'https://bowl.grovixlab.com/about', priority: 1.0 },
            { loc: 'https://bowl.grovixlab.com/auth/login', priority: 1.0 },
            { loc: 'https://bowl.grovixlab.com/privacy-policy', priority: 1.0 },
            { loc: 'https://bowl.grovixlab.com/terms-and-conditions', priority: 1.0 },
            { loc: 'https://bowl.grovixlab.com/auth/reset-password', priority: 1.0 },
            { loc: 'https://bowl.grovixlab.com/auth/signup', priority: 1.0 },
        ];

        const currentDate = new Date().toISOString();

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset
        xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
              http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;

        urls.forEach((url) => {
            sitemap += `
        <url>
          <loc>${url.loc}</loc>
          <lastmod>${currentDate}</lastmod>
          <changefreq>daily</changefreq>
          <priority>${url.priority.toFixed(2)}</priority>
        </url>`;
        });

        sitemap += '\n</urlset>';

        // Set response header to XML
        res.header('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Route for robots.txt
router.get('/robots.txt', (req, res) => {
    try {
        const robotsTxt = `
User-agent: *
Allow: /*
Disallow: /app/*

Sitemap: https://bowl.grovixlab.com/sitemap.xml
`;
        res.header('Content-Type', 'text/plain');
        res.send(robotsTxt.trim());
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});


module.exports = router;
