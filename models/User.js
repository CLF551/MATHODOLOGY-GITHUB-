const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ['student', 'teacher','admin'], default: 'student' },
    grade: { type: Number, enum: [1, 2], default: 1 }, 
    class: {
        type: String,
        enum: ['1A', '1B', '1C', '1D', '2A', '2B', '2C', '2D'],  
        required: function() { return this.role === 'student' } 
    },
    scores: [{
        question: String,
        userAnswer: String,
        isCorrect: Boolean,
        category: String,
        subCategory: String,
        timestamp: { type: Date, default: Date.now },
        optionsWithLabels: [{
            label: String,
            content: String
        }],
        answerType: { type: String, enum: ['text', 'choice'], default: 'text' }
    }]
});

module.exports = mongoose.model('User', userSchema);