// Scroll to Top Button
function initScrollToTop() {
  // Eğer zaten varsa ekleme
  if (document.querySelector('.scroll-to-top')) return;
  
  const button = document.createElement('button');
  button.className = 'scroll-to-top';
  button.setAttribute('aria-label', 'Yukarı çık');
  button.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 15l-6-6-6 6"/>
    </svg>
  `;
  document.body.appendChild(button);

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      button.classList.add('visible');
    } else {
      button.classList.remove('visible');
    }
  });

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// WhatsApp Floating Button
function initWhatsAppButton() {
  // Eğer zaten varsa ekleme
  if (document.querySelector('.whatsapp-float')) return;
  
  const whatsappButton = document.createElement('a');
  whatsappButton.href = 'https://wa.me/905367191308?text=Merhaba, bilgi almak istiyorum.';
  whatsappButton.target = '_blank';
  whatsappButton.rel = 'noopener noreferrer';
  whatsappButton.className = 'whatsapp-float';
  whatsappButton.setAttribute('aria-label', 'WhatsApp ile iletişime geç');
  whatsappButton.innerHTML = `
    <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.372a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .96 4.534.96 10.087c0 1.847.485 3.584 1.335 5.092L.06 23.876l8.92-2.344a11.81 11.81 0 003.07.4h.001c6.554 0 11.89-5.335 11.89-11.89a11.816 11.816 0 00-3.528-8.393"/>
    </svg>
  `;
  document.body.appendChild(whatsappButton);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initScrollToTop();
  initWhatsAppButton();
});

