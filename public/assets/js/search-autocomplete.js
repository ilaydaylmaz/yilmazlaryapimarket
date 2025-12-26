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

// Metni vurgula (highlight)
function highlightText(text, query) {
  if (!query || !text) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Akıllı eşleştirme skoru hesapla
function calculateMatchScore(product, query) {
  const lowerQuery = query.toLowerCase();
  const name = (product.ad || '').toLowerCase();
  const brand = (product.marka || '').toLowerCase();
  const category = (product.kategori || '').toLowerCase();
  
  let score = 0;
  
  // 1. Ürün adı başlangıçta eşleşiyor (en yüksek öncelik)
  if (name.startsWith(lowerQuery)) {
    score += 100;
  }
  
  // 2. Ürün adında kelime başlangıcında eşleşiyor
  const nameWords = name.split(/\s+/);
  if (nameWords.some(word => word.startsWith(lowerQuery))) {
    score += 50;
  }
  
  // 3. Marka başlangıçta eşleşiyor
  if (brand.startsWith(lowerQuery)) {
    score += 40;
  }
  
  // 4. Kategori başlangıçta eşleşiyor
  if (category.startsWith(lowerQuery)) {
    score += 30;
  }
  
  // 5. Ürün adında içinde geçiyor
  if (name.includes(lowerQuery)) {
    score += 20;
  }
  
  // 6. Marka içinde geçiyor
  if (brand.includes(lowerQuery)) {
    score += 10;
  }
  
  // 7. Kategori içinde geçiyor
  if (category.includes(lowerQuery)) {
    score += 5;
  }
  
  return score;
}

function showSuggestions(query) {
  const suggestionsContainer = document.getElementById('searchSuggestions');
  if (!suggestionsContainer) return;
  
  const lowerQuery = query.toLowerCase();
  
  // Akıllı ürün araması - skorlama ile
  const productMatches = allProductsForSearch
    .map(p => ({
      product: p,
      score: calculateMatchScore(p, query)
    }))
    .filter(item => item.score > 0) // Sadece eşleşenleri al
    .sort((a, b) => b.score - a.score) // Yüksek skorlu önce
    .slice(0, 8) // En fazla 8 öneri
    .map(item => item.product);
  
  // Son arananlar
  const recentMatches = recentSearches
    .filter(s => s.toLowerCase().includes(lowerQuery))
    .slice(0, 3);
  
  let html = '';
  
  // Son arananlar
  if (recentMatches.length > 0 && query.length >= 2) {
    html += '<div class="search-recent-searches">🕒 Son Arananlar</div>';
    recentMatches.forEach(term => {
      const highlightedTerm = highlightText(term, query);
      html += `
        <div class="search-recent-item" onclick="selectSearchTerm('${term.replace(/'/g, "\\'")}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 8v4l3 3"/>
            <circle cx="12" cy="12" r="10"/>
          </svg>
          <span>${highlightedTerm}</span>
        </div>
      `;
    });
  }
  
  // Ürün önerileri
  if (productMatches.length > 0) {
    if (recentMatches.length > 0) {
      html += '<div class="search-suggestions-divider"></div>';
    }
    html += '<div class="search-recent-searches">🔍 Ürün Önerileri</div>';
    
    productMatches.forEach(product => {
      const productUrl = `/urun.html?id=${product.id}`;
      const highlightedName = highlightText(product.ad || 'İsimsiz Ürün', query);
      const highlightedBrand = product.marka ? highlightText(product.marka, query) : '';
      const highlightedCategory = product.kategori ? highlightText(product.kategori, query) : '';
      
      html += `
        <div class="search-suggestion-item">
          <a href="${productUrl}" style="display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; width: 100%; padding: 12px; border-radius: 8px; transition: background 0.2s;">
            <div class="search-suggestion-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <div class="search-suggestion-text" style="flex: 1; min-width: 0;">
              <div class="search-suggestion-title" style="font-weight: 600; margin-bottom: 4px; color: var(--text-dark);">${highlightedName}</div>
              <div class="search-suggestion-meta" style="font-size: 0.85rem; color: var(--text-light);">
                ${highlightedBrand} ${highlightedCategory ? '• ' + highlightedCategory : ''}
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

