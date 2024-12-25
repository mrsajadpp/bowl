const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cookieSession = require('cookie-session');
const expressLayouts = require('express-ejs-layouts');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Use cookie-session middleware
app.use(cookieSession({
    name: 'session',
    keys: ['hi@23', 'hello@23'],
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
}));

// Middleware to check if user is already logged in
function checkLoggedIn(req, res, next) {
    if (!req.session.user) {
        return next();
    }
    return res.redirect('/auth/login');
}

// Middleware to check if user is not logged in
function checkNotLoggedIn(req, res, next) {
    if (req.session.user) {
        return next();
    }
    return res.redirect('/auth/login');
}

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
app.use('/auth', checkLoggedIn, authRouter);
app.use('/', checkNotLoggedIn, indexRouter);

// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
