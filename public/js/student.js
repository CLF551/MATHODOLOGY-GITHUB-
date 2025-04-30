document.addEventListener('DOMContentLoaded', function() {
    
    const questionContainer = document.getElementById('question-container');
    const submitButton = document.getElementById('submit-answer');
    const resultDiv = document.getElementById('result');
    const leaderboardBody = document.getElementById('leaderboard-body');
    const classLeaderboardBody = document.getElementById('class-leaderboard-body');
    const leaderboardContainer = document.getElementById('leaderboard-container');
    const showLeaderboardButton = document.getElementById('show-leaderboard');
    
    const usernameDisplay = document.getElementById('username-display');
    const username = localStorage.getItem('username');
    const showPerformanceButton = document.getElementById('show-performance');
    const performanceModal = new bootstrap.Modal(document.getElementById('performanceModal'));
    const performanceSummary = document.getElementById('performance-summary');
    const performanceDetails = document.getElementById('performance-details');
    
    
    const questionsTab = document.getElementById('questions-tab');
    const leaderboardTab = document.getElementById('leaderboard-tab');
    const performanceTab = document.getElementById('performance-tab');
    const reviewTab = document.getElementById('review-tab');  
    const gradeLeaderboardTab = document.getElementById('grade-leaderboard-tab');
    const classLeaderboardTab = document.getElementById('class-leaderboard-tab');

    
    const questionSetsContainer = document.getElementById('question-sets-container');
    const questionSetsList = document.getElementById('question-sets-list');
    const answeringArea = document.getElementById('answering-area');
    
    
    const reviewSummary = document.getElementById('review-summary');
    const completedSetsList = document.getElementById('completed-sets-list');
    const reviewDetailsContainer = document.getElementById('review-details-container');
    const reviewSetName = document.getElementById('review-set-name');
    const reviewSetSummary = document.getElementById('review-set-summary');
    const reviewQuestionsList = document.getElementById('review-questions-list');
    const backToSetsButton = document.getElementById('back-to-sets');
    const practiceWrongQuestionsButton = document.getElementById('practice-wrong-questions');
    
    
    const backToSetsButtonQuestionSet = document.createElement('button');
    
    
    const completedQuestionIds = new Set();
    
    let currentReviewSetData = null;
    let wrongQuestionsToReview = [];

    if (!username) {
        window.location.href = '/login';
    } else {
        usernameDisplay.textContent = `Welcome, ${username}`;
    }

    
    leaderboardTab.addEventListener('click', function(e) {
        e.preventDefault();
        loadGradeLeaderboard(); 
    });
    
    
    gradeLeaderboardTab.addEventListener('click', function(e) {
        e.preventDefault();
        loadGradeLeaderboard(); 
    });
    
    classLeaderboardTab.addEventListener('click', function(e) {
        e.preventDefault();
        loadClassLeaderboard(); 
    });

    performanceTab.addEventListener('click', function(e) {
        e.preventDefault();
        loadPerformanceData(); 
    });

    reviewTab.addEventListener('click', function(e) {
        e.preventDefault();
        loadCompletedQuestionSets(); 
    });

    
    let performanceChart = null;
    
    let originalPerformanceData = null;
    
    const chartCategoryFilter = document.getElementById('chart-category-filter');

    
    function formatCategory(category) {
        if (!category) return '-';
        
        
        return category
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    
    function loadPerformanceData() {
        const username = localStorage.getItem('username');
        if (!username) {
            alert('please login first');
            return;
        }
    
        
        performanceSummary.innerHTML = `
            <div class="text-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
        performanceDetails.innerHTML = '';
    
        fetch(`/get-student-performance?username=${username}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    
                    originalPerformanceData = data;
                    
                    
                    updateCategoryFilter(data);
                    
                    
                    const totalAccuracy = (data.totalCorrect / data.totalQuestions * 100).toFixed(1);
                    performanceSummary.innerHTML = `
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Overall performance</h5>
                                <div class="progress mb-3" style="height: 25px;">
                                    <div class="progress-bar" role="progressbar" 
                                         style="width: ${totalAccuracy}%">
                                        Correct percentage: ${totalAccuracy}%
                                    </div>
                                </div>
                                <p>Total questions: ${data.totalQuestions} | Correct: ${data.totalCorrect}</p>
                            </div>
                        </div>
                    `;
                    
                    
                    renderPerformanceChart(data);
    
                    
                    let detailsHtml = '<div class="accordion" id="categoryAccordion">';
                    Object.entries(data.stats).forEach(([category, stats], index) => {
                        const accuracy = (stats.correct / stats.total * 100).toFixed(1);
                        detailsHtml += `
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button ${index > 0 ? 'collapsed' : ''}" 
                                            type="button" data-bs-toggle="collapse" 
                                            data-bs-target="#category${index}">
                                        ${formatCategory(category)} (Correct percentage: ${accuracy}%)
                                    </button>
                                </h2>
                                <div id="category${index}" 
                                     class="accordion-collapse collapse ${index === 0 ? 'show' : ''}"
                                     data-bs-parent="#categoryAccordion">
                                    <div class="accordion-body">
                                        <div class="table-responsive">
                                            <table class="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Question</th>
                                                        <th>Your answer</th>
                                                        <th>Result</th>
                                                        <th>Time</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${stats.questions.map(q => {
                                                        
                                                        let userAnswerDisplay = q.userAnswer;
                                                        
                                                        
                                                        if (q.answerType === 'choice') {
                                                            
                                                            if (q.optionsWithLabels && q.optionsWithLabels.length > 0) {
                                                                const option = q.optionsWithLabels.find(opt => opt.label === q.userAnswer);
                                                                if (option) {
                                                                    userAnswerDisplay = `${option.label}. ${option.content}`;
                                                                }
                                                            } 
                                                            
                                                            else if (q.options && q.options.length > 0) {
                                                                const index = q.userAnswer.charCodeAt(0) - 65; 
                                                                if (index >= 0 && index < q.options.length) {
                                                                    userAnswerDisplay = `${q.userAnswer}. ${q.options[index]}`;
                                                                }
                                                            }
                                                            
                                                            else {
                                                                userAnswerDisplay = q.userAnswer;
                                                            }
                                                        }
                                                        
                                                        return `
                                                            <tr>
                                                                <td>${q.question}</td>
                                                                <td>${userAnswerDisplay}</td>
                                                                <td>
                                                                    <span class="badge ${q.isCorrect ? 'bg-success' : 'bg-danger'}">
                                                                        ${q.isCorrect ? '✓' : '✗'}
                                                                    </span>
                                                                </td>
                                                                <td>${new Date(q.timestamp).toLocaleString()}</td>
                                                                <td>
                                                                    ${q.isLate ? '<span class="badge bg-warning">Late</span>' : '<span class="badge bg-success">On time</span>'}
                                                                </td>
                                                            </tr>
                                                        `;
                                                    }).join('')}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    detailsHtml += '</div>';
                    performanceDetails.innerHTML = detailsHtml;
                }
            })
            .catch(error => {
                console.error('Failed to load result:', error);
                performanceSummary.innerHTML = '<div class="alert alert-danger">Failed to load performance</div>';
            });
    }

    
    function updateCategoryFilter(data) {
        
        while (chartCategoryFilter.options.length > 1) {
            chartCategoryFilter.remove(1);
        }
        
        
        const categories = Object.keys(data.stats);
        
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = formatCategory(category);
            chartCategoryFilter.appendChild(option);
        });
        
        
        if (!chartCategoryFilter._hasEventListener) {
            chartCategoryFilter.addEventListener('change', function() {
                filterChartByCategory(this.value);
            });
            chartCategoryFilter._hasEventListener = true;
        }
    }
    
    
    function filterChartByCategory(category) {
        if (!originalPerformanceData) return;
        
        if (!category) {
            
            renderPerformanceChart(originalPerformanceData);
            return;
        }
        
        
        const filteredData = {
            ...originalPerformanceData,
            stats: {}
        };
        
        
        if (originalPerformanceData.stats[category]) {
            filteredData.stats[category] = originalPerformanceData.stats[category];
            
            
            filteredData.totalQuestions = originalPerformanceData.stats[category].total;
            filteredData.totalCorrect = originalPerformanceData.stats[category].correct;
        }
        
        
        renderPerformanceChart(filteredData);
    }

    
    function renderPerformanceChart(performanceData) {
        const ctx = document.getElementById('student-performance-chart').getContext('2d');
        
        
        if (performanceChart) {
            performanceChart.destroy();
        }

        
        const categories = Object.keys(performanceData.stats);
        
        
        const correctCounts = categories.map(cat => performanceData.stats[cat].correct);
        const incorrectCounts = categories.map(cat => {
            const total = performanceData.stats[cat].total;
            const correct = performanceData.stats[cat].correct;
            return total - correct;
        });
        const totalCounts = categories.map(cat => performanceData.stats[cat].total);
        const percentages = categories.map((cat, index) => {
            const correct = performanceData.stats[cat].correct;
            const total = performanceData.stats[cat].total;
            return total > 0 ? (correct / total) * 100 : 0;
        });
        
        const chartData = {
            labels: categories.map(cat => formatCategory(cat)),
            datasets: [
                {
                    label: 'Correct answers',
                    data: correctCounts,
                    backgroundColor: '#4e73df',
                    borderColor: '#3a56c5',
                    borderWidth: 1,
                    stack: 'Stack 0',
                },
                {
                    label: 'Incorrect answers',
                    data: incorrectCounts,
                    backgroundColor: '#e74a3b',
                    borderColor: '#be3326',
                    borderWidth: 1,
                    stack: 'Stack 0',
                }
            ]
        };

        
        performanceChart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Category'
                        },
                        stacked: true
                    },
                    y: {
                        beginAtZero: true,
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Questions number'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            afterTitle: function(context) {
                                const index = context[0].dataIndex;
                                const correct = correctCounts[index];
                                const total = totalCounts[index];
                                const percentage = percentages[index];
                                return `Correct rate: ${percentage.toFixed(1)}%`;
                            },
                            label: function(context) {
                                const datasetLabel = context.dataset.label || '';
                                const value = context.raw;
                                return `${datasetLabel}: ${value}`;
                            },
                            afterLabel: function(context) {
                                if (context.datasetIndex === 0) {
                                    const index = context.dataIndex;
                                    const correct = correctCounts[index];
                                    const total = totalCounts[index];
                                    return `Total: ${total}`;
                                }
                                return '';
                            }
                        }
                    }
                }
            }
        });
    }

    
    let currentCategory = '';
    let currentSetId = '';
    let questions = [];
    let currentQuestionIndex = 0;
    let isAnswering = false;

    
    function loadCompletedQuestions() {
        const username = localStorage.getItem('username');
        const saved = localStorage.getItem(`${username}_completed_questions`);
        if (saved) {
            try {
                const savedIds = JSON.parse(saved);
                
                savedIds.forEach(id => completedQuestionIds.add(id.toString()));
                console.log('Loaded completed questions:', completedQuestionIds.size);
                console.log('Completed question IDs:', [...completedQuestionIds]);
            } catch (err) {
                console.error('Error parsing completed questions:', err);
                
                localStorage.removeItem(`${username}_completed_questions`);
            }
        }
    }
    
    
    function saveCompletedQuestions() {
        const username = localStorage.getItem('username');
        localStorage.setItem(
            `${username}_completed_questions`,
            JSON.stringify([...completedQuestionIds])
        );
    }



    function loadQuestions(category, resetIndex = true) {
        if (category !== undefined) {
            currentCategory = category;
        }
        
        const username = localStorage.getItem('username');
        if (!username) {
            window.location.href = '/login';
            return;
        }
    
        
        const userGrade = localStorage.getItem('userGrade');
        console.log('load questions, grade:', userGrade); 
    
        const url = currentCategory ? 
            `/get-questions?category=${currentCategory}&username=${username}` : 
            `/get-questions?username=${username}`;
        
        if (isAnswering && !resetIndex) {
            return;
        }
    
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log('Questions get:', data.length); 
                
                
                data.forEach(q => {
                    if (q._id && typeof q._id !== 'string') {
                        q._id = q._id.toString();
                    }
                });
                
                
                const newQuestions = data.filter(q => !completedQuestionIds.has(q._id));
                console.log('Questions after filtered:', newQuestions.length); 
                
                if (newQuestions.length > 0) {
                    questions = newQuestions;
                    if (resetIndex) {
                        currentQuestionIndex = 0;
                    }
                    showQuestion(currentQuestionIndex);
                } else {
                    questionContainer.innerHTML = "All questions completed, good job!";
                }
            })
            .catch(error => {
                console.error('Failed to load question:', error);
                questionContainer.innerHTML = '<div class="alert alert-danger">Failed to load questions</div>';
            });
    }

    function checkForNewQuestions(newQuestions) {
        if (!questions.length) return true;
        
        
        return newQuestions.length > 0 && 
            (!questions[0] || newQuestions[0]._id !== questions[0]._id);
    }

    function startQuestionPolling() {
        
        loadQuestions(currentCategory);
        
        
        setInterval(() => {
            loadQuestions(currentCategory, false);
        }, 300000);
    }

    function showQuestion(index) {
        if (questions[index]) {
            const question = questions[index];
            console.log('Showing question:', question);
            
            const timeLimit = question.timeLimit || 0;
            
            let timerDisplay = '';
            if (timeLimit > 0) {
                timerDisplay = `
                    <div class="timer-container mb-3">
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar" role="progressbar" style="width: 100%">
                                <span id="timer">${timeLimit}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            
            const questionText = question.text || question.question || '';
            if (!questionText) {
                console.error('Question has no text:', question);
            }
            
            let answerInputHtml = '';
            if (question.answerType === 'choice' && (question.options || question.optionsWithLabels)) {
                
                let options = [];
                
                
                if (question.optionsWithLabels && question.optionsWithLabels.length > 0) {
                    
                    options = question.optionsWithLabels.map(opt => ({
                        label: opt.label,
                        content: opt.content
                    }));
                } else if (question.options && question.options.length > 0) {
                    
                    options = question.options.map((option, i) => ({
                        label: String.fromCharCode(65 + i),
                        content: option
                    }));
                }
                
                if (options.length > 0) {
                    answerInputHtml = `
                        <div class="options-container mb-3">
                            ${options.map(option => `
                                <div class="form-check">
                                    <input class="form-check-input option-radio" type="radio" name="question-option" 
                                        id="option-${option.label}" value="${option.label}">
                                    <label class="form-check-label" for="option-${option.label}">
                                        ${option.label}. ${option.content}
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    `;
                } else {
                    
                    console.error('Choice question has invalid options:', question);
                    answerInputHtml = `
                        <div class="mb-3">
                            <input type="text" class="form-control" id="answer-input" placeholder="Enter your answer here">
                            <small class="text-danger">Warning: This should be a multiple choice question, but options data is missing.</small>
                        </div>
                    `;
                }
            } else {
                
                answerInputHtml = `
                    <div class="mb-3">
                        <input type="text" class="form-control" id="answer-input" placeholder="Enter your answer here">
                    </div>
                `;
            }

            
            const isDeadlinePassed = question.deadline && new Date() > new Date(question.deadline);

            questionContainer.innerHTML = `
                <div class="card mb-3">
                    <div class="card-body">
                        ${timeLimit > 0 ? timerDisplay : ''}
                        <h5 class="card-title">Question ${index + 1} / ${questions.length}</h5>
                        <p class="card-text">${questionText}</p>
                        <div class="text-muted small">
                            Category: ${formatCategory(question.category)}
                            ${question.subCategory ? `- ${question.subCategory}` : ''}
                            ${question.deadline ? `<br>Deadline: <span class="${isDeadlinePassed ? 'text-danger fw-bold' : ''}">${new Date(question.deadline).toLocaleString()} ${isDeadlinePassed ? '<span class="badge bg-danger">Expired</span>' : ''}</span>` : ''}
                        </div>
                        ${answerInputHtml}
                    </div>
                </div>
            `;

            
            if (timeLimit > 0) {
                startTimer(timeLimit);
            }
        } else {
            questionContainer.innerHTML = `
                <div class="alert alert-warning">
                    <p>No question found at index ${index}.</p>
                    <button class="btn btn-primary mt-2" id="back-to-question-sets">Back to Question Sets</button>
                </div>
            `;
            
            document.getElementById('back-to-question-sets').addEventListener('click', function() {
                answeringArea.style.display = 'none';
                questionSetsContainer.style.display = 'block';
            });
        }
    }


    let timerInterval;

    function startTimer(timeLimit) {
        clearInterval(timerInterval);
        let timeLeft = timeLimit;
        const timerElement = document.getElementById('timer');
        const progressBar = timerElement.parentElement;
        
        timerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft >= 0) {
                timerElement.textContent = timeLeft;
                const percentage = (timeLeft / timeLimit) * 100;
                progressBar.style.width = `${percentage}%`;
                
                
                if (timeLeft <= 5) {
                    progressBar.classList.add('bg-danger');
                } else if (timeLeft <= 10) {
                    progressBar.classList.add('bg-warning');
                }
            } else if (timeLeft < 0) {
                clearInterval(timerInterval);
                
              
                submitButton.click();  
            }
        }, 1000);
    }

    submitButton.addEventListener('click', function() {
        clearInterval(timerInterval); 
        
        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return;
        
        let userAnswer = 'Not answered';
        
        
        if (currentQuestion.answerType === 'choice') {
            
            const selectedOption = document.querySelector('input[name="question-option"]:checked');
            userAnswer = selectedOption ? selectedOption.value : 'Not answered';

            
            if (currentQuestion.options && !currentQuestion.optionsWithLabels) {
                const optionsWithLabels = currentQuestion.options.map((content, index) => ({
                    label: String.fromCharCode(65 + index),
                    content: content
                }));
                currentQuestion.optionsWithLabels = optionsWithLabels;
            }
        } else {
            
            userAnswer = document.getElementById('answer-input').value.trim() || 'Not answered';
        }
        
        isAnswering = true;
        submitButton.disabled = true; 
        
        
        const isReviewMode = currentQuestion._id && String(currentQuestion._id).startsWith('temp_');
        
        if (isReviewMode) {
            
            console.log('Review mode answer:', userAnswer);
            
            
            const isCorrect = checkAnswerLocally(currentQuestion, userAnswer);
            
            
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = isCorrect ? 
                '<i class="text-success">✓ Correct!</i>' : 
                `<i class="text-danger">✗ Wrong. The correct answer is: ${currentQuestion.answer}</i>`;
            resultDiv.className = isCorrect ? 'alert alert-success' : 'alert alert-danger';
            
            
            setTimeout(() => {
                submitButton.disabled = false; 
                currentQuestionIndex++;
                
                if (currentQuestionIndex < questions.length) {
                    showQuestion(currentQuestionIndex);
                } else {
                    isAnswering = false;
                    
                    const reviewTabElement = new bootstrap.Tab(document.getElementById('review-tab'));
                    reviewTabElement.show();
                    answeringArea.style.display = 'none';
                    questionContainer.innerHTML = "";
                    
                    
                    alert("You have completed all the review questions!");
                }
                resultDiv.style.display = 'none';
            }, 2000);
            
            return; 
        }
        
        
        const username = localStorage.getItem('username');
        if (!username) {
            window.location.href = '/login';
            return;
        }
        
        fetch('/submit-answer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                questionId: currentQuestion._id,
                userAnswer: userAnswer,
                category: currentQuestion.category,
                timestamp: new Date().toISOString(),
                optionsWithLabels: currentQuestion.optionsWithLabels || [], 
                setId: currentSetId || null 
            })
        })
        .then(response => response.json())
        .then(data => {
            resultDiv.style.display = 'block';
            if (data.success) {
                
                const questionIdStr = currentQuestion._id.toString();
                completedQuestionIds.add(questionIdStr);
                console.log(`Added completed question ID: ${questionIdStr}`);
                console.log('Updated completedQuestionIds:', [...completedQuestionIds]);
                saveCompletedQuestions();

                
                let resultHtml = data.isCorrect ? 
                    '<i class="text-success">✓ Correct!</i>' : 
                    `<i class="text-danger">✗ Wrong. The correct answer is: ${data.correctAnswer}</i>`;
                
                
                if (data.isLate) {
                    resultHtml += '<div class="mt-2"><i class="text-warning">⚠️ Submitted after deadline</i></div>';
                }
                
                resultDiv.innerHTML = resultHtml;
                resultDiv.className = data.isCorrect ? 'alert alert-success' : 'alert alert-danger';
                
                
                const isLastQuestion = currentQuestionIndex === questions.length - 1;
                
                setTimeout(() => {
                    submitButton.disabled = false; 
                    currentQuestionIndex++;
                    
                    if (currentQuestionIndex < questions.length) {
                        showQuestion(currentQuestionIndex);
                    } else {
                        isAnswering = false;
                        
                        questionSetsContainer.style.display = 'block';
                        answeringArea.style.display = 'none';
                        questionContainer.innerHTML = "";
                        
                        if (isLastQuestion) {
                            console.log(`All questions in set ${currentSetId} completed!`);
                            alert("You have completed all the questions in this set!");
                            
                            
                            loadQuestionSets();
                        }
                    }
                    resultDiv.style.display = 'none';
                }, 2000);
                
                
                loadGradeLeaderboard();
            } else {
                submitButton.disabled = false; 
                console.error('Submit answer error:', data);
                resultDiv.innerHTML = data.message || 'Failed to submit answer, please try again.';
                resultDiv.className = 'alert alert-danger';
            }
        })
        .catch(error => {
            submitButton.disabled = false; 
            console.error('Submit answer error:', error);
            resultDiv.innerHTML = 'Failed to submit answer, please try again later.';
            resultDiv.className = 'alert alert-danger';
            isAnswering = false;
        });
    });

    
    function loadGradeLeaderboard() {
        const userGrade = localStorage.getItem('userGrade') || '1';
        
        
        leaderboardBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </td>
            </tr>
        `;
        
        fetch(`/get-leaderboard?grade=${userGrade}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    
                    const top10 = data.leaderboard.slice(0, 10);
                    leaderboardBody.innerHTML = top10
                        .map((user, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${user.username}</td>
                                <td>${user.grade ? (user.grade === 1 ? 'Grade 1' : 'Grade 2') : '-'}</td>
                                <td>${user.class || '-'}</td>
                                <td>${user.correctAnswers}</td>
                                <td>${user.totalQuestions}</td>
                            </tr>
                        `)
                        .join('');
                }
            })
            .catch(error => {
                console.error('Failed to load leaderboard:', error);
                leaderboardBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-danger">
                            Failed to load leaderboard, please try again later.
                        </td>
                    </tr>
                `;
            });
    }
    
    
    function loadClassLeaderboard() {
        const userClass = localStorage.getItem('userClass');
        
        if (!userClass) {
            classLeaderboardBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-warning">
                        Class information not available
                    </td>
                </tr>
            `;
            return;
        }
        
        
        classLeaderboardBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </td>
            </tr>
        `;
        
        fetch(`/get-leaderboard?class=${userClass}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    
                    const top10 = data.leaderboard.slice(0, 10);
                    classLeaderboardBody.innerHTML = top10
                        .map((user, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${user.username}</td>
                                <td>${user.grade ? (user.grade === 1 ? 'Grade 1' : 'Grade 2') : '-'}</td>
                                <td>${user.class || '-'}</td>
                                <td>${user.correctAnswers}</td>
                                <td>${user.totalQuestions}</td>
                            </tr>
                        `)
                        .join('');
                    
                    
                    if (top10.length === 0) {
                        classLeaderboardBody.innerHTML = `
                            <tr>
                                <td colspan="6" class="text-center text-info">
                                    No data available for your class
                                </td>
                            </tr>
                        `;
                    }
                }
            })
            .catch(error => {
                console.error('Failed to load class leaderboard:', error);
                classLeaderboardBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-danger">
                            Failed to load class leaderboard, please try again later.
                        </td>
                    </tr>
                `;
            });
    }

    
    showPerformanceButton.addEventListener('click', function() {
        
        const performanceTabEl = new bootstrap.Tab(performanceTab);
        performanceTabEl.show();
        loadPerformanceData();
    });

    
    function loadUserGradeAndUpdateUI() {
        const username = localStorage.getItem('username');
        if (!username) return;
        
        fetch(`/get-user-info?username=${username}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    
                    localStorage.setItem('userGrade', data.user.grade);
                    localStorage.setItem('userClass', data.user.class);
                    
                    
                }
            })
            .catch(error => {
                console.error('Failed to load user grade:', error);
            });
    }


    
    function loadQuestionSets() {
        const username = localStorage.getItem('username');
        if (!username) {
            window.location.href = '/login';
            return;
        }

        
        console.log('Current completed question IDs:', [...completedQuestionIds]);
        
        
        questionSetsList.innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Loading question sets...</p>
            </div>
        `;

        
        fetch(`/get-question-sets?username=${username}&include_questions=true&full_details=true`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('API response:', data);
                
                if (!data.success) {
                    console.error('API reported failure:', data);
                    throw new Error('API reported failure');
                }
                
                if (!data.sets || !Array.isArray(data.sets)) {
                    console.error('Invalid sets data:', data);
                    throw new Error('Invalid sets data received');
                }
                
                if (data.sets.length === 0) {
                    questionSetsList.innerHTML = '<div class="col-12 text-center">No available question sets.</div>';
                    return;
                }
                
                console.log('Received question sets:', data.sets);
                
                
                data.sets.forEach(set => {
                    if (!set.questions) {
                        set.questions = [];
                        console.warn(`Set ${set.setName} has no questions array`);
                    } else if (!Array.isArray(set.questions)) {
                        console.warn(`Set ${set.setId || set.setName} has invalid questions format:`, set.questions);
                        set.questions = Array.isArray(set.questions) ? set.questions : [];
                    } else {
                        
                        set.questions = set.questions.map(qId => qId.toString());
                    }
                    console.log(`Set ${set.setName} has ${set.questions.length} questions:`, set.questions);
                });
                
                renderQuestionSets(data.sets);
            })
            .catch(error => {
                console.error('Failed to load question sets:', error);
                questionSetsList.innerHTML = `
                    <div class="col-12 text-center text-danger">
                        <p>Failed to load question sets: ${error.message}</p>
                        <button class="btn btn-primary mt-2" onclick="loadQuestionSets()">Try Again</button>
                    </div>
                `;
            });
    }

    
    function renderQuestionSets(sets) {
        
        sets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        console.log('Rendering sets, before filtering:', sets.length);
        
        
        const filteredSets = sets.filter(set => {
            
            if (!set.questions || !Array.isArray(set.questions) || set.questions.length === 0) {
                console.log(`Set ${set.setName} has no questions array, keeping it`);
                return true;
            }
            
            
            const allCompleted = set.questions.every(qId => {
                const questionIdStr = qId.toString();
                const isCompleted = completedQuestionIds.has(questionIdStr);
                if (isCompleted) {
                    console.log(`Question ${questionIdStr} in set ${set.setName} is completed`);
                }
                return isCompleted;
            });
            
            console.log(`Set ${set.setName}: allCompleted = ${allCompleted}, showing = ${!allCompleted}`);
            
            
            return !allCompleted;
        });
        
        console.log('After filtering:', filteredSets.length);
        
        if (filteredSets.length === 0) {
            questionSetsList.innerHTML = '<div class="col-12 text-center">All question sets completed! Good job!</div>';
            return;
        }
        
        const setsHtml = filteredSets.map(set => {
            
            const isDeadlinePassed = set.deadline && new Date() > new Date(set.deadline);
            
            return `
            <div class="col-md-4 mb-3">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${set.setName}</h5>
                        <p class="card-text">
                            <small class="text-muted">Category: ${formatCategory(set.category)}</small><br>
                            <small class="text-muted">Created time: ${new Date(set.createdAt).toLocaleString()}</small>
                            ${set.deadline ? `<br><small class="text-muted ${isDeadlinePassed ? 'text-danger fw-bold' : ''}">Deadline: ${new Date(set.deadline).toLocaleString()} ${isDeadlinePassed ? '<span class="badge bg-danger">Expired</span>' : ''}</small>` : ''}
                        </p>
                        <button class="btn btn-primary btn-sm start-set" data-set-id="${set.setId}">Start</button>
                    </div>
                </div>
            </div>
        `}).join('');
        
        questionSetsList.innerHTML = setsHtml;
        
        
        document.querySelectorAll('.start-set').forEach(button => {
            button.addEventListener('click', function() {
                const setId = this.getAttribute('data-set-id');
                currentSetId = setId;
                loadQuestionsBySet(setId);
            });
        });
    }

    
    let currentSet = null;

    
    function loadQuestionsBySet(setId) {
        const username = localStorage.getItem('username');
        if (!username) {
            window.location.href = '/login';
            return;
        }
        
        currentSetId = setId; 
        
        fetch(`/get-questions-by-set/${setId}?username=${username}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.questions && data.questions.length > 0) {
                    
                    if (data.set) {
                        currentSet = data.set;
                        console.log('Current set info:', currentSet);
                    }
                    
                    
                    questionSetsContainer.style.display = 'none';
                    answeringArea.style.display = 'block';
                    
                    console.log('Loaded questions:', data.questions.length);
                    console.log('Completed IDs count:', completedQuestionIds.size);
                    
                    
                    data.questions.forEach(q => {
                        if (q._id && typeof q._id !== 'string') {
                            q._id = q._id.toString();
                        }
                    });
                    
                    
                    questions = data.questions.filter(q => !completedQuestionIds.has(q._id.toString()));
                    
                    console.log('Filtered questions:', questions.length);
                    
                    if (questions.length > 0) {
                        currentQuestionIndex = 0;
                        showQuestion(currentQuestionIndex);
                    } else {
                        
                        questionSetsContainer.style.display = 'block';
                        answeringArea.style.display = 'none';
                        questionContainer.innerHTML = "";
                        loadQuestionSets(); 
                        alert("You have completed all the questions in this set!");
                    }
                } else {
                    alert('No questions found in this set');
                }
            })
            .catch(error => {
                console.error('Failed to load questions by set:', error);
                alert('Failed to load questions, please try again later.');
            });
    }

    
    loadQuestionSets();
    loadUserGradeAndUpdateUI();
    loadGradeLeaderboard(); 
    loadQuestions();
    startQuestionPolling();
    loadCompletedQuestions();

    
    backToSetsButtonQuestionSet.className = 'btn btn-secondary mt-3';
    backToSetsButtonQuestionSet.textContent = 'Back to question sets list';
    backToSetsButtonQuestionSet.addEventListener('click', function() {
        questions = [];
        answeringArea.style.display = 'none';
        questionSetsContainer.style.display = 'block';
    });
    answeringArea.appendChild(backToSetsButtonQuestionSet);

    
    backToSetsButton.addEventListener('click', function() {
        reviewDetailsContainer.style.display = 'none';
        document.getElementById('completed-sets-container').style.display = 'block';
    });

    
    practiceWrongQuestionsButton.addEventListener('click', function() {
        if (wrongQuestionsToReview.length === 0) {
            alert('No wrong questions to practice!');
            return;
        }
        
        
        const questionsTabElement = new bootstrap.Tab(document.getElementById('questions-tab'));
        questionsTabElement.show();
        
        
        practiceWrongQuestions(wrongQuestionsToReview);
    });

    
    function loadCompletedQuestionSets() {
        const username = localStorage.getItem('username');
        if (!username) {
            window.location.href = '/login';
            return;
        }
        
        
        completedSetsList.innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Loading completed question sets...</p>
            </div>
        `;
        
        
        fetch(`/get-student-performance?username=${username}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    
                    fetch(`/get-question-sets?username=${username}`)
                        .then(response => response.json())
                        .then(setsData => {
                            if (setsData.success && setsData.sets && setsData.sets.length > 0) {
                                console.log('GET-QUESTION-SETS Response:', setsData.sets);
                                
                                
                                console.log('Performance data stats:', data.stats);
                                
                                
                                for (const category in data.stats) {
                                    const questions = data.stats[category].questions;
                                    if (questions && questions.length > 0) {
                                        const sampleQuestion = questions[0];
                                        console.log(`Sample question from ${category}:`, sampleQuestion);
                                        console.log(`Has setId: ${sampleQuestion.setId ? 'Yes' : 'No'}`);
                                    }
                                }
                                
                                renderCompletedSets(data, setsData.sets);
                            } else {
                                completedSetsList.innerHTML = '<div class="col-12">No question sets found.</div>';
                            }
                        })
                        .catch(error => {
                            console.error('Failed to load question sets:', error);
                            completedSetsList.innerHTML = '<div class="col-12 alert alert-danger">Failed to load question sets.</div>';
                        });
                } else {
                    completedSetsList.innerHTML = '<div class="col-12 alert alert-warning">No performance data available.</div>';
                }
            })
            .catch(error => {
                console.error('Failed to load performance data:', error);
                completedSetsList.innerHTML = '<div class="col-12 alert alert-danger">Failed to load performance data.</div>';
            });
    }
    
    
    function renderCompletedSets(performanceData, allSets) {
        
        const setCompletionMap = new Map();
        
        
        allSets.forEach(set => {
            setCompletionMap.set(set.setId, {
                setId: set.setId,
                setName: set.setName,
                category: set.category,
                totalQuestions: 0,
                correctQuestions: 0,
                questions: [],
                created: set.createdAt || new Date().toISOString() 
            });
        });
        
        
        Object.entries(performanceData.stats).forEach(([category, stats]) => {
            
            const categoryQuestionSets = allSets.filter(set => set.category === category);
            
            if (categoryQuestionSets.length > 0) {
                
                categoryQuestionSets.sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0);
                    const dateB = new Date(b.createdAt || 0);
                    return dateB - dateA; 
                });
                
                
                stats.questions.forEach(question => {
                    
                    if (question.setId && setCompletionMap.has(question.setId)) {
                        const setData = setCompletionMap.get(question.setId);
                        setData.totalQuestions++;
                        if (question.isCorrect) {
                            setData.correctQuestions++;
                        }
                        setData.questions.push(question);
                    } else {
                        

                        
                        const questionTime = new Date(question.timestamp || 0);
                        
                        
                        let bestMatchSet = null;
                        let minTimeDiff = Infinity;
                        
                        for (const set of categoryQuestionSets) {
                            const setTime = new Date(set.createdAt || 0);
                            
                            if (setTime <= questionTime) {
                                const timeDiff = questionTime - setTime;
                                if (timeDiff < minTimeDiff) {
                                    minTimeDiff = timeDiff;
                                    bestMatchSet = set;
                                }
                            }
                        }
                        
                        
                        if (bestMatchSet && setCompletionMap.has(bestMatchSet.setId)) {
                            const setData = setCompletionMap.get(bestMatchSet.setId);
                            setData.totalQuestions++;
                            if (question.isCorrect) {
                                setData.correctQuestions++;
                            }
                            setData.questions.push(question);
                        } else if (categoryQuestionSets.length > 0) {
                            
                            const fallbackSetId = `unclassified_${category}`;
                            
                            if (!setCompletionMap.has(fallbackSetId)) {
                                setCompletionMap.set(fallbackSetId, {
                                    setId: fallbackSetId,
                                    setName: `Unclassified ${formatCategory(category)} Questions`,
                                    category: category,
                                    totalQuestions: 0,
                                    correctQuestions: 0,
                                    questions: []
                                });
                            }
                            
                            const setData = setCompletionMap.get(fallbackSetId);
                            setData.totalQuestions++;
                            if (question.isCorrect) {
                                setData.correctQuestions++;
                            }
                            setData.questions.push(question);
                        }
                    }
                });
            }
        });
        
        
        for (const [setId, setData] of setCompletionMap.entries()) {
            if (setData.totalQuestions === 0) {
                setCompletionMap.delete(setId);
            }
        }
        
        if (setCompletionMap.size === 0) {
            completedSetsList.innerHTML = '<div class="col-12">No completed question sets found. All questions are from individual practice.</div>';
            return;
        }
        
        
        let html = '';
        setCompletionMap.forEach(setData => {
            const accuracy = (setData.correctQuestions / setData.totalQuestions * 100).toFixed(1);
            html += `
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${setData.setName}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">${formatCategory(setData.category)}</h6>
                            <div class="progress mb-2" style="height: 20px;">
                                <div class="progress-bar ${getProgressBarClass(accuracy)}" role="progressbar" 
                                     style="width: ${accuracy}%" aria-valuenow="${accuracy}" 
                                     aria-valuemin="0" aria-valuemax="100">${accuracy}%</div>
                            </div>
                            <p class="card-text">
                                Correct: ${setData.correctQuestions} / ${setData.totalQuestions}
                            </p>
                            <button class="btn btn-primary btn-sm view-set-details" 
                                    data-set-id="${setData.setId}">View Details</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        completedSetsList.innerHTML = html;
        
        
        document.querySelectorAll('.view-set-details').forEach(button => {
            button.addEventListener('click', function() {
                const setId = this.getAttribute('data-set-id');
                const setData = setCompletionMap.get(setId);
                showSetDetails(setData);
            });
        });
    }
    
    
    function getProgressBarClass(accuracy) {
        if (accuracy >= 90) return 'bg-success';
        if (accuracy >= 70) return 'bg-info';
        if (accuracy >= 50) return 'bg-warning';
        return 'bg-danger';
    }
    
    
    function showSetDetails(setData) {
        
        currentReviewSetData = setData;
        
        console.log('Viewing set details:', setData);
        
        
        reviewSetName.textContent = setData.setName;
        
        
        const accuracy = (setData.correctQuestions / setData.totalQuestions * 100).toFixed(1);
        reviewSetSummary.innerHTML = `
            <p>Category: ${formatCategory(setData.category)}</p>
            <p>Total questions: ${setData.totalQuestions}</p>
            <p>Correct: ${setData.correctQuestions} (${accuracy}%)</p>
        `;
        
        
        wrongQuestionsToReview = setData.questions.filter(q => !q.isCorrect);
        console.log('Found wrong questions:', wrongQuestionsToReview.length);
        console.log('Sample wrong question:', wrongQuestionsToReview.length > 0 ? wrongQuestionsToReview[0] : 'None');
        
        
        wrongQuestionsToReview = wrongQuestionsToReview.map(q => {
            
            if (!q._id && q.question) {
                console.log('Adding question field as ID for:', q.question);
                q._id = q.question; 
            }
            return q;
        });
        
        
        let questionsHtml = '<div class="table-responsive"><table class="table table-hover">';
        questionsHtml += `
            <thead>
                <tr>
                    <th>Question</th>
                    <th>Your Answer</th>
                    <th>Result</th>
                    <th>Correct Answer</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        setData.questions.forEach(question => {
            
            let userAnswerDisplay = question.userAnswer;
            let correctAnswerDisplay = ''; 
            
            
            if (question.answerType === 'choice' && question.optionsWithLabels) {
                
                const userOption = question.optionsWithLabels.find(opt => opt.label === question.userAnswer);
                if (userOption) {
                    userAnswerDisplay = `${userOption.label}. ${userOption.content}`;
                }
                
                
                
                if (question.correctAnswer) {
                    const correctOption = question.optionsWithLabels.find(opt => opt.label === question.correctAnswer);
                    if (correctOption) {
                        correctAnswerDisplay = `${correctOption.label}. ${correctOption.content}`;
                    } else {
                        correctAnswerDisplay = question.correctAnswer;
                    }
                }
            } else {
                
                correctAnswerDisplay = question.correctAnswer || 'Not available';
            }
            
            questionsHtml += `
                <tr class="${question.isCorrect ? 'table-success' : 'table-danger'}">
                    <td>${question.question}</td>
                    <td>${userAnswerDisplay}</td>
                    <td>
                        <span class="badge ${question.isCorrect ? 'bg-success' : 'bg-danger'}">
                            ${question.isCorrect ? '✓' : '✗'}
                        </span>
                    </td>
                    <td>${correctAnswerDisplay}</td>
                </tr>
            `;
        });
        
        questionsHtml += '</tbody></table></div>';
        reviewQuestionsList.innerHTML = questionsHtml;
        
        
        document.getElementById('completed-sets-container').style.display = 'none';
        reviewDetailsContainer.style.display = 'block';
        
        
        practiceWrongQuestionsButton.disabled = wrongQuestionsToReview.length === 0;
    }
    
    
    function practiceWrongQuestions(wrongQuestions) {
        if (!wrongQuestions || wrongQuestions.length === 0) {
            alert('No wrong questions to practice!');
            return;
        }
        
        console.log('Wrong questions to practice:', wrongQuestions);
        
        
        
        const questionTexts = wrongQuestions
            .map(q => q.question)
            .filter(text => text);
        
        console.log('Question texts for practice:', questionTexts);
        
        if (questionTexts.length === 0) {
            alert('Cannot extract question content for practice.');
            return;
        }
        
        
        questionContainer.innerHTML = `
            <div class="text-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Loading practice questions...</p>
            </div>
        `;
        
        
        answeringArea.style.display = 'block';
        questionSetsContainer.style.display = 'none';
        
        
        const username = localStorage.getItem('username');
        const userGrade = localStorage.getItem('userGrade');
        
        
        
        questions = wrongQuestions.map(q => {
            
            return {
                text: q.question,
                category: q.category || 'review',
                answerType: q.answerType || 'text',
                options: q.options || [],
                optionsWithLabels: q.optionsWithLabels || [],
                answer: q.correctAnswer || '',
                _id: `temp_${Math.random().toString(36).substr(2, 9)}`, 
                grade: userGrade || 1
            };
        });
        
        if (questions.length > 0) {
            currentQuestionIndex = 0;
            showQuestion(currentQuestionIndex);
        } else {
            questionContainer.innerHTML = `
                <div class="alert alert-warning">
                    <p>Failed to prepare practice questions.</p>
                    <button class="btn btn-primary mt-2" id="back-to-review">Back to Review</button>
                </div>
            `;
            
            
            document.getElementById('back-to-review').addEventListener('click', function() {
                const reviewTabElement = new bootstrap.Tab(document.getElementById('review-tab'));
                reviewTabElement.show();
                answeringArea.style.display = 'none';
            });
        }
    }

    
    function checkAnswerLocally(question, userAnswer) {
        console.log('Checking answer locally:', {
            question: question.text,
            userAnswer: userAnswer,
            correctAnswer: question.answer
        });
        
        
        if (question.answerType === 'choice') {
            
            return userAnswer === question.answer;
        } else {
            
            
            const userAnswerTrimmed = userAnswer.trim().toLowerCase();
            const correctAnswerTrimmed = question.answer.trim().toLowerCase();
            return userAnswerTrimmed === correctAnswerTrimmed;
        }
    }
});