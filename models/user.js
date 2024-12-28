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

const User = mongoose.model('User', userSchema);

userSchema.pre('save', async function (next) {
    if (this.isModified('password') || this.isNew) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Method to set status to false if email_verified is false after 24 hours
userSchema.methods.checkEmailVerification = function () {
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
userSchema.methods.sendVerificationEmail = async function () {
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
userSchema.methods.sendResetEmail = async function (resetToken) {
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

function formatCategoryName(category) {
    return category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

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
        await sendWeeklyEmail(user.email, user.user_name, summary);
    }
}

function generateSummaryString(report) {
    let summary = 'Your Weekly Financial Summary:<br><br>';

    for (const [type, categories] of Object.entries(report)) {
        summary += `\n${type === 'income' ? 'Income Sources' : 'Expenses'}:<br>`;
        for (const [category, total] of Object.entries(categories)) {
            summary += `- ${formatCategoryName(category)}: ₹${total.toFixed(2)}<br>`;
        }
    }

    return summary;
}


async function sendWeeklyEmail(to, userName, summary) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'noreply.tikketu@gmail.com',
            pass: process.env.APP_PASS
        }
    });

    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
                .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px; }
                .content { font-size: 16px; color: #333333; line-height: 1.6; text-align: left; }
                .content p { margin: 10px 0; }
                .footer { text-align: center; font-size: 12px; color: #888888; padding: 20px; }
                .footer img { margin-top: 10px; height: 30px; }
            </style>
        </head>
        <body>
            <table class="container" align="center">
                <tr>
                    <td class="content">
                        <p>Dear <strong>${userName}</strong>,</p>
                        <p>Here’s your weekly financial report:</p>
                        ${summary}
                        <p>To view a detailed breakdown of your transactions, please log in to your Bowl account.</p>
                        <p>We hope this report helps you manage your finances effectively. Thank you for using Bowl!</p>
                        <p>Warm regards,<br>The Bowl Team</p>
                    </td>
                </tr>
                <tr>
                    <td class="footer">
                        <img src="https://bowl.grovixlab.com/logo/logo.png" alt="Bowl Logo">
                        <p>© Bowl by Grovix Lab. All rights reserved.</p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    const mailOptions = {
        from: 'Bowl. <noreply.tikketu@gmail.com>',
        to,
        subject: 'Weekly Financial Summary',
        html: emailHtml
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
