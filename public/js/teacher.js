document.addEventListener('DOMContentLoaded', function() {
    const generateQuestionsButton = document.getElementById('generate-questions');
    const questionsDisplay = document.getElementById('questions-display');
    const studentScoresDiv = document.getElementById('student-scores');
    const generateReportButton = document.getElementById('generate-report');
    const reportDiv = document.getElementById('report');
    const usernameDisplay = document.getElementById('username-display');
    const username = localStorage.getItem('username');
    const userRole = localStorage.getItem('role'); 
    const classFilterSelect = document.getElementById('class-filter');
    const exportReportButton = document.getElementById('export-report');
    const showHistoryButton = document.getElementById('show-history');
    const questionHistoryDiv = document.getElementById('question-history');
    const historyFilter = document.getElementById('history-filter');
    const historyGradeFilter = document.getElementById('history-grade-filter'); 
    const gradeFilterSelect = document.getElementById('grade-filter');
    const timeLimitSelect = document.getElementById('time-limit');
    const customTimeContainer = document.getElementById('custom-time-container');
    const customTimeLimitInput = document.getElementById('custom-time-limit'); 
    const questionCountSelect = document.getElementById('question-count');
    const customCountContainer = document.getElementById('custom-count-container');
    const customQuestionCountInput = document.getElementById('custom-question-count');
    const questionGradeSelect = document.getElementById('question-grade');
    const questionCategorySelect = document.getElementById('question-category');
    let performanceChart = null;
    let studentsCache = {}; 
    
    
    const chartCategoryFilter = document.getElementById('chart-category-filter');
    let originalPerformanceData = null;

    
    const generateTab = document.getElementById('generate-tab');
    const historyTab = document.getElementById('history-tab');
    const performanceTab = document.getElementById('performance-tab');
    const chartTab = document.getElementById('chart-tab');

    
    if (!username) {
        window.location.href = '/login';
    } else if (userRole !== 'teacher' && userRole !== 'admin') {
        
        alert('Only teachers and admins can access this page');
        window.location.href = '/login';
    } else {
        usernameDisplay.textContent = `Welcome, ${username}`;
    }

    
    historyTab.addEventListener('click', function(e) {
        e.preventDefault();
        
        
        questionHistoryDiv.style.display = 'block';
        
        
        if (historyGradeFilter) {
            updateHistoryCategoryByGrade(historyGradeFilter.value);
        }
        
        try {
            loadQuestionSets(historyFilter.value);
        } catch (error) {
            console.error("Error loading question sets:", error);
            
            if (typeof loadQuestionHistory === 'function') {
                loadQuestionHistory(historyFilter.value);
            }
        }
    });

    performanceTab.addEventListener('click', function(e) {
        e.preventDefault();
        
        loadAllStudentScores(classFilterSelect.value, gradeFilterSelect.value);
    });

    chartTab.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (performanceChart) {
            performanceChart.update();
        }
    });

    
    if (chartCategoryFilter && !chartCategoryFilter._hasEventListener) {
        chartCategoryFilter.addEventListener('change', function() {
            filterChartByCategory(this.value);
        });
        chartCategoryFilter._hasEventListener = true;
    }

    if (gradeFilterSelect) {
        gradeFilterSelect.addEventListener('change', function() {
            const selectedGrade = this.value;
            
            
            updateClassFilter(selectedGrade);
            
            
            loadAllStudentScores(classFilterSelect.value, selectedGrade);
        });
    }

    
    if (gradeFilterSelect) {
        gradeFilterSelect.addEventListener('change', function() {
            const selectedGrade = this.value;
            
            
            updateClassFilter(selectedGrade);
            
            
            loadAllStudentScores(classFilterSelect.value, selectedGrade);
        });
    }

    
    function updateClassFilter(grade) {
        const classFilter = document.getElementById('class-filter');
        
        if (classFilter) {
            classFilter.innerHTML = '<option value="">All Classes</option>';
            
            if (!grade || grade === '') {
                
                const grade1Group = document.createElement('optgroup');
                grade1Group.label = 'Primary 1';
                ['1A', '1B', '1C', '1D'].forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls;
                    option.textContent = cls;
                    grade1Group.appendChild(option);
                });
                classFilter.appendChild(grade1Group);
                
                const grade2Group = document.createElement('optgroup');
                grade2Group.label = 'Primary 2';
                ['2A', '2B', '2C', '2D'].forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls;
                    option.textContent = cls;
                    grade2Group.appendChild(option);
                });
                classFilter.appendChild(grade2Group);
            } else if (grade === '1') {
                
                const grade1Group = document.createElement('optgroup');
                grade1Group.label = 'Primary 1';
                ['1A', '1B', '1C', '1D'].forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls;
                    option.textContent = cls;
                    grade1Group.appendChild(option);
                });
                classFilter.appendChild(grade1Group);
            } else if (grade === '2') {
                
                const grade2Group = document.createElement('optgroup');
                grade2Group.label = 'Primary 2';
                ['2A', '2B', '2C', '2D'].forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls;
                    option.textContent = cls;
                    grade2Group.appendChild(option);
                });
                classFilter.appendChild(grade2Group);
            }
        }
    }

    
    
    function loadClassList() {
        
        const classFilter = document.getElementById('class-filter'); 
        
        if (classFilter) { 
            classFilter.innerHTML = `
                <option value="">All classes</option>
                ${['1A','1B','1C','1D'].map(c => 
                    `<option value="${c}">${c}</option>`
                ).join('')}
            `;
        }
    }
    


    
    function renderQuestions(questions) {
        const container = document.createElement('div');
        container.innerHTML = `
            <h5 class="mt-3">Generated Questions (${questions.length})</h5>
            <ol class="list-group">
                ${questions.map((q, i) => `
                    <li class="list-group-item d-flex justify-content-between align-items-start">
                        <div class="ms-2 me-auto">
                            <div class="fw-bold">Question ${i+1}</div>
                            ${q.text}
                            ${q.answerType === 'choice' ? `
                                <div class="options-preview mt-2">
                                    ${q.options.map((opt, j) => `
                                        <div class="${q.answer === String.fromCharCode(65 + j) ? 'text-success fw-bold' : ''}">
                                            ${String.fromCharCode(65 + j)}. ${opt}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            <div class="mt-2">
                                <small class="text-muted">
                                    Target class: ${formatTargetClasses(q.targetClasses)}
                                </small>
                                ${q.deadline ? `
                                <br>
                                <small class="text-muted">
                                    Deadline: ${new Date(q.deadline).toLocaleString()}
                                </small>
                                ` : ''}
                            </div>
                        </div>
                        <span class="badge bg-primary rounded-pill">Answer: ${q.answer}</span>
                    </li>
                `).join('')}
            </ol>
        `;
        
        return container;
    }
    
    
    function renderQuestionSets(sets) {
        if (sets.length === 0) {
            return '<div class="alert alert-info">No question set record</div>';
        }
        
        return `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Set name</th>
                            <th>Category</th>
                            <th>Questions number</th>
                            <th>Target class</th>
                            <th>Deadline</th>
                            <th>Created time</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sets.map(set => `
                            <tr>
                                <td>${set.setName}</td>
                                <td>${formatCategory(set.category)}</td>
                                <td>${set.count}</td>
                                <td>${formatTargetClasses(set.targetClasses)}</td>
                                <td>${set.deadline ? new Date(set.deadline).toLocaleString() : 'No deadline'}</td>
                                <td>${new Date(set.createdAt).toLocaleString()}</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary view-set-questions" 
                                                data-setid="${set._id}">
                                            Check questions
                                        </button>
                                        <button class="btn btn-outline-secondary edit-set-name" 
                                                data-setid="${set._id}"
                                                data-setname="${set.setName}">
                                            Edit name
                                        </button>
                                        <button class="btn btn-outline-primary edit-set-classes" 
                                                data-setid="${set._id}" 
                                                data-category="${set.category}">
                                            Edit target class
                                        </button>
                                        <button class="btn btn-outline-danger delete-question-set" 
                                                data-setid="${set._id}"
                                                data-setname="${set.setName}">
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-question-classes')) {
            const questionId = e.target.dataset.id;
            showEditClassesModal(questionId);
        } else if (e.target.classList.contains('edit-set-classes')) {
            const setId = e.target.dataset.setid;
            const category = e.target.dataset.category;
            showEditSetClassesModal(setId, category);
        }
    });

    
    function closeSetClassesModal() {
        const modalElement = document.getElementById('editSetClassesModal');
        if (!modalElement) return;
        
        const modal = bootstrap.Modal.getInstance(modalElement);
        
        if (modal) {
            modal.hide();
        } else {
            
            modalElement.classList.remove('show');
            modalElement.setAttribute('aria-hidden', 'true');
            modalElement.style.display = 'none';
        }
        
        
        const modalBackdrops = document.querySelectorAll('.modal-backdrop');
        modalBackdrops.forEach(backdrop => {
            backdrop.remove();
        });
        
        
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        
        setTimeout(() => {
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
            document.body.style.position = '';
            document.body.style.height = '';
            document.body.style.width = '';
        }, 100);
    }
    
    function closeQuestionClassesModal() {
        const modalElement = document.getElementById('editClassesModal');
        if (!modalElement) return;
        
        const modal = bootstrap.Modal.getInstance(modalElement);
        
        if (modal) {
            modal.hide();
        } else {
            
            modalElement.classList.remove('show');
            modalElement.setAttribute('aria-hidden', 'true');
            modalElement.style.display = 'none';
        }
        
        
        const modalBackdrops = document.querySelectorAll('.modal-backdrop');
        modalBackdrops.forEach(backdrop => {
            backdrop.remove();
        });
        
        
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        
        setTimeout(() => {
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
            document.body.style.position = '';
            document.body.style.height = '';
            document.body.style.width = '';
        }, 100);
    }

    
    function showEditSetClassesModal(setId, category) {
        
        const grade = category.startsWith('p2_') ? "2" : "1";
        
        
        if (!document.getElementById('editSetClassesModal')) {
            const modalHtml = `
                <div class="modal fade" id="editSetClassesModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Edit target class for entire question set</h5>
                                <button type="button" class="btn-close" id="edit-set-close-btn" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <input type="hidden" id="edit-set-id">
                                <input type="hidden" id="edit-set-grade">
                                
                                <div id="set-p1-all-class" class="form-check mb-2">
                                    <input class="form-check-input" type="checkbox" id="edit-set-p1-all" value="p1-all">
                                    <label class="form-check-label" for="edit-set-p1-all">All Primary 1 Classes</label>
                                </div>
                                
                                <div id="set-p2-all-class" class="form-check mb-2" style="display:none;">
                                    <input class="form-check-input" type="checkbox" id="edit-set-p2-all" value="p2-all">
                                    <label class="form-check-label" for="edit-set-p2-all">All Primary 2 Classes</label>
                                </div>
                                
                                <h6 class="mt-3">Primary 1 Classes:</h6>
                                <div id="set-p1-classes">
                                    <div class="form-check mb-2">
                                        <input class="form-check-input edit-set-p1-checkbox" type="checkbox" id="edit-set-class-1a" value="1A">
                                        <label class="form-check-label" for="edit-set-class-1a">1A</label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input edit-set-p1-checkbox" type="checkbox" id="edit-set-class-1b" value="1B">
                                        <label class="form-check-label" for="edit-set-class-1b">1B</label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input edit-set-p1-checkbox" type="checkbox" id="edit-set-class-1c" value="1C">
                                        <label class="form-check-label" for="edit-set-class-1c">1C</label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input edit-set-p1-checkbox" type="checkbox" id="edit-set-class-1d" value="1D">
                                        <label class="form-check-label" for="edit-set-class-1d">1D</label>
                                    </div>
                                </div>
                                
                                <h6 class="mt-3">Primary 2 Classes:</h6>
                                <div id="set-p2-classes">
                                    <div class="form-check mb-2">
                                        <input class="form-check-input edit-set-p2-checkbox" type="checkbox" id="edit-set-class-2a" value="2A">
                                        <label class="form-check-label" for="edit-set-class-2a">2A</label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input edit-set-p2-checkbox" type="checkbox" id="edit-set-class-2b" value="2B">
                                        <label class="form-check-label" for="edit-set-class-2b">2B</label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input edit-set-p2-checkbox" type="checkbox" id="edit-set-class-2c" value="2C">
                                        <label class="form-check-label" for="edit-set-class-2c">2C</label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input edit-set-p2-checkbox" type="checkbox" id="edit-set-class-2d" value="2D">
                                        <label class="form-check-label" for="edit-set-class-2d">2D</label>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" id="edit-set-cancel-btn">Cancel</button>
                                <button type="button" class="btn btn-primary" id="save-set-classes">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            
            document.getElementById('edit-set-close-btn').addEventListener('click', function() {
                closeSetClassesModal();
            });
            
            
            document.getElementById('edit-set-cancel-btn').addEventListener('click', function() {
                closeSetClassesModal();
            });
            
            
            document.getElementById('edit-set-p1-all').addEventListener('change', function() {
                const classCheckboxes = document.querySelectorAll('.edit-set-p1-checkbox');
                classCheckboxes.forEach(checkbox => {
                    checkbox.disabled = this.checked;
                    checkbox.checked = false;
                });
            });
            
            document.getElementById('edit-set-p2-all').addEventListener('change', function() {
                const classCheckboxes = document.querySelectorAll('.edit-set-p2-checkbox');
                classCheckboxes.forEach(checkbox => {
                    checkbox.disabled = this.checked;
                    checkbox.checked = false;
                });
            });
            
            document.querySelectorAll('.edit-set-p1-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    if (this.checked) {
                        document.getElementById('edit-set-p1-all').checked = false;
                    }
                    
                    
                    const anyChecked = [...document.querySelectorAll('.edit-set-p1-checkbox')].some(cb => cb.checked);
                    document.getElementById('edit-set-p1-all').checked = !anyChecked;
                });
            });
            
            document.querySelectorAll('.edit-set-p2-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    if (this.checked) {
                        document.getElementById('edit-set-p2-all').checked = false;
                    }
                    
                    
                    const anyChecked = [...document.querySelectorAll('.edit-set-p2-checkbox')].some(cb => cb.checked);
                    document.getElementById('edit-set-p2-all').checked = !anyChecked;
                });
            });
            
            document.getElementById('save-set-classes').addEventListener('click', function() {
                const setId = document.getElementById('edit-set-id').value;
                const grade = document.getElementById('edit-set-grade').value;
                let targetClasses = [];
                
                if (grade === "1") {
                    if (document.getElementById('edit-set-p1-all').checked) {
                        targetClasses = ['p1-all'];
                    } else {
                        document.querySelectorAll('.edit-set-p1-checkbox:checked').forEach(checkbox => {
                            targetClasses.push(checkbox.value);
                        });
                        
                        
                        if (targetClasses.length === 0) {
                            targetClasses = ['p1-all'];
                        }
                    }
                } else { 
                    if (document.getElementById('edit-set-p2-all').checked) {
                        targetClasses = ['p2-all'];
                    } else {
                        document.querySelectorAll('.edit-set-p2-checkbox:checked').forEach(checkbox => {
                            targetClasses.push(checkbox.value);
                        });
                        
                        
                        if (targetClasses.length === 0) {
                            targetClasses = ['p2-all'];
                        }
                    }
                }
                
                updateQuestionSetClasses(setId, targetClasses);
            });
        }
        
        
        document.getElementById('edit-set-id').value = setId;
        document.getElementById('edit-set-grade').value = grade;
        
        
        if (grade === "1") {
            document.getElementById('set-p1-all-class').style.display = 'block';
            document.getElementById('set-p2-all-class').style.display = 'none';
            
            
            document.getElementById('edit-set-p1-all').checked = true;
            
            
            document.querySelectorAll('.edit-set-p1-checkbox').forEach(checkbox => {
                checkbox.disabled = true;
                checkbox.checked = false;
            });
        } else {
            document.getElementById('set-p1-all-class').style.display = 'none';
            document.getElementById('set-p2-all-class').style.display = 'block';
            
            
            document.getElementById('edit-set-p2-all').checked = true;
            
            
            document.querySelectorAll('.edit-set-p2-checkbox').forEach(checkbox => {
                checkbox.disabled = true;
                checkbox.checked = false;
            });
        }
        
        
        const modal = new bootstrap.Modal(document.getElementById('editSetClassesModal'));
        modal.show();
    }
    
    function updateQuestionSetClasses(setId, targetClasses) {
        fetch('/update-question-set-classes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                setId,
                targetClasses
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                
                closeSetClassesModal();
                
                
                document.body.style.overflow = 'auto';
                document.documentElement.style.overflow = 'auto';
                
                
                setTimeout(() => {
                    
                    loadQuestionSets(historyFilter.value);
                    
                    
                    document.body.style.overflow = 'auto';
                    document.documentElement.style.overflow = 'auto';
                    document.body.style.position = '';
                    
                    
                    alert('Successfully updated target classes for the entire question set');
                }, 300);
            } else {
                alert('Failed to update target classes: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Failed to update target classes:', error);
            alert('Failed to update target classes, please try again later');
        });
    }

    






    
    function formatTargetClasses(targetClasses) {
        if (!targetClasses || targetClasses.length === 0) {
            return 'No classes assigned';
        }
        
        if (targetClasses.includes('all')) {
            return 'All classes';
        }
        
        if (targetClasses.includes('p1-all')) {
            return 'All Primary 1 classes';
        }
        
        if (targetClasses.includes('p2-all')) {
            return 'All Primary 2 classes';
        }
        
        return targetClasses.join(', ');
    }

    function formatCategory(category) {
        if (!category) return '-';
        
        
        return category
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }


    
    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-question-classes')) {
            const questionId = e.target.dataset.id;
            showEditClassesModal(questionId);
        }
    });


    
    function showAlert(message, type = 'success') {
        
        const existingAlerts = document.querySelectorAll('.alert-dismissible');
        existingAlerts.forEach(alert => alert.remove());
        
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '1050';
        alertDiv.style.maxWidth = '350px';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="关闭"></button>
        `;
        
        
        document.body.appendChild(alertDiv);
        
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    function renderScores(scores) {
        
        const allScores = [];
        scores.forEach(user => {
            user.scores.forEach(score => {
                allScores.push({
                    class: user.class,
                    username: user.username,
                    ...score
                });
            });
        });
        
        
        let pageSize = 10; 
        let totalPages = Math.ceil(allScores.length / pageSize);
        let currentPage = 1;
        
        
        const container = document.createElement('div');
        container.className = 'score-container';
    
        
        container.innerHTML = `
            <div id="alert-container"></div>
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>Total <span class="fw-bold">${allScores.length}</span> records</div>
                <div class="d-flex align-items-center">
                    <label for="records-per-page" class="me-2">Show for each page:</label>
                    <select id="records-per-page" class="form-select form-select-sm" style="width: auto;">
                        <option value="10" selected>10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-bordered table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Class</th>
                            <th>Student</th>
                            <th>Question</th>
                            <th>Answer</th>
                            <th>Correct?</th>
                            <th>Category</th>
                            <th>Time</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="scores-table-body">
                    </tbody>
                </table>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-3">
                <div>
                    Showing <span id="showing-records">1-${Math.min(pageSize, allScores.length)}</span> of ${allScores.length} records
                </div>
                <nav aria-label="Page navigation">
                    <ul class="pagination pagination-sm" id="pagination-controls">
                    </ul>
                </nav>
            </div>
        `;

        
        function renderPage(page) {
            currentPage = page;
            const start = (page - 1) * pageSize;
            const end = Math.min(start + pageSize, allScores.length);
            const pageRecords = allScores.slice(start, end);
            
            
            const showingInfo = container.querySelector('#showing-records');
            if (showingInfo) {
                showingInfo.textContent = `${start + 1}-${end}`;
            }
            
            
            const tableBody = container.querySelector('#scores-table-body');
            tableBody.innerHTML = pageRecords.map(score => `
                <tr>
                    <td>${score.class}</td>
                    <td>${score.username}</td>
                    <td>${score.question}</td>
                    <td>${score.userAnswer}</td>
                    <td class="${score.isCorrect ? 'text-success' : 'text-danger'}">
                        ${score.isCorrect ? '✓' : '✗'}
                    </td>
                    <td>${formatCategory(score.category)}</td>
                    <td>${new Date(score.timestamp).toLocaleString()}</td>
                    <td>
                        <button class="btn btn-danger btn-sm delete-record" 
                                data-username="${score.username}"
                                data-scoreid="${score._id}">
                            Delete
                        </button>
                    </td>
                </tr>
            `).join('');
            
            
            updatePaginationControls();
            
            
            attachDeleteHandlers();
        }
        
        
        function updatePaginationControls() {
            const pagination = container.querySelector('#pagination-controls');
            
            totalPages = Math.ceil(allScores.length / pageSize);
            
            if (totalPages <= 1) {
                pagination.innerHTML = '';
                return;
            }
            
            
            let paginationHTML = `
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="prev" aria-label="Previous">
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>
            `;
            
            
            const maxVisiblePages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            
            if (startPage > 1) {
                paginationHTML += `
                    <li class="page-item">
                        <a class="page-link" href="#" data-page="1">1</a>
                    </li>
                `;
                if (startPage > 2) {
                    paginationHTML += `
                        <li class="page-item disabled">
                            <a class="page-link" href="#">...</a>
                        </li>
                    `;
                }
            }
            
            
            for (let i = startPage; i <= endPage; i++) {
                paginationHTML += `
                    <li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            }
            
            
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    paginationHTML += `
                        <li class="page-item disabled">
                            <a class="page-link" href="#">...</a>
                        </li>
                    `;
                }
                paginationHTML += `
                    <li class="page-item">
                        <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
                    </li>
                `;
            }
            
            paginationHTML += `
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="next" aria-label="Next">
                        <span aria-hidden="true">&raquo;</span>
                    </a>
                </li>
            `;
            
            pagination.innerHTML = paginationHTML;
            
            
            pagination.querySelectorAll('.page-link').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const page = this.dataset.page;
                    
                    if (page === 'prev') {
                        if (currentPage > 1) renderPage(currentPage - 1);
                    } else if (page === 'next') {
                        if (currentPage < totalPages) renderPage(currentPage + 1);
                    } else {
                        renderPage(parseInt(page));
                    }
                });
            });
        }
        
        
        function attachDeleteHandlers() {
            container.querySelectorAll('.delete-record').forEach(button => {
                button.addEventListener('click', async function() {
                    if (confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
                        const username = this.dataset.username;
                        const scoreId = this.dataset.scoreid;
                        
                        try {
                            const response = await fetch('/delete-student-record', {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ username, scoreId })
                            });
                            
                            const data = await response.json();
                            
                            if (data.success) {
                                
                                showAlert('Record deleted successfully');
                                
                                
                                const classFilter = document.getElementById('class-filter');
                                const gradeFilter = document.getElementById('grade-filter');
                                loadAllStudentScores(classFilter.value, gradeFilter.value);
                            } else {
                                throw new Error(data.message);
                            }
                        } catch (error) {
                            console.error('Failed to delete record:', error);
                            showAlert('Failed to delete record, please try again later', 'danger');
                        }
                    }
                });
            });
        }
        
        
        renderPage(1);
        
        
        const recordsPerPage = container.querySelector('#records-per-page');
        if (recordsPerPage) {
            recordsPerPage.addEventListener('change', function() {
                pageSize = parseInt(this.value);
                
                totalPages = Math.ceil(allScores.length / pageSize);
                if (currentPage > totalPages) {
                    currentPage = totalPages || 1;
                }
                renderPage(1); 
            });
        }
    
        return container;
    }

    
    
    function loadQuestionSets(category = '') {
        const url = '/get-question-sets-teacher' + (category ? `?category=${category}` : '');
        
        
        questionHistoryDiv.innerHTML = '<div class="alert alert-info">loading question sets...</div>';
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    if (data.sets && data.sets.length > 0) {
                        questionHistoryDiv.innerHTML = renderQuestionSets(data.sets);
                        
                        
                        document.querySelectorAll('.view-set-questions').forEach(button => {
                            button.addEventListener('click', function() {
                                const setId = this.dataset.setid;
                                loadSetQuestions(setId);
                            });
                        });
                        
                        
                        document.querySelectorAll('.edit-set-classes').forEach(button => {
                            button.addEventListener('click', function() {
                                const setId = this.dataset.setid;
                                const category = this.dataset.category;
                                showEditSetClassesModal(setId, category);
                            });
                        });
                        
                        
                        document.querySelectorAll('.delete-question-set').forEach(button => {
                            button.addEventListener('click', function() {
                                const setId = this.dataset.setid;
                                const setName = this.dataset.setname;
                                if (confirm(`Sure to delete question set"${setName}"? This action cannot be undone.`)) {
                                    deleteQuestionSet(setId);
                                }
                            });
                        });
                        
                        
                        document.querySelectorAll('.edit-set-name').forEach(button => {
                            button.addEventListener('click', function() {
                                const setId = this.dataset.setid;
                                const currentName = this.dataset.setname;
                                showEditSetNameModal(setId, currentName);
                            });
                        });
                    } else {
                        questionHistoryDiv.innerHTML = '<div class="alert alert-info">No question set record</div>';
                    }
                } else {
                    questionHistoryDiv.innerHTML = `<div class="alert alert-warning">${data.message || 'Fail to load question set'}</div>`;
                }
            })
            .catch(error => {
                console.error('Failed to load question set:', error);
                questionHistoryDiv.innerHTML = `<div class="alert alert-danger">Fail to load question set: ${error.message}</div>`;
                
                
                if (typeof loadQuestionHistory === 'function') {
                    setTimeout(() => {
                        loadQuestionHistory(category);
                    }, 1000);
                }
            });
    }


    
    function loadSetQuestions(setId) {
        fetch(`/get-questions-by-set/${setId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    
                    const setDetailsContainer = document.createElement('div');
                    setDetailsContainer.id = 'set-details';
                    setDetailsContainer.className = 'mb-4 p-3 border rounded bg-light';
                    
                    const setName = data.questions.length > 0 ? data.questions[0].setName : 'Question Set';
                    const deadline = data.questions.length > 0 && data.questions[0].deadline ? 
                        new Date(data.questions[0].deadline).toLocaleString() : 'No deadline';
                    
                    
                    const questionsContainer = document.createElement('div');
                    questionsContainer.className = 'set-questions-container';
                    questionsContainer.innerHTML = `
                        <h5 class="mt-3">Questions in this set (${data.questions.length})</h5>
                        <ol class="list-group">
                            ${data.questions.map((q, i) => `
                                <li class="list-group-item d-flex justify-content-between align-items-start">
                                    <div class="ms-2 me-auto">
                                        <div class="fw-bold">Question ${i+1}</div>
                                        ${q.text}
                                        ${q.options ? `
                                            <div class="options-preview mt-2">
                                                ${q.options.map((opt, j) => `
                                                    <div class="${q.answer === String.fromCharCode(65 + j) ? 'text-success fw-bold' : ''}">
                                                        ${String.fromCharCode(65 + j)}. ${opt}
                                                    </div>
                                                `).join('')}
                                            </div>
                                        ` : ''}
                                        <div class="mt-2">
                                            <small class="text-muted">
                                                Target class: ${formatTargetClasses(q.targetClasses)}
                                            </small>
                                        </div>
                                        <div class="mt-2">
                                            <button class="btn btn-sm btn-primary edit-question-classes" data-id="${q._id}">
                                                edit target classes
                                            </button>
                                        </div>
                                    </div>
                                    <span class="badge bg-primary rounded-pill">Answer: ${q.answer}</span>
                                </li>
                            `).join('')}
                        </ol>
                    `;
                    
                    setDetailsContainer.innerHTML = `
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h4>${setName}</h4>
                                <p class="text-muted">Deadline: ${deadline}</p>
                            </div>
                            <button class="btn btn-sm btn-outline-secondary back-to-sets">
                                <i class="fas fa-arrow-left"></i> Back to Sets
                            </button>
                        </div>
                    `;
                    
                    setDetailsContainer.appendChild(questionsContainer);
                    
                    
                    questionHistoryDiv.innerHTML = '';
                    questionHistoryDiv.appendChild(setDetailsContainer);
                    
                    
                    document.querySelector('.back-to-sets').addEventListener('click', function() {
                        loadQuestionSets(historyFilter.value);
                    });
                }
            })
            .catch(error => {
                console.error('Fail to load question set questions:', error);
                questionHistoryDiv.innerHTML = '<div class="alert alert-danger">Fail to load question set questions</div>';
            });
    }
    
    function deleteQuestionSet(setId) {
        fetch(`/delete-question-set/${setId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadQuestionSets(historyFilter.value);
                alert(`question set deleted！Deleted ${data.deletedCount} questions`);
            }
        })
        .catch(error => {
            console.error('Fail to delete question set :', error);
            alert('Fail to delete question set,please try again later');
        });
    }
    
    function showEditSetNameModal(setId, currentName) {
        
        if (!document.getElementById('editSetNameModal')) {
            const modalHtml = `
                <div class="modal fade" id="editSetNameModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Edit question set name</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <input type="hidden" id="edit-set-id">
                                <div class="form-group">
                                    <label for="edit-set-name">question set name:</label>
                                    <input type="text" class="form-control" id="edit-set-name">
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="save-set-name">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            document.getElementById('save-set-name').addEventListener('click', function() {
                const setId = document.getElementById('edit-set-id').value;
                const setName = document.getElementById('edit-set-name').value;
                
                if (!setName.trim()) {
                    alert('Name cannot be empty');
                    return;
                }
                
                updateSetName(setId, setName);
            });
        }
        
        
        document.getElementById('edit-set-id').value = setId;
        document.getElementById('edit-set-name').value = currentName;
        
        const modal = new bootstrap.Modal(document.getElementById('editSetNameModal'));
        modal.show();
    }
    
    function updateSetName(setId, setName) {
        fetch(`/update-question-set-name/${setId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ setName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                
                bootstrap.Modal.getInstance(document.getElementById('editSetNameModal')).hide();
                
                
                loadQuestionSets(historyFilter.value);
                
                
                alert('question set name updated');
            } else {
                alert('update failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Fail to update question set name:', error);
            alert('Fail to update question set name,pease try again later');
        });
    }
    











    
    
    
    function showEditClassesModal(questionId) {
        
        if (!document.getElementById('editClassesModal')) {
            const modalHtml = `
                <div class="modal fade" id="editClassesModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Edit target class</h5>
                                <button type="button" class="btn-close" id="edit-question-close-btn" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <input type="hidden" id="edit-question-id">
                                <input type="hidden" id="edit-question-grade">
                                
                                <div id="p1-all-class" class="form-check mb-2">
                                    <input class="form-check-input" type="checkbox" id="edit-p1-all" value="p1-all">
                                    <label class="form-check-label" for="edit-p1-all">All Primary 1 Classes</label>
                                </div>
                                
                                <div id="p2-all-class" class="form-check mb-2" style="display:none;">
                                    <input class="form-check-input" type="checkbox" id="edit-p2-all" value="p2-all">
                                    <label class="form-check-label" for="edit-p2-all">All Primary 2 Classes</label>
                                </div>
                                
                                <h6 class="mt-3">Primary 1 Classes:</h6>
                                <div id="p1-classes">
                                    <div class="form-check mb-2">
                                        <input class="form-check-input edit-p1-checkbox" type="checkbox" id="edit-class-1a" value="1A">
                                        <label class="form-check-label" for="edit-class-1a">1A</label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input edit-p1-checkbox" type="checkbox" id="edit-class-1b" value="1B">
                                        <label class="form-check-label" for="edit-class-1b">1B</label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input edit-p1-checkbox" type="checkbox" id="edit-class-1c" value="1C">
                                        <label class="form-check-label" for="edit-class-1c">1C</label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input edit-p1-checkbox" type="checkbox" id="edit-class-1d" value="1D">
                                        <label class="form-check-label" for="edit-class-1d">1D</label>
                                    </div>
                                </div>
                                
                                <h6 class="mt-3">Primary 2 Classes:</h6>
                                <div id="p2-classes">
                                    <div class="form-check mb-2">
                                        <input class="form-check-input edit-p2-checkbox" type="checkbox" id="edit-class-2a" value="2A">
                                        <label class="form-check-label" for="edit-class-2a">2A</label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input edit-p2-checkbox" type="checkbox" id="edit-class-2b" value="2B">
                                        <label class="form-check-label" for="edit-class-2b">2B</label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input edit-p2-checkbox" type="checkbox" id="edit-class-2c" value="2C">
                                        <label class="form-check-label" for="edit-class-2c">2C</label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input edit-p2-checkbox" type="checkbox" id="edit-class-2d" value="2D">
                                        <label class="form-check-label" for="edit-class-2d">2D</label>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" id="edit-question-cancel-btn">Cancel</button>
                                <button type="button" class="btn btn-primary" id="save-classes">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            
            document.getElementById('edit-question-close-btn').addEventListener('click', function() {
                closeQuestionClassesModal();
            });
            
            
            document.getElementById('edit-question-cancel-btn').addEventListener('click', function() {
                closeQuestionClassesModal();
            });
            
            
            document.getElementById('edit-p1-all').addEventListener('change', function() {
                const classCheckboxes = document.querySelectorAll('.edit-p1-checkbox');
                classCheckboxes.forEach(checkbox => {
                    checkbox.disabled = this.checked;
                    checkbox.checked = false;
                });
            });
            
            document.getElementById('edit-p2-all').addEventListener('change', function() {
                const classCheckboxes = document.querySelectorAll('.edit-p2-checkbox');
                classCheckboxes.forEach(checkbox => {
                    checkbox.disabled = this.checked;
                    checkbox.checked = false;
                });
            });
            
            document.querySelectorAll('.edit-p1-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    if (this.checked) {
                        document.getElementById('edit-p1-all').checked = false;
                    }
                    
                    
                    const anyChecked = [...document.querySelectorAll('.edit-p1-checkbox')].some(cb => cb.checked);
                    document.getElementById('edit-p1-all').checked = !anyChecked;
                });
            });
            
            document.querySelectorAll('.edit-p2-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    if (this.checked) {
                        document.getElementById('edit-p2-all').checked = false;
                    }
                    
                    
                    const anyChecked = [...document.querySelectorAll('.edit-p2-checkbox')].some(cb => cb.checked);
                    document.getElementById('edit-p2-all').checked = !anyChecked;
                });
            });
            
            document.getElementById('save-classes').addEventListener('click', function() {
                const questionId = document.getElementById('edit-question-id').value;
                const questionGrade = document.getElementById('edit-question-grade').value;
                let targetClasses = [];
                
                if (questionGrade === "1") {
                    if (document.getElementById('edit-p1-all').checked) {
                        targetClasses = ['p1-all'];
                    } else {
                        document.querySelectorAll('.edit-p1-checkbox:checked').forEach(checkbox => {
                            targetClasses.push(checkbox.value);
                        });
                        
                        
                        if (targetClasses.length === 0) {
                            targetClasses = ['p1-all'];
                        }
                    }
                } else { 
                    if (document.getElementById('edit-p2-all').checked) {
                        targetClasses = ['p2-all'];
                    } else {
                        document.querySelectorAll('.edit-p2-checkbox:checked').forEach(checkbox => {
                            targetClasses.push(checkbox.value);
                        });
                        
                        
                        if (targetClasses.length === 0) {
                            targetClasses = ['p2-all'];
                        }
                    }
                }
                
                updateQuestionClasses(questionId, targetClasses);
            });
        }
        
        
        fetch(`/get-question/${questionId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const question = data.question;
                    document.getElementById('edit-question-id').value = questionId;
                    
                    
                    const questionGrade = question.category.startsWith('p2_') ? "2" : "1";
                    document.getElementById('edit-question-grade').value = questionGrade;
                    
                    
                    if (questionGrade === "1") {
                        document.getElementById('p1-all-class').style.display = 'block';
                        document.getElementById('p2-all-class').style.display = 'none';
                    } else {
                        document.getElementById('p1-all-class').style.display = 'none';
                        document.getElementById('p2-all-class').style.display = 'block';
                    }
                    
                    
                    const isP1All = question.targetClasses.includes('p1-all') || 
                                    (question.targetClasses.includes('all') && questionGrade === "1");
                    const isP2All = question.targetClasses.includes('p2-all') || 
                                    (question.targetClasses.includes('all') && questionGrade === "2");
                    
                    document.getElementById('edit-p1-all').checked = isP1All;
                    document.getElementById('edit-p2-all').checked = isP2All;
                    
                    
                    document.querySelectorAll('.edit-p1-checkbox').forEach(checkbox => {
                        checkbox.checked = question.targetClasses.includes(checkbox.value);
                        checkbox.disabled = isP1All;
                    });
                    
                    document.querySelectorAll('.edit-p2-checkbox').forEach(checkbox => {
                        checkbox.checked = question.targetClasses.includes(checkbox.value);
                        checkbox.disabled = isP2All;
                    });
                    
                    
                    const modal = new bootstrap.Modal(document.getElementById('editClassesModal'));
                    modal.show();
                }
            })
            .catch(error => {
                console.error('Fail to get question:', error);
                alert('Fail to get question,please try again later');
            });
    }




    
    
    
    function updateQuestionClasses(questionId, targetClasses) {
        fetch('/update-question-classes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                questionId,
                targetClasses
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                
                closeQuestionClassesModal();
                
                
                document.body.style.overflow = 'auto';
                document.documentElement.style.overflow = 'auto';
                
                
                setTimeout(() => {
                    
                    document.body.style.overflow = 'auto';
                    document.documentElement.style.overflow = 'auto';
                    document.body.style.position = '';
                    
                    
                    if (document.querySelector('#questions-display .edit-question-classes')) {
                        
                        alert('Updated question target classes');
                        
                        window.location.reload();
                    } else {
                        
                        const category = document.getElementById('history-filter') ? 
                                        document.getElementById('history-filter').value : '';
                        
                        if (document.getElementById('set-details')) {
                            
                            const backButton = document.querySelector('.back-to-sets');
                            if (backButton) {
                                backButton.click(); 
                            }
                        } else {
                            if (typeof loadQuestionSets === 'function') {
                                loadQuestionSets(category);
                            } else if (typeof loadQuestionHistory === 'function') {
                                loadQuestionHistory(category);
                            }
                        }
                        
                        alert('Updated question target classes');
                    }
                }, 300);
            } else {
                alert('Failed to update question target class: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Failed to update question target class:', error);
            alert('Failed to update question target class, please try again later');
        });
    }


    
    
   

    
    
    

    
    function loadQuestionHistory(category = '') {
        
        questionHistoryDiv.innerHTML = `
            <div class="d-flex justify-content-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
        
        const url = category ? `/get-question-history?category=${category}` : '/get-question-history';
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const setsHtml = renderQuestionSets(data.sets);
                    questionHistoryDiv.innerHTML = setsHtml;
                } else {
                    questionHistoryDiv.innerHTML = '<div class="alert alert-danger">Failed to load question history</div>';
                }
            })
            .catch(error => {
                console.error('Failed to load question history:', error);
                questionHistoryDiv.innerHTML = '<div class="alert alert-danger">Failed to load question history</div>';
            });
    }

    
    function deleteQuestion(questionId) {
        fetch(`/delete-question/${questionId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadQuestionHistory(historyFilter.value);
            }
        })
        .catch(error => {
            console.error('Failed to delete question:', error);
            alert('Failed to delete question,please try again later');
        });
    }

    
    
    function renderQuestionHistory(questions) {
        if (questions.length === 0) {
            return '<div class="alert alert-info">No question record</div>';
        }
        
        return `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Question</th>
                            <th>Answer</th>
                            <th>Category</th>
                            <th>Time limit</th>
                            <th>Target class</th>
                            <th>Creater</th>
                            <th>Created time</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${questions.map(q => `
                            <tr>
                                <td>${q.text}</td>
                                <td>${q.answer}</td>
                                <td>${formatCategory(q.category)}</td>
                                <td>${q.timeLimit ? q.timeLimit + 'second' : 'No time limit'}</td>
                                <td>${q.targetClasses.includes('all') ? 'All classes' : q.targetClasses.join(', ')}</td>
                                <td>${q.createdBy || 'Unknown'}</td>
                                <td>${new Date(q.createdAt).toLocaleString()}</td>
                                <td>
                                    <button class="btn btn-primary btn-sm edit-question-classes" 
                                            data-id="${q._id}">
                                        Edit target class
                                    </button>
                                    <button class="btn btn-danger btn-sm delete-question" 
                                            data-id="${q._id}">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    
    
    
    
    if (showHistoryButton) {
        showHistoryButton.addEventListener('click', () => {
            
            const historyTabEl = new bootstrap.Tab(historyTab);
            historyTabEl.show();
            
            
            try {
                loadQuestionSets(historyFilter.value);
            } catch (error) {
                console.error("Error loading question sets:", error);
                
                if (typeof loadQuestionHistory === 'function') {
                    loadQuestionHistory(historyFilter.value);
                }
            }
        });
    }
    
    
    if (historyFilter) {
        historyFilter.addEventListener('change', function() {
            
            const historyPane = document.getElementById('history-pane');
            if (historyPane.classList.contains('active') || historyPane.classList.contains('show')) {
                
                if (document.getElementById('set-details')) {
                    loadQuestionSets(this.value);
                } else {
                    loadQuestionSets(this.value);
                }
            }
        });
    }
    
    
    if (historyGradeFilter) {
        historyGradeFilter.addEventListener('change', function() {
            updateHistoryCategoryByGrade(this.value);
            
            
            historyFilter.value = '';
            
            
            const historyPane = document.getElementById('history-pane');
            if (historyPane.classList.contains('active') || historyPane.classList.contains('show')) {
                loadQuestionSets('');
            }
        });
    }
    
    
    function updateHistoryCategoryByGrade(grade) {
        
        const optgroups = historyFilter.querySelectorAll('optgroup');
        
        if (!grade) {
            
            optgroups.forEach(optgroup => {
                optgroup.style.display = '';
            });
        } else {
            
            optgroups.forEach(optgroup => {
                if (optgroup.label === `Grade ${grade}`) {
                    optgroup.style.display = '';
                } else {
                    optgroup.style.display = 'none';
                }
            });
        }
    }

    function generateReport(scores) {
        
        const classSummaries = {};
        scores.forEach(user => {
            if (!classSummaries[user.class]) {
                classSummaries[user.class] = {
                    students: [],
                    totalCorrect: 0,
                    totalQuestions: 0
                };
            }
            const studentStats = {
                username: user.username,
                correct: user.scores.filter(s => s.isCorrect).length,
                total: user.scores.length
            };
            classSummaries[user.class].students.push(studentStats);
            classSummaries[user.class].totalCorrect += studentStats.correct;
            classSummaries[user.class].totalQuestions += studentStats.total;
        });

        const container = document.createElement('div');
        container.innerHTML = `
            <div class="report-container">
                ${Object.entries(classSummaries).map(([className, summary]) => `
                    <div class="report-card p-4 mb-4 bg-white rounded shadow-sm">
                        <h4 class="mb-3">${className} result report</h4>
                        <div class="class-summary mb-3">
                            <div class="progress mb-2" style="height: 25px;">
                                <div class="progress-bar" role="progressbar" 
                                    style="width: ${(summary.totalCorrect / summary.totalQuestions) * 100}%">
                                    Class corret %: ${Math.round((summary.totalCorrect / summary.totalQuestions) * 100)}%
                                </div>
                            </div>
                            <div class="row mt-3">
                                <div class="col">
                                    <strong>Total question:</strong> ${summary.totalQuestions}
                                </div>
                                <div class="col">
                                    <strong>Total Correct:</strong> ${summary.totalCorrect}
                                </div>
                            </div>
                        </div>
                        <div class="student-list">
                            <h5 class="d-flex justify-content-between align-items-center">
                                <span>Student personal performance</span>
                                <button class="btn btn-sm btn-outline-primary toggle-students" data-bs-toggle="collapse" data-bs-target="#student-list-${className.replace(/[^a-zA-Z0-9]/g, '')}">
                                    Show Students <i class="fas fa-chevron-down"></i>
                                </button>
                            </h5>
                            <div class="collapse" id="student-list-${className.replace(/[^a-zA-Z0-9]/g, '')}">
                                <div class="row mt-3">
                                    ${summary.students.map(student => `
                                        <div class="col-md-6 mb-3">
                                            <div class="student-card p-2 border rounded">
                                                <h6>${student.username}</h6>
                                                <div class="progress" style="height: 20px;">
                                                    <div class="progress-bar" role="progressbar" 
                                                        style="width: ${(student.correct / student.total) * 100}%">
                                                        ${Math.round((student.correct / student.total) * 100)}%
                                                    </div>
                                                </div>
                                                <small class="text-muted">
                                                    Answered ${student.correct}/${student.total} correctly
                                                </small>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        
        const toggleButtons = container.querySelectorAll('.toggle-students');
        toggleButtons.forEach(button => {
            button.addEventListener('click', function() {
                const icon = this.querySelector('i');
                if (icon.classList.contains('fa-chevron-down')) {
                    icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
                    this.textContent = this.textContent.replace('Show', 'Hide');
                    this.innerHTML = 'Hide Students <i class="fas fa-chevron-up"></i>';
                } else {
                    icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
                    this.textContent = this.textContent.replace('Hide', 'Show');
                    this.innerHTML = 'Show Students <i class="fas fa-chevron-down"></i>';
                }
            });
        });
        
        return container;
    }

    
    function exportToExcel(scores, selectedClass) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('result report');

        
        worksheet.columns = [
            { header: 'Class', key: 'class', width: 10 },
            { header: 'Student', key: 'student', width: 15 },
            { header: 'Question', key: 'question', width: 30 },
            { header: 'Answer', key: 'answer', width: 15 },
            { header: 'Correct?', key: 'correct', width: 10 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Time', key: 'timestamp', width: 20 }
        ];

        
        scores.forEach(user => {
            if (!selectedClass || user.class === selectedClass) {
                user.scores.forEach(score => {
                    worksheet.addRow({
                        class: user.class,
                        student: user.username,
                        question: score.question,
                        answer: score.userAnswer,
                        correct: score.isCorrect ? '✓' : '✗',
                        category: score.category,
                        timestamp: new Date(score.timestamp).toLocaleString()
                    });
                });
            }
        });

        
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        
        workbook.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `result report_${selectedClass || 'All'}_${new Date().toLocaleDateString()}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        });
    }


    
    if (exportReportButton) {
        exportReportButton.addEventListener('click', function() {
            const selectedClass = classFilterSelect.value;
            const url = '/get-all-scores' + (selectedClass ? `?class=${selectedClass}` : '');
            
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        exportToExcel(data.scores, selectedClass);
                    }
                })
                .catch(error => {
                    console.error('Failed to export report', error);
                    alert('Failed to export report,please try again later');
                });
        });
    }





    
        
        
    
    
    
    generateQuestionsButton.addEventListener('click', function() {
        const username = localStorage.getItem('username');
        const category = document.getElementById('question-category').value;
        
        
        const grade = parseInt(questionGradeSelect.value);
        
        
        let timeLimit = 0;
        
        if (timeLimitSelect) {
            timeLimit = timeLimitSelect.value === 'custom' && customTimeLimitInput
                ? parseInt(customTimeLimitInput.value)
                : parseInt(timeLimitSelect.value);
                
            
            if (timeLimitSelect.value === 'custom' && (!timeLimit || timeLimit < 1)) {
                alert('Please enter valid time limit');
                return;
            }
        }
        
        
        let count;
        if (questionCountSelect.value === 'custom') {
            count = parseInt(customQuestionCountInput.value);
            
            if (!count || count < 1) {
                alert('Please enter valid number of questions');
                return;
            }
        } else {
            count = parseInt(questionCountSelect.value);
        }
        
        const setName = document.getElementById('set-name').value.trim() || null;
        
        
        const deadlineInput = document.getElementById('deadline');
        let deadline = null;
        if (deadlineInput && deadlineInput.value) {
            deadline = new Date(deadlineInput.value).toISOString();
        }
        
        
        let targetClasses = [];
        if (document.getElementById('class-all').checked) {
            
            targetClasses = [grade === 1 ? 'p1-all' : 'p2-all'];
        } else {
            
            const gradePrefix = grade === 1 ? '1' : '2';
            document.querySelectorAll('.class-checkbox:checked').forEach(checkbox => {
                if (checkbox.value.startsWith(gradePrefix)) {
                    targetClasses.push(checkbox.value);
                }
            });
            
            
            if (targetClasses.length === 0) {
                targetClasses = [grade === 1 ? 'p1-all' : 'p2-all'];
            }
        }
        
        
        const generatePane = document.getElementById('generate-pane');
        if (!generatePane.classList.contains('active')) {
            const generateTabEl = new bootstrap.Tab(document.getElementById('generate-tab'));
            generateTabEl.show();
        }
        
        
        questionsDisplay.innerHTML = '<div class="alert alert-info">Generating questions...</div>';
        
        fetch('/generate-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username,
                category,
                grade,
                timeLimit,
                count,
                targetClasses,
                setName: setName || `${category} - ${new Date().toLocaleString()}`,
                deadline
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.questions && data.questions.length > 0) {
                questionsDisplay.innerHTML = '';
                questionsDisplay.appendChild(renderQuestions(data.questions));
                
                
                questionsDisplay.scrollIntoView({ behavior: 'smooth' });
            } else {
                questionsDisplay.innerHTML = '<div class="alert alert-warning">Failed to generate or not generate question</div>';
            }
        })
        .catch(error => {
            console.error('Generate question error:', error);
            questionsDisplay.innerHTML = '<div class="alert alert-danger">Error when generating question</div>';
        });
    });


    
    
    function loadAllStudentScores(classFilter = '', gradeFilter = '') {
        let url = '/get-all-scores';
        const params = [];
        
        if (classFilter) {
            params.push(`class=${classFilter}`);
        }
        if (gradeFilter) {
            params.push(`grade=${gradeFilter}`);
        }
        
        if (params.length > 0) {
            url += '?' + params.join('&');
        }
        
        
        studentScoresDiv.innerHTML = `
            <div class="d-flex justify-content-center my-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
            </div>
        `;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    studentScoresDiv.innerHTML = '';
                    
                    if (data.scores.length === 0) {
                        studentScoresDiv.innerHTML = `
                            <div class="alert alert-info">
                                ${classFilter ? `${classFilter}class` : ''}
                                ${gradeFilter ? `${gradeFilter === '1' ? '1' : '2'}grade` : ''}
                                No student result data
                            </div>
                        `;
                        return;
                    }
                    studentScoresDiv.appendChild(renderScores(data.scores));

                    
                    if (reportDiv.style.display === 'block') {
                        reportDiv.innerHTML = '';
                        reportDiv.appendChild(generateReport(data.scores));
                    }
                }
            })
            .catch(error => {
                console.error('Failed to load result:', error);
                studentScoresDiv.innerHTML = `
                    <div class="alert alert-danger">
                        Failed to load result,please try again later
                    </div>
                `;
            });
    }
    
    
    if (classFilterSelect) {
        classFilterSelect.addEventListener('change', function() {
            const selectedClass = this.value;
            const selectedGrade = gradeFilterSelect ? gradeFilterSelect.value : '';
            loadAllStudentScores(selectedClass, selectedGrade);
        });
    }



    generateReportButton.addEventListener('click', function() {
        
        if (reportDiv.style.display === 'block') {
            reportDiv.style.display = 'none';
            return;
        }
        
        
        const performancePane = document.getElementById('performance-pane');
        if (!performancePane.classList.contains('active')) {
            const performanceTabEl = new bootstrap.Tab(document.getElementById('performance-tab'));
            performanceTabEl.show();
        }

        
        const selectedClass = classFilterSelect.value;
        const selectedGrade = gradeFilterSelect ? gradeFilterSelect.value : '';
        const url = '/get-all-scores' + (selectedClass || selectedGrade ? 
            `?${selectedClass ? 'class=' + selectedClass : ''}${selectedClass && selectedGrade ? '&' : ''}${selectedGrade ? 'grade=' + selectedGrade : ''}` 
            : '');
        
        
        reportDiv.innerHTML = `
            <div class="d-flex justify-content-center my-3">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
        reportDiv.style.display = 'block';
            
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    reportDiv.innerHTML = '';
                    reportDiv.appendChild(generateReport(data.scores));
                    
                    
                    reportDiv.scrollIntoView({ behavior: 'smooth' });
                } else {
                    reportDiv.innerHTML = '<div class="alert alert-danger">Failed to generate report</div>';
                }
            })
            .catch(error => {
                console.error('Failed to load report data:', error);
                reportDiv.innerHTML = '<div class="alert alert-danger">Error when generating report</div>';
            });
    });


    
    function initStudentChart() {
        
        const select = document.getElementById('student-select');
        select.innerHTML = '<option value="">Choose student</option>'; 

        
        Chart.defaults.font.family = 'Arial';
        Chart.defaults.color = '#333';
        
        
        const chartCanvas = document.getElementById('performance-chart');
        const chartContainer = chartCanvas.parentNode;
        chartContainer.style.height = '400px';
        chartCanvas.style.width = '100%';
        
        
        const chartParent = chartCanvas.parentNode.parentNode;
        if (!document.getElementById('student-performance-details')) {
            const detailsContainer = document.createElement('div');
            detailsContainer.id = 'student-performance-details';
            detailsContainer.className = 'mt-4 p-3 border rounded bg-light';
            detailsContainer.style.display = 'none'; 
            chartParent.appendChild(detailsContainer);
        }
    }

    
    function updateStudentSelector(students) {
        const studentSelect = document.getElementById('student-select');
        studentSelect.innerHTML = students.users.length 
            ? '<option value="">Choose student</option>' 
            : '<option value="">No student in this class</option>';
        
        students.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = user.username;
            studentSelect.appendChild(option);
        });
        
        studentSelect.disabled = !students.users.length;
    }
    
    
    
    
    document.getElementById('student-select').addEventListener('change', function() {
        const performanceContainer = document.getElementById('student-performance-details');
        
        if (!this.value) {
            if (performanceChart) performanceChart.destroy();
            if (performanceContainer) performanceContainer.innerHTML = '';
            return;
        }
        
        
        if (performanceContainer) {
            performanceContainer.innerHTML = '<div class="text-center my-4"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        }
        
        fetch(`/get-student-performance?username=${this.value}`)
            .then(res => res.json())
            .then(updateChart)
            .catch(error => {
                console.error('Failed to load student data:', error);
                alert('Failed to load student data');
                if (performanceContainer) {
                    performanceContainer.innerHTML = '<div class="alert alert-danger">Failed to load student data</div>';
                }
            });
    });
    
    
    document.getElementById('class-select').addEventListener('change', async function() {
        const selectedClass = this.value;
        const studentSelect = document.getElementById('student-select');
        
        studentSelect.disabled = true;
        studentSelect.innerHTML = '<option value="">Loading student...</option>';
        
        if (!selectedClass) {
            studentSelect.innerHTML = '<option value="">Select class first</option>';
            return;
        }

        
        if (studentsCache[selectedClass]) {
            updateStudentSelector(studentsCache[selectedClass]);
        } else {
            try {
                const students = await fetch(`/admin/users?role=student&class=${selectedClass}`)
                    .then(res => res.json());
                
                studentsCache[selectedClass] = students;
                updateStudentSelector(students);
            } catch (error) {
                console.error('Failed to load student:', error);
                studentSelect.innerHTML = '<option value="">Failed to load student</option>';
            }
        }
    });


    
    function updateChart(performanceData) {
        const ctx = document.getElementById('performance-chart').getContext('2d');
        const studentPerformanceContainer = document.getElementById('student-performance-details');
        
        
        originalPerformanceData = performanceData;
        
        
        updateCategoryFilter(performanceData);
        
        
        if (!studentPerformanceContainer) {
            
            const container = document.createElement('div');
            container.id = 'student-performance-details';
            container.className = 'mt-4 p-3 border rounded bg-light';
            document.getElementById('performance-chart').parentNode.appendChild(container);
        }
        
        
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
                    label: 'correct answers',
                    data: correctCounts,
                    backgroundColor: '#4e73df',
                    borderColor: '#3a56c5',
                    borderWidth: 1,
                    stack: 'Stack 0',
                },
                {
                    label: 'incorrect answers',
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
                            text: 'category'
                        },
                        stacked: true
                    },
                    y: {
                        beginAtZero: true,
                        stacked: true,
                        title: {
                            display: true,
                            text: 'number of questions'
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
                                return `correct rate: ${percentage.toFixed(1)}%`;
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
                                    return `total: ${total}`;
                                }
                                return '';
                            }
                        }
                    }
                }
            }
        });
        
        
        updateStudentPerformanceDetails(performanceData);
    }

    
    function updateStudentPerformanceDetails(performanceData) {
        const container = document.getElementById('student-performance-details');
        const studentName = document.getElementById('student-select').value;
        
        
        const totalCorrect = performanceData.totalCorrect;
        const totalQuestions = performanceData.totalQuestions;
        const overallPercentage = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : 0;
        
        
        const categoryStats = Object.entries(performanceData.stats).map(([category, stats]) => {
            const percentage = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0;
            return { 
                category, 
                correct: stats.correct, 
                total: stats.total, 
                percentage 
            };
        }).sort((a, b) => b.percentage - a.percentage); 
        
        
        const strongestCategory = categoryStats.length > 0 ? categoryStats[0] : null;
        const weakestCategory = categoryStats.length > 0 ? categoryStats[categoryStats.length - 1] : null;
        
        
        let html = `
            <h4 class="mb-3">Performance Summary for ${studentName}</h4>
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="card border-left-primary shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                        Overall Accuracy</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">${overallPercentage}%</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-percent fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-left-success shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                        Total Questions Attempted</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">${totalQuestions}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-clipboard-list fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-left-info shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                                        Correct Answers</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">${totalCorrect}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        
        if (strongestCategory && weakestCategory) {
            html += `
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                            Strongest Category</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${formatCategory(strongestCategory.category)}</div>
                                        <div class="small text-muted">${strongestCategory.correct}/${strongestCategory.total} (${strongestCategory.percentage}%)</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-trophy fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card border-left-warning shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                            Needs Improvement</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">${formatCategory(weakestCategory.category)}</div>
                                        <div class="small text-muted">${weakestCategory.correct}/${weakestCategory.total} (${weakestCategory.percentage}%)</div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        
        html += `
            <h5 class="mb-3">Category Performance</h5>
            <div class="table-responsive">
                <table class="table table-bordered table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Category</th>
                            <th>Correct</th>
                            <th>Total</th>
                            <th>Accuracy</th>
                            <th>Accuracy bar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categoryStats.map(stat => `
                            <tr>
                                <td>${formatCategory(stat.category)}</td>
                                <td>${stat.correct}</td>
                                <td>${stat.total}</td>
                                <td>${stat.percentage}%</td>
                                <td>
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar ${getProgressBarClass(parseFloat(stat.percentage))}" 
                                            role="progressbar" 
                                            style="width: ${stat.percentage}%"
                                            aria-valuenow="${stat.percentage}" 
                                            aria-valuemin="0" 
                                            aria-valuemax="100">
                                            ${stat.percentage}%
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    }

        
    function getProgressBarClass(percentage) {
        if (percentage >= 90) return 'bg-success';
        if (percentage >= 70) return 'bg-info';
        if (percentage >= 50) return 'bg-primary';
        if (percentage >= 30) return 'bg-warning';
        return 'bg-danger';
    }

    
    function truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }


















        
    document.getElementById('class-all').addEventListener('change', function() {
        const classCheckboxes = document.querySelectorAll('.class-checkbox');
        classCheckboxes.forEach(checkbox => {
            checkbox.disabled = this.checked;
            checkbox.checked = false;
        });
    });

    
    document.querySelectorAll('.class-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                document.getElementById('class-all').checked = false;
            }
            
            
            const anyChecked = [...document.querySelectorAll('.class-checkbox')].some(cb => cb.checked);
            document.getElementById('class-all').checked = !anyChecked;
        });
    });

    
    
    

    document.getElementById('question-category').addEventListener('change', function() {
        const category = this.value;
        
        
        const grade1Classes = document.getElementById('grade1-classes');
        const grade2Classes = document.getElementById('grade2-classes');
        
        if (category.startsWith('p2_')) {
            
            grade1Classes.style.display = 'none';
            grade2Classes.style.display = 'block';
            
            
            document.querySelector('label[for="class-all"]').textContent = 'All Primary 2 Classes';
        } else {
            
            grade1Classes.style.display = 'block';
            grade2Classes.style.display = 'none';
            
            
            document.querySelector('label[for="class-all"]').textContent = 'All Primary 1 Classes';
        }
    });


    
    document.getElementById('class-all').addEventListener('change', function() {
        const classCheckboxes = document.querySelectorAll('.class-checkbox');
        classCheckboxes.forEach(checkbox => {
            checkbox.disabled = this.checked;
            checkbox.checked = false;
        });
    });

    
    document.querySelectorAll('.class-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                document.getElementById('class-all').checked = false;
            }
            
            
            const anyChecked = [...document.querySelectorAll('.class-checkbox')].some(cb => cb.checked);
            document.getElementById('class-all').checked = !anyChecked;
        });
    });
        
    
    document.getElementById('question-category').dispatchEvent(new Event('change'));

    
    initStudentChart();
    loadClassList();    
    loadAllStudentScores();

    
    document.body.addEventListener('hidden.bs.modal', function(event) {
        
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        document.body.style.position = '';
        document.body.style.height = '';
        document.body.style.width = '';
        
        
        const modalBackdrops = document.querySelectorAll('.modal-backdrop');
        modalBackdrops.forEach(backdrop => {
            backdrop.remove();
        });
        
        
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
    });

    
    if (timeLimitSelect && customTimeContainer) {
        timeLimitSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                customTimeContainer.style.display = 'block';
            } else {
                customTimeContainer.style.display = 'none';
            }
        });
    }

    
    if (questionCountSelect && customCountContainer) {
        questionCountSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                customCountContainer.style.display = 'block';
            } else {
                customCountContainer.style.display = 'none';
            }
        });
    }

    
    if (questionGradeSelect && questionCategorySelect) {
        
        updateCategoryByGrade('1');
        
        questionGradeSelect.addEventListener('change', function() {
            const selectedGrade = this.value;
            
            
            updateCategoryByGrade(selectedGrade);
            
            
            toggleGradeClassesDisplay(selectedGrade);
            
            
            const classAllLabel = document.querySelector('label[for="class-all"]');
            if (classAllLabel) {
                classAllLabel.textContent = `All Primary ${selectedGrade} Classes`;
            }
        });
    }
    
    
    function updateCategoryByGrade(grade) {
        
        const optgroups = questionCategorySelect.querySelectorAll('optgroup');
        
        
        optgroups.forEach(optgroup => {
            
            if ((grade === '1' && optgroup.label === 'Grade 1') || 
                (grade === '2' && optgroup.label === 'Grade 2')) {
                optgroup.style.display = '';
            } else {
                optgroup.style.display = 'none';
            }
        });
        
        
        const visibleOptions = questionCategorySelect.querySelectorAll(`optgroup[label="Grade ${grade}"] option`);
        if (visibleOptions.length > 0) {
            questionCategorySelect.value = visibleOptions[0].value;
        }
    }
    
    
    function toggleGradeClassesDisplay(grade) {
        const grade1Classes = document.getElementById('grade1-classes');
        const grade2Classes = document.getElementById('grade2-classes');
        
        if (grade === '1') {
            if (grade1Classes) grade1Classes.style.display = '';
            if (grade2Classes) grade2Classes.style.display = 'none';
        } else if (grade === '2') {
            if (grade1Classes) grade1Classes.style.display = 'none';
            if (grade2Classes) grade2Classes.style.display = '';
        }
        
        
        const classAllCheckbox = document.getElementById('class-all');
        if (classAllCheckbox) {
            classAllCheckbox.checked = true;
            
            
            document.querySelectorAll('.class-checkbox').forEach(checkbox => {
                checkbox.checked = false;
            });
        }
    }

    
    const loadLateSubmissionsBtn = document.getElementById('load-late-submissions');
    const lateGradeFilter = document.getElementById('late-grade-filter');
    const lateClassFilter = document.getElementById('late-class-filter');
    const lateSubmissionsContainer = document.getElementById('late-submissions-container');
    
    
    if (loadLateSubmissionsBtn) {
        loadLateSubmissionsBtn.addEventListener('click', function() {
            const grade = lateGradeFilter.value;
            const classValue = lateClassFilter.value;
            
            
            lateSubmissionsContainer.innerHTML = '<div class="alert alert-info">Loading late submissions...</div>';
            
            
            let params = new URLSearchParams();
            if (grade) params.append('grade', grade);
            if (classValue) params.append('class', classValue);
            
            
            fetch(`/get-late-submissions?${params.toString()}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.lateSubmissions) {
                        if (data.lateSubmissions.length === 0) {
                            lateSubmissionsContainer.innerHTML = '<div class="alert alert-success">No late submissions found.</div>';
                            return;
                        }
                        
                        
                        const tableHtml = `
                            <div class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Class</th>
                                            <th>Category</th>
                                            <th>Late Questions</th>
                                            <th>Submission Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.lateSubmissions.map(submission => `
                                            <tr>
                                                <td>${submission.username}</td>
                                                <td>${submission.class}</td>
                                                <td>${formatCategory(submission.category)}</td>
                                                <td>${submission.lateQuestionCount}</td>
                                                <td>${new Date(submission.submissionTime).toLocaleString()}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `;
                        
                        lateSubmissionsContainer.innerHTML = tableHtml;
                    } else {
                        lateSubmissionsContainer.innerHTML = '<div class="alert alert-danger">Failed to load late submissions.</div>';
                    }
                })
                .catch(error => {
                    console.error('Error loading late submissions:', error);
                    lateSubmissionsContainer.innerHTML = '<div class="alert alert-danger">Error loading late submissions.</div>';
                });
        });
    }
    
    
    if (lateGradeFilter) {
        lateGradeFilter.addEventListener('change', function() {
            const grade = lateGradeFilter.value;
            
            
            if (grade) {
                const grade1Options = lateClassFilter.querySelector('optgroup[label="Primary 1"]');
                const grade2Options = lateClassFilter.querySelector('optgroup[label="Primary 2"]');
                
                if (grade === '1') {
                    grade1Options.style.display = '';
                    grade2Options.style.display = 'none';
                } else if (grade === '2') {
                    grade1Options.style.display = 'none';
                    grade2Options.style.display = '';
                }
            } else {
                
                const optgroups = lateClassFilter.querySelectorAll('optgroup');
                optgroups.forEach(group => group.style.display = '');
            }
            
            
            lateClassFilter.value = '';
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
    }
    
    
    function filterChartByCategory(category) {
        if (!originalPerformanceData) return;
        
        if (!category) {
            
            updateChart(originalPerformanceData);
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
        
        
        const ctx = document.getElementById('performance-chart').getContext('2d');
        
        
        if (performanceChart) {
            performanceChart.destroy();
        }

        
        const categories = Object.keys(filteredData.stats);
        
        
        const correctCounts = categories.map(cat => filteredData.stats[cat].correct);
        const incorrectCounts = categories.map(cat => {
            const total = filteredData.stats[cat].total;
            const correct = filteredData.stats[cat].correct;
            return total - correct;
        });
        const totalCounts = categories.map(cat => filteredData.stats[cat].total);
        const percentages = categories.map((cat, index) => {
            const correct = filteredData.stats[cat].correct;
            const total = filteredData.stats[cat].total;
            return total > 0 ? (correct / total) * 100 : 0;
        });
        
        const chartData = {
            labels: categories.map(cat => formatCategory(cat)),
            datasets: [
                {
                    label: 'correct answers',
                    data: correctCounts,
                    backgroundColor: '#4e73df',
                    borderColor: '#3a56c5',
                    borderWidth: 1,
                    stack: 'Stack 0',
                },
                {
                    label: 'incorrect answers',
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
                            text: 'category'
                        },
                        stacked: true
                    },
                    y: {
                        beginAtZero: true,
                        stacked: true,
                        title: {
                            display: true,
                            text: 'number of questions'
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
                                return `correct rate: ${percentage.toFixed(1)}%`;
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
                                    return `total: ${total}`;
                                }
                                return '';
                            }
                        }
                    }
                }
            }
        });
        
        
        
    }

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-question-classes')) {
            const questionId = e.target.dataset.id;
            showEditClassesModal(questionId);
        }
    });
    
    
    if (historyGradeFilter) {
        
        updateHistoryCategoryByGrade(historyGradeFilter.value);
    }
});