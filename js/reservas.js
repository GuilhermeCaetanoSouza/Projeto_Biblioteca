document.addEventListener('DOMContentLoaded', async function() {
    // Verifica se o usuário está logado
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    // Carrega o banco de dados
    const db = await (await fetch('data/database.json')).json();
    const reserveButtons = document.querySelectorAll('.reserve-btn');

    // Evento de reserva
    reserveButtons.forEach(btn => {
        btn.addEventListener('click', async function() {
            const bookId = parseInt(this.dataset.id);
            const book = db.books.find(b => b.id === bookId);
            
            if (!book.available) {
                showToast('Este livro já está reservado!', 'error');
                return;
            }

            const returnDate = new Date();
            returnDate.setDate(returnDate.getDate() + 15); // 15 dias para devolução

            const newReservation = {
                id: db.reservations.length + 1,
                bookId: bookId,
                userId: user.id,
                reservationDate: new Date().toISOString().split('T')[0],
                returnDate: returnDate.toISOString().split('T')[0],
                status: 'active'
            };

            book.available = false;
            db.reservations.push(newReservation);
            localStorage.setItem('db', JSON.stringify(db));
            
            showToast(`Livro "${book.title}" reservado até ${newReservation.returnDate}`);
            this.disabled = true;
            this.textContent = 'Reservado';
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
});