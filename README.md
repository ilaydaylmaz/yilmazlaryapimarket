# Yılmazlar Yapı Market

Modern ve profesyonel yapı market web sitesi.

## Özellikler

- 🏠 Modern ve responsive tasarım
- 📦 Ürün kataloğu ve detay sayfaları
- 🔍 Gelişmiş ürün arama ve filtreleme
- 📝 İletişim formu
- 🔐 Admin paneli (ürün yönetimi)
- 📱 Mobil uyumlu

## Kurulum

### Yerel Geliştirme

1. Projeyi klonlayın:
```bash
git clone <repository-url>
cd yapi_market
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. MongoDB Atlas Kurulumu (Ücretsiz):
   - Detaylı kurulum için `MONGODB_KURULUM.md` dosyasına bakın
   - Kısaca: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) hesabı oluşturun
   - "Build a Database" → "Free" seçin
   - Cluster oluşturun (birkaç dakika sürebilir)
   - Database kullanıcısı oluşturun
   - Network Access ayarlayın (0.0.0.0/0)
   - "Connect" → "Connect your application" seçin
   - Connection string'i kopyalayın ve düzenleyin

4. Environment Variable Ayarlayın:
   - `.env` dosyası oluşturun (proje kök dizininde)
   - İçine şunu ekleyin:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yapi_market
   ```
   - `username`, `password` ve `cluster` bilgilerini kendi MongoDB Atlas bilgilerinizle değiştirin

5. Sunucuyu başlatın:
```bash
npm start
```

6. Tarayıcıda açın: `http://localhost:3000`

## Admin Girişi

- URL: `/login.html`
- Kullanıcı adı: `admin`
- Şifre: `1234`

## Deployment (Yayınlama)

### Render.com (Önerilen - Ücretsiz)

1. [Render.com](https://render.com) hesabı oluşturun
2. "New Web Service" seçin
3. GitHub repository'nizi bağlayın
4. Ayarlar:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: `Node`
5. Deploy edin!

### Railway.app

1. [Railway.app](https://railway.app) hesabı oluşturun
2. "New Project" → "Deploy from GitHub repo"
3. Repository'nizi seçin
4. Otomatik deploy başlar!

### Vercel

1. [Vercel](https://vercel.com) hesabı oluşturun
2. "Import Project" → GitHub repo seçin
3. Framework: "Other"
4. Build Command: `npm install`
5. Output Directory: `.`
6. Deploy!

### Heroku

1. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) yükleyin
2. Heroku'da yeni app oluşturun:
```bash
heroku create yapi-market
```
3. Deploy edin:
```bash
git push heroku main
```

## Ortam Değişkenleri

Production'da şu değişkenleri ayarlayın:

- `MONGODB_URI`: MongoDB bağlantı string'i (zorunlu)
- `PORT`: Sunucu portu (genelde otomatik ayarlanır)
- `SESSION_SECRET`: Session secret key (güvenlik için değiştirin)

### Render.com'da Environment Variables

1. Render Dashboard → Service → Environment
2. "Add Environment Variable" tıklayın
3. `MONGODB_URI` ekleyin ve MongoDB Atlas connection string'inizi yapıştırın
4. Deploy edin

## Teknolojiler

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript
- **Veritabanı**: MongoDB (MongoDB Atlas)
- **ODM**: Mongoose
- **File Upload**: Multer

## Lisans

ISC

