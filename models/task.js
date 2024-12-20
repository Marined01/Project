const mongoose = require('mongoose');

// Схема для задач
const taskSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
    },
    number: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        default: "pending",
    },
    progress: {
        type: Number,
        default: 0,
    },
    result: {
        type: String,
        default: null,
    }
}, { timestamps: true });


module.exports = mongoose.model('Task', taskSchema);
