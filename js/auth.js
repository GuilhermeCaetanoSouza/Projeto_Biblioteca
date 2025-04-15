document.addEventListener('DOMContentLoaded', async function() {
    // Carrega o banco de dados
    const database = await loadDatabase();
    const currentUser = getCurrentUser();

    // Elementos do DOM
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutButtons = document.querySelectorAll('#logoutBtn, .logout-btn');
    const switchAccountBtn = document.getElementById('switchAccountBtn');

    // Funções principais
    async function loadDatabase() {
        try {
            const response = await fetch('data/database.json');
            return await response.json();
        } catch (error) {
            console.error("Erro ao carregar database:", error);
            return { users: [], books: [], reservations: [] };
        }
    }

    function getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser'));
    }

    function updateHeader(user) {
        const userGreeting = document.getElementById('userGreeting');
        const authButtons = document.getElementById('authButtons');
        const myBooksLink = document.getElementById('myBooksLink');
        
        if (user) {
            if (userGreeting) {
                userGreeting.textContent = `Olá, ${user.name.split(' ')[0]}!`;
                userGreeting.style.display = 'inline';
            }
            if (authButtons) {
                authButtons.innerHTML = `
                    <button id="switchAccountBtn" class="btn">Trocar Conta</button>
                    <button id="logoutBtn" class="btn btn-danger">Sair</button>
                `;
            }
            if (myBooksLink && user.role === 'user') {
                myBooksLink.style.display = 'block';
            }
        }
    }

    // Redirecionamentos inteligentes
    function checkAuth() {
        const user = getCurrentUser();
        const isAuthPage = window.location.pathname.includes('login.html') || 
                          window.location.pathname.includes('cadastro.html');

        if (user && isAuthPage) {
            window.location.href = user.role === 'admin' ? 'admin.html' : 'index.html';
        } else if (!user && !isAuthPage && !window.location.pathname.includes('index.html')) {
            window.location.href = 'login.html';
        }
        
        updateHeader(user);
        return user;
    }

    // Event Listeners
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const user = database.users.find(u => u.email === email && u.password === password);
            
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                showToast(`Bem-vindo, ${user.name.split(' ')[0]}!`);
                setTimeout(() => {
                    window.location.href = user.role === 'admin' ? 'admin.html' : 'index.html';
                }, 1000);
            } else {
                showToast('Credenciais inválidas!', 'error');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                showToast('As senhas não coincidem!', 'error');
                return;
            }
            
            if (database.users.some(u => u.email === email)) {
                showToast('Este email já está cadastrado!', 'error');
                return;
            }

            const newUser = {
                id: database.users.length + 1,
                name: document.getElementById('name').value,
                email: email,
                password: password,
                role: 'user',
                createdAt: new Date().toISOString().split('T')[0]
            };

            database.users.push(newUser);
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            localStorage.setItem('db', JSON.stringify(database));
            
            showToast('Cadastro realizado com sucesso!');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        });
    }

    document.addEventListener('click', function(e) {
        if (e.target.id === 'switchAccountBtn' || e.target.closest('#switchAccountBtn')) {
            localStorage.removeItem('currentUser');
            showToast('Sessão encerrada');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }
    });

    logoutButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            showToast('Logout realizado');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        });
    });

    // Mostra notificação
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Inicialização
    checkAuth();
});