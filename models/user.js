const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    user_name: {
        type: String,
        required: true,
        unique: true
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
    }
});

userSchema.pre('save', async function(next) {
    if (this.isModified('password') || this.isNew) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

module.exports = mongoose.model('User', userSchema);
