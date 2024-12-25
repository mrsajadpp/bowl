const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const router = express.Router();

// GET route for signup page
router.get('/signup', (req, res) => {
    res.render('signup', { title: 'Signup' });
});

// GET route for login page
router.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

// Signup route
router.post('/signup', async (req, res) => {
    const { user_name, email, dob, password, position, profile_url } = req.body;
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        // Create new user
        const newUser = new User({ user_name, email, dob, password, position, profile_url });
        await newUser.save();

        // Save user to session
        req.session.user = newUser;
        res.status(201).send('User created successfully');
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send('User does not exist');
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }

        // Save user to session
        req.session.user = user;
        res.status(200).send('Logged in successfully');
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
