# WishCEO uygulaması

wishceo.com'daki haftalık CEO karar oyununun iOS ve Android uygulaması (Flutter).
Sayılar sitedeki `sites/wishceo.com/sayilar/NNN.json` dosyalarıdır; uygulama
açılmış sayıları paketle getirir, yenilerini wishceo.com'dan indirir. Hesap,
reklam, analiz ve takip yok (gizlilik: https://wishceo.com/gizlilik#uygulama).

- Paket: `co.saascorner.wishceo` (iOS bundle ID ve Android applicationId)
- Apple Team: `6K67GB2HY9`
- Android: minSdk 24, targetSdk 36; iOS: yalnız iPhone, dikey, Türkçe

## Klasörler

| Yol | İçerik |
| --- | --- |
| `lib/` | Uygulama. `data/` veri ve takvim, `screens/` ekranlar |
| `assets/sayilar/` | Paketle gelen sayılar (`tool/bundle_issues.dart` doldurur) |
| `assets/career.json` | Kariyer modu kartları |
| `test/` | Widget ve veri testleri |
| `tool/` | Sayı kopyalama, ikon ve mağaza görseli üretimi |
| `store/apple/` | App Store metinleri (fastlane deliver düzeni) |
| `store/play/` | Play metinleri, 512 ikon, 1024x500 öne çıkan görsel |
| `android/key.properties.example` | Upload anahtarı alanları (gerçek dosya depoya girmez) |
| `ios/ExportOptions.plist` | `flutter build ipa` için App Store dışa aktarma ayarı |

## Geliştirme

```sh
flutter pub get
flutter analyze
flutter test
flutter run            # bağlı cihaz ya da simülatör
```

## Yeni sayıları pakete almak

Uygulama her Pazartesi TR 00:00'da açılan sayıyı siteden indirir; paketteki
sayılar yalnız internetsiz ilk açılış içindir. Sürüm çıkarmadan önce:

```sh
dart run tool/bundle_issues.dart            # bugüne kadar açılanlar
dart run tool/bundle_issues.dart 2026-11-09 # belirli bir güne kadar açılanlar
```

## Görseller

```sh
flutter test --no-pub tool/store_art_test.dart  # iOS ikonları, Android mipmap'ler, store/play görselleri
flutter test --no-pub tool/shots_test.dart      # build/shots/<cihaz>/*.png (depoya girmez)
```

Ekran görüntüsü boyutları: `ios-6.3` 1206x2622 (App Store'un zorunlu iPhone
boyutu), `ios-6.9` 1320x2868, `android` 1080x1920. Hepsi alfasız PNG.

## Sürüm

`pubspec.yaml` içindeki `version: X.Y.Z+N`. `X.Y.Z` mağazada görünen sürüm,
`N` derleme numarası; her mağaza yüklemesinde `N` artmalı (aynı numara iki kez
yüklenemez).

## Android yayını (AAB)

1. Upload anahtarını bir kez oluştur (şifreyi sen girersin, depoya girmez):

   ```sh
   mkdir -p ~/.wishceo
   keytool -genkeypair -v -keystore ~/.wishceo/upload-keystore.jks \
     -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   cp android/key.properties.example ~/.wishceo/key.properties  # sonra alanları doldur
   ```

   Başka yerdeki dosya için `WISHCEO_KEY_PROPERTIES=/yol/key.properties`.
   Anahtar yoksa derleme debug imzayla sürer ve uyarı yazar; Play bunu kabul etmez.
   Keystore'u ve şifreyi yedekle; Play App Signing açıkken kaybolursa Play
   Console'dan upload anahtarı sıfırlatılır.

2. Derle:

   ```sh
   flutter build appbundle --release
   # build/app/outputs/bundle/release/app-release.aab
   ```

3. Play Console: uygulamayı oluştur, Play App Signing'i kabul et, AAB'yi
   Dahili test kanalına yükle. Liste metinleri `store/play/tr-TR/`, görseller
   `store/play/` ve `build/shots/android/`. Veri güvenliği formu: veri
   toplanmıyor, paylaşılmıyor. Reklam: yok. Hedef kitle: 13+ önerilir.

## iOS yayını (IPA)

1. Xcode'da iOS platformu yüklü olmalı (yoksa derleme "iOS 26.5 is not
   installed" der):

   ```sh
   xcodebuild -downloadPlatform iOS
   ```

2. App Store Connect'te `co.saascorner.wishceo` ile uygulama kaydı oluştur.

3. Derle ve imzala (Xcode'da Apple hesabı oturumu açık olmalı):

   ```sh
   flutter build ipa --release --export-options-plist=ios/ExportOptions.plist
   # build/ios/ipa/*.ipa
   ```

4. Yükle: Transporter uygulamasına `.ipa`'yı sürükle ya da Xcode Organizer'dan
   "Distribute App". TestFlight'ta dene, sonra incelemeye gönder.

5. App Store Connect metinleri `store/apple/tr/`, inceleme notu
   `store/apple/review_information/notes.txt`. Uygulama gizliliği: "Data Not
   Collected". Yaş derecesi anketinde kumar, simüle kumar ve reklam yok.
   Şifreleme: yalnız HTTPS, `ITSAppUsesNonExemptEncryption` = NO.

## Kontroller

- Android 15+ için 16 KB sayfa hizalaması: AAB'deki 64 bit `.so` dosyaları
  `objdump -p` ile `align 2**14` ya da üstü olmalı.
- Birleşik manifestte `com.google.android.gms.permission.AD_ID` olmamalı.
- `ios/Runner/PrivacyInfo.xcprivacy`: UserDefaults (CA92.1) dışında API yok.
