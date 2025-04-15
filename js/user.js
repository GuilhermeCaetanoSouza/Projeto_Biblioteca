document.addEventListener('DOMContentLoaded', async function() {
    // Verifica autenticação
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Carrega os dados
    const db = await loadDatabase();
    const reservedBooksContainer = document.getElementById('reservedBooks');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Funções principais
    async function loadDatabase() {
        const response = await fetch('../data/database.json');
        return await response.json();
    }
    
    function renderReservedBooks() {
        const userReservations = db.reservations.filter(r => r.userId === user.id && r.status === 'active');
        
        if (userReservations.length === 0) {
            reservedBooksContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <p>Você não tem livros reservados</p>
                </div>
            `;
            return;
        }
        
        reservedBooksContainer.innerHTML = userReservations.map(reservation => {
            const book = db.books.find(b => b.id === reservation.bookId);
            return `
                <div class="book-card">
                    <div class="book-cover">
                        <img src="${book.cover}" alt="${book.title}">
                    </div>
                    <div class="book-info">
                        <h3>${book.title}</h3>
                        <p>Autor: ${book.author}</p>
                        <p>Reservado até: ${new Date(reservation.returnDate).toLocaleDateString()}</p>
                        <button class="btn btn-danger cancel-btn" data-id="${reservation.id}">
                            Cancelar Reserva
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Adiciona event listeners para cancelamento
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                if (confirm('Tem certeza que deseja cancelar esta reserva?')) {
                    const reservationId = parseInt(this.dataset.id);
                    const reservation = db.reservations.find(r => r.id === reservationId);
                    
                    if (reservation) {
                        const book = db.books.find(b => b.id === reservation.bookId);
                        if (book) book.available = true;
                        reservation.status = 'cancelled';
                        
                        localStorage.setItem('db', JSON.stringify(db));
                        showToast('Reserva cancelada com sucesso!');
                        renderReservedBooks();
                    }
                }
            });
        });
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
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }
    
    // Renderiza os livros inicialmente
    renderReservedBooks();
});