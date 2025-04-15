document.addEventListener('DOMContentLoaded', async function() {
    // Carrega os dados do JSON
    const response = await fetch('data/database.json');
    const database = await response.json();
    
    // Elementos do DOM
    const booksContainer = document.getElementById('books-container');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const genreFilter = document.getElementById('genreFilter');
    const availabilityFilter = document.getElementById('availabilityFilter');
    
    // Renderiza os livros
    function renderBooks(books) {
        booksContainer.innerHTML = '';
        
        books.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card';
            bookCard.innerHTML = `
                <div class="book-cover">
                    <img src="${book.cover}" alt="${book.title}">
                </div>
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p class="author">${book.author}</p>
                    <p class="genre">${book.genre}</p>
                    <button class="btn btn-primary reserve-btn" data-id="${book.id}" ${!book.available ? 'disabled' : ''}>
                        ${book.available ? 'Reservar' : 'Indisponível'}
                    </button>
                </div>
            `;
            booksContainer.appendChild(bookCard);
        });
    }
    
    // Filtra os livros
    function filterBooks() {
        const searchTerm = searchInput.value.toLowerCase();
        const genre = genreFilter.value;
        const availability = availabilityFilter.value;
        
        const filteredBooks = database.books.filter(book => {
            const matchesSearch = book.title.toLowerCase().includes(searchTerm) || 
                                book.author.toLowerCase().includes(searchTerm);
            const matchesGenre = !genre || book.genre === genre;
            const matchesAvailability = !availability || 
                                      (availability === 'disponivel' && book.available) || 
                                      (availability === 'reservado' && !book.available);
            
            return matchesSearch && matchesGenre && matchesAvailability;
        });
        
        renderBooks(filteredBooks);
    }
    
    // Event listeners
    searchBtn.addEventListener('click', filterBooks);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') filterBooks();
    });
    genreFilter.addEventListener('change', filterBooks);
    availabilityFilter.addEventListener('change', filterBooks);
    
    // Renderiza todos os livros inicialmente
    renderBooks(database.books);
});