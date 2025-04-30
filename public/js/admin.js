document.addEventListener('DOMContentLoaded', function() {
    
    const usernameDisplay = document.getElementById('username-display');
    const showUsersBtn = document.getElementById('show-users');
    const showQuestionsBtn = document.getElementById('show-questions');
    const showStatisticsBtn = document.getElementById('show-statistics');
    const userManagementSection = document.getElementById('user-management');
    const questionManagementSection = document.getElementById('question-management');
    const systemStatisticsSection = document.getElementById('system-statistics');
    const usersTableBody = document.getElementById('users-table-body');
    const questionsTableBody = document.getElementById('questions-table-body');
    const questionCategoryFilter = document.getElementById('question-category-filter');
    const userSearchInput = document.getElementById('user-search');
    const searchBtn = document.getElementById('search-btn');
    const clearAllQuestionsBtn = document.getElementById('clear-all-questions');
    const editGrade = document.getElementById('edit-grade');
    
    
    const totalUsersElement = document.getElementById('total-users');
    const teacherCountElement = document.getElementById('teacher-count');
    const studentCountElement = document.getElementById('student-count');
    const classDistributionElement = document.getElementById('class-distribution');
    const activeStudentsList = document.getElementById('active-students-list');
    const totalQuestionsElement = document.getElementById('total-questions');
    const totalAnswersElement = document.getElementById('total-answers');
    const questionsByCategoryElement = document.getElementById('questions-by-category');
    const correctRateContainer = document.getElementById('correct-rate-container');
    const classPerformanceElement = document.getElementById('class-performance');
    
    
    const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
    const confirmClearModal = new bootstrap.Modal(document.getElementById('confirmClearModal'));
    const confirmDeleteQuestionModal = new bootstrap.Modal(document.getElementById('confirmDeleteQuestionModal'));
    const confirmClearAllQuestionsModal = new bootstrap.Modal(document.getElementById('confirmClearAllQuestionsModal'));
    
    
    const editUserForm = document.getElementById('edit-user-form');
    const editUserId = document.getElementById('edit-user-id');
    const editUsername = document.getElementById('edit-username');
    const editPassword = document.getElementById('edit-password');
    const editRole = document.getElementById('edit-role');
    const editClass = document.getElementById('edit-class');
    const editClassGroup = document.getElementById('edit-class-group');
    const saveUserChangesBtn = document.getElementById('save-user-changes');
    const clearUsername = document.getElementById('clear-username');
    const confirmClearRecordsBtn = document.getElementById('confirm-clear-records');
    const confirmDeleteQuestionBtn = document.getElementById('confirm-delete-question');
    const confirmClearAllQuestionsBtn = document.getElementById('confirm-clear-all-questions');
    
    
    let currentUser = null;
    let currentQuestionId = null;
    let users = [];
    let questions = [];
    
    
    function checkAdminAuth() {
        const username = localStorage.getItem('username');
        if (!username || username !== 'admin') {
            window.location.href = '/login';
            return false;
        }
        usernameDisplay.textContent = `Welcome, ${username}`;
        return true;
    }
    
    
    function showAlert(message, type = 'success') {
        const alertContainer = document.getElementById('alert-container');
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        alertContainer.appendChild(alertDiv);
        
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
    
    
    function showSection(section) {
        userManagementSection.style.display = 'none';
        questionManagementSection.style.display = 'none';
        systemStatisticsSection.style.display = 'none';
        
        showUsersBtn.classList.remove('active');
        showQuestionsBtn.classList.remove('active');
        showStatisticsBtn.classList.remove('active');
        
        if (section === 'users') {
            userManagementSection.style.display = 'block';
            showUsersBtn.classList.add('active');
            loadUsers();
        } else if (section === 'questions') {
            questionManagementSection.style.display = 'block';
            showQuestionsBtn.classList.add('active');
            loadQuestions();
        } else if (section === 'statistics') {
            systemStatisticsSection.style.display = 'block';
            showStatisticsBtn.classList.add('active');
            loadStatistics();
        }
    }
    
    
    function loadUsers(searchTerm = '') {
        fetch(`/admin/users${searchTerm ? `?search=${searchTerm}` : ''}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load users');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    users = data.users;
                    renderUsers(users);
                } else {
                    throw new Error(data.message || 'Failed to load users');
                }
            })
            .catch(error => {
                console.error('Error loading users:', error);
                showAlert('Failed to load users: ' + error.message, 'danger');
            });
    }
    
    
    function renderUsers(users) {
        usersTableBody.innerHTML = '';
        if (users.length === 0) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No users found</td>
                </tr>
            `;
            return;
        }
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td><span class="badge ${getRoleBadgeClass(user.role)}">${user.role}</span></td>
                <td>${user.grade ? `Grade ${user.grade}` : '-'}</td>
                <td>${user.class || '-'}</td>
                <td>${user.scores ? user.scores.length : 0}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-user" data-userid="${user._id}">Edit</button>
                    <button class="btn btn-sm btn-warning clear-records" data-userid="${user._id}" data-username="${user.username}"
                            ${user.role === 'admin' ? 'disabled' : ''}>
                        Clear Records
                    </button>
                </td>
            `;
            usersTableBody.appendChild(row);
        });

        
        document.querySelectorAll('.edit-user').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.dataset.userid;
                editUser(userId);
            });
        });
        
        document.querySelectorAll('.clear-records').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.dataset.userid;
                const username = this.dataset.username;
                showClearRecordsConfirmation(userId, username);
            });
        });
    }
    
    
    function getRoleBadgeClass(role) {
        switch (role) {
            case 'admin':
                return 'bg-danger';
            case 'teacher':
                return 'bg-success';
            case 'student':
                return 'bg-primary';
            default:
                return 'bg-secondary';
        }
    }
    
    
    
    function editUser(userId) {
        const user = users.find(u => u._id === userId);
        if (!user) return;
        
        currentUser = user;
        editUserId.value = user._id;
        editUsername.value = user.username;
        
        editUsername.disabled = false;

        editPassword.value = '';
        editRole.value = user.role;
        
        
        updateFormForRole(user.role);
        
        
        if (user.grade) {
            editGrade.value = user.grade.toString();
        } else {
            editGrade.value = '1'; 
        }
        
        
        if (user.role === 'student') {
            updateClassOptions(user.grade || 1);
            if (user.class) {
                editClass.value = user.class;
            }
        }
        
        
        if (user.username === 'admin') {
            editRole.disabled = true;
        } else {
            editRole.disabled = false;
        }
        
        editUserModal.show();
    }

    
    function updateFormForRole(role) {
        if (role === 'student') {
            editGrade.parentElement.style.display = 'block';
            editClassGroup.style.display = 'block';
        } else {
            editGrade.parentElement.style.display = 'none';
            editClassGroup.style.display = 'none';
        }
    }




    
    
    
    function updateClassOptions(grade) {
        const classSelect = document.getElementById('edit-class');
        classSelect.innerHTML = '';
        
        const gradeNum = parseInt(grade);
        const gradeGroup = document.createElement('optgroup');
        gradeGroup.label = gradeNum === 1 ? 'Grade 1' : 'Grade 2';
        
        const classes = gradeNum === 1 ? ['1A','1B','1C','1D'] : ['2A','2B','2C','2D'];
        
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls;
            option.textContent = cls;
            gradeGroup.appendChild(option);
        });
        
        classSelect.appendChild(gradeGroup);
    }
    
    
    
    editRole.addEventListener('change', function() {
        updateFormForRole(this.value);
    });
    
    editGrade.addEventListener('change', function() {
        if (editRole.value === 'student') {
            updateClassOptions(this.value);
        }
    });

    
    
    
    
    saveUserChangesBtn.addEventListener('click', function() {
        const userId = editUserId.value;
        const username = editUsername.value.trim();
        const password = editPassword.value;
        const role = editRole.value;
        
        
        const updateData = {
            username: username,
            role: role
        };
        
        if (password) {
            updateData.password = password;
        }
        
        if (role === 'student') {
            const grade = parseInt(editGrade.value);
            const studentClass = editClass.value;
            updateData.grade = grade;
            updateData.class = studentClass;
        } else {
            
            
            updateData.grade = null;
            updateData.class = null;
        }
        
        fetch(`/admin/update-user/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update user');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                editUserModal.hide();
                showAlert('User updated successfully');
                loadUsers();
            } else {
                throw new Error(data.message || 'Failed to update user');
            }
        })
        .catch(error => {
            console.error('Error updating user:', error);
            showAlert('Failed to update user: ' + error.message, 'danger');
        });
    });

        
    const gradeFilterSelect = document.getElementById('grade-filter');
    if (gradeFilterSelect) {
        gradeFilterSelect.addEventListener('change', function() {
            const roleFilter = document.getElementById('role-filter')?.value || '';
            const classFilter = document.getElementById('class-filter')?.value || '';
            const searchTerm = document.getElementById('user-search')?.value || '';
            
            
            let queryParams = [];
            if (roleFilter) queryParams.push(`role=${roleFilter}`);
            if (this.value) queryParams.push(`grade=${this.value}`);
            if (classFilter) queryParams.push(`class=${classFilter}`);
            if (searchTerm) queryParams.push(`search=${searchTerm}`);
            
            
            const url = '/admin/users' + (queryParams.length ? '?' + queryParams.join('&') : '');
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        users = data.users;
                        renderUsers(users);
                    }
                })
                .catch(error => {
                    console.error('Error loading users:', error);
                    showAlert('Failed to load users: ' + error.message, 'danger');
                });
        });
    }


    
    
    function showClearRecordsConfirmation(userId, username) {
        currentUser = users.find(u => u._id === userId);
        clearUsername.textContent = username;
        confirmClearModal.show();
    }
    
    
    confirmClearRecordsBtn.addEventListener('click', function() {
        if (!currentUser) return;
        
        fetch(`/admin/clear-user-records/${currentUser._id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to clear records');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                confirmClearModal.hide();
                showAlert('User records cleared successfully');
                loadUsers();
            } else {
                throw new Error(data.message || 'Failed to clear records');
            }
        })
        .catch(error => {
            console.error('Error clearing records:', error);
            showAlert('Failed to clear records: ' + error.message, 'danger');
        });
    });
    
    
    function loadQuestions(category = '') {
        fetch(`/admin/questions${category ? `?category=${category}` : ''}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load questions');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    questions = data.questions;
                    renderQuestions(questions);
                } else {
                    throw new Error(data.message || 'Failed to load questions');
                }
            })
            .catch(error => {
                console.error('Error loading questions:', error);
                showAlert('Failed to load questions: ' + error.message, 'danger');
            });
    }
    
    
    function renderQuestions(questions) {
        questionsTableBody.innerHTML = '';
        if (questions.length === 0) {
            questionsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No questions found</td>
                </tr>
            `;
            return;
        }
        
        questions.forEach(question => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${question.text}</td>
                <td>${question.answer}</td>
                <td>${formatCategory(question.category)}</td>
                <td>${question.timeLimit ? question.timeLimit + ' seconds' : 'No limit'}</td>
                <td>${question.createdBy?.username || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-danger delete-question" data-questionid="${question._id}">Delete</button>
                </td>
            `;
            questionsTableBody.appendChild(row);
        });
        
        
        document.querySelectorAll('.delete-question').forEach(button => {
            button.addEventListener('click', function() {
                const questionId = this.dataset.questionid;
                showDeleteQuestionConfirmation(questionId);
            });
        });
    }
    
    
    function formatCategory(category) {
        if (!category) return '-';
        
        
        return category
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    
    function showDeleteQuestionConfirmation(questionId) {
        currentQuestionId = questionId;
        confirmDeleteQuestionModal.show();
    }
    
    
    confirmDeleteQuestionBtn.addEventListener('click', function() {
        if (!currentQuestionId) return;
        
        fetch(`/admin/delete-question/${currentQuestionId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete question');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                confirmDeleteQuestionModal.hide();
                showAlert('Question deleted successfully');
                loadQuestions(questionCategoryFilter.value);
            } else {
                throw new Error(data.message || 'Failed to delete question');
            }
        })
        .catch(error => {
            console.error('Error deleting question:', error);
            showAlert('Failed to delete question: ' + error.message, 'danger');
        });
    });
    
    
    clearAllQuestionsBtn.addEventListener('click', function() {
        confirmClearAllQuestionsModal.show();
    });
    
    
    confirmClearAllQuestionsBtn.addEventListener('click', function() {
        fetch('/admin/clear-all-questions', {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to clear all questions');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                confirmClearAllQuestionsModal.hide();
                showAlert('All questions cleared successfully');
                loadQuestions();
            } else {
                throw new Error(data.message || 'Failed to clear all questions');
            }
        })
        .catch(error => {
            console.error('Error clearing all questions:', error);
            showAlert('Failed to clear all questions: ' + error.message, 'danger');
        });
    });
    
    
    function loadStatistics() {
        fetch('/admin/statistics')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load statistics');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    renderStatistics(data);
                } else {
                    throw new Error(data.message || 'Failed to load statistics');
                }
            })
            .catch(error => {
                console.error('Error loading statistics:', error);
                showAlert('Failed to load statistics: ' + error.message, 'danger');
            });
    }
    
    
    function renderStatistics(data) {
        
        totalUsersElement.textContent = data.userStats.totalUsers;
        teacherCountElement.textContent = data.userStats.teacherCount;
        studentCountElement.textContent = data.userStats.studentCount;
        
        
        renderClassDistribution(data.userStats.classDistribution, data.userStats.studentCount);
        
        
        renderActiveStudents(data.userStats.mostActiveStudents);
        
        
        totalQuestionsElement.textContent = data.questionStats.totalQuestions;
        totalAnswersElement.textContent = data.questionStats.totalAnswers;
        
        
        renderQuestionsByCategory(data.questionStats.categoryCounts, data.questionStats.totalQuestions);
        
        
        renderCorrectRate(data.questionStats.correctRate);
        
        
        renderClassPerformance(data.classPerformance);
    }
    
    
    function renderClassDistribution(distribution, totalStudents) {
        let html = '';
        
        
        html += '<div class="progress" style="height: 30px;">';
        Object.entries(distribution).forEach(([className, count]) => {
            const percentage = (count / totalStudents) * 100;
            html += `
                <div class="progress-bar bg-primary" role="progressbar" 
                     style="width: ${percentage}%" 
                     title="${className}: ${count} students">
                    ${className}: ${count}
                </div>
            `;
        });
        html += '</div>';
        
        
        html += '<div class="d-flex justify-content-between mt-2">';
        Object.entries(distribution).forEach(([className, count]) => {
            html += `<small>${className}: ${count}</small>`;
        });
        html += '</div>';
        
        classDistributionElement.innerHTML = html;
    }
    
    
    function renderActiveStudents(students) {
        activeStudentsList.innerHTML = '';
        
        if (students.length === 0) {
            activeStudentsList.innerHTML = '<li class="list-group-item">No student data available</li>';
            return;
        }
        
        students.forEach(student => {
            const item = document.createElement('li');
            item.className = 'list-group-item d-flex justify-content-between align-items-start';
            item.innerHTML = `
                <div class="ms-2 me-auto">
                    <div class="fw-bold">${student.username}</div>
                    Class: ${student.class}
                </div>
                <span class="badge bg-primary rounded-pill badge-answers">
                    ${student.answerCount} answers
                </span>
            `;
            activeStudentsList.appendChild(item);
        });
    }
    
    
    function renderQuestionsByCategory(categoryCounts, totalQuestions) {
        let html = `
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Questions</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        Object.entries(categoryCounts).forEach(([category, count]) => {
            const percentage = (count / totalQuestions) * 100;
            html += `
                <tr class="category-row">
                    <td>${formatCategory(category)}</td>
                    <td>${count}</td>
                    <td>
                        <div class="progress" style="height: 10px;">
                            <div class="progress-bar" role="progressbar" 
                                 style="width: ${percentage}%"></div>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        questionsByCategoryElement.innerHTML = html;
    }
    
    
    function renderCorrectRate(rate) {
        correctRateContainer.innerHTML = `
            <div class="progress" style="height: 25px;">
                <div class="progress-bar ${rate > 70 ? 'bg-success' : rate > 40 ? 'bg-warning' : 'bg-danger'}" 
                     role="progressbar" style="width: ${rate}%">
                    ${rate.toFixed(1)}% Correct
                </div>
            </div>
        `;
    }
    
    
    function renderClassPerformance(performance) {
        let html = '';
        
        Object.entries(performance).forEach(([className, stats]) => {
            const correctRate = stats.totalAnswers > 0 
                ? (stats.correctAnswers / stats.totalAnswers) * 100 
                : 0;
            
            html += `
                <div class="col-md-6 mb-4">
                    <div class="content-section">
                        <h5 class="mb-2">Class ${className}</h5>
                        <div class="d-flex justify-content-between mb-2">
                            <div>Students: ${stats.studentCount}</div>
                            <div>Total Answers: ${stats.totalAnswers}</div>
                        </div>
                        <div class="progress mb-3" style="height: 20px;">
                            <div class="progress-bar ${correctRate > 70 ? 'bg-success' : correctRate > 40 ? 'bg-warning' : 'bg-danger'}" 
                                 role="progressbar" style="width: ${correctRate}%">
                                ${correctRate.toFixed(1)}% Correct
                            </div>
                        </div>
                        
                        <h6 class="mt-3 mb-2">Category Performance</h6>
            `;
            
            if (stats.categoryPerformance && Object.keys(stats.categoryPerformance).length > 0) {
                html += `
                    <div class="table-container">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Correct</th>
                                    <th>Total</th>
                                    <th>Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                Object.entries(stats.categoryPerformance).forEach(([category, catStats]) => {
                    const catCorrectRate = catStats.total > 0 
                        ? (catStats.correct / catStats.total) * 100 
                        : 0;
                    
                    html += `
                        <tr>
                            <td>${formatCategory(category)}</td>
                            <td>${catStats.correct}</td>
                            <td>${catStats.total}</td>
                            <td>
                                <div class="progress" style="height: 10px;">
                                    <div class="progress-bar ${catCorrectRate > 70 ? 'bg-success' : catCorrectRate > 40 ? 'bg-warning' : 'bg-danger'}" 
                                         role="progressbar" style="width: ${catCorrectRate}%"></div>
                                </div>
                            </td>
                        </tr>
                    `;
                });
                
                html += '</tbody></table></div>';
            } else {
                html += '<p>No category data available</p>';
            }
            
            html += '</div></div>';
        });
        
        classPerformanceElement.innerHTML = html;
    }
    
    
    showUsersBtn.addEventListener('click', () => showSection('users'));
    showQuestionsBtn.addEventListener('click', () => showSection('questions'));
    showStatisticsBtn.addEventListener('click', () => showSection('statistics'));
    
    
    questionCategoryFilter.addEventListener('change', function() {
        loadQuestions(this.value);
    });
    
    
    searchBtn.addEventListener('click', function() {
        const searchTerm = userSearchInput.value.trim();
        loadUsers(searchTerm);
    });
    
    userSearchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.trim();
            loadUsers(searchTerm);
        }
    });
    
    
    function init() {
        if (checkAdminAuth()) {
            showSection('statistics');
        }
    }
    
    init();
});