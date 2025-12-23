# Showroom Hotspot Ayarlama Kılavuzu

Showroom fotoğraflarınız üzerinde ürünleri göstermek için hotspot'ları ayarlamanız gerekiyor.

## Hotspot Nedir?

Hotspot'lar fotoğraflar üzerindeki kırmızı tıklanabilir noktalardır. Kullanıcılar bu noktalara tıkladığında ilgili ürün kategorisindeki ürünler gösterilir.

## Hotspot Pozisyonlarını Ayarlama

`showroom.html` dosyasındaki `showroomImages` dizisinde her fotoğraf için hotspot'ları tanımlayabilirsiniz.

### Örnek Yapı:

```javascript
{
  image: '/uploads/showroom-banner.jpg',
  title: 'Ana Showroom',
  description: 'Geniş ürün yelpazemizi keşfedin',
  hotspots: [
    { x: 30, y: 40, category: 'Seramik Ürünleri', title: 'Seramik Ürünleri' },
    { x: 60, y: 50, category: 'Boya Ürünleri', title: 'Boya Ürünleri' }
  ]
}
```

### Parametreler:

- **x**: Hotspot'un fotoğraf üzerindeki yatay pozisyonu (0-100 arası yüzde)
- **y**: Hotspot'un fotoğraf üzerindeki dikey pozisyonu (0-100 arası yüzde)
- **category**: Ürün kategorisi (ürünlerinizin kategori isimleriyle eşleşmeli)
- **title**: Hotspot üzerinde görünecek başlık

### Kategori İsimleri:

Mevcut kategori isimleri:
- Seramik Ürünleri
- Boya Ürünleri
- Hırdavat Ürünleri
- Elektrik Ürünleri
- Tesisat Ürünleri
- Yapı Malzemeleri
- El Aletleri Ürünleri
- Elektrikli El Aletleri
- Banyo Dolapları
- Parke Ürünleri
- Kaba Grubu

### Hotspot Pozisyonunu Bulma:

1. Fotoğrafınızı bir görüntü düzenleme programında açın
2. Ürünün fotoğraftaki konumunu belirleyin
3. X ve Y koordinatlarını yüzde olarak hesaplayın:
   - Sol üst köşe: x=0, y=0
   - Sağ alt köşe: x=100, y=100
   - Ortada: x=50, y=50

### Örnek:

Eğer bir ürün fotoğrafın sol tarafında, yukarıdan %30 aşağıda ve soldan %25 içerideyse:
- x: 25
- y: 30

## Fotoğraf Ekleme

Yeni showroom fotoğrafları eklemek için:

1. Fotoğrafı `/public/uploads/` klasörüne yükleyin
2. `showroomImages` dizisine yeni bir obje ekleyin
3. Hotspot'ları ayarlayın

## Notlar

- Hotspot'lar yüzde bazlıdır, bu sayede fotoğraf boyutu değişse bile doğru konumda kalırlar
- Her fotoğraf için istediğiniz kadar hotspot ekleyebilirsiniz
- Kategori isimleri, ürünlerinizin `kategori` alanıyla tam olarak eşleşmelidir (büyük/küçük harf duyarlı)

