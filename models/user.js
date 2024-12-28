const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const moment = require('moment');
const Transaction = require('./transaction');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cron = require('node-cron');

const userSchema = new mongoose.Schema({
    user_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    dob: {
        type: Date,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    profile_url: {
        type: String,
        required: true
    },
    sex: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    status: {
        type: Boolean,
        default: true,
        required: true
    },
    email_verified: {
        type: Boolean,
        default: false,
        required: true
    },
    verificationCode: {
        type: String
    },
    verificationCodeCreatedAt: {
        type: Date
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    }
});

const User =mongoose.model('User', userSchema);

userSchema.pre('save', async function(next) {
    if (this.isModified('password') || this.isNew) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Method to set status to false if email_verified is false after 24 hours
userSchema.methods.checkEmailVerification = function() {
    const user = this;
    if (!user.email_verified) {
        const createdAt = user._id.getTimestamp();
        const currentTime = new Date();
        const timeDifference = currentTime - createdAt;
        const hoursDifference = timeDifference / (1000 * 60 * 60);

        if (hoursDifference > 24) {
            user.status = false;
            user.save();
        }
    }
};

// Method to send verification email
userSchema.methods.sendVerificationEmail = async function() {
    const user = this;
    user.verificationCode = crypto.randomBytes(20).toString('hex');
    user.verificationCodeCreatedAt = new Date();
    await user.save();

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'noreply.tikketu@gmail.com',
            pass: process.env.APP_PASS
        }
    });

    const verificationUrl = `https://bowl.grovixlab.com/auth/verify-email?userId=${user._id}&verificationCode=${user.verificationCode}`;

    const mailOptions = {
        from: 'Bowl. <noreply.tikketu@gmail.com>',
        to: user.email,
        subject: 'Email Verification',
        text: `Please verify your email by clicking the following link: ${verificationUrl}`
    };

    await transporter.sendMail(mailOptions);
};

// Method to send password reset email
userSchema.methods.sendResetEmail = async function(resetToken) {
    const user = this;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'noreply.tikketu@gmail.com',
            pass: process.env.APP_PASS
        }
    });

    const resetUrl = `https://bowl.grovixlab.com/auth/reset-password/${resetToken}`;

    const mailOptions = {
        from: 'Bowl. <noreply.tikketu@gmail.com>',
        to: user.email,
        subject: 'Password Reset',
        text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}. This link will expire in 6 minutes.`
    };

    await transporter.sendMail(mailOptions);
};


// Weekly report

async function generateWeeklyReport() {
    const oneWeekAgo = moment().subtract(7, 'days').toDate();
    const users = await User.find({ email_verified: true });

    for (const user of users) {
        const transactions = await Transaction.find({
            user_id: user._id,
            transaction_date: { $gte: oneWeekAgo }
        });

        if (transactions.length === 0) continue;

        // Categorize transactions
        const report = transactions.reduce((acc, transaction) => {
            if (!acc[transaction.transaction_type]) {
                acc[transaction.transaction_type] = {};
            }
            if (!acc[transaction.transaction_type][transaction.category]) {
                acc[transaction.transaction_type][transaction.category] = 0;
            }
            acc[transaction.transaction_type][transaction.category] += transaction.amount;
            return acc;
        }, {});

        // Generate a summary
        const summary = generateSummaryString(report);

        // Send the email
        await sendWeeklyEmail(user.email, summary);
    }
}

function generateSummaryString(report) {
    let summary = 'Your Weekly Financial Summary:\n\n';

    for (const [type, categories] of Object.entries(report)) {
        summary += `\n${type === 'income' ? 'Income Sources' : 'Expenses'}:\n`;
        for (const [category, total] of Object.entries(categories)) {
            summary += `- ${category}: ₹${total.toFixed(2)}\n`;
        }
    }

    return summary;
}

async function sendWeeklyEmail(to, summary) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'noreply.tikketu@gmail.com',
            pass: process.env.APP_PASS
        }
    });

    const mailOptions = {
        from: 'Bowl. <noreply.tikketu@gmail.com>',
        to,
        subject: 'Weekly Financial Summary',
        text: summary
    };

    await transporter.sendMail(mailOptions);
}


cron.schedule('0 8 * * 0', async () => {
    console.log('Running weekly report job...');
    try {
        await generateWeeklyReport();
        console.log('Weekly reports sent successfully!');
    } catch (error) {
        console.error('Error sending weekly reports:', error);
    }
});

module.exports = User;
