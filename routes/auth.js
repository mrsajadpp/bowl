const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const router = express.Router();

// GET route for signup page
router.get('/signup', (req, res) => {
    res.render('signup', { title: 'Signup', error: null });
});

// GET route for login page
router.get('/login', (req, res) => {
    res.render('login', { title: 'Login', error: null });
});

// Signup route
router.post('/signup', async (req, res) => {
    const { user_name, email, dob, password, position, profile_url } = req.body;
    try {
        // Validate user_name
        if (!user_name || user_name.length < 3) {
            return res.status(400).render('signup', { title: 'Signup', error: 'Invalid username' });
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).render('signup', { title: 'Signup', error: 'Invalid email' });
        }

        // Validate dob
        if (!dob || new Date(dob) > new Date()) {
            return res.status(400).render('signup', { title: 'Signup', error: 'Invalid date of birth' });
        }

        // Validate password
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
        if (!password || !passwordRegex.test(password)) {
            return res.status(400).render('signup', { title: 'Signup', error: 'Password must be at least 6 characters long and contain alphabets, numbers, and special symbols' });
        }

        // Validate position
        if (!position) {
            return res.status(400).render('signup', { title: 'Signup', error: 'Position is required' });
        }

        // Validate profile_url
        const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
        if (!profile_url || !urlRegex.test(profile_url)) {
            return res.status(400).render('signup', { title: 'Signup', error: 'Invalid profile URL' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).render('signup', { title: 'Signup', error: 'User already exists' });
        }

        // Create new user
        const newUser = new User({ user_name, email, dob, password, position, profile_url });
        await newUser.save();

        // Remove password from user object before adding to session
        const userWithoutPassword = newUser.toObject();
        delete userWithoutPassword.password;

        // Save user to session
        req.session.user = userWithoutPassword;
        res.status(201).send('User created successfully');
    } catch (err) {
        res.status(500).render('signup', { title: 'Signup', error: 'Server error' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).render('login', { title: 'Login', error: 'Invalid email' });
        }

        // Validate password
        if (!password) {
            return res.status(400).render('login', { title: 'Login', error: 'Password is required' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).render('login', { title: 'Login', error: 'User does not exist' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).render('login', { title: 'Login', error: 'Invalid credentials' });
        }

        // Remove password from user object before adding to session
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        // Save user to session
        req.session.user = userWithoutPassword;
        res.status(200).send('Logged in successfully');
    } catch (err) {
        res.status(500).render('login', { title: 'Login', error: 'Server error' });
    }
});

module.exports = router;
