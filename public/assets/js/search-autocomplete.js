// Search Autocomplete
let allProductsForSearch = [];
let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
let selectedSuggestionIndex = -1;

function initSearchAutocomplete() {
  const searchInput = document.getElementById('searchInput');
  const searchModal = document.getElementById('searchModal');
  
  if (!searchInput || !searchModal) return;
  
  // Ürünleri yükle
  fetch('/api/public/products')
    .then(r => r.json())
    .then(data => {
      allProductsForSearch = data;
    })
    .catch(err => console.error('Ürün yükleme hatası:', err));
  
  // Suggestions container oluştur
  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.className = 'search-suggestions';
  suggestionsContainer.id = 'searchSuggestions';
  searchModal.querySelector('.search-modal-content').appendChild(suggestionsContainer);
  
  // Input event listener
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length >= 2) {
      showSuggestions(query);
    } else {
      hideSuggestions();
    }
    selectedSuggestionIndex = -1;
  });
  
  // Keyboard navigation
  searchInput.addEventListener('keydown', (e) => {
    const suggestions = document.querySelectorAll('.search-suggestion-item');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
      updateSelectedSuggestion(suggestions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
      updateSelectedSuggestion(suggestions);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[selectedSuggestionIndex];
      if (selected) {
        const link = selected.querySelector('a');
        if (link) {
          window.location.href = link.href;
        }
      }
    } else if (e.key === 'Escape') {
      hideSuggestions();
    }
  });
  
  // Click outside to close
  document.addEventListener('click', (e) => {
    if (!searchModal.contains(e.target)) {
      hideSuggestions();
    }
  });
}

function showSuggestions(query) {
  const suggestionsContainer = document.getElementById('searchSuggestions');
  if (!suggestionsContainer) return;
  
  const lowerQuery = query.toLowerCase();
  
  // Ürün araması
  const productMatches = allProductsForSearch
    .filter(p => {
      const name = (p.ad || '').toLowerCase();
      const brand = (p.marka || '').toLowerCase();
      const category = (p.kategori || '').toLowerCase();
      return name.includes(lowerQuery) || brand.includes(lowerQuery) || category.includes(lowerQuery);
    })
    .slice(0, 5);
  
  // Son arananlar
  const recentMatches = recentSearches
    .filter(s => s.toLowerCase().includes(lowerQuery))
    .slice(0, 3);
  
  let html = '';
  
  // Son arananlar
  if (recentMatches.length > 0 && query.length >= 2) {
    html += '<div class="search-recent-searches">Son Arananlar</div>';
    recentMatches.forEach(term => {
      html += `
        <div class="search-recent-item" onclick="selectSearchTerm('${term.replace(/'/g, "\\'")}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 8v4l3 3"/>
            <circle cx="12" cy="12" r="10"/>
          </svg>
          <span>${term}</span>
        </div>
      `;
    });
  }
  
  // Ürün önerileri
  if (productMatches.length > 0) {
    productMatches.forEach(product => {
      const productUrl = `/urun.html?id=${product.id}`;
      html += `
        <div class="search-suggestion-item">
          <a href="${productUrl}" style="display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; width: 100%;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <div class="search-suggestion-text">
              <div class="search-suggestion-title">${product.ad || 'İsimsiz Ürün'}</div>
              <div class="search-suggestion-meta">
                ${product.marka ? product.marka : ''} ${product.kategori ? '• ' + product.kategori : ''}
              </div>
            </div>
          </a>
        </div>
      `;
    });
  }
  
  if (html) {
    suggestionsContainer.innerHTML = html;
    suggestionsContainer.classList.add('active');
  } else {
    hideSuggestions();
  }
}

function hideSuggestions() {
  const suggestionsContainer = document.getElementById('searchSuggestions');
  if (suggestionsContainer) {
    suggestionsContainer.classList.remove('active');
  }
  selectedSuggestionIndex = -1;
}

function updateSelectedSuggestion(suggestions) {
  suggestions.forEach((item, index) => {
    if (index === selectedSuggestionIndex) {
      item.classList.add('selected');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('selected');
    }
  });
}

function selectSearchTerm(term) {
  addToRecentSearches(term);
  window.location.href = `/urunler.html?arama=${encodeURIComponent(term)}`;
}

function addToRecentSearches(term) {
  if (!term || term.trim().length < 2) return;
  
  const trimmedTerm = term.trim();
  recentSearches = recentSearches.filter(s => s.toLowerCase() !== trimmedTerm.toLowerCase());
  recentSearches.unshift(trimmedTerm);
  recentSearches = recentSearches.slice(0, 5); // Max 5 son arama
  localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
}

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
  initSearchAutocomplete();
});

