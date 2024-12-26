const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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
        type: String,
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

userSchema.pre('save', async function(next) {
    if (this.isModified('password') || this.isNew) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

userSchema.pre('save', function(next) {
    if (this.isModified('dob') || this.isNew) {
        if (typeof this.dob === 'string' && this.dob.includes('/')) {
            const [day, month, year] = this.dob.split('/').map(Number);
            this.dob = new Date(year, month - 1, day);
        }
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

    const verificationUrl = `http://192.168.1.60:3000/auth/verify-email?userId=${user._id}&verificationCode=${user.verificationCode}`;

    const mailOptions = {
        from: 'your-email@gmail.com',
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

    const resetUrl = `http://192.168.1.60:3000/auth/reset-password/${resetToken}`;

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: user.email,
        subject: 'Password Reset',
        text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}. This link will expire in 6 minutes.`
    };

    await transporter.sendMail(mailOptions);
};

module.exports = mongoose.model('User', userSchema);
