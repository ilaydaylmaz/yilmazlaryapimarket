# Showroom Hotspot Ayarlama - Adım Adım Kılavuz

## 🎯 Hızlı Başlangıç

### 1. Showroom Sayfasını Açın
Tarayıcınızda şu adrese gidin:
```
http://localhost:3000/showroom.html?edit=1
```
veya sayfada "Düzenleme Modunu Aç" butonuna tıklayın.

### 2. Fotoğrafa Tıklayın
- Showroom fotoğraflarınızdan birine tıklayın
- Ürünlerin bulunduğu yere tıklayın (örneğin: seramik ürünlerinin olduğu raf)
- Sağ altta bir panel açılacak

### 3. Kategori Seçin
- Açılan panelde "Kategori Seçin" menüsünden ilgili kategoriyi seçin
- Örnek: Seramik ürünleri için "Seramik Ürünleri" seçin

### 4. Başlık Girin (Opsiyonel)
- İsterseniz özel bir başlık yazabilirsiniz
- Boş bırakırsanız kategori adı kullanılır

### 5. Hotspot Ekle
- "Hotspot Ekle" butonuna tıklayın
- Fotoğraf üzerinde kırmızı bir nokta görünecek

### 6. Diğer Hotspot'ları Ekleyin
- Aynı fotoğrafa veya diğer fotoğraflara tıklayarak daha fazla hotspot ekleyin
- Her ürün grubu için bir hotspot ekleyin

### 7. Hotspot Silme (Gerekirse)
- Mevcut hotspot'lara (kırmızı noktalara) tıklayın
- Onay mesajında "Tamam" deyin
- Hotspot silinecek

### 8. Ayarları Kaydetme
- Tüm hotspot'ları ekledikten sonra "Ayarları Kopyala" butonuna tıklayın
- F12 tuşuna basarak Developer Console'u açın
- Console'da görünen kodu kopyalayın

### 9. Kodu Dosyaya Yapıştırın
- `public/showroom.html` dosyasını açın
- `showroomImages` dizisini bulun (yaklaşık 568. satır)
- Eski kodu silin ve yeni kodu yapıştırın
- Dosyayı kaydedin

### 10. Test Edin
- Düzenleme modunu kapatın
- Hotspot'lara tıklayarak ürünlerin göründüğünü kontrol edin

---

## 📸 Örnek Senaryo

Diyelim ki `showroom-banner.jpg` fotoğrafınızda:
- Sol tarafta seramik ürünleri var
- Sağ tarafta boya ürünleri var
- Ortada hırdavat ürünleri var

**Yapılacaklar:**
1. Fotoğrafa sol tarafa tıklayın → Kategori: "Seramik Ürünleri" → Hotspot Ekle
2. Fotoğrafa sağ tarafa tıklayın → Kategori: "Boya Ürünleri" → Hotspot Ekle
3. Fotoğrafa ortaya tıklayın → Kategori: "Hırdavat Ürünleri" → Hotspot Ekle
4. "Ayarları Kopyala" → Kodu dosyaya yapıştır

---

## 🎨 Görsel İpuçları

- **Kırmızı noktalar**: Hotspot'lar (tıklanabilir)
- **Düzenleme modu**: Fotoğraflar üzerinde crosshair (artı işareti) görünür
- **Panel**: Sağ altta hotspot ekleme paneli açılır

---

## ⚠️ Önemli Notlar

1. **Kategori İsimleri**: Kategori isimleri ürünlerinizdeki kategori isimleriyle tam olarak eşleşmeli
2. **Pozisyon**: Hotspot'lar yüzde bazlıdır (0-100), bu yüzden fotoğraf boyutu değişse bile doğru konumda kalırlar
3. **Kaydetme**: Her değişiklikten sonra "Ayarları Kopyala" yapıp dosyaya yapıştırmayı unutmayın

---

## 🆘 Sorun Giderme

**Hotspot görünmüyor:**
- Düzenleme modunu kapatıp tekrar açın
- Sayfayı yenileyin (F5)

**Kategori bulunamıyor:**
- Ürünlerinizin kategori alanının dolu olduğundan emin olun
- Kategori isimlerinin doğru yazıldığından emin olun

**Ayarlar kaydedilmiyor:**
- Console'u açın (F12)
- "Ayarları Kopyala" butonuna tıklayın
- Console'da görünen kodu kopyalayın
- Dosyaya manuel olarak yapıştırın

---

## 📝 Örnek Kod Yapısı

```javascript
const showroomImages = [
  {
    image: '/uploads/showroom-banner.jpg',
    title: 'Ana Showroom',
    description: 'Geniş ürün yelpazemizi keşfedin',
    hotspots: [
      { x: 30, y: 40, category: 'Seramik Ürünleri', title: 'Seramik Ürünleri' },
      { x: 60, y: 50, category: 'Boya Ürünleri', title: 'Boya Ürünleri' }
    ]
  }
];
```

Her hotspot için:
- `x`: Yatay pozisyon (0-100)
- `y`: Dikey pozisyon (0-100)
- `category`: Ürün kategorisi
- `title`: Görünen başlık

