document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.querySelector('.logout-btn');

    
    
    function logout() {
        const username = localStorage.getItem('username');
        
        localStorage.removeItem(`${username}_completed_questions`);
        
        localStorage.removeItem('username');
        localStorage.removeItem('role'); 
        localStorage.removeItem('selectedCategory');
        
        window.location.href = '/login';
    }

    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
    
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        localStorage.setItem('username', username);
                        localStorage.setItem('role', data.role); 
                        if (data.role === 'admin') {
                            window.location.href = '/admin';
                        } else if (data.role === 'teacher') {
                            window.location.href = '/teacher';
                        } else {
                            window.location.href = '/student';
                        }
                    } else {
                        alert('Invalid username or password.');
                    }
                });
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const password = document.getElementById('register-password').value;
            const role = document.getElementById('register-role').value;
            const grade = document.getElementById('register-grade').value;
            const classSelect = document.getElementById('register-class');
            
            
            const studentClass = role === 'student' ? classSelect.value : null;
    
            fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    username, 
                    password, 
                    role,
                    grade: parseInt(grade),
                    class: studentClass 
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Register success！');
                    window.location.href = '/login';
                } else {
                    alert(data.message || 'Username already exists.');
                }
            });
        });
                
        const roleSelect = document.getElementById('register-role');
        const gradeSelect = document.getElementById('register-grade');
        const classFormGroup = document.getElementById('class-form-group');
        const classSelect = document.getElementById('register-class');
                
        function updateClassOptions() {
            if (roleSelect.value === 'student') {
                classFormGroup.style.display = 'block';
                
                
                classSelect.innerHTML = '';
                
                const grade = gradeSelect.value;
                if (grade === '1') {
                    
                    const grade1Group = document.createElement('optgroup');
                    grade1Group.label = 'Primary 1';
                    ['1A', '1B', '1C', '1D'].forEach(cls => {
                        const option = document.createElement('option');
                        option.value = cls;
                        option.textContent = cls;
                        grade1Group.appendChild(option);
                    });
                    classSelect.appendChild(grade1Group);
                } else {
                    
                    const grade2Group = document.createElement('optgroup');
                    grade2Group.label = 'Primary 2';
                    ['2A', '2B', '2C', '2D'].forEach(cls => {
                        const option = document.createElement('option');
                        option.value = cls;
                        option.textContent = cls;
                        grade2Group.appendChild(option);
                    });
                    classSelect.appendChild(grade2Group);
                }
            } else {
                classFormGroup.style.display = 'none';
            }
        }

        roleSelect.addEventListener('change', updateClassOptions);
        gradeSelect.addEventListener('change', updateClassOptions);

        updateClassOptions();

        
    }
});