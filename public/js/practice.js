document.addEventListener('DOMContentLoaded', function() {
    
    const usernameDisplay = document.getElementById('username-display');
    const practiceForm = document.getElementById('practice-form');
    const gradeSelect = document.getElementById('grade-select');
    const categorySelect = document.getElementById('category-select');
    const questionCountSelect = document.getElementById('question-count');
    const questionContainer = document.getElementById('question-container');
    const resultContainer = document.getElementById('result-container');
    const prevQuestionBtn = document.getElementById('prev-question');
    const nextQuestionBtn = document.getElementById('next-question');
    const correctCountElement = document.getElementById('correct-count');
    const totalCountElement = document.getElementById('total-count');
    const progressBar = document.getElementById('progress-bar');
    const accuracyDisplay = document.getElementById('accuracy-display');
    const p1Categories = document.getElementById('p1-categories');
    const p2Categories = document.getElementById('p2-categories');
    
    
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = '/login';
    } else {
        usernameDisplay.textContent = `Welcome, ${username}`;
    }
    
    
    let practiceQuestions = [];
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let correctAnswers = 0;
    
    
    gradeSelect.addEventListener('change', function() {
        const grade = parseInt(gradeSelect.value);
        if (grade === 1) {
            p1Categories.style.display = '';
            p2Categories.style.display = 'none';
            
            categorySelect.value = categorySelect.querySelector('#p1-categories option').value;
        } else if (grade === 2) {
            p1Categories.style.display = 'none';
            p2Categories.style.display = '';
            
            categorySelect.value = categorySelect.querySelector('#p2-categories option').value;
        }
    });
    
    
    practiceForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const category = categorySelect.value;
        const count = parseInt(questionCountSelect.value);
        
        
        currentQuestionIndex = 0;
        userAnswers = new Array(count).fill(null);
        correctAnswers = 0;
        updateStats();
        
        try {
            
            fetch('/api/practice-questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category: category,
                    count: count
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    practiceQuestions = data.questions;
                    
                    
                    updateNavigationButtons();
                    
                    
                    displayQuestion(currentQuestionIndex);
                } else {
                    throw new Error(data.message || 'Failed to generate questions');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                questionContainer.innerHTML = `
                    <div class="alert alert-danger">
                        ${error.message || 'Failed to generate questions. Please try again.'}
                    </div>
                `;
            });
        } catch (error) {
            console.error('Error generating questions:', error);
            questionContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to generate questions. Please try again.
                </div>
            `;
        }
    });
    
    
    prevQuestionBtn.addEventListener('click', function() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion(currentQuestionIndex);
            updateNavigationButtons();
        }
    });
    
    nextQuestionBtn.addEventListener('click', function() {
        if (currentQuestionIndex < practiceQuestions.length - 1) {
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex);
            updateNavigationButtons();
        }
    });
    
    
    function displayQuestion(index) {
        const question = practiceQuestions[index];
        if (!question) return;
        
        let questionHTML = `
            <div class="question-header d-flex justify-content-between mb-3">
                <h5>Question ${index + 1} of ${practiceQuestions.length}</h5>
                <span class="badge ${getUserAnswerBadgeClass(index)}">${getUserAnswerStatus(index)}</span>
            </div>
            <div class="question-text mb-4">
                ${question.text}
            </div>
        `;
        
        if (question.answerType === 'choice') {
            
            if (question.optionsWithLabels && question.optionsWithLabels.length > 0) {
                questionHTML += `
                    <div class="options-container">
                        ${question.optionsWithLabels.map((option, i) => `
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="radio" name="question-option" 
                                    id="option-${i}" value="${option.label}"
                                    ${userAnswers[index] === option.label ? 'checked' : ''}>
                                <label class="form-check-label" for="option-${i}">
                                    ${option.label}. ${option.content}
                                </label>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-primary mt-3" id="submit-answer">Submit Answer</button>
                `;
            } else {
                questionHTML += `
                    <div class="options-container">
                        ${question.options.map((option, i) => `
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="radio" name="question-option" 
                                    id="option-${i}" value="${String.fromCharCode(65 + i)}"
                                    ${userAnswers[index] === String.fromCharCode(65 + i) ? 'checked' : ''}>
                                <label class="form-check-label" for="option-${i}">
                                    ${String.fromCharCode(65 + i)}. ${option}
                                </label>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-primary mt-3" id="submit-answer">Submit Answer</button>
                `;
            }
        } else {
            questionHTML += `
                <div class="input-group mb-3">
                    <input type="text" class="form-control" id="answer-input" 
                        placeholder="Enter your answer" value="${userAnswers[index] || ''}">
                    <button class="btn btn-primary" id="submit-answer">Submit Answer</button>
                </div>
            `;
        }
        
        questionContainer.innerHTML = questionHTML;
        
        
        document.getElementById('submit-answer').addEventListener('click', function() {
            submitAnswer(currentQuestionIndex);
        });
        
        
        const answerInput = document.getElementById('answer-input');
        if (answerInput) {
            answerInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    submitAnswer(currentQuestionIndex);
                }
            });
            
            answerInput.focus();
        }
    }
    
    
    function submitAnswer(index) {
        const question = practiceQuestions[index];
        let userAnswer;
        
        if (question.answerType === 'choice') {
            const selectedOption = document.querySelector('input[name="question-option"]:checked');
            userAnswer = selectedOption ? selectedOption.value : null;
        } else {
            const answerInput = document.getElementById('answer-input');
            userAnswer = answerInput ? answerInput.value.trim() : null;
        }
        
        if (!userAnswer) {
            alert('Please provide an answer!');
            return;
        }
        
        
        const isCorrect = checkAnswer(question, userAnswer);
        
        
        userAnswers[index] = userAnswer;
        if (isCorrect && userAnswers[index] === userAnswer) {
            
            correctAnswers++;
        }
        
        
        updateStats();
        
        
        let feedbackHTML = `
            <div class="alert ${isCorrect ? 'alert-success' : 'alert-danger'} mb-3">
                <strong>${isCorrect ? 'Correct!' : 'Incorrect!'}</strong>
                ${!isCorrect ? `<p>The correct answer is: ${question.answer}</p>` : ''}
            </div>
        `;
        
        resultContainer.innerHTML = feedbackHTML;
        resultContainer.style.display = 'block';
        
        
        if (isCorrect && currentQuestionIndex < practiceQuestions.length - 1) {
            setTimeout(() => {
                currentQuestionIndex++;
                displayQuestion(currentQuestionIndex);
                updateNavigationButtons();
                resultContainer.style.display = 'none';
            }, 1500);
        }
        
        
        displayQuestion(index);
    }
    
    
    function checkAnswer(question, userAnswer) {
        if (question.answerType === 'choice') {
            return userAnswer === question.answer;
        } else {
            
            return userAnswer.toLowerCase() === question.answer.toLowerCase();
        }
    }
    
    
    function updateNavigationButtons() {
        prevQuestionBtn.disabled = currentQuestionIndex === 0;
        nextQuestionBtn.disabled = currentQuestionIndex === practiceQuestions.length - 1;
    }
    
    
    function updateStats() {
        const totalAnswered = userAnswers.filter(a => a !== null).length;
        const accuracy = totalAnswered > 0 ? (correctAnswers / totalAnswered) * 100 : 0;
        
        correctCountElement.textContent = correctAnswers;
        totalCountElement.textContent = `${totalAnswered} / ${practiceQuestions.length}`;
        progressBar.style.width = `${(totalAnswered / practiceQuestions.length) * 100}%`;
        progressBar.className = `progress-bar ${getProgressBarClass(accuracy)}`;
        accuracyDisplay.textContent = `Accuracy: ${accuracy.toFixed(1)}%`;
    }
    
    
    function getUserAnswerStatus(index) {
        return userAnswers[index] === null ? 'Not Answered' : 
               checkAnswer(practiceQuestions[index], userAnswers[index]) ? 'Correct' : 'Incorrect';
    }
    
    function getUserAnswerBadgeClass(index) {
        return userAnswers[index] === null ? 'bg-secondary' : 
               checkAnswer(practiceQuestions[index], userAnswers[index]) ? 'bg-success' : 'bg-danger';
    }
    
    function getProgressBarClass(accuracy) {
        if (accuracy >= 80) return 'bg-success';
        if (accuracy >= 60) return 'bg-info';
        if (accuracy >= 40) return 'bg-warning';
        return 'bg-danger';
    }
});