# Supabase RLS (Row Level Security) Düzeltme

## Sorun
"new row violates row-level security policy" hatası alıyorsunuz.

## Çözüm 1: RLS Politikası Ekleme (Önerilen)

1. Supabase Dashboard → Table Editor → `products` tablosu
2. "Policies" sekmesine gidin
3. "New Policy" tıklayın
4. **Policy Name**: `Enable insert for authenticated users`
5. **Allowed Operation**: `INSERT` seçin
6. **Policy Definition**: 
   ```sql
   true
   ```
   (Herkes ekleyebilir - admin panel için)
7. "Review" → "Save Policy" tıklayın

### Tüm İşlemler İçin:
- **INSERT Policy**: `true` (herkes ekleyebilir)
- **SELECT Policy**: `true` (herkes okuyabilir)
- **UPDATE Policy**: `true` (herkes güncelleyebilir)
- **DELETE Policy**: `true` (herkes silebilir)

## Çözüm 2: RLS'yi Geçici Olarak Kapatma (Test İçin)

1. Supabase Dashboard → Table Editor → `products`
2. "..." menüsü → "Disable RLS"
3. ⚠️ **Dikkat**: Production'da güvenlik riski oluşturabilir

## Çözüm 3: Service Role Key Kullanma (Gelişmiş)

Eğer service role key kullanmak isterseniz:
1. Supabase Dashboard → Settings → API
2. "service_role" key'i kopyalayın (anon key değil!)
3. Render.com'da `SUPABASE_SERVICE_KEY` environment variable ekleyin
4. Server.js'de service role key kullanın (sadece admin işlemleri için)

## Sütun Adı Sorunu

Eğer `created_at` sütunu yoksa:
1. Supabase Dashboard → Table Editor → `products`
2. Sütun adlarını kontrol edin
3. Eğer `created-at` gibi tire ile yazılmışsa, SQL ile düzeltin:

```sql
ALTER TABLE products RENAME COLUMN "created-at" TO created_at;
ALTER TABLE products RENAME COLUMN "updated-at" TO updated_at;
```

VEYA sütunları yeniden oluşturun:
1. Table Editor → `products` → "..." → "Delete table"
2. Yeniden oluşturun (doğru sütun adlarıyla)

