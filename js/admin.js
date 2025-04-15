document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Verifica se usuário é admin
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user || user.role !== 'admin') {
            window.location.href = 'login.html';
            return;
        }

        // Carrega banco de dados
        const db = await loadDatabase();
        
        // Elementos do DOM
        const tabs = document.querySelectorAll('[data-tab]');
        const booksTable = document.getElementById('booksTable');
        const usersTable = document.getElementById('usersTable');
        const reservationsTable = document.getElementById('reservationsTable');
        const addBookBtn = document.getElementById('addBookBtn');

        // Função para carregar dados
        async function loadDatabase() {
            const response = await fetch('../data/database.json');
            if (!response.ok) throw new Error('Falha ao carregar dados');
            return await response.json();
        }

        // Função para salvar alterações
        async function saveDatabase(db) {
            localStorage.setItem('db', JSON.stringify(db));
            return true;
        }

        // Sistema de ordenação
        function sortData(data, sortBy = 'id', ascending = true) {
            return data.sort((a, b) => {
                let comparison = 0;
                
                if (sortBy === 'title' || sortBy === 'author' || sortBy === 'name' || sortBy === 'email') {
                    comparison = a[sortBy].localeCompare(b[sortBy]);
                } 
                else if (sortBy === 'status') {
                    comparison = (a.available === b.available) ? 0 : a.available ? -1 : 1;
                }
                else if (sortBy === 'reservationDate') {
                    comparison = new Date(a.reservationDate) - new Date(b.reservationDate);
                }
                else {
                    comparison = a.id - b.id;
                }
                
                return ascending ? comparison : -comparison;
            });
        }

        // Cria controles de ordenação
        function createSortControls(section, fields, defaultField) {
            const sortContainer = document.createElement('div');
            sortContainer.className = 'sort-controls';
            sortContainer.innerHTML = `
                <label>Ordenar por:</label>
                <select class="sort-field">
                    ${fields.map(field => `
                        <option value="${field.value}" ${field.value === defaultField ? 'selected' : ''}>
                            ${field.label}
                        </option>
                    `).join('')}
                </select>
                <select class="sort-order">
                    <option value="asc">Crescente</option>
                    <option value="desc">Decrescente</option>
                </select>
            `;

            const sortField = sortContainer.querySelector('.sort-field');
            const sortOrder = sortContainer.querySelector('.sort-order');

            const updateSort = () => {
                renderSection(section);
            };

            sortField.addEventListener('change', updateSort);
            sortOrder.addEventListener('change', updateSort);

            return sortContainer;
        }

        // Renderiza seção ativa
        function renderSection(section) {
            switch(section) {
                case 'livros':
                    renderBooksTable();
                    break;
                case 'usuarios':
                    renderUsersTable();
                    break;
                case 'reservas':
                    renderReservationsTable();
                    break;
            }
        }

        // Renderiza tabela de livros
        function renderBooksTable() {
            const sortField = document.querySelector('#livros .sort-field')?.value || 'title';
            const sortOrder = document.querySelector('#livros .sort-order')?.value || 'asc';
            const sortedBooks = sortData(db.books, sortField, sortOrder === 'asc');

            booksTable.innerHTML = `
                <thead>
                    <tr>
                        <th>Capa</th>
                        <th>Título</th>
                        <th>Autor</th>
                        <th>Gênero</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedBooks.map(book => `
                        <tr>
                            <td><img src="${book.cover}" alt="${book.title}" class="book-cover-small"></td>
                            <td>${book.title}</td>
                            <td>${book.author}</td>
                            <td>${book.genre}</td>
                            <td>
                                <span class="status-badge ${book.available ? 'available' : 'unavailable'}">
                                    ${book.available ? 'Disponível' : 'Reservado'}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-edit edit-book" data-id="${book.id}">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                                <button class="btn btn-sm btn-danger delete-book" data-id="${book.id}">
                                    <i class="fas fa-trash"></i> Excluir
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            `;

            // Adiciona event listeners para os botões
            document.querySelectorAll('.edit-book').forEach(btn => {
                btn.addEventListener('click', () => showBookModal(parseInt(btn.dataset.id)));
            });

            document.querySelectorAll('.delete-book').forEach(btn => {
                btn.addEventListener('click', () => deleteBook(parseInt(btn.dataset.id)));
            });
        }

        // Renderiza tabela de usuários
        function renderUsersTable() {
            const sortField = document.querySelector('#usuarios .sort-field')?.value || 'name';
            const sortOrder = document.querySelector('#usuarios .sort-order')?.value || 'asc';
            const sortedUsers = sortData(db.users, sortField, sortOrder === 'asc');

            usersTable.innerHTML = `
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Tipo</th>
                        <th>Cadastro</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedUsers.map(user => `
                        <tr>
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td>
                                <span class="role-badge ${user.role}">
                                    ${user.role === 'admin' ? 'Administrador' : 'Usuário'}
                                </span>
                            </td>
                            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-sm btn-edit edit-user" data-id="${user.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            `;

            document.querySelectorAll('.edit-user').forEach(btn => {
                btn.addEventListener('click', () => showUserModal(parseInt(btn.dataset.id)));
            });
        }

        // Renderiza tabela de reservas
        function renderReservationsTable() {
            const sortField = document.querySelector('#reservas .sort-field')?.value || 'reservationDate';
            const sortOrder = document.querySelector('#reservas .sort-order')?.value || 'desc';
            const sortedReservations = sortData(db.reservations, sortField, sortOrder === 'asc');

            reservationsTable.innerHTML = `
                <thead>
                    <tr>
                        <th>Livro</th>
                        <th>Usuário</th>
                        <th>Data Reserva</th>
                        <th>Data Devolução</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedReservations.map(res => {
                        const book = db.books.find(b => b.id === res.bookId);
                        const user = db.users.find(u => u.id === res.userId);
                        return `
                            <tr>
                                <td>${book?.title || 'Livro removido'}</td>
                                <td>${user?.name || 'Usuário removido'}</td>
                                <td>${new Date(res.reservationDate).toLocaleDateString()}</td>
                                <td>${new Date(res.returnDate).toLocaleDateString()}</td>
                                <td class="status-${res.status}">
                                    ${res.status === 'active' ? 'Ativa' : 'Cancelada'}
                                </td>
                                <td>
                                    ${res.status === 'active' ? `
                                    <button class="btn btn-sm btn-danger cancel-reservation" data-id="${res.id}">
                                        Cancelar
                                    </button>` : ''}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            `;

            document.querySelectorAll('.cancel-reservation').forEach(btn => {
                btn.addEventListener('click', () => cancelReservation(parseInt(btn.dataset.id)));
            });
        }

        // Modal para edição de livros
        function showBookModal(bookId = null) {
            const book = bookId ? db.books.find(b => b.id === bookId) : {
                id: db.books.length + 1,
                title: '',
                author: '',
                genre: 'fantasia',
                cover: '',
                description: '',
                available: true,
                pages: 0,
                year: new Date().getFullYear()
            };

            const modalContent = `
                <h2>${bookId ? 'Editar Livro' : 'Adicionar Livro'}</h2>
                <form id="bookForm">
                    <input type="hidden" id="bookId" value="${book.id}">
                    <div class="form-group">
                        <label for="bookTitle">Título</label>
                        <input type="text" id="bookTitle" value="${book.title}" required>
                    </div>
                    <div class="form-group">
                        <label for="bookAuthor">Autor</label>
                        <input type="text" id="bookAuthor" value="${book.author}" required>
                    </div>
                    <div class="form-group">
                        <label for="bookGenre">Gênero</label>
                        <select id="bookGenre">
                            <option value="fantasia" ${book.genre === 'fantasia' ? 'selected' : ''}>Fantasia</option>
                            <option value="ficcao" ${book.genre === 'ficcao' ? 'selected' : ''}>Ficção</option>
                            <option value="romance" ${book.genre === 'romance' ? 'selected' : ''}>Romance</option>
                            <option value="tecnologia" ${book.genre === 'tecnologia' ? 'selected' : ''}>Tecnologia</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="bookCover">Capa (URL)</label>
                        <input type="text" id="bookCover" value="${book.cover}">
                    </div>
                    <div class="form-group">
                        <label for="bookPages">Páginas</label>
                        <input type="number" id="bookPages" value="${book.pages}">
                    </div>
                    <div class="form-group">
                        <label for="bookYear">Ano</label>
                        <input type="number" id="bookYear" value="${book.year}">
                    </div>
                    <div class="form-group">
                        <label for="bookAvailable">Disponível</label>
                        <input type="checkbox" id="bookAvailable" ${book.available ? 'checked' : ''}>
                    </div>
                    <button type="submit" class="btn btn-primary">Salvar</button>
                    <button type="button" class="btn btn-close-modal">Cancelar</button>
                </form>
            `;

            showModal(modalContent);

            document.getElementById('bookForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                saveBook({
                    id: parseInt(document.getElementById('bookId').value),
                    title: document.getElementById('bookTitle').value,
                    author: document.getElementById('bookAuthor').value,
                    genre: document.getElementById('bookGenre').value,
                    cover: document.getElementById('bookCover').value,
                    pages: parseInt(document.getElementById('bookPages').value),
                    year: parseInt(document.getElementById('bookYear').value),
                    available: document.getElementById('bookAvailable').checked,
                    description: document.getElementById('bookDescription')?.value || ''
                });
            });
        }

        // Modal para edição de usuários
        function showUserModal(userId) {
            const user = db.users.find(u => u.id === userId);
            if (!user) return;

            const modalContent = `
                <h2>Editar Usuário</h2>
                <form id="userForm">
                    <input type="hidden" id="userId" value="${user.id}">
                    <div class="form-group">
                        <label for="userName">Nome</label>
                        <input type="text" id="userName" value="${user.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="userEmail">Email</label>
                        <input type="email" id="userEmail" value="${user.email}" required>
                    </div>
                    <div class="form-group">
                        <label for="userRole">Tipo</label>
                        <select id="userRole">
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>Usuário</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Salvar</button>
                    <button type="button" class="btn btn-close-modal">Cancelar</button>
                </form>
            `;

            showModal(modalContent);

            document.getElementById('userForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                const userIndex = db.users.findIndex(u => u.id === userId);
                if (userIndex >= 0) {
                    db.users[userIndex] = {
                        ...db.users[userIndex],
                        name: document.getElementById('userName').value,
                        email: document.getElementById('userEmail').value,
                        role: document.getElementById('userRole').value
                    };
                    
                    saveDatabase(db).then(() => {
                        showToast('Usuário atualizado com sucesso!');
                        renderUsersTable();
                        closeModal();
                    });
                }
            });
        }

        // Salva livro no banco de dados
        async function saveBook(bookData) {
            const index = db.books.findIndex(b => b.id === bookData.id);
            
            if (index >= 0) {
                // Atualiza livro existente
                db.books[index] = { ...db.books[index], ...bookData };
            } else {
                // Adiciona novo livro
                db.books.push(bookData);
            }

            if (await saveDatabase(db)) {
                showToast('Livro salvo com sucesso!');
                closeModal();
                renderBooksTable();
            } else {
                showToast('Erro ao salvar livro!', 'error');
            }
        }

        // Exclui livro
        async function deleteBook(bookId) {
            if (!confirm('Tem certeza que deseja excluir este livro?')) return;
            
            db.books = db.books.filter(b => b.id !== bookId);
            
            if (await saveDatabase(db)) {
                showToast('Livro excluído com sucesso!');
                renderBooksTable();
            } else {
                showToast('Erro ao excluir livro!', 'error');
            }
        }

        // Cancela reserva
        async function cancelReservation(reservationId) {
            if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;
            
            const reservation = db.reservations.find(r => r.id === reservationId);
            if (!reservation) return;
            
            const book = db.books.find(b => b.id === reservation.bookId);
            if (book) book.available = true;
            
            reservation.status = 'cancelled';
            
            if (await saveDatabase(db)) {
                showToast('Reserva cancelada com sucesso!');
                renderReservationsTable();
            } else {
                showToast('Erro ao cancelar reserva!', 'error');
            }
        }

        // Funções para modal genérico
        function showModal(content) {
            const modal = document.createElement('div');
            modal.id = 'adminModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    ${content}
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.querySelector('.btn-close-modal')?.addEventListener('click', closeModal);
        }

        function closeModal() {
            document.getElementById('adminModal')?.remove();
        }

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
        function init() {
            // Adiciona controles de ordenação
            document.querySelector('#livros').prepend(
                createSortControls('livros', [
                    { value: 'title', label: 'Título' },
                    { value: 'author', label: 'Autor' },
                    { value: 'genre', label: 'Gênero' },
                    { value: 'status', label: 'Status' }
                ], 'title')
            );

            document.querySelector('#usuarios').prepend(
                createSortControls('usuarios', [
                    { value: 'name', label: 'Nome' },
                    { value: 'email', label: 'Email' },
                    { value: 'role', label: 'Tipo' }
                ], 'name')
            );

            document.querySelector('#reservas').prepend(
                createSortControls('reservas', [
                    { value: 'reservationDate', label: 'Data Reserva' },
                    { value: 'returnDate', label: 'Data Devolução' },
                    { value: 'status', label: 'Status' }
                ], 'reservationDate')
            );

            // Renderiza tabelas
            renderBooksTable();
            renderUsersTable();
            renderReservationsTable();

            // Event listeners
            addBookBtn?.addEventListener('click', () => showBookModal());
            
            tabs.forEach(tab => {
                tab.addEventListener('click', function(e) {
                    e.preventDefault();
                    const tabId = this.getAttribute('data-tab');
                    
                    tabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    document.getElementById(tabId).classList.add('active');
                });
            });
        }

        init();

    } catch (error) {
        console.error('Erro no admin.js:', error);
        alert('Ocorreu um erro ao carregar o painel administrativo');
    }
});