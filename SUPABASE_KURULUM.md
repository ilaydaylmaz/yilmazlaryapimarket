# Supabase Kurulum Rehberi (MongoDB'den Daha Kolay!)

Supabase, MongoDB'den çok daha kolay kurulum ve kullanım sunan ücretsiz bir PostgreSQL veritabanıdır.

## 🚀 Adım 1: Supabase Hesabı Oluşturma

1. [Supabase](https://supabase.com) sitesine gidin
2. "Start your project" veya "Sign Up" tıklayın
3. GitHub ile giriş yapın (en kolay yol)
4. E-posta doğrulamasını tamamlayın

## 🗄️ Adım 2: Yeni Proje Oluşturma

1. Dashboard'da "New Project" tıklayın
2. **Organization**: Yeni organization oluşturun (veya mevcut olanı seçin)
3. **Name**: `yapi-market` (veya istediğiniz isim)
4. **Database Password**: Güçlü bir şifre belirleyin (not edin!)
5. **Region**: `West EU (Ireland)` veya `Central EU (Frankfurt)` seçin (Türkiye'ye yakın)
6. **Pricing Plan**: "Free" seçin
7. "Create new project" tıklayın
8. ⏳ Proje oluşturulması 1-2 dakika sürebilir

## 📋 Adım 3: API Bilgilerini Alma

1. Proje oluşturulduktan sonra, sol menüden "Settings" → "API" seçin
2. Şu bilgileri kopyalayın:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🗃️ Adım 4: Tabloları Oluşturma

1. Sol menüden "Table Editor" seçin
2. "Create a new table" tıklayın

### Products Tablosu:
- **Name**: `products`
- **Columns** ekleyin:
  - `id` (uuid, primary key, default: uuid_generate_v4())
  - `ad` (text, not null)
  - `kategori` (text)
  - `marka` (text)
  - `aciklama` (text)
  - `resim` (text)
  - `created_at` (timestamptz, default: now())
  - `updated_at` (timestamptz, default: now())
- "Save" tıklayın

### Contacts Tablosu:
- **Name**: `contacts`
- **Columns** ekleyin:
  - `id` (uuid, primary key, default: uuid_generate_v4())
  - `ad_soyad` (text, not null)
  - `email` (text, not null)
  - `telefon` (text, not null)
  - `mesaj` (text, not null)
  - `created_at` (timestamptz, default: now())
- "Save" tıklayın

## 🔐 Adım 5: Row Level Security (RLS) Ayarlama

1. Her tablo için "Enable RLS" açık olmalı (varsayılan)
2. Policies ekleyin (isteğe bağlı - admin için):
   - Products tablosu için: "Enable insert for authenticated users only"
   - Contacts tablosu için: "Enable insert for all users" (herkes form gönderebilir)

## 🚀 Adım 6: Render.com'da Environment Variables Ekleme

1. Render Dashboard → Service → Environment
2. Şu environment variable'ları ekleyin:

**SUPABASE_URL**:
```
https://xxxxx.supabase.co
```

**SUPABASE_KEY**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

(Değerleri Supabase Dashboard'dan kopyalayın)

## ✅ Adım 7: Test Etme

1. Deploy tamamlandıktan sonra sitenize gidin
2. Admin paneline giriş yapın
3. Ürün ekleyin
4. Supabase Dashboard → Table Editor → products tablosunda ürünü görebilirsiniz

## 🎯 Avantajlar

- ✅ MongoDB'den çok daha kolay kurulum
- ✅ Web arayüzü ile veri yönetimi
- ✅ Ücretsiz (500MB database, 2GB bandwidth)
- ✅ Otomatik yedekleme
- ✅ Real-time özellikler (isteğe bağlı)
- ✅ REST API otomatik oluşturulur

## 📞 Yardım

- [Supabase Dokümantasyon](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)

