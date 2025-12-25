// Lazy Loading with Intersection Observer
function initLazyLoading() {
  // Intersection Observer options
  const options = {
    root: null,
    rootMargin: '50px',
    threshold: 0.01
  };
  
  // Observer callback
  const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const dataSrc = img.getAttribute('data-src');
        
        if (dataSrc) {
          // Blur-up effect için placeholder göster
          const placeholder = img.parentElement.querySelector('.lazy-image-placeholder');
          
          // Resmi yükle
          img.src = dataSrc;
          img.classList.add('lazy-image');
          
          // Yüklendiğinde blur'u kaldır
          img.onload = () => {
            img.classList.add('loaded');
            if (placeholder) {
              setTimeout(() => {
                placeholder.style.opacity = '0';
                setTimeout(() => {
                  placeholder.style.display = 'none';
                }, 300);
              }, 100);
            }
          };
          
          img.onerror = () => {
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EResim Yok%3C/text%3E%3C/svg%3E';
            img.classList.add('loaded');
          };
          
          // data-src'yi kaldır
          img.removeAttribute('data-src');
          
          // Observer'dan çıkar
          observer.unobserve(img);
        }
      }
    });
  };
  
  // Observer oluştur
  const observer = new IntersectionObserver(observerCallback, options);
  
  // Tüm lazy image'ları gözlemle
  const lazyImages = document.querySelectorAll('img[data-src]');
  lazyImages.forEach(img => {
    // Placeholder ekle
    const container = img.parentElement;
    if (container && !container.querySelector('.lazy-image-placeholder')) {
      const placeholder = document.createElement('div');
      placeholder.className = 'lazy-image-placeholder';
      container.style.position = 'relative';
      container.insertBefore(placeholder, img);
    }
    
    observer.observe(img);
  });
  
  // Sayfa yüklendiğinde görünür olanları hemen yükle
  lazyImages.forEach(img => {
    if (img.getBoundingClientRect().top < window.innerHeight + 100) {
      const dataSrc = img.getAttribute('data-src');
      if (dataSrc) {
        img.src = dataSrc;
        img.classList.add('lazy-image', 'loaded');
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    }
  });
}

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
  initLazyLoading();
});

// Dinamik içerik için mutation observer
const mutationObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { // Element node
        const lazyImages = node.querySelectorAll ? node.querySelectorAll('img[data-src]') : [];
        lazyImages.forEach(img => {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const dataSrc = img.getAttribute('data-src');
                if (dataSrc) {
                  img.src = dataSrc;
                  img.classList.add('lazy-image', 'loaded');
                  img.removeAttribute('data-src');
                }
              }
            });
          }, { rootMargin: '50px' });
          observer.observe(img);
        });
      }
    });
  });
});

// Body'yi gözlemle
document.addEventListener('DOMContentLoaded', () => {
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
});

