#!/bin/bash
TOP_BAR='<!-- Top Info Bar -->
<div class="top-info-bar">
  <div class="container">
    <div class="top-info-items">
      <a href="mailto:bilgi@yilmazlaryapi.com.tr" class="top-info-item">
        <i class="fas fa-envelope"></i>
        <span>bilgi@yilmazlaryapi.com.tr</span>
      </a>
      <a href="tel:+902566335050" class="top-info-item">
        <i class="fas fa-phone"></i>
        <span>+90 256 633 50 50</span>
      </a>
      <div class="top-info-item">
        <i class="fas fa-map-marker-alt"></i>
        <span>Aydın / Kuşadası</span>
      </div>
      <div class="top-info-item">
        <i class="fas fa-clock"></i>
        <span>Çalışma saatlerimiz: 08:00 - 18:00</span>
      </div>
    </div>
    <div class="top-info-social">
      <a href="https://www.instagram.com/yilmazlaryapi" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
        <i class="fab fa-instagram"></i>
      </a>
      <a href="https://wa.me/902566335050" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
        <i class="fab fa-whatsapp"></i>
      </a>
    </div>
  </div>
</div>

'

for file in *.html; do
  if ! grep -q "top-info-bar" "$file" 2>/dev/null; then
    if grep -q "^<header>" "$file"; then
      sed -i '' "s|^<header>|$TOP_BAR<header>|" "$file"
      echo "Added to $file"
    fi
  fi
done
