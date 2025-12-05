const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    value: {
        type: Number,
        required: true
    }
}, {
    timestamps: true // This adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Record', recordSchema);
