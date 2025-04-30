const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;


const uri = 'mongodb+srv://admin:admin@cluster0.4kndk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});


mongoose.connection.on('connected', () => {
    console.log('Success connet to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('failed to connect database:', err);
});


async function initAdminUser() {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin', 10);
            const admin = new User({
                username: 'admin',
                password: hashedPassword,
                role: 'admin'
            });
            await admin.save();
            console.log('Admin user created successfully');
        }
    } catch (error) {
        console.error('Failed to initialize admin user:', error);
    }
}


mongoose.connection.once('open', () => {
    console.log('MongoDB connected');
    initAdminUser();
});






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
        isLate: { type: Boolean, default: false }, 
        setId: { type: String, default: null } 
    }]
});
const User = mongoose.model('User', userSchema);



const questionSchema = new mongoose.Schema({
    text: String,
    answer: String,
    options: [String],
    optionsWithLabels: [{
        label: String,
        content: String
    }],
    answerType: { type: String, enum: ['text', 'choice'], default: 'text' },
    grade: { type: Number, enum: [1, 2], default: 1 }, 
    category: { 
        type: String, 
        enum: [
         
            'numbers_to_20',
            'hard_numbers_to_20',
            'basic_operations',
            'hard_basic_operations',
            'numbers_to_100',
            'hard_numbers_to_100',
            'measurement',
            'hard_measurement',
            'money',
            'hard_money',
            'time',
            'hard_time',
            'geometry_2d',
            'hard_geometry_2d',
            'geometry_3d',
            'hard_geometry_3d',
            'positions',
            'hard_positions',
            'calendar',
            'hard_calendar',
         
            'p2_addition',
            'p2_hard_addition',
            'p2_subtraction',
            'p2_hard_subtraction',
            'p2_angles',
            'p2_directions',
            'p2_multiplication',
            'p2_hard_multiplication',
            'p2_time',
            'p2_date',
            'p2_shapes',
            'p2_mixed_operations',
            'p2_hard_mixed_ops',
            'p2_division',
            'p2_hard_division',
            'p2_pictograms',
            'p2_measurement',
            'p2_money'
        ]
    },
    subCategory: String,
    difficulty: { type: Number, min: 1, max: 3, default: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timeLimit: { type: Number, default: 0 },
    targetClasses: {
        type: [String],
        enum: ['1A', '1B', '1C', '1D', '2A', '2B', '2C', '2D', 'all','p1-all','p2-all'], 
        default: ['all']
    },
    isPublic: { type: Boolean, default: true },
    setId: { type: String, default: null },
    setName: { type: String, default: null },
    deadline: { type: Date, default: null } 
});

const Question = mongoose.model('Question', questionSchema);






app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});


app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});


app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});


app.get('/student', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'student.html'));
});


app.get('/teacher', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'teacher.html'));
});


app.get('/materials', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'materials.html'));
});


app.get('/materials/:topic', (req, res) => {
    const topic = req.params.topic;
    const filePath = path.join(__dirname, 'HTML Files', `${topic}.html`);
    res.sendFile(filePath);
});


app.get('/practice', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'practice.html'));
});


app.post('/api/practice-questions', (req, res) => {
    const { category, count } = req.body;
    
    if (!category) {
        return res.status(400).json({ 
            success: false, 
            message: 'No question category provided' 
        });
    }
    
    try {
        
        const questions = generateQuestions(category);
        
        
        const limitedQuestions = count ? questions.slice(0, count) : questions;
        
        res.json({
            success: true,
            questions: limitedQuestions
        });
    } catch (error) {
        console.error('Error generating practice questions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate practice questions'
        });
    }
});

app.post('/register', async (req, res) => {
    const { username, password, role, grade, class: studentClass } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userData = {
            username,
            password: hashedPassword,
            role,
            grade: parseInt(grade) || 1
        };

        
        if (role === 'student') {
            if (!studentClass) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'student must choose class' 
                });
            }
            userData.class = studentClass;
        }

        const user = new User(userData);
        await user.save();
        
        res.json({ 
            success: true, 
            message: 'register success' 
        });
    } catch (err) {
        if (err.code === 11000) { 
            res.status(400).json({ 
                success: false, 
                message: 'Username already exists' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to register,try again later' 
            });
        }
    }
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        res.json({ success: true, role: user.role });
    } else {
        res.status(400).json({ success: false, message: 'Invalid username or password.' });
    }
});



app.get('/user-info', async (req, res) => {
    try {
        const { username } = req.query;
        
        if (!username) {
            return res.status(400).json({ success: false, message: 'No username data' });
        }
        
        const user = await User.findOne({ username }, 'username role grade class');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not exist' });
        }
        
        res.json({ 
            success: true, 
            user: {
                username: user.username,
                role: user.role,
                grade: user.grade,
                class: user.class
            }
        });
    } catch (error) {
        console.error('Failed to get user data:', error);
        res.status(500).json({ success: false, message: 'Failed to get user data' });
    }
});


app.get('/get-student-performance', async (req, res) => {
    try {
        const { username } = req.query;
        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'Cannot find user' });
        }

        
        const categoryStats = {};
        for (const score of user.scores) {
            if (!categoryStats[score.category]) {
                categoryStats[score.category] = {
                    total: 0,
                    correct: 0,
                    questions: []
                };
            }
            categoryStats[score.category].total++;
            if (score.isCorrect) categoryStats[score.category].correct++;

            
            let originalQuestion = null;
            try {
                originalQuestion = await Question.findOne({
                    text: score.question,
                    category: score.category
                });
            } catch (err) {
                console.log('Error finding original question:', err);
            }

            
            let optionsWithLabels = [];
            let options = [];
            let answerType = score.answerType || 'text';
            let correctAnswer = ''; 
            
            
            if (score.optionsWithLabels && score.optionsWithLabels.length > 0) {
                optionsWithLabels = score.optionsWithLabels;
                answerType = 'choice';
            } 
            
            else if (originalQuestion) {
                answerType = originalQuestion.answerType || 'text';
                
                if (originalQuestion.optionsWithLabels && originalQuestion.optionsWithLabels.length > 0) {
                    optionsWithLabels = originalQuestion.optionsWithLabels;
                } 
                else if (originalQuestion.options && originalQuestion.options.length > 0) {
                    options = originalQuestion.options;
                    optionsWithLabels = originalQuestion.options.map((content, index) => ({
                        label: String.fromCharCode(65 + index),
                        content: content
                    }));
                }
                
                
                correctAnswer = originalQuestion.answer;
            }

            
            categoryStats[score.category].questions.push({
                question: score.question,
                userAnswer: score.userAnswer,
                isCorrect: score.isCorrect,
                timestamp: score.timestamp,
                optionsWithLabels: optionsWithLabels,
                options: options,
                answerType: answerType,
                isLate: score.isLate || false,
                correctAnswer: correctAnswer, 
                setId: score.setId || null 
            });
        }

        res.json({
            success: true,
            stats: categoryStats,
            totalQuestions: user.scores.length,
            totalCorrect: user.scores.filter(s => s.isCorrect).length
        });
    } catch (error) {
        console.error('Error getting student performance:', error);
        res.status(500).json({ success: false, message: 'Fail to get result' });
    }
});




app.get('/get-question-history', async (req, res) => {
    try {
        const { category } = req.query;
        const query = category ? { category } : {};
        
        const questions = await Question.find(query)
            .sort({ _id: -1 })
            .populate('createdBy', 'username');
            
        res.json({ 
            success: true, 
            questions: questions.map(q => ({
                _id: q._id,
                text: q.text,
                answer: q.answer,
                category: q.category,
                timeLimit: q.timeLimit,
                createdBy: q.createdBy?.username,
                createdAt: q._id.getTimestamp(),
                targetClasses: q.targetClasses
            }))
        });
    } catch (error) {
        console.error('Failed to load question history:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to load question history'
        });
    }
});


app.delete('/delete-question/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Question.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete question'
        });
    }
});


app.delete('/delete-student-record', async (req, res) => {
    try {
        const { username, scoreId } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cannot find this student' 
            });
        }

        
        user.scores = user.scores.filter(score => 
            score._id.toString() !== scoreId
        );
        
        await user.save();
        
        res.json({ 
            success: true, 
            message: 'Delete success'
        });
    } catch (error) {
        console.error('Failed to delete record:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete record'
        });
    }
});


app.post('/update-question-set-classes', async (req, res) => {
    try {
        const { setId, targetClasses } = req.body;
        
        
        const validClasses = ['1A', '1B', '1C', '1D', '2A', '2B', '2C', '2D', 'all', 'p1-all', 'p2-all'];
        const isValidClasses = targetClasses && targetClasses.every(c => validClasses.includes(c));
        
        if (!isValidClasses) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid class selection' 
            });
        }
        
        
        await Question.updateMany(
            { setId: setId }, 
            { 
                targetClasses,
                isPublic: targetClasses.includes('all') || targetClasses.includes('p1-all') || targetClasses.includes('p2-all')
            }
        );
        
        res.json({ 
            success: true, 
            message: 'Updated target classes for all questions in this set'
        });
    } catch (error) {
        console.error('Failed to update set target classes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update set target classes' 
        });
    }
});





app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});


app.get('/admin/users', async (req, res) => {
    try {
        const { role, grade, class: className, search } = req.query;
        let query = {};

        if (role) query.role = role;
        if (grade) query.grade = parseInt(grade);
        if (className) query.class = className;

        if (search) {
            query = {
                $or: [
                    { username: { $regex: search, $options: 'i' } },
                    { class: { $regex: search, $options: 'i' } }
                ]
            };
        }
        
        const users = await User.find(query);
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ success: false, message: 'Failed to get users' });
    }
});


app.put('/admin/update-user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, role, grade, class: studentClass } = req.body;
        
        
        const user = await User.findById(id);
        if (user.username === 'admin' && role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Cannot change admin role' 
            });
        }
        
        
        const updateData = { role };
        
        
        if (username && username !== user.username) {
            
            const existingUser = await User.findOne({ username, _id: { $ne: id } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken'
                });
            }
            updateData.username = username;
        }
        
        
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }
        
        
        if (role === 'student') {
            if (grade) updateData.grade = grade;
            if (studentClass) updateData.class = studentClass;
        } else {
            
            updateData.$unset = { grade: "", class: "" };
        }
        
        await User.findByIdAndUpdate(id, updateData);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
});


app.delete('/admin/clear-user-records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        
        await User.findByIdAndUpdate(id, { scores: [] });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing user records:', error);
        res.status(500).json({ success: false, message: 'Failed to clear user records' });
    }
});


app.get('/admin/questions', async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};
        
        if (category) {
            query.category = category;
        }
        
        const questions = await Question.find(query).populate('createdBy', 'username');
        res.json({ success: true, questions });
    } catch (error) {
        console.error('Error getting questions:', error);
        res.status(500).json({ success: false, message: 'Failed to get questions' });
    }
});


app.delete('/admin/delete-question/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Question.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ success: false, message: 'Failed to delete question' });
    }
});


app.delete('/admin/clear-all-questions', async (req, res) => {
    try {
        await Question.deleteMany({});
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing all questions:', error);
        res.status(500).json({ success: false, message: 'Failed to clear all questions' });
    }
});

app.get('/admin/statistics', async (req, res) => {
    try {
   
        const totalUsers = await User.countDocuments();
        const teacherCount = await User.countDocuments({ role: 'teacher' });
        const studentCount = await User.countDocuments({ role: 'student' });
        
       
        const classDistribution = {};
        const classes = await User.aggregate([
            { $match: { role: 'student' } },
            { $group: { _id: '$class', count: { $sum: 1 } } }
        ]);
        
        classes.forEach(c => {
            classDistribution[c._id] = c.count;
        });
        
     
        const mostActiveStudents = await User.aggregate([
            { $match: { role: 'student' } },
            { $project: { username: 1, class: 1, answerCount: { $size: '$scores' } } },
            { $sort: { answerCount: -1 } },
            { $limit: 5 }
        ]);
        
       
        const totalQuestions = await Question.countDocuments();
        
     
        const categories = await Question.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        
        const categoryCounts = {};
        categories.forEach(cat => {
            if (cat._id) {
                categoryCounts[cat._id] = cat.count;
            }
        });
        
        
        const users = await User.find({ role: 'student' });
        let totalAnswers = 0;
        let correctAnswers = 0;
        
        users.forEach(user => {
            totalAnswers += user.scores.length;
            correctAnswers += user.scores.filter(score => score.isCorrect).length;
        });
        
        const correctRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
        
       
        const classPerformance = {};
        
        for (const user of users) {
            const className = user.class;
            if (!classPerformance[className]) {
                classPerformance[className] = {
                    studentCount: 0,
                    totalAnswers: 0,
                    correctAnswers: 0,
                    categoryPerformance: {}
                };
            }
            
            classPerformance[className].studentCount++;
            classPerformance[className].totalAnswers += user.scores.length;
            classPerformance[className].correctAnswers += user.scores.filter(s => s.isCorrect).length;
            
           
            user.scores.forEach(score => {
                const category = score.category;
                if (!category) return;
                
                if (!classPerformance[className].categoryPerformance[category]) {
                    classPerformance[className].categoryPerformance[category] = {
                        total: 0,
                        correct: 0
                    };
                }
                
                classPerformance[className].categoryPerformance[category].total++;
                if (score.isCorrect) {
                    classPerformance[className].categoryPerformance[category].correct++;
                }
            });
        }
        
        res.json({
            success: true,
            userStats: {
                totalUsers,
                teacherCount,
                studentCount,
                classDistribution,
                mostActiveStudents
            },
            questionStats: {
                totalQuestions,
                categoryCounts,
                totalAnswers,
                correctAnswers,
                correctRate
            },
            classPerformance
        });
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({ success: false, message: 'Failed to get statistics' });
    }
});





function generateQuestions(category) {
    if (!category) {
        console.error('No chosen category');
        return [];
    }

    const generateHandlers = {
        numbers_to_20: (count) => generateNumberSense(20,count),
        hard_numbers_to_20: (count) => generateHardNumberSense(20,count),

        basic_operations: (count) => generateBasicOperations(count),
        hard_basic_operations: (count) => generateHardBasicOperations(count),

        numbers_to_100: (count) => generateNumberSense(100,count),
        hard_numbers_to_100: (count) => generateHardNumberSense(100,count),

        measurement: (count) => generateMeasurement(count),
        hard_measurement: (count) => generateHardMeasurement(count),

        money: (count) => generateMoneyQuestions(count),
        hard_money: (count) => generateHardMoneyQuestions(count),

        time: (count) => generateTimeQuestions(count),
        hard_time: (count) => generateHardTimeQuestions(count),

        geometry_2d: (count) => generateShapeQuestions('2d',count),
        hard_geometry_2d: (count) => generateHardShapeQuestions('2d',count),

        geometry_3d: (count) => generateShapeQuestions('3d',count),
        hard_geometry_3d: (count) => generateHardShapeQuestions('3d',count),

        positions: (count) => generatePositionQuestions(count),

        calendar: (count) => generateCalendarQuestions(count),
        hard_calendar: (count) => generateHardCalendarQuestions(count),



        
        p2_addition: (count) => generateP2Addition(count),
        p2_hard_addition: (count) => generateP2HardAddition(count),
        p2_subtraction: (count) => generateP2Subtraction(count),
        p2_hard_subtraction: (count) => generateP2HardSubtraction(count),
        
        p2_angles: (count) => generateP2Angles(count),

        p2_directions: (count) => generateP2Directions(count),

        p2_multiplication: (count) => generateP2Multiplication(count),
        p2_hard_multiplication: (count) => generateP2HardMultiplication(count),

        p2_time: (count) => generateP2Time(count),
        p2_date: (count) => generateP2Date(count),
        p2_shapes: (count) => generateP2Shapes(count),

        p2_mixed_operations: (count) => generateP2MixedOperations(count),
        p2_hard_mixed_ops: (count) => generateP2HardMixedOps(count),

        p2_division: (count) => generateP2Division(count),
        p2_hard_division: (count) => generateP2HardDivision(count),

        p2_pictograms: (count) => generateP2Pictograph(count),
        p2_measurement: (count) => generateP2MeasurementTools(count),
        p2_money: (count) => generateP2Money(count)
    };

    const generator = generateHandlers[category];
    if (!generator) {
        console.error('Unknow question type:', category);
        return [];
    }

    return generator(10);
}


function generateP2Addition(count) {
    return Array.from({length: count}, () => {
       
        const num1 = Math.floor(Math.random() * 300) + 100; 
        const num2 = Math.floor(Math.random() * 300) + 100; 
        const remaining = 1000 - num1 - num2;
        const num3 = Math.floor(Math.random() * (remaining > 200 ? 200 : remaining)) + 1;
        
        return {
            text: `${num1} + ${num2} + ${num3} = ?`,
            answer: String(num1 + num2 + num3),
            category: 'p2_addition',
            grade: 2,
            subCategory: 'three_digit_addition',
            answerType: 'text',
            difficulty: 2
        };
    });
}

function generateP2Subtraction(count) {
    return Array.from({length: count}, () => {
        
        const num1 = Math.floor(Math.random() * 600) + 300; 
        const num2 = Math.floor(Math.random() * (num1/2)) + 100; 
        const maxNum3 = num1 - num2;
        const num3 = Math.floor(Math.random() * (maxNum3 > 100 ? 100 : maxNum3)) + 1;
        
        return {
            text: `${num1} - ${num2} - ${num3} = ?`,
            answer: String(num1 - num2 - num3),
            category: 'p2_subtraction',
            subCategory: 'three_digit_subtraction',
            answerType: 'text',
            difficulty: 2
        };
    });
}

function generateP2Angles(count) {
    return Array.from({ length: count }, () => {
        
        const questionType = Math.random() < 0.5 ? 1 : 2;
        
        if (questionType === 1) { 
            const angles = {
                "right angle": "90°",
                "acute angle": "smaller than90°",
                "obtuse angle": "larger than90°"
            };
            
            
            const angleTypes = Object.keys(angles);
            const correctAngle = angleTypes[Math.floor(Math.random() * angleTypes.length)];
            
            
            const options = shuffle(angleTypes);
            const correctIndex = options.indexOf(correctAngle);
            const correctAnswer = String.fromCharCode(65 + correctIndex);
            
            
            const processedOptions = processChoiceQuestion(options, correctAnswer);
            
            return {
                text: `What type of angle is shown in the image?<br><img src="/angles/${correctAngle.replace(/\s/g, '_')}.png" style="width:200px">`,
                ...processedOptions,
                answerType: 'choice',
                category: 'p2_angles',
                subCategory: 'angle_recognition',
                difficulty: 1
            };
        } else { 
            
            let angle1 = Math.floor(Math.random() * 16) * 10 + 10;
            let angle2;
            
            
            do {
                angle2 = Math.floor(Math.random() * 16) * 10 + 10;
            } while (angle1 === angle2);
            
            const isBigger = angle1 > angle2;
            const options = ["bigger", "smaller"];
            const correctAnswer = isBigger ? "A" : "B";
            
            
            const processedOptions = processChoiceQuestion(options, correctAnswer);
            
            return {
                text: `Angle A (${angle1}°) is ____ than Angle B (${angle2}°).`,
                ...processedOptions,
                answerType: 'choice',
                category: 'p2_angles',
                subCategory: 'angle_comparison',
                difficulty: 1
            };
        }
    });
}

function generateP2Directions(count) {
    
    const directions = ['north', 'east', 'south', 'west'];
    const clockwiseRelation = {
        'north': { turn: 'right', result: 'east' },
        'east': { turn: 'right', result: 'south' },
        'south': { turn: 'right', result: 'west' },
        'west': { turn: 'right', result: 'north' }
    };
    
    return Array.from({ length: count }, () => {
        
        const startDir = directions[Math.floor(Math.random() * directions.length)];
        
        
        const isClockwise = Math.random() < 0.5;
        
        
        let correctAnswer;
        if (isClockwise) {
            
            correctAnswer = clockwiseRelation[startDir].result;
        } else {
            
            const currentIndex = directions.indexOf(startDir);
            correctAnswer = directions[(currentIndex - 1 + 4) % 4];
        }
        
        
        const options = shuffle([...directions]);
        const correctIndex = options.indexOf(correctAnswer);
        const answerLetter = String.fromCharCode(65 + correctIndex);
        
        
        const processedOptions = processChoiceQuestion(options, answerLetter);
        
        
        const turnText = isClockwise ? 'right' : 'left';
        
        return {
            text: `If you are facing ${startDir} and turn ${turnText}, which direction will you be facing?`,
            ...processedOptions,
            answerType: 'choice',
            category: 'p2_directions',
            subCategory: 'direction_turn',
            difficulty: 1
        };
    });
}

function generateP2Multiplication(count) {
    return Array.from({ length: count }, () => {
        
        const num1 = Math.floor(Math.random() * 9) + 2; 
        const num2 = Math.floor(Math.random() * 9) + 1; 
        const correctAnswer = num1 * num2;
        
        
        const wrongAnswers = [
            correctAnswer + 1,
            correctAnswer - 1,
            correctAnswer + num1,
            correctAnswer - num1,
            correctAnswer + num2,
            correctAnswer - num2
        ].filter(a => a !== correctAnswer && a > 0)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        
        
        const options = shuffle([correctAnswer, ...wrongAnswers]);
        const correctIndex = options.indexOf(correctAnswer);
        const answerLetter = String.fromCharCode(65 + correctIndex);
        
        
        const processedOptions = processChoiceQuestion(options.map(String), answerLetter);
        
        return {
            text: `${num1} × ${num2} = ?`,
            ...processedOptions,
            answerType: 'choice',
            category: 'p2_multiplication',
            subCategory: 'basic_multiplication',
            difficulty: 2
        };
    });
}


function generateP2Date(count) {
    const months = [
        { name: "January", days: 31 },
        { name: "February", days: 28 },
        { name: "March", days: 31 },
        { name: "April", days: 30 },
        { name: "May", days: 31 },
        { name: "June", days: 30 },
        { name: "July", days: 31 },
        { name: "August", days: 31 },
        { name: "September", days: 30 },
        { name: "October", days: 31 },
        { name: "November", days: 30 },
        { name: "December", days: 31 }
    ];

    return Array.from({length: count}, () => {
        const month = months[Math.floor(Math.random() * months.length)];
        
        
        const options = shuffle([
            month.days,
            month.days === 28 ? 29 : 28,
            month.days === 30 ? 31 : 30,
            Math.floor(Math.random() * 3) + 28
        ]).map(String);  
        
        
        const correctIndex = options.indexOf(String(month.days));
        
        
        const processed = processChoiceQuestion(options, String.fromCharCode(65 + correctIndex));

        return {
            text: `How many days are there in ${month.name}?`,
            ...processed,
            answerType: 'choice',
            category: 'p2_date',  
            subCategory: 'month_days',
            difficulty: 2
        };
    });
}

function generateP2Shapes(count) {
    const shapes = [
        { name: "cube", faces: 6 },
        { name: "rectangular prism", faces: 6 },
        { name: "triangular prism", faces: 5 },
        { name: "square pyramid", faces: 5 },
        { name: "triangular pyramid", faces: 4 },
        { name: "cylinder", faces: 3 },
        { name: "sphere", faces: 1 }
    ];

    return Array.from({length: count}, () => {
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const baseOptions = [
            shape.faces, 
            shape.faces + 1, 
            shape.faces - (shape.faces > 1 ? 1 : 0), 
            shape.faces + 2
        ];
        
        
        const numericOptions = shuffle([...new Set(baseOptions)]);
        
        const options = numericOptions.map(String);
        
        const correctIndex = options.indexOf(String(shape.faces));
        
        const correctLetter = String.fromCharCode(65 + correctIndex);
        
        
        const processedOptions = processChoiceQuestion(options, correctLetter);

        return {
            text: `How many faces does a ${shape.name} have?`,
            ...processedOptions,
            answerType: 'choice',
            category: 'p2_shapes',
            subCategory: '3d_faces',
            difficulty: 2
        };
    });
}

function generateP2Time(count) {
    
    const generateCalculationQuestion = () => {
        const hours = Math.floor(Math.random() * 12) + 1; 
        const minutes = Math.floor(Math.random() * 12) * 5; 
        const addMins = Math.floor(Math.random() * 55) + 5; 

        
        const formatTime = (h, m) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        
        const startTime = formatTime(hours, minutes);
        const endTime = new Date(1970, 0, 1, hours, minutes + addMins);
        const correctAnswer = formatTime(endTime.getHours(), endTime.getMinutes());

        
        const wrongOptions = [
            formatTime(endTime.getHours() + 1, endTime.getMinutes()),    
            formatTime(hours, minutes + addMins),                       
            formatTime(hours + Math.floor(addMins/60), (minutes + addMins) % 60) 
        ];

        
        const options = shuffle([correctAnswer, ...wrongOptions.slice(0, 3)]);
        const correctIndex = options.indexOf(correctAnswer);
        const processed = processChoiceQuestion(options, String.fromCharCode(65 + correctIndex));

        return {
            text: `If the current time is ${startTime}, what time will it be after ${addMins} minutes?`,
            ...processed,
            answerType: 'choice',
            category: 'p2_time',
            subCategory: 'time_calculation',
            difficulty: 2
        };
    };

    
    const generateClockQuestion = () => {
        const minuteNumber = Math.floor(Math.random() * 12); 
        const minutes = minuteNumber * 5; 
        const correctAnswer = String(minutes);
        
        
        const options = shuffle([
            correctAnswer,
            String((minuteNumber + 1) * 5),  
            String((minuteNumber - 1 + 12) * 5 % 60), 
            String((minuteNumber + 3) * 5 % 60)       
        ]).map(opt => opt.padStart(2, '0')); 

        const correctIndex = options.indexOf(correctAnswer.padStart(2, '0'));
        const processed = processChoiceQuestion(options, String.fromCharCode(65 + correctIndex));

        return {
            text: `When the minute hand points to the number ${minuteNumber}, how many minutes have passed?`,
            ...processed,
            answerType: 'choice',
            category: 'p2_time',
            subCategory: 'clock_reading',
            difficulty: 2
        };
    };

    return Array.from({length: count}, () => 
        Math.random() < 0.7 ? generateCalculationQuestion() : generateClockQuestion()
    );
}


function generateP2MixedOperations(count) {
    return Array.from({length: count}, () => {
        
        const num1 = Math.floor(Math.random() * 500) + 100; 
        const num2 = Math.floor(Math.random() * 400) + 100; 
        const num3 = Math.floor(Math.random() * 300) + 100; 
        
        
        const ops = [['+', '-'], ['-', '+']][Math.floor(Math.random() * 2)];
        const expression = `${num1} ${ops[0]} ${num2} ${ops[1]} ${num3}`;
        const answer = eval(expression.replace(/−/g, '-'));
        
        
        if(answer < 0) return generateP2MixedOperations(1)[0];

        return {
            text: `Calculate: ${expression} = ?`,
            answer: String(answer),
            category: 'p2_mixed_operations',
            subCategory: 'three_digit_operations',
            answerType: 'text',
            difficulty: 2
        };
    });
}


function generateP2Division(count) {
    return Array.from({length: count}, () => {
        let divisor, quotient;
        do {
            divisor = Math.floor(Math.random() * 9) + 1; 
            quotient = Math.floor(Math.random() * 11) + 4; 
        } while(divisor * quotient > 99);

        const dividend = divisor * quotient;
        
        return {
            text: `${dividend} ÷ ${divisor} = ?`,
            answer: String(quotient),
            category: 'p2_division',
            subCategory: 'two_digit_division',
            answerType: 'text',
            difficulty: 2
        };
    });
}


function generateP2Pictograph(count) {
    const charts = [
        {
            title: "Pet Ownership",
            items: [
                {icon: '🐶', count: Math.floor(Math.random() * 10) + 1, label: 'Dog'},
                {icon: '🐱', count: Math.floor(Math.random() * 10) + 1, label: 'Cat'},
                {icon: '🐠', count: Math.floor(Math.random() * 10) + 1, label: 'Fish'},
                {icon: '🐰', count: Math.floor(Math.random() * 10) + 1, label: 'Rabbit'}
            ]
        },
        {
            title: "Farm Animals",
            items: [
                {icon: '🐔', count: Math.floor(Math.random() * 10) + 1, label: 'Chicken'},
                {icon: '🐑', count: Math.floor(Math.random() * 10) + 1, label: 'Sheep'},
                {icon: '🐖', count: Math.floor(Math.random() * 10) + 1, label: 'Pig'},
                {icon: '🐄', count: Math.floor(Math.random() * 10) + 1, label: 'Cow'}
            ]
        }
    ];

    return Array.from({length: count}, () => {
        const chart = charts[Math.floor(Math.random() * charts.length)];
        const randomIndex = Math.floor(Math.random() * chart.items.length);
        const targetAnimal = chart.items[randomIndex];
        const correctValue = targetAnimal.count * 2;

        
        const generateUniqueOptions = () => {
            const options = new Set([correctValue]);
            
            
            while(options.size < 3) {
                options.add(correctValue + (Math.random() < 0.5 ? 2 : -2));
            }
            
            
            while(options.size < 5) {
                const randomValue = targetAnimal.count + Math.floor(Math.random() * 5);
                options.add(randomValue !== correctValue ? randomValue : randomValue + 1);
            }

            return shuffle(Array.from(options));
        };

        
        const numericOptions = generateUniqueOptions();
        const options = numericOptions.map(String);
        const correctIndex = options.indexOf(String(correctValue));
        const processed = processChoiceQuestion(options, String.fromCharCode(65 + correctIndex));

        return {
            text: `${chart.title}:<br>${chart.items.map(i => 
                `${i.icon.repeat(i.count)}<br>${i.label}s`
            ).join('<br>')}<br><br>How many ${targetAnimal.label}s are there? (Each ${targetAnimal.icon} = 2)`,
            ...processed,
            answerType: 'choice',
            category: 'p2_pictograms',
            subCategory: 'pictograph',
            difficulty: 2
        };
    });
}


function generateP2MeasurementTools(count) {
    const tools = [
        '15cm ruler',   
        '1m ruler',     
        'soft tape',    
        '5m tape',      
        'measuring wheel' 
    ];

    const scenarios = [
        {
            object: 'child\'s height',
            correctTool: 'soft tape',
            distractors: ['15cm ruler', '1m ruler', '5m tape']
        },
        {
            object: 'classroom length',
            correctTool: '5m tape',
            distractors: ['1m ruler', 'measuring wheel', 'soft tape']
        },
        {
            object: 'math textbook thickness',
            correctTool: '15cm ruler',
            distractors: ['soft tape', '1m ruler', 'measuring wheel']
        },
        {
            object: 'swimming pool length',
            correctTool: 'measuring wheel',
            distractors: ['5m tape', '1m ruler', 'soft tape']
        },
        {
            object: 'tree trunk circumference',
            correctTool: 'soft tape',
            distractors: ['5m tape', '15cm ruler', 'measuring wheel']
        },
        {
            object: 'basketball court',
            correctTool: 'measuring wheel',
            distractors: ['5m tape', '1m ruler', 'soft tape']
        },
        {
            object: 'pencil case width',
            correctTool: '15cm ruler',
            distractors: ['soft tape', '5m tape', 'measuring wheel']
        }
    ];

    return Array.from({length: count}, () => {
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        
        
        const options = shuffle([scenario.correctTool, ...scenario.distractors]);
        const answerIndex = options.indexOf(scenario.correctTool);
        const processed = processChoiceQuestion(options, String.fromCharCode(65 + answerIndex));

        return {
            text: `Which tool is <strong>most suitable</strong> for measuring ${scenario.object}?`,
            ...processed,
            answerType: 'choice',
            category: 'p2_measurement',
            subCategory: 'tool_selection',
            difficulty: 2
        };
    });
}

function generateP2Money(count) {
    
    const banknotes = [
        { value: 10, name: '$10 note', image: 'hk_10_note.png' },
        { value: 20, name: '$20 note', image: 'hk_20_note.png' },
        { value: 50, name: '$50 note', image: 'hk_50_note.png' },
        { value: 100, name: '$100 note', image: 'hk_100_note.png' },
        { value: 500, name: '$500 note', image: 'hk_500_note.png' },
        { value: 1000, name: '$1000 note', image: 'hk_1000_note.png' }
    ];

    return Array.from({length: count}, () => {
        
        const questionType = Math.random() < 0.5 ? 0 : 1;

        if (questionType === 0) { 
            const note = banknotes[Math.floor(Math.random() * banknotes.length)];
            
            
            const otherOptions = banknotes
                .filter(n => n.value !== note.value)
                .map(n => `HK$${n.value}`);
            
            const options = shuffle([...otherOptions]).slice(0, 3); 
            const allOptions = shuffle([`HK$${note.value}`, ...options]); 
            
            const correctIndex = allOptions.indexOf(`HK$${note.value}`);
            const correctLetter = String.fromCharCode(65 + correctIndex);
            
            
            const processed = processChoiceQuestion(allOptions, correctLetter);
            
            return {
                text: `What is the value of this banknote?<br><img src="/banknotes/${note.image}" style="height:120px">`,
                ...processed,
                answerType: 'choice',
                category: 'p2_money',
                subCategory: 'banknote_identification',
                difficulty: 1
            };
        } 
        else { 
            
            const numNotes = Math.floor(Math.random() * 2) + 2; 
            const selectedNotes = [];
            
            for (let i = 0; i < numNotes; i++) {
                
                const notePool = i === 0 ? 
                    banknotes.slice(0, 4) : 
                    banknotes;
                
                selectedNotes.push(notePool[Math.floor(Math.random() * notePool.length)]);
            }
            
            
            const total = selectedNotes.reduce((sum, note) => sum + note.value, 0);
            
            
            const correctAnswer = `HK$${total}`;
            const variations = [
                total + 10, 
                total - 10,
                total * 2,
                Math.floor(total / 2)
            ].filter(v => v > 0 && v !== total); 
            
            const options = shuffle([...variations.map(v => `HK$${v}`)]).slice(0, 3); 
            const allOptions = shuffle([correctAnswer, ...options]); 
            
            const correctIndex = allOptions.indexOf(correctAnswer);
            const correctLetter = String.fromCharCode(65 + correctIndex);
            
            
            const processed = processChoiceQuestion(allOptions, correctLetter);
            
            
            const noteImages = selectedNotes.map(note => 
                `<img src="/banknotes/${note.image}" style="height:80px; margin:0 5px;">`
            ).join('');
            
            return {
                text: `Calculate the total value of these banknotes:<br><div style="text-align:center">${noteImages}</div>`,
                ...processed,
                answerType: 'choice',
                category: 'p2_money',
                subCategory: 'banknote_calculation',
                difficulty: 2
            };
        }
    });
}

function generateP2HardAddition(count) {
    return Array.from({length: count}, () => {
        const num1 = Math.floor(Math.random() * 400) + 100; 
        const num2 = Math.floor(Math.random() * 300) + 50;  
        const num3 = Math.floor(Math.random() * 200) + 50;  
        const sum = num1 + num2 + num3;
        
        
        const positions = [
            `${num1} + ? + ${num3} = ${sum}`,
            `${num1} + ${num2} + ? = ${sum}`,
            `? + ${num2} + ${num3} = ${sum}`
        ];
        const [question, answer] = (() => {
            const pos = Math.floor(Math.random() * 3);
            return [
                positions[pos],
                [num2, num3, num1][pos]
            ];
        })();
        
        return {
            text: question,
            answer: String(answer),
            category: 'p2_hard_addition',
            subCategory: 'missing_number',
            difficulty: 3
        };
    });
}

function generateP2HardSubtraction(count) {
    return Array.from({length: count}, () => {
        const minuend = Math.floor(Math.random() * 500) + 200; 
        const subtrahend = Math.floor(Math.random() * 150) + 50;  
        const difference = minuend - subtrahend;
        
        const templates = [
            `? - ${subtrahend} = ${difference}`,
            `${minuend} - ? = ${difference}`,
            `${minuend} - ${subtrahend} = ?`
        ];
        const [question, answer] = (() => {
            const pos = Math.floor(Math.random() * 3);
            return [
                templates[pos],
                [minuend, subtrahend, difference][pos]
            ];
        })();
        
        return {
            text: question,
            answer: String(answer),
            category: 'p2_hard_subtraction',
            subCategory: 'missing_number',
            difficulty: 3
        };
    });
}

function generateP2HardMultiplication(count) {
    return Array.from({length: count}, () => {
        const factors = [
            Math.floor(Math.random() * 8) + 2, 
            Math.floor(Math.random() * 8) + 2  
        ];
        const product = factors[0] * factors[1];
        
        const templates = [
            `? × ${factors[1]} = ${product}`,
            `${factors[0]} × ? = ${product}`,
            `${factors[0]} × ${factors[1]} = ?`
        ];
        const [question, answer] = (() => {
            const pos = Math.floor(Math.random() * 3);
            return [
                templates[pos],
                [factors[0], factors[1], product][pos]
            ];
        })();
        
        return {
            text: question,
            answer: String(answer),
            category: 'p2_hard_multiplication',
            subCategory: 'missing_factor',
            difficulty: 3
        };
    });
}

function generateP2HardDivision(count) {
    return Array.from({length: count}, () => {
        const divisor = Math.floor(Math.random() * 8) + 2; 
        const quotient = Math.floor(Math.random() * 9) + 2; 
        const dividend = divisor * quotient;
        
        const templates = [
            `? ÷ ${divisor} = ${quotient}`,
            `${dividend} ÷ ? = ${quotient}`,
            `${dividend} ÷ ${divisor} = ?`
        ];
        const [question, answer] = (() => {
            const pos = Math.floor(Math.random() * 3);
            return [
                templates[pos],
                [dividend, divisor, quotient][pos]
            ];
        })();
        
        return {
            text: question,
            answer: String(answer),
            category: 'p2_hard_division',
            subCategory: 'missing_element',
            difficulty: 3
        };
    });
}

function generateP2HardMixedOps(count) {
    return Array.from({length: count}, () => {
        
        const num1 = Math.floor(Math.random() * 400) + 100;  
        const num2 = Math.floor(Math.random() * 300) + 50;   
        const num3 = Math.floor(Math.random() * 200) + 50;   

        
        const operations = [];
        operations.push(Math.random() < 0.5 ? '+' : '-');
        operations.push(Math.random() < 0.5 ? '+' : '-');
        
        
        if (!operations.includes('+')) operations[0] = '+';
        if (!operations.includes('-')) operations[1] = '-';

        
        let expression = `${num1} ${operations[0]} ${num2} ${operations[1]} ${num3}`;
        let answer = eval(expression.replace(/−/g, '-')); 
        
        
        if (answer < 0) {
            
            const newNum1 = num1 + Math.abs(answer) + 10;
            expression = `${newNum1} ${operations[0]} ${num2} ${operations[1]} ${num3}`;
            answer = eval(expression.replace(/−/g, '-'));
        }

        
        const missingPos = Math.floor(Math.random() * 4);
        let questionText, correctAnswer;

        switch(missingPos) {
            case 0: 
                questionText = `? ${operations[0]} ${num2} ${operations[1]} ${num3} = ${answer}`;
                
                correctAnswer = operations[1] === '+' 
                    ? (operations[0] === '+' ? answer - num3 - num2 : answer - num3 + num2)
                    : (operations[0] === '+' ? answer + num3 - num2 : answer + num3 + num2);
                break;
                
            case 1: 
                questionText = `${num1} ${operations[0]} ? ${operations[1]} ${num3} = ${answer}`;
                
                correctAnswer = operations[0] === '+' 
                    ? (operations[1] === '+' ? answer - num3 - num1 : answer + num3 - num1)
                    : (operations[1] === '+' ? num1 - (answer - num3) : num1 - (answer + num3));
                break;
                
            case 2: 
                questionText = `${num1} ${operations[0]} ${num2} ${operations[1]} ? = ${answer}`;
                
                correctAnswer = operations[1] === '+' 
                    ? (operations[0] === '+' ? answer - num1 - num2 : answer - num1 + num2)
                    : (operations[0] === '+' ? num1 + num2 - answer : num1 - num2 - answer);
                break;
                
            case 3: 
                questionText = `${num1} ${operations[0]} ${num2} ${operations[1]} ${num3} = ?`;
                correctAnswer = answer;
                break;
        }

        
        if (correctAnswer < 0 || correctAnswer > 1000) {
            return generateP2HardMixedOps(1)[0];
        }

        return {
            text: questionText,
            answer: String(correctAnswer),
            category: 'p2_hard_mixed_ops',
            subCategory: 'hard_mixed_operations',
            answerType: 'text',
            difficulty: 3
        };
    });
}





































function generateNumberSense(maxNumber, count) {
    return Array.from({ length: count }, () => {
        
        const number = Math.floor(Math.random() * maxNumber) + 1;
        
        
        const questionType = Math.floor(Math.random() * 4);
        
        if (questionType === 0) { 
            const otherNumber = Math.floor(Math.random() * maxNumber) + 1;
            let text, correctAnswer;
            
            if (number === otherNumber) {
                text = `Which statement is correct for ${number} and ${otherNumber}?`;
                correctAnswer = 'equal to';
            } else {
                text = `Is ${number} greater than, less than, or equal to ${otherNumber}?`;
                correctAnswer = number > otherNumber ? 'greater than' : 'less than';
            }
            
            const options = ['greater than', 'less than', 'equal to'];
            const shuffledOptions = shuffle(options);
            const correctIndex = shuffledOptions.indexOf(correctAnswer);
            const answerLetter = String.fromCharCode(65 + correctIndex);
            
            
            const processedOptions = processChoiceQuestion(shuffledOptions, answerLetter);
            
            return {
                text,
                ...processedOptions,
                answerType: 'choice',
                category: 'numbers_to_' + maxNumber,
                subCategory: 'comparison',
                difficulty: 1
            };
        } else if (questionType === 1) { 
            const isBefore = Math.random() < 0.5;
            const text = isBefore ? `What number comes before ${number}?` : `What number comes after ${number}?`;
            const correctAnswer = isBefore ? number - 1 : number + 1;
            
            
            const wrongAnswers = [
                isBefore ? number - 2 : number + 2,
                isBefore ? number + 1 : number - 1,
                isBefore ? number + 2 : number - 2
            ].filter(n => n > 0 && n <= maxNumber);
            
            const options = shuffle([correctAnswer, ...wrongAnswers]);
            const correctIndex = options.indexOf(correctAnswer);
            const answerLetter = String.fromCharCode(65 + correctIndex);
            
            
            const processedOptions = processChoiceQuestion(options.map(String), answerLetter);
            
            return {
                text,
                ...processedOptions,
                answerType: 'choice',
                category: 'numbers_to_' + maxNumber,
                subCategory: 'sequence',
                difficulty: 1
            };
        } else if (questionType === 2) { 
            
            const isEven = Math.random() < 0.5;
            const start = isEven ? 2 : 1;
            const step = 2;
            const length = 3; 
            
            
            const sequence = [];
            for (let i = 0; i < length; i++) {
                sequence.push(start + i * step);
            }
            
            
            const correctAnswer = start + length * step;
            
            
            const wrongAnswers = [
                correctAnswer + 1,
                correctAnswer - 1,
                correctAnswer + 2
            ].filter(n => n > 0 && n <= maxNumber && n !== correctAnswer);
            
            const options = shuffle([correctAnswer, ...wrongAnswers]);
            const correctIndex = options.indexOf(correctAnswer);
            const answerLetter = String.fromCharCode(65 + correctIndex);
            
            
            const processedOptions = processChoiceQuestion(options.map(String), answerLetter);
            
            return {
                text: `What number comes next in this sequence? ${sequence.join(', ')}, ...`,
                ...processedOptions,
                answerType: 'choice',
                category: 'numbers_to_' + maxNumber,
                subCategory: 'pattern',
                difficulty: 1
            };
        } else { 
            
            let evenNumber = Math.floor(Math.random() * (maxNumber / 2)) * 2;
            if (evenNumber === 0) evenNumber = 2; 
            
            
            const wrongAnswers = [
                evenNumber - 1,
                evenNumber + 1,
                evenNumber + 3
            ].filter(n => n > 0 && n <= maxNumber);
            
            const options = shuffle([evenNumber, ...wrongAnswers]);
            const correctIndex = options.indexOf(evenNumber);
            const answerLetter = String.fromCharCode(65 + correctIndex);
            
            
            const processedOptions = processChoiceQuestion(options.map(String), answerLetter);
            
            return {
                text: 'Which of these numbers is an even number?',
                ...processedOptions,
                answerType: 'choice',
                category: 'numbers_to_' + maxNumber,
                subCategory: 'even_odd',
                difficulty: 1
            };
        }
    });
}




function generateBasicOperations(count) {
    const operations = [
        {
            symbol: '+',
            method: (a, b) => a + b,
            generator: () => {
                const a = Math.floor(Math.random() * 10) + 1;
                const b = Math.floor(Math.random() * 10) + 1;
                return { a, b };
            }
        },
        {
            symbol: '-',
            method: (a, b) => a - b,
            generator: () => {
                const b = Math.floor(Math.random() * 10) + 1;
                const a = b + Math.floor(Math.random() * 10);
                return { a, b };
            }
        }
    ];

    return Array.from({ length: count }, () => {
        const op = operations[Math.floor(Math.random() * operations.length)];
        const { a, b } = op.generator();
        return {
            text: `${a} ${op.symbol} ${b} = ?`,
            answer: String(op.method(a, b)),
            category: 'basic_operations',
            subCategory: op.symbol === '+' ? 'addition' : 'subtraction'
        };
    });
}


function generateMoneyQuestions(count) {
    
    const coins = [
        { name: "10cents", value: 0.10, label: "10¢", image: "hk_ten_cents.png" },
        { name: "20cents", value: 0.20, label: "20¢", image: "hk_twenty_cents.png" },
        { name: "50cents", value: 0.50, label: "50¢", image: "hk_fifty_cents.png" },
        { name: "1dollar", value: 1.00, label: "$1", image: "hk_one_dollar.png" },
        { name: "2dollars", value: 2.00, label: "$2", image: "hk_two_dollars.png" },
        { name: "5dollars", value: 5.00, label: "$5", image: "hk_five_dollars.png" },
        { name: "10dollars", value: 10.00, label: "$10", image: "hk_ten_dollars.png" }
    ];

    return Array.from({ length: count }, () => {
        const questionType = Math.random() < 0.5 ? 0 : 1;

        if (questionType === 0) { 
            const coin = coins[Math.floor(Math.random() * coins.length)];
            
            
            const variations = [
                coin.value + 1.00,
                coin.value - 1.00,
                coin.value + 0.50,
                coin.value - 0.50
            ].filter(v => v > 0); 
            
            const options = shuffle([
                coin.value.toFixed(2),
                ...variations.map(v => v.toFixed(2))
            ]).slice(0, 3); 

            const shuffledOptions = shuffle([...options, coin.value.toFixed(2)]); 
            const correctIndex = shuffledOptions.indexOf(coin.value.toFixed(2));
            const correctLetter = String.fromCharCode(65 + correctIndex); 

            
            const formattedOptions = shuffledOptions.map(opt => `HK$${opt}`);
            const optionsWithLabels = shuffledOptions.map((opt, idx) => ({
                label: String.fromCharCode(65 + idx),
                content: `HK$${opt}`
            }));

            return {
                text: `What is the value of this coin? <img src="/coins/${coin.image}" style="height:60px">`,
                answer: correctLetter,
                options: formattedOptions,
                optionsWithLabels: optionsWithLabels,
                answerType: 'choice',
                category: 'money',
                subCategory: 'coin_value',
                difficulty: 1
            };
        } 
        else { 
            let coinA, coinB;
            do {
                coinA = coins[Math.floor(Math.random() * coins.length)];
                coinB = coins[Math.floor(Math.random() * coins.length)];
            } while (coinA.value === coinB.value); 

            const isLarger = coinA.value > coinB.value;
            const comparisonTerm = isLarger ? "larger" : "smaller";
            const shuffledOptions = shuffle(["larger", "smaller"]);
            const correctIndex = shuffledOptions.indexOf(comparisonTerm);
            const correctLetter = String.fromCharCode(65 + correctIndex);

            
            const optionsWithLabels = shuffledOptions.map((opt, idx) => ({
                label: String.fromCharCode(65 + idx),
                content: opt
            }));

            return {
                text: `The <img src="/coins/${coinA.image}" style="height:40px"> is ___ than <img src="/coins/${coinB.image}" style="height:40px">`,
                answer: correctLetter,
                options: shuffledOptions,
                optionsWithLabels: optionsWithLabels,
                answerType: 'choice',
                category: 'money',
                subCategory: 'coin_comparison',
                difficulty: 1
            };
        }
    });
}





function generateTimeQuestions(count) {
    return Array.from({ length: count }, () => {
        
        const hour = Math.floor(Math.random() * 12) + 1; 
        const minute = Math.random() < 0.7 ? 0 : 30; 
        
        
        const clockImage = `clock_${hour}_${minute === 0 ? '00' : minute}.png`;
        
        
        const wrongHours = Array.from({ length: 11 }, (_, i) => (hour + i) % 12 + 1).filter(h => h !== hour).slice(0, 3);
        const correctTimeStr = `${hour}:${minute === 0 ? '00' : minute}`;
        const wrongTimeStrs = wrongHours.map(h => `${h}:${minute === 0 ? '00' : minute}`);
        
        
        const options = shuffle([correctTimeStr, ...wrongTimeStrs]);
        const correctIndex = options.indexOf(correctTimeStr);
        const answerLetter = String.fromCharCode(65 + correctIndex);
        
        
        const processedOptions = processChoiceQuestion(options, answerLetter);
        
        return {
            text: `What time is shown on the clock?<br><div style="text-align:center"><img src="/clock/${clockImage}" alt="Clock showing ${correctTimeStr}" style="width: 150px; height: 150px;"></div>`,
            ...processedOptions,
            answerType: 'choice',
            category: 'time',
            subCategory: 'reading_clock',
            difficulty: 1
        };
    });
}


function generateShapeQuestions(dimension, count=5) {
    const shapes2D = ['circle', 'square', 'triangle', 'rectangle', 'pentagon', 'hexagon'];
    const shapes3D = ['sphere', 'cube', 'cone', 'cylinder', 'triangular prism', 'rectangular prism'];
    const shapes = dimension === '2d' ? shapes2D : shapes3D;
    
    return Array.from({ length: count }, () => {
        
        const correctShape = shapes[Math.floor(Math.random() * shapes.length)];
        
        
        const otherShapes = shapes.filter(s => s !== correctShape);
        const shuffledOtherShapes = shuffle(otherShapes).slice(0, 3);
        const options = shuffle([correctShape, ...shuffledOtherShapes]);
        
        
        const correctIndex = options.indexOf(correctShape);
        const answerLetter = String.fromCharCode(65 + correctIndex);
        
        
        const processedOptions = processChoiceQuestion(options, answerLetter);
        
        return {
            text: `Which shape is shown in the image?<br><img src="/shapes/${correctShape.replace(/\s/g, '_')}.png" style="width:150px">`,
            ...processedOptions,
            answerType: 'choice',
            category: dimension === '2d' ? 'geometry_2d' : 'geometry_3d',
            subCategory: dimension === '2d' ? '2d_shapes' : '3d_shapes',
            difficulty: 1
        };
    });
}

function generateMeasurement(count) {
    const questions = [];
    const symbols = ['+', '=', '#', '>', '~', '◆', '■', '▲', '●'];
    
    
    for (let i = 0; i < count; i++) {
        
        const numBars = Math.floor(Math.random() * 2) + 3; 
        const bars = [];
        const usedSymbols = new Set();
        const usedLengths = new Set();

        
        for (let j = 0; j < numBars; j++) {
            let symbol;
            do {
                symbol = symbols[Math.floor(Math.random() * symbols.length)];
            } while (usedSymbols.has(symbol));
            usedSymbols.add(symbol);

            let length;
            do {
                length = Math.floor(Math.random() * 6) + 3; 
            } while (usedLengths.has(length));
            usedLengths.add(length);

            bars.push({ 
                symbol, 
                length,
                line: symbol.repeat(length), 
                patternName: `Pattern ${j + 1}`
            });
        }

        
        const compareTypes = ['longest', 'shortest'];
        const compareType = compareTypes[Math.floor(Math.random() * compareTypes.length)];
        
        
        const answer = bars.reduce((a, b) => 
            compareType === 'longest' 
                ? (a.length > b.length ? a : b)
                : (a.length < b.length ? a : b)
        );
        
        
        const barsDisplay = bars.map(bar => 
            `${bar.patternName}: ${bar.line}`
        ).join('<br>');
        
        
        const options = bars.map(bar => bar.patternName);
        
        
        const answerIndex = options.indexOf(answer.patternName);
        const answerLetter = String.fromCharCode(65 + answerIndex); 
        
        questions.push({
            text: `Look at these patterns:<br><br>${barsDisplay}<br><br>Which pattern is the ${compareType}?`,
            options: options,
            answer: answerLetter,
            answerType: 'choice',
            category: 'measurement',
            subCategory: 'length_comparison'
        });
    }

    return questions;
}



function generatePositionQuestions(count) {
    const questions = [];
    const positions = [
        { 
            type: 'basic', 
            items: [
                { pos: 'above', opposite: 'below' },
                { pos: 'below', opposite: 'above' },
                { pos: 'to the left of', opposite: 'to the right of' },
                { pos: 'to the right of', opposite: 'to the left of' },
                { pos: 'in front of', opposite: 'behind' },
                { pos: 'behind', opposite: 'in front of' }
            ]
        },
        { 
            type: 'between',
            template: 'What is between the {obj1} and the {obj2}?'
        }
    ];
    
    const objects = ['apple', 'orange', 'banana', 'watermelon', 'strawberry', 'lemon', 'grape', 'pear'];

    
    const basicCount = Math.ceil(count * 0.6);
    const betweenCount = count - basicCount;

    
    for (let i = 0; i < basicCount; i++) {
        const posIndex = Math.floor(Math.random() * positions[0].items.length);
        const pos = positions[0].items[posIndex];
        const obj1 = objects[Math.floor(Math.random() * objects.length)];
        const obj2 = objects[Math.floor(Math.random() * objects.length)];
        
        const questionType = Math.random() < 0.5 ? 'position' : 'object';
        
        if (questionType === 'position') {
            questions.push({
                text: `If the ${obj1} is ${pos.pos} the ${obj2}, what position is the ${obj2} in relation to the ${obj1}?`,
                answer: pos.opposite,
                category: 'positions',
                subCategory: 'relative_position',
                difficulty: 1
            });
        } else {
            questions.push({
                text: `If the ${obj1} is ${pos.pos} the ${obj2}, which object would you see first when looking from ${pos.pos === 'above' ? 'top' : pos.pos === 'below' ? 'bottom' : 'front'}?`,
                answer: pos.pos === 'behind' || pos.pos === 'to the right of' || pos.pos === 'below' ? obj2 : obj1,
                category: 'positions',
                subCategory: 'object_identification',
                difficulty: 1
            });
        }
    }

    
    for (let i = 0; i < betweenCount; i++) {
        let obj1, obj2, middleObj;
        do {
            obj1 = objects[Math.floor(Math.random() * objects.length)];
            obj2 = objects[Math.floor(Math.random() * objects.length)];
            middleObj = objects[Math.floor(Math.random() * objects.length)];
        } while (new Set([obj1, obj2, middleObj]).size < 3);

        const sequence = `From left to right: ${obj1}, ${middleObj}, ${obj2}`;

        questions.push({
            text: `${sequence}<br>${positions[1].template.replace('{obj1}', obj1).replace('{obj2}', obj2)}`,
            answer: middleObj,
            category: 'positions',
            subCategory: 'between_position',
            difficulty: 1
        });
    }

    return questions.slice(0, count); 
}


function generateCalendarQuestions(count) {
    const questions = [];
    
    
    const months = [
        'January', 'February', 'March', 'April', 
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ];
    
    
    const weekdays = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
        'Friday', 'Saturday', 'Sunday'
    ];

    
    for (let i = 0; i < count; i++) {
        
        const isMonthQuestion = Math.random() < 0.5;
        
        if (isMonthQuestion) {
            const questionType = Math.random() < 0.5 ? 'order' : 'name';
            
            if (questionType === 'order') {
                
                const monthIndex = Math.floor(Math.random() * months.length);
                const month = months[monthIndex];
                const nextMonthIndex = (monthIndex + 1) % 12;
                const prevMonthIndex = (monthIndex - 1 + 12) % 12;
                const nextMonth = months[nextMonthIndex];
                const prevMonth = months[prevMonthIndex];
                
                const isNext = Math.random() < 0.5;
                
                
                const options = isNext ? 
                    shuffle([
                        nextMonth,
                        prevMonth,
                        months[(nextMonthIndex + 1) % 12],
                        months[(nextMonthIndex + 2) % 12]
                    ]) :
                    shuffle([
                        prevMonth,
                        nextMonth,
                        months[(prevMonthIndex - 1 + 12) % 12],
                        months[(prevMonthIndex - 2 + 12) % 12]
                    ]);
                
                const correctAnswer = isNext ? nextMonth : prevMonth;
                const answerIndex = options.indexOf(correctAnswer);
                const answerLetter = String.fromCharCode(65 + answerIndex);
                
                questions.push({
                    text: isNext ? 
                        `What month comes after ${month}?` : 
                        `What month comes before ${month}?`,
                    options: options,
                    answer: answerLetter, 
                    answerType: 'choice',
                    category: 'calendar',
                    subCategory: 'month_order',
                    difficulty: 1
                });
            } else {
                
                const monthIndex = Math.floor(Math.random() * months.length);
                const month = months[monthIndex];
                
                
                const options = shuffle([
                    month,
                    months[(monthIndex + 4) % 12],
                    months[(monthIndex + 7) % 12],
                    months[(monthIndex + 10) % 12]
                ]);
                
                const answerIndex = options.indexOf(month);
                const answerLetter = String.fromCharCode(65 + answerIndex);
                
                questions.push({
                    text: `What is the ${getOrdinalSuffix(monthIndex + 1)} month of the year?`,
                    options: options,
                    answer: answerLetter, 
                    answerType: 'choice',
                    category: 'calendar',
                    subCategory: 'month_position',
                    difficulty: 1
                });
            }
        } else {
            
            const questionType = Math.random() < 0.6 ? 'order' : 'weekend';
            
            if (questionType === 'order') {
                
                const dayIndex = Math.floor(Math.random() * weekdays.length);
                const weekday = weekdays[dayIndex];
                const nextDayIndex = (dayIndex + 1) % 7;
                const prevDayIndex = (dayIndex - 1 + 7) % 7;
                const nextDay = weekdays[nextDayIndex];
                const prevDay = weekdays[prevDayIndex];
                
                const isNext = Math.random() < 0.5;
                
                
                const options = isNext ? 
                    shuffle([
                        nextDay,
                        prevDay,
                        weekdays[(nextDayIndex + 1) % 7],
                        weekdays[(nextDayIndex + 2) % 7]
                    ]) :
                    shuffle([
                        prevDay,
                        nextDay,
                        weekdays[(prevDayIndex - 1 + 7) % 7],
                        weekdays[(prevDayIndex - 2 + 7) % 7]
                    ]);
                
                const correctAnswer = isNext ? nextDay : prevDay;
                const answerIndex = options.indexOf(correctAnswer);
                const answerLetter = String.fromCharCode(65 + answerIndex);
                
                questions.push({
                    text: isNext ? 
                        `What day comes after ${weekday}?` : 
                        `What day comes before ${weekday}?`,
                    options: options,
                    answer: answerLetter, 
                    answerType: 'choice',
                    category: 'calendar',
                    subCategory: 'weekday_order',
                    difficulty: 1
                });
            } else {
                
                const isWeekend = Math.random() < 0.5;
                
                if (isWeekend) {
                    
                    const options = shuffle([
                        `Saturday and Sunday`,
                        `Monday and Tuesday`,
                        `Wednesday and Thursday`,
                        `Friday and Saturday`
                    ]);
                    
                    const correctAnswer = `Saturday and Sunday`;
                    const answerIndex = options.indexOf(correctAnswer);
                    const answerLetter = String.fromCharCode(65 + answerIndex);
                    
                    questions.push({
                        text: `Which days are part of the weekend?`,
                        options: options,
                        answer: answerLetter, 
                        answerType: 'choice',
                        category: 'calendar',
                        subCategory: 'weekend_days',
                        difficulty: 1
                    });
                } else {
                    
                    const day = weekdays[Math.floor(Math.random() * weekdays.length)];
                    const isWeekendDay = day === 'Saturday' || day === 'Sunday';
                    
                    const options = ['Yes', 'No'];
                    const correctAnswer = isWeekendDay ? 'Yes' : 'No';
                    const answerIndex = options.indexOf(correctAnswer);
                    const answerLetter = String.fromCharCode(65 + answerIndex);
                    
                    questions.push({
                        text: `Is ${day} a weekend day?`,
                        options: options,
                        answer: answerLetter, 
                        answerType: 'choice',
                        category: 'calendar',
                        subCategory: 'weekend_identification',
                        difficulty: 1
                    });
                }
            }
        }
    }
    
    return questions;
}


function generateHardCalendarQuestions(count) {
    const questions = [];
    
    
    const months = [
        'January', 'February', 'March', 'April', 
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ];
    
    
    const weekdays = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
        'Friday', 'Saturday', 'Sunday'
    ];
    
    
    const seasons = [
        { name: 'Spring', months: ['March', 'April', 'May'] },
        { name: 'Summer', months: ['June', 'July', 'August'] },
        { name: 'Autumn', months: ['September', 'October', 'November'] },
        { name: 'Winter', months: ['December', 'January', 'February'] }
    ];
    
    
    const daysInMonth = {
        'January': 31,
        'February': 28,
        'March': 31,
        'April': 30,
        'May': 31,
        'June': 30,
        'July': 31,
        'August': 31,
        'September': 30,
        'October': 31,
        'November': 30,
        'December': 31
    };

    
    for (let i = 0; i < count; i++) {
        
        const questionType = Math.floor(Math.random() * 5);
        
        switch (questionType) {
            case 0: 
                
                const startMonthIndex = Math.floor(Math.random() * 12);
                const startMonth = months[startMonthIndex];
                
                
                const monthGap = Math.floor(Math.random() * 6) + 1;
                const targetMonthIndex = (startMonthIndex + monthGap) % 12;
                const targetMonth = months[targetMonthIndex];
                
                
                const monthOptions = [
                    targetMonth,
                    months[(targetMonthIndex + 1) % 12],
                    months[(targetMonthIndex + 2) % 12],
                    months[(targetMonthIndex - 1 + 12) % 12]
                ];
                
                
                const uniqueMonthOptions = [...new Set(monthOptions)];
                
                while (uniqueMonthOptions.length < 4) {
                    const randomMonth = months[Math.floor(Math.random() * 12)];
                    if (!uniqueMonthOptions.includes(randomMonth)) {
                        uniqueMonthOptions.push(randomMonth);
                    }
                }
                
                
                const shuffledMonthOptions = shuffle(uniqueMonthOptions);
                const monthAnswerIndex = shuffledMonthOptions.indexOf(targetMonth);
                const monthAnswerLetter = String.fromCharCode(65 + monthAnswerIndex);
                
                questions.push({
                    text: `If the current month is ${startMonth}, what month will it be after ${monthGap} month${monthGap > 1 ? 's' : ''}?`,
                    options: shuffledMonthOptions,
                    answer: monthAnswerLetter,
                    answerType: 'choice',
                    category: 'hard_calendar',
                    subCategory: 'month_calculation',
                    difficulty: 2
                });
                break;
                
            case 1:
                
                const season = seasons[Math.floor(Math.random() * seasons.length)];
                const isMonthToSeason = Math.random() < 0.5;
                
                if (isMonthToSeason) {
                    
                    const seasonMonth = season.months[Math.floor(Math.random() * 3)];
                    
                    
                    const seasonOptions = seasons.map(s => s.name);
                    const seasonAnswerIndex = seasonOptions.indexOf(season.name);
                    const seasonAnswerLetter = String.fromCharCode(65 + seasonAnswerIndex);
                    
                    questions.push({
                        text: `What season is ${seasonMonth} in?`,
                        options: shuffle(seasonOptions),
                        answer: seasonAnswerLetter,
                        answerType: 'choice',
                        category: 'hard_calendar',
                        subCategory: 'month_to_season',
                        difficulty: 2
                    });
                } else {
                    
                    
                    const nonSeasonMonths = months.filter(m => !season.months.includes(m));
                    const correctMonth = nonSeasonMonths[Math.floor(Math.random() * nonSeasonMonths.length)];
                    
                    
                    const monthSeasonOptions = [
                        correctMonth,
                        ...shuffle(season.months).slice(0, 3)
                    ];
                    
                    
                    const uniqueMonthSeasonOptions = [...new Set(monthSeasonOptions)];
                    while (uniqueMonthSeasonOptions.length < 4) {
                        const randomMonth = season.months[Math.floor(Math.random() * 3)];
                        if (!uniqueMonthSeasonOptions.includes(randomMonth)) {
                            uniqueMonthSeasonOptions.push(randomMonth);
                        }
                    }
                    
                    
                    const shuffledMonthSeasonOptions = shuffle(uniqueMonthSeasonOptions);
                    const monthSeasonAnswerIndex = shuffledMonthSeasonOptions.indexOf(correctMonth);
                    const monthSeasonAnswerLetter = String.fromCharCode(65 + monthSeasonAnswerIndex);
                    
                    questions.push({
                        text: `Which month is NOT in ${season.name}?`,
                        options: shuffledMonthSeasonOptions,
                        answer: monthSeasonAnswerLetter,
                        answerType: 'choice',
                        category: 'hard_calendar',
                        subCategory: 'season_to_month',
                        difficulty: 2
                    });
                }
                break;
                
            case 2:
                
                const monthForDays = months[Math.floor(Math.random() * 12)];
                const daysCount = daysInMonth[monthForDays];
                
                
                const daysOptions = [
                    daysCount.toString(),
                    (daysCount - 1).toString(),
                    (daysCount + 1).toString(),
                    (daysCount + 2).toString()
                ];
                
                
                const uniqueDaysOptions = [...new Set(daysOptions)];
                while (uniqueDaysOptions.length < 4) {
                    const randomDays = Math.floor(Math.random() * 3) + 28;
                    if (!uniqueDaysOptions.includes(randomDays.toString())) {
                        uniqueDaysOptions.push(randomDays.toString());
                    }
                }
                
                
                const shuffledDaysOptions = shuffle(uniqueDaysOptions);
                const daysAnswerIndex = shuffledDaysOptions.indexOf(daysCount.toString());
                const daysAnswerLetter = String.fromCharCode(65 + daysAnswerIndex);
                
                questions.push({
                    text: `How many days are there in ${monthForDays}?`,
                    options: shuffledDaysOptions,
                    answer: daysAnswerLetter,
                    answerType: 'choice',
                    category: 'hard_calendar',
                    subCategory: 'month_days',
                    difficulty: 2
                });
                break;
                
            case 3:
                
                const randomType = Math.random() < 0.5;
                
                if (randomType) {
                    
                    const weekdayCountOptions = shuffle(['5', '6', '7', '2']);
                    const weekdayCountAnswerIndex = weekdayCountOptions.indexOf('5');
                    const weekdayCountAnswerLetter = String.fromCharCode(65 + weekdayCountAnswerIndex);
                    
                    questions.push({
                        text: `How many weekdays (Monday to Friday) are there in a week?`,
                        options: weekdayCountOptions,
                        answer: weekdayCountAnswerLetter,
                        answerType: 'choice',
                        category: 'hard_calendar',
                        subCategory: 'weekday_count',
                        difficulty: 2
                    });
                } else {
                    
                    const weekdayPool = weekdays.filter(d => !['Saturday', 'Sunday'].includes(d));
                    const weekendPool = ['Saturday', 'Sunday'];
                    
                    
                    const workday = weekdayPool[Math.floor(Math.random() * weekdayPool.length)];
                    
                    
                    const weekdayOptions = [
                        workday,
                        'Saturday',
                        'Sunday',
                        
                        Math.random() < 0.5 ? weekdayPool[Math.floor(Math.random() * weekdayPool.length)] : 
                                             weekendPool[Math.floor(Math.random() * weekendPool.length)]
                    ];
                    
                    
                    const uniqueWeekdayOptions = [...new Set(weekdayOptions)];
                    while (uniqueWeekdayOptions.length < 4) {
                        const randomDay = weekdayPool[Math.floor(Math.random() * weekdayPool.length)];
                        if (!uniqueWeekdayOptions.includes(randomDay)) {
                            uniqueWeekdayOptions.push(randomDay);
                        }
                    }
                    
                    
                    const shuffledWeekdayOptions = shuffle(uniqueWeekdayOptions);
                    const weekdayAnswerIndex = shuffledWeekdayOptions.indexOf(workday);
                    const weekdayAnswerLetter = String.fromCharCode(65 + weekdayAnswerIndex);
                    
                    questions.push({
                        text: `Which of the following is a weekday (not weekend)?`,
                        options: shuffledWeekdayOptions,
                        answer: weekdayAnswerLetter,
                        answerType: 'choice',
                        category: 'hard_calendar',
                        subCategory: 'identify_weekday',
                        difficulty: 2
                    });
                }
                break;
                
            case 4:
                
                const startDayIndex = Math.floor(Math.random() * 7);
                const startDay = weekdays[startDayIndex];
                
                
                const dayGap = Math.floor(Math.random() * 3) + 2;
                const targetDayIndex = (startDayIndex + dayGap) % 7;
                const targetDay = weekdays[targetDayIndex];
                
                
                const dayOptions = [
                    targetDay,
                    weekdays[(targetDayIndex + 1) % 7],
                    weekdays[(targetDayIndex + 2) % 7],
                    weekdays[(targetDayIndex - 1 + 7) % 7]
                ];
                
                
                const uniqueDayOptions = [...new Set(dayOptions)];
                while (uniqueDayOptions.length < 4) {
                    const randomDay = weekdays[Math.floor(Math.random() * 7)];
                    if (!uniqueDayOptions.includes(randomDay)) {
                        uniqueDayOptions.push(randomDay);
                    }
                }
                
                
                const shuffledDayOptions = shuffle(uniqueDayOptions);
                const dayAnswerIndex = shuffledDayOptions.indexOf(targetDay);
                const dayAnswerLetter = String.fromCharCode(65 + dayAnswerIndex);
                
                questions.push({
                    text: `If today is ${startDay}, what day will it be after ${dayGap} days?`,
                    options: shuffledDayOptions,
                    answer: dayAnswerLetter,
                    answerType: 'choice',
                    category: 'hard_calendar',
                    subCategory: 'day_calculation',
                    difficulty: 2
                });
                break;
        }
    }
    
    return questions;
}









function getOrdinalSuffix(number) {
    const j = number % 10,
          k = number % 100;
          
    if (j == 1 && k != 11) {
        return number + "st";
    }
    if (j == 2 && k != 12) {
        return number + "nd";
    }
    if (j == 3 && k != 13) {
        return number + "rd";
    }
    return number + "th";
}


function shuffle(array) {
    let currentIndex = array.length;
    let temporaryValue, randomIndex;
  
    
    while (0 !== currentIndex) {
        
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        
        
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
  
    return array;
}






















function generateHardNumberSense(maxNumber, count) {
    return Array.from({length: count}, () => {
        const questionType = Math.floor(Math.random() * 3); 
        let text, answer, subCategory;
        const isSmallRange = maxNumber === 20;

        
        const [minStart, maxStep, seqLength] = isSmallRange 
            ? [3, 2, 4]  
            : [10, 3, 5]; 

        switch(questionType) {
            case 0: 
                const step = 2;
                const isOdd = Math.random() < 0.5;
                const start = isOdd 
                    ? Math.floor(Math.random() * (maxNumber - step*3)) * 2 + 1
                    : Math.floor(Math.random() * (maxNumber - step*3)) * 2;
                
                const pattern = Array.from({length: seqLength}, (_, i) => {
                    const num = start + (i * step);
                    return num > maxNumber ? num - step*2 : num;
                });
                
                const hiddenIndex = Math.floor(Math.random() * (seqLength - 2)) + 1;
                pattern[hiddenIndex] = '?';
                text = `Complete the pattern: ${pattern.join(', ')}`;
                answer = start + (hiddenIndex * step);
                subCategory = 'number_pattern';
                break;

            case 1: 
                const reverseStep = Math.floor(Math.random() * maxStep) + 1;
                const reverseStart = Math.min(
                    maxNumber, 
                    Math.floor(Math.random() * (maxNumber - reverseStep*(seqLength-1))) + reverseStep*(seqLength-1)
                );
                
                const reverseSeq = Array.from({length: seqLength}, (_, i) => reverseStart - (i * reverseStep));
                const reverseHidden = Math.floor(Math.random() * (seqLength - 2)) + 1;
                reverseSeq[reverseHidden] = '?';
                
                text = `Fill the missing number: ${reverseSeq.join(', ')}`;
                answer = reverseStart - (reverseHidden * reverseStep);
                subCategory = 'reverse_counting';
                break;

            case 2: 
                const target = Math.floor(Math.random() * (maxNumber - 1)) + 2; 
                text = `What number is right before ${target}?`;
                answer = target - 1;
                subCategory = 'number_order';
                break;
        }

        
        answer = Math.max(1, Math.min(maxNumber, answer));

        return {
            text,
            answer: String(answer),
            category: `hard_numbers_to_${maxNumber}`,
            subCategory,
            difficulty: 2
        };
    });
}



function generateHardBasicOperations(count) {
    return Array.from({length: count}, () => {
       
            
            const result = Math.floor(Math.random() * 10) + 5; 
            const a = Math.floor(Math.random() * (result - 1)) + 1;
            const b = result - a; 
            
            const op = Math.random() < 0.5 ? '+' : '-';
            
            if (op === '+') {
                return {
                    text: `${a} + ? = ${result}`,
                    answer: String(b),
                    category: 'hard_basic_operations',
                    subCategory: 'fill_blank_addition'
                };
            } else {
                
                const newA = result + b;
                return {
                    text: `${newA} - ? = ${result}`,
                    answer: String(b),
                    category: 'hard_basic_operations',
                    subCategory: 'fill_blank_subtraction'
                };
            }
        
    });
}


function generateHardMoneyQuestions(count) {
    
    const formatCurrency = (amount) => {
        return amount.toFixed(2);
    };

    
    const coins = [
        { name: "10cents", value: 0.10, label: "10¢" },
        { name: "20cents", value: 0.20, label: "20¢" },
        { name: "50cents", value: 0.50, label: "50¢" },
        { name: "1dollar", value: 1.00, label: "$1 coin" },
        { name: "2dollars", value: 2.00, label: "$2 coin" },
        { name: "5dollars", value: 5.00, label: "$5 coin" }
    ];

    
    const generateCoinCombination = (maxTotal = 10.00) => {
        let total = 0;
        const combination = [];
        const coinTypes = Math.floor(Math.random() * 4) + 3; 
        
        while(combination.length < coinTypes && total < maxTotal) {
            const coin = coins[Math.floor(Math.random() * coins.length)];
            if(total + coin.value > maxTotal) continue;
            combination.push(coin);
            total += coin.value;
        }
        return { combination, total };
    };

    return Array.from({ length: count }, () => {
        const questionType = Math.random() < 0.5 ? 0 : 1;

        if(questionType === 0) { 
            const { combination, total } = generateCoinCombination();
            const coinText = combination.map((c, index) => 
                `${index > 0 ? ' + ' : ''}${c.label}`
            ).join('');

            return {
                text: `Calculate the total value of these coins: ${coinText}`,
                answer: formatCurrency(total),
                answerType: 'text',
                category: 'hard_money',
                subCategory: 'coin_addition',
                difficulty: 2
            };
        }
        else { 
            let itemPrice, payment, change;
            do {
                
                itemPrice = (Math.floor(Math.random() * 13) + 3) * 0.50;
                
                
                payment = generateCoinCombination(itemPrice + 5.00);
                change = payment.total - itemPrice;
            } while(change <= 0 || change > 8.00);

            const paymentText = payment.combination.map(c => c.label).join(' + ');

            return {
                text: `A toy costs $${itemPrice.toFixed(2)}. You pay with ${paymentText}. How much change should you receive? (in dollars)`,
                answer: formatCurrency(change),
                answerType: 'text',
                category: 'hard_money',
                subCategory: 'coin_change',
                difficulty: 3
            };
        }
    });
}



function generateHardTimeQuestions(count) {
    return Array.from({length: count}, () => {
        const questionType = Math.random() < 0.6 ? 'elapsed_time' : 'schedule';
        
        if (questionType === 'elapsed_time') {
            
            const startHour = Math.floor(Math.random() * 12) + 1;
            const startMinute = Math.random() < 0.5 ? 0 : 30;
            const hoursElapsed = Math.floor(Math.random() * 3) + 1; 
            const additionalMinutes = Math.random() < 0.5 ? 0 : 30;
            
            let endHour = (startHour + hoursElapsed) % 12;
            if (endHour === 0) endHour = 12;
            let endMinute = (startMinute + additionalMinutes) % 60;
            
            if (startMinute + additionalMinutes >= 60) {
                endHour = (endHour + 1) % 12;
                if (endHour === 0) endHour = 12;
            }
            
            const startTime = `${startHour}:${startMinute === 0 ? '00' : startMinute}`;
            const endTime = `${endHour}:${endMinute === 0 ? '00' : endMinute}`;
            
            return {
                text: `School starts at ${startTime} and ends at ${endTime}. How long is the school day?`,
                answer: additionalMinutes === 0 ? 
                        `${hoursElapsed} hour${hoursElapsed > 1 ? 's' : ''}` : 
                        `${hoursElapsed} hour${hoursElapsed > 1 ? 's' : ''} and 30 minutes`,
                category: 'time',
                subCategory: 'elapsed_time'
            };
        } else {
            
            const hour = Math.floor(Math.random() * 12) + 1;
            const minute = Math.random() < 0.5 ? 0 : 30;
            const time = `${hour}:${minute === 0 ? '00' : minute}`;
            
            
            const activities = ["breakfast", "lunch", "school", "dinner", "bedtime"];
            const morningActivities = ["breakfast", "school"];
            const afternoonActivities = ["lunch", "school"];
            const eveningActivities = ["dinner", "bedtime"];
            
            let activity;
            if (hour >= 6 && hour < 12) {
                activity = morningActivities[Math.floor(Math.random() * morningActivities.length)];
            } else if (hour >= 12 && hour < 18) {
                activity = afternoonActivities[Math.floor(Math.random() * afternoonActivities.length)];
            } else {
                activity = eveningActivities[Math.floor(Math.random() * eveningActivities.length)];
            }
            
            return {
                text: `It is ${time}. What are you likely doing?<br>A) Having breakfast<br>B) At school<br>C) Having lunch<br>D) Having dinner<br>E) Getting ready for bed`,
                answer: activity === "breakfast" ? "A" :
                        activity === "school" ? "B" :
                        activity === "lunch" ? "C" :
                        activity === "dinner" ? "D" : "E",
                category: 'time',
                subCategory: 'daily_schedule'
            };
        }
    });
}



function generateHardMeasurement(count) {
    return Array.from({length: count}, () => {
        const questionType ='order_lengths' ;
        
        if (questionType === 'order_lengths') {
            
            const objects = ['pencil', 'eraser', 'ruler', 'crayon', 'book'];
            const selectedObjects = [];
            const usedObjects = new Set();
            
            
            while (selectedObjects.length < 3) {
                const obj = objects[Math.floor(Math.random() * objects.length)];
                if (!usedObjects.has(obj)) {
                    usedObjects.add(obj);
                    selectedObjects.push(obj);
                }
            }
            
            
            const relations = [
                `The ${selectedObjects[0]} is longer than the ${selectedObjects[1]}.`,
                `The ${selectedObjects[1]} is longer than the ${selectedObjects[2]}.`
            ];
            
            
            if (Math.random() < 0.5) {
                relations.reverse();
            }
            
            return {
                text: `${relations[0]}<br>${relations[1]}<br><br>Which is the shortest?`,
                answer: selectedObjects[2],
                category: 'hard_measurement',
                subCategory: 'transitive_reasoning'
            };
        } 
    });
}

function generateHardShapeQuestions(dimension, count) {

    const shapePool = dimension === '2d' 
        ? ['circle', 'square', 'triangle', 'rectangle','pentagon', 'hexagon']
        : ['prism', 'sphere','pyramid', 'cylinder','cone'];
    
    return Array.from({length: count}, (_, i) => {
        const shape = shapePool[Math.floor(Math.random() * shapePool.length)];
        const num = Math.floor(Math.random() * 2) + 1;

        return {
            text: `Identify this shape: <img src="/hardshapes/${shape}${num}.png" style="width: 100px; height: auto;">`,
            answer: shape,
            category: `hard_geometry_${dimension}d`,
            subCategory: 'shape_recognition',
            difficulty: 3
        };
    });
}






















app.post('/generate-questions', async (req, res) => {
    try {
        const { username, category, grade, timeLimit, count, targetClasses, setName, deadline } = req.body;

        
        const validClasses = ['1A', '1B', '1C', '1D', '2A', '2B', '2C', '2D', 'all', 'p1-all', 'p2-all'];
        const isValidClasses = targetClasses && targetClasses.every(c => validClasses.includes(c));
        if (!isValidClasses) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid class select' 
            });
        }

        
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: "User not exist" });

        
        const newQuestions = generateQuestions(category).slice(0, parseInt(count) || 10);
        
        
        const setId = new mongoose.Types.ObjectId().toString();
        
        
        
        const questionGrade = category.startsWith('p2_') ? 2 : parseInt(grade) || 1;
        
        
        const questionsWithMetadata = newQuestions.map(q => ({
            ...q,
            createdBy: user._id,
            category: category,
            grade: questionGrade, 
            timeLimit: parseInt(timeLimit) || 0,
            targetClasses: targetClasses || [questionGrade === 1 ? 'p1-all' : 'p2-all'],
            isPublic: targetClasses.includes('all') || targetClasses.includes('p1-all') || targetClasses.includes('p2-all'),
            setId: setId,
            setName: setName || `${category} - ${new Date().toLocaleString()}`,
            deadline: deadline ? new Date(deadline) : null
        }));
        
        
        const savedQuestions = await Question.insertMany(questionsWithMetadata);
        
        
        res.json({ 
            success: true,
            questions: savedQuestions.map(q => ({
                _id: q._id,
                text: q.text,
                answer: q.answer,
                options: q.options,
                answerType: q.answerType,
                category: q.category,
                grade: q.grade,
                timeLimit: q.timeLimit,
                targetClasses: q.targetClasses,
                setId: q.setId,
                setName: q.setName,
                deadline: q.deadline
            }))
        });
    } catch (error) {
        console.error('Generate question error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

app.get('/get-question-sets-teacher', async (req, res) => {
    try {
        const { category } = req.query;
        
        
        let query = {};
        if (category) {
            query.category = category;
        }
        
        
        const questions = await Question.find({
            ...query,
            setId: { $ne: null }
        });
        
        
        const setsMap = new Map();
        
        questions.forEach(q => {
            if (!setsMap.has(q.setId)) {
                setsMap.set(q.setId, {
                    _id: q.setId,
                    setName: q.setName || `Question Set - ${new Date(q._id.getTimestamp()).toLocaleString()}`,
                    category: q.category,
                    count: 1,
                    createdAt: q._id.getTimestamp(),
                    targetClasses: q.targetClasses,
                    deadline: q.deadline 
                });
            } else {
                const setInfo = setsMap.get(q.setId);
                setInfo.count += 1;
            }
        });
        
        
        const sets = Array.from(setsMap.values())
            .sort((a, b) => b.createdAt - a.createdAt);
        
        res.json({ 
            success: true, 
            sets
        });
    } catch (error) {
        console.error('failed to get question set:', error);
        res.status(500).json({ 
            success: false, 
            message: 'failed to get question set: ' + error.message
        });
    }
});


app.get('/get-question-sets', async (req, res) => {
    try {
        const { username } = req.query;
        
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        
        const query = {
            $or: [
                { targetClasses: 'all' },  
                { targetClasses: user.class },  
                
                user.grade === 1 ? { targetClasses: 'p1-all' } : { targetClasses: 'p2-all' }
            ],
            grade: user.grade,  
            setId: { $ne: null } 
        };
        
        
        const questions = await Question.find(query);
        
        
        const setsMap = new Map();
        
        questions.forEach(q => {
            if (q.setId && !setsMap.has(q.setId)) {
                setsMap.set(q.setId, {
                    setId: q.setId,
                    setName: q.setName || `${q.category} - ${new Date(q._id.getTimestamp()).toLocaleString()}`,
                    category: q.category,
                    createdAt: q._id.getTimestamp(),
                    deadline: q.deadline 
                });
            }
        });
        
        
        const sets = Array.from(setsMap.values())
            .sort((a, b) => b.createdAt - a.createdAt);
        
        res.json({
            success: true,
            sets: sets
        });
    } catch (error) {
        console.error('Error getting question sets:', error);
        res.status(500).json({ success: false, message: 'Failed to get question sets' });
    }
});


app.get('/get-questions-by-set/:setId', async (req, res) => {
    try {
        const { setId } = req.params;
        const { username } = req.query;
        
        
        let query = { setId };
        
        if (username) {
            const user = await User.findOne({ username });
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            
            
            query = {
                setId,
                $or: [
                    { targetClasses: 'all' },  
                    { targetClasses: user.class },  
                    
                    user.grade === 1 ? { targetClasses: 'p1-all' } : { targetClasses: 'p2-all' }
                ],
                grade: user.grade  
            };
        }
        
        const questions = await Question.find(query)
            .sort({ _id: 1 }) 
            .populate('createdBy', 'username');
            
        res.json({ 
            success: true, 
            questions: questions.map(q => ({
                _id: q._id,
                text: q.text,
                answer: q.answer,
                options: q.options,
                optionsWithLabels: q.optionsWithLabels,
                answerType: q.answerType || 'text',
                category: q.category,
                subCategory: q.subCategory,
                timeLimit: q.timeLimit,
                targetClasses: q.targetClasses,
                createdBy: q.createdBy?.username,
                setId: q.setId,
                setName: q.setName,
                deadline: q.deadline
            }))
        });
    } catch (error) {
        console.error('Failed to get question set:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get question set'
        });
    }
});



app.delete('/delete-question-set/:setId', async (req, res) => {
    try {
        const { setId } = req.params;
        
        
        const result = await Question.deleteMany({ setId });
        
        res.json({ 
            success: true,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Failed to delete question set:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete question set'
        });
    }
});



app.put('/update-question-set-name/:setId', async (req, res) => {
    try {
        const { setId } = req.params;
        const { setName } = req.body;
        
        if (!setName) {
            return res.status(400).json({
                success: false,
                message: 'Set name cannot be empty'
            });
        }
        
        
        await Question.updateMany({ setId }, { setName });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Update set name failed:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Update set name failed'
        });
    }
});






app.get('/get-question/:id', async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cannot find question' 
            });
        }
        
        res.json({ 
            success: true, 
            question: {
                _id: question._id,
                text: question.text,
                answer: question.answer,
                options: question.options,
                answerType: question.answerType,
                category: question.category,
                timeLimit: question.timeLimit,
                targetClasses: question.targetClasses
            }
        });
    } catch (error) {
        console.error('Failed to load question data:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to load question data' 
        });
    }
});




app.post('/update-question-classes', async (req, res) => {
    try {
        const { questionId, targetClasses } = req.body;
        
        
        const validClasses = ['1A', '1B', '1C', '1D', '2A', '2B', '2C', '2D', 'all', 'p1-all', 'p2-all'];
        const isValidClasses = targetClasses && targetClasses.every(c => validClasses.includes(c));
        
        if (!isValidClasses) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid class select' 
            });
        }
        
        
        await Question.findByIdAndUpdate(questionId, { 
            targetClasses,
            isPublic: targetClasses.includes('all') || targetClasses.includes('p1-all') || targetClasses.includes('p2-all')
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Update target class failed:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Update target class failed' 
        });
    }
});







app.get('/get-questions', async (req, res) => {
    try {
        const { category, username } = req.query;
        
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'Username not exist' });
        }
        
        const completedQuestionIds = user.scores.map(score => score.question);
        
        
        const query = {
            text: { $nin: completedQuestionIds },
            $or: [
                { targetClasses: 'all' },  
                { targetClasses: user.class },  
                
                user.grade === 1 ? { targetClasses: 'p1-all' } : { targetClasses: 'p2-all' }
            ]
        };

        
        if (category) {
            query.category = category;
        }
        
        
        if (user.role === 'student' && user.grade) {
            query.grade = user.grade;  
        }
        
        const questions = await Question.find(query)
            .sort({ _id: -1 })
            .limit(10);
            
        res.json(questions);
    } catch (error) {
        console.error('Failed to load question:', error);
        res.status(500).json({ error: 'Failed to load question' });
    }
});



app.post('/submit-answer', async (req, res) => {
    try {
        const { username, questionId, userAnswer, category, timestamp, optionsWithLabels, setId } = req.body;
        const user = await User.findOne({ username });
        const question = await Question.findById(questionId);

        if (!user || !question) {
            return res.status(404).json({ success: false, message: 'User or question not found' });
        }

        
        const isCorrect = question.answerType === 'choice' 
            ? userAnswer === question.answer 
            : userAnswer.toLowerCase() === question.answer.toLowerCase(); 
        
        
        let questionOptionsWithLabels = [];
        
        
        if (optionsWithLabels && optionsWithLabels.length > 0) {
            questionOptionsWithLabels = optionsWithLabels;
        } 
        
        else if (question.optionsWithLabels && question.optionsWithLabels.length > 0) {
            questionOptionsWithLabels = question.optionsWithLabels;
        } 
        
        else if (question.options && question.options.length > 0) {
            
            questionOptionsWithLabels = question.options.map((content, index) => ({
                label: String.fromCharCode(65 + index),
                content: content
            }));
        }
        
        
        let isLate = false;
        const submissionTime = timestamp ? new Date(timestamp) : new Date();
        
        if (question.deadline) {
            isLate = submissionTime > new Date(question.deadline);
        }
        
        
        const newScore = {
            question: question.text,
            userAnswer,
            isCorrect,
            category: category || question.category,
            timestamp: submissionTime,
            optionsWithLabels: questionOptionsWithLabels,
            answerType: question.answerType || 'text',
            options: question.options || [],
            isLate: isLate,
            setId: setId 
        };

        
        user.scores.push(newScore);
        await user.save();

        
        let correctAnswerDisplay = question.answer;
        if (question.answerType === 'choice') {
            if (questionOptionsWithLabels.length > 0) {
                const correctOption = questionOptionsWithLabels.find(opt => opt.label === question.answer);
                if (correctOption) {
                    correctAnswerDisplay = `${correctOption.label}. ${correctOption.content}`;
                }
            } else if (question.options) {
                const index = question.answer.charCodeAt(0) - 65; 
                if (index >= 0 && index < question.options.length) {
                    correctAnswerDisplay = `${question.answer}. ${question.options[index]}`;
                }
            }
        }

        res.json({
            success: true,
            isCorrect,
            correctAnswer: correctAnswerDisplay,
            isLate: isLate
        });
    } catch (error) {
        console.error('Error submitting answer:', error);
        res.status(500).json({ success: false, message: 'Failed to submit answer' });
    }
});





app.get('/get-all-scores', async (req, res) => {
    try {
        const { class: studentClass, grade } = req.query;
        const query = { role: 'student' };
        
        
        if (studentClass) {
            query.class = studentClass;
        }
        if (grade) {
            query.grade = parseInt(grade);
        }

        const users = await User.find(query);
        const scores = users.map(user => ({
            username: user.username,
            class: user.class,
            grade: user.grade,
            scores: user.scores
        }));

        res.json({ success: true, scores });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to load result.' 
        });
    }
});



app.get('/get-leaderboard', async (req, res) => {
    try {
        const { class: studentClass, grade } = req.query;
        const query = { role: 'student' };
        
        if (studentClass) {
            query.class = studentClass;
        }
        if (grade) {
            query.grade = parseInt(grade);
        }

        const users = await User.find(query);
        const leaderboard = users.map(user => ({
            username: user.username,
            class: user.class,
            grade: user.grade,
            correctAnswers: user.scores.filter(score => score.isCorrect).length,
            totalQuestions: user.scores.length
        })).sort((a, b) => b.correctAnswers - a.correctAnswers);

        res.json({ success: true, leaderboard });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to load leaderboard.' 
        });
    }
});


app.get('/get-user-info', async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            user: {
                username: user.username,
                role: user.role,
                grade: user.grade,
                class: user.class
            }
        });
    } catch (err) {
        console.error('Error getting user info:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to get user info'
        });
    }
});



function processChoiceQuestion(options, correctAnswer, answerIsIndex = false) {
    
    let correctLetter = correctAnswer;
    if (answerIsIndex) {
        correctLetter = String.fromCharCode(65 + parseInt(correctAnswer));
    }

    
    const optionsWithLabels = options.map((content, idx) => ({
        label: String.fromCharCode(65 + idx),
        content: content
    }));

    return {
        options: options,
        optionsWithLabels: optionsWithLabels,
        answer: correctLetter
    };
}


app.get('/get-questions-by-ids', async (req, res) => {
    try {
        const { ids, username, is_text_search } = req.query;
        
        if (!ids) {
            return res.status(400).json({ 
                success: false, 
                message: 'Question IDs are required' 
            });
        }
        
        
        const questionIdentifiers = ids.split(',').map(id => id.trim());
        
        if (questionIdentifiers.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No valid question IDs provided' 
            });
        }
        
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        
        let query = {};
        
        if (is_text_search === 'true') {
            
            query = {
                text: { $in: questionIdentifiers },
                grade: user.grade 
            };
            console.log('Searching questions by text:', questionIdentifiers);
        } else {
            
            try {
                query = {
                    _id: { $in: questionIdentifiers }
                };
                console.log('Searching questions by IDs:', questionIdentifiers);
            } catch (error) {
                console.error('Error processing question IDs:', error);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid question IDs format'
                });
            }
        }
        
        
        const questions = await Question.find(query);
        
        console.log(`Found ${questions.length} questions`);
        
        if (questions.length === 0) {
            return res.json({ 
                success: true, 
                questions: [], 
                message: 'No questions found for these identifiers' 
            });
        }
        
        
        const processedQuestions = questions.map(q => {
            const question = q.toObject();
            
            
            if (q.answerType === 'choice' && q.options && q.options.length > 0) {
                if (!question.optionsWithLabels) {
                    question.optionsWithLabels = q.options.map((option, index) => ({
                        label: String.fromCharCode(65 + index),  
                        content: option
                    }));
                }
            }
            
            return question;
        });
        
        res.json({ 
            success: true, 
            questions: processedQuestions 
        });
    } catch (error) {
        console.error('Error getting questions by IDs:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get questions: ' + error.message 
        });
    }
});

app.get('/get-late-submissions', async (req, res) => {
    try {
        
        const { class: studentClass, grade } = req.query;
        const query = { role: 'student' };
        
        
        if (studentClass) {
            query.class = studentClass;
        }
        if (grade) {
            query.grade = parseInt(grade);
        }

        
        const users = await User.find(query);
        const lateSubmissions = [];

        
        for (const user of users) {
            
            const lateScores = user.scores.filter(score => score.isLate);
            
            if (lateScores.length > 0) {
                
                const submissionsBySet = {};
                
                for (const score of lateScores) {
                    const setId = score.setId || 'uncategorized';
                    if (!submissionsBySet[setId]) {
                        submissionsBySet[setId] = [];
                    }
                    submissionsBySet[setId].push(score);
                }
                
                
                for (const [setId, scores] of Object.entries(submissionsBySet)) {
                    
                    const firstSubmission = scores.sort((a, b) => 
                        new Date(a.timestamp) - new Date(b.timestamp))[0];
                    
                    lateSubmissions.push({
                        username: user.username,
                        class: user.class,
                        grade: user.grade,
                        setId: setId === 'uncategorized' ? null : setId,
                        lateQuestionCount: scores.length,
                        submissionTime: firstSubmission.timestamp,
                        
                        category: firstSubmission.category
                    });
                }
            }
        }

        
        lateSubmissions.sort((a, b) => new Date(b.submissionTime) - new Date(a.submissionTime));
        
        res.json({ 
            success: true, 
            lateSubmissions 
        });
    } catch (err) {
        console.error('Error getting late submissions:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get late submissions.' 
        });
    }
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


app.use((req, res) => {
    res.status(404).send('Page not found');
});





app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


