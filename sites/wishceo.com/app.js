// WishCEO: sayı sayı CEO oyunu, arşiv, CEO karnesi, paylaşım ve yeni sayı bildirimi.
// Vakalar gerçek şirket krizlerinden uyarlanmıştır; şirket, ürün ve kişi adları kurgusaldır, rakamlar yuvarlanmıştır. Dosyalarda dış bağlantı yoktur.
(function () {
  "use strict";

  var FORM_END = "https://corner-forms.berkay-999.workers.dev/submit";
  var LIST_KEY = "wishceo.liste";

  // tag: karnede CEO tipini belirler (cerrah, kalkan, kumar, kasa)
  var S001 = [
    {
      area: "Müşteri sadakati",
      place: ["ABD", " · 1980’lerin ortası"],
      company: "Lavenhurst",
      title: "Yüz yıllık formüle dokunmak",
      body: [
        "Lavenhurst, Amerika’nın en çok satan kolası. Tarifi yaklaşık yüz yıldır neredeyse hiç değişmedi; marka ülkede yaz tatilleri, stadyumlar ve aile sofralarıyla anılıyor. Ama pazar payın yıllardır yavaş yavaş geriliyor ve daha tatlı kolasıyla öne çıkan ezeli rakibin marketlerde seni geçti.",
        "Rakip yıllardır kör tadım kampanyası yürütüyor: alışveriş merkezlerinde etiketsiz iki bardak, reklamlarda hep onların bardağını seçen insanlar. Şirketin kendi tadımları da aynı sonucu verdi. Ekibin daha tatlı yeni bir formül geliştirdi; yaklaşık iki yüz bin kör tadımda yeni formül hem eskiyi hem rakibi geçti. Kısa süre önce yeni Lavenhurst büyük bir lansmanla raflara çıktı, eski formül raflardan tamamen kalktı.",
        "Lansmandan bu yana şirkete on binlerce telefon ve mektup geldi. İnsanlar eski koladan kasa kasa stok yapıyor. Şikâyetlerin çoğu tatla ilgili değil: “Bizim kolamızı değiştirdiniz, kimse bize sormadı.” Araştırma ekibi, tadımlarda katılımcıların küçük bir kısmının eski formülün tamamen kalkacağını duyunca çok kızdığını hatırlatıyor. Pazarlama ekibi ise sabırlı olmanı istiyor: yeni tadı en çok gençler seviyor ve tepkinin birkaç ay içinde yatışacağını düşünüyorlar. Yeni formülü onaylayan CEO sensin ve lansmanın üzerinden yaklaşık iki ay geçti."
      ],
      stats: [["Kör tadım", "~200 bin"], ["Telefon ve mektup", "On binlerce"], ["Lansmandan bu yana", "~2 ay"]],
      ask: "Yeni formülle ne yaparsın?",
      opts: [
        { k: "A", t: "Geri adım atma. Reklam bütçesini iki katına çıkar, ülkenin en sevilen yüzleriyle yeni bir kampanya başlat; birkaç ay içinde insanlar yeni tada alışır.", s: 15, tag: "kumar",
          r: "Daha çok reklam, eski kolanın gittiğini daha çok insana duyurmak demek. Tepki tattan değil bağlılıktan geliyor; bütçeyi büyütmek “bize sorulmadı” hissini derinleştirir." },
        { k: "B", t: "Eski formülü hemen rafa geri getir, yenisini de yanında tut. Müşteriye açıkça “sizi duyduk” de; hangisini içeceğine o karar versin.", s: 90, tag: "kalkan",
          r: "“Hata yaptık” demek pahalıdır: rafta iki kola kafa karıştırır, basın günlerce bununla eğlenir. Ama sadık müşteriye sesinin duyulduğunu gösterirsin, yeni tadı seveni de kapı dışında bırakmazsın." },
        { k: "C", t: "Lansmana harcanan milyonların boşa gitmesine izin verme. Şikâyet edenler sesi çok çıkan bir azınlık olabilir: yeni formülü koru, eski formülü yalnızca birkaç bölgede sınırlı bir süre için geri getir ve satış verisini izle.", s: 35, tag: "kasa",
          r: "Temkinli bir deneme gibi görünür, ama eski kolayı yalnızca birkaç bölgeye geri vermek, geri kalan herkese “sizinki yok” demek olur. Tadımda kazanmak, insanlara “eski kolanız artık yok” demiş olmanı telafi etmez. Veriyi beklediğin her hafta stok yapan ve şikâyet eden insan sayısı artar." },
        { k: "D", t: "Yeni formülü tamamen kaldır, eski formülü tek başına rafa geri koy; televizyona çıkıp açıkça özür dile.", s: 65, tag: "cerrah",
          r: "Sadık müşteri sevinir, konu hızla kapanır. Ama yeni tadı gerçekten beğenen gençleri yeniden rakibe bırakırsın; haftalardır anlatılan “daha iyi tat” hikâyesi de tek açıklamayla çöpe gider." }
      ],
      real: {
        who: "Nolan Chesterly",
        role: "Lavenhurst CEO’su",
        k: "B",
        text: [
          "Lansmandan iki buçuk ay kadar sonra şirket, eski formülün “Lavenhurst İlk Tarif” adıyla rafa döneceğini duyurdu; yeni formül de satışta kalacaktı. Yöneticiler basının karşısına çıkıp müşterilerin markaya bu kadar bağlı olduğunu hesaba katmadıklarını açıkça kabul etti. Haber akşam bültenlerinde ilk sıradaydı; sonraki iki günde gelen teşekkür telefonları, o güne kadarki bütün şikâyetlere yakın bir sayıya ulaştı.",
          "İlk Tarif’in satışları hızla yükseldi. Yıl bitmeden Lavenhurst İlk Tarif hem yeni formülü hem rakibi geride bırakmıştı; şirket rakibe kaptırdığı liderliği geri aldı. Bazı yorumcular olanların baştan planlanmış bir pazarlama hamlesi olduğunu ileri sürdü; yöneticiler bunu kabul etmedi, yalnızca müşterilerini artık daha iyi tanıdıklarını söylediler.",
          "Yeni formül birkaç yıl sonra adı değiştirilerek küçük bir kitleye satılmaya devam etti, satışları giderek azaldı ve sonunda üretimi sessizce durduruldu. Vaka bugün pazarlama derslerinde, insanların bir kolayı yalnızca tadı için değil, taşıdığı anlam için aldığının örneği olarak anlatılıyor."
        ]
      }
    },
    {
      area: "Dönüşüm",
      place: ["Danimarka", " · 2000’lerin başı"],
      company: "Tumla Group",
      title: "Her şeye giren oyuncakçı",
      body: [
        "Tumla yetmiş yılı aşkın bir aile şirketi. Son on yılda markasını her yere taşıdı: tema parkları, giyim, takı, video oyunları, bir televizyon dizisi.",
        "Ürün yelpazesi şişti. Yeni setler yalnızca bir kez kullanılan özel parçalarla dolu; kalıplar, depolar, maliyetler fırladı. Satışlar düşüyor, şirket zarar ediyor, kasadaki para hızla azalıyor.",
        "Aile, otuzlu yaşlarındaki eski bir danışmanı CEO yaptı. O kişi sensin."
      ],
      stats: [["Kuruluş", "1930’lar"], ["Tema parkı", "Birkaç"], ["Son bilanço", "Zarar"]],
      ask: "Neyi değiştirirsin?",
      opts: [
        { k: "A", t: "Daha çok yenilik: yeni dijital ürünler, yeni filmler, yeni parklar. Büyüyerek çıkarız.", s: 15, tag: "kumar",
          r: "Şirketi bu hâle getiren tam da buydu. Kasa boşalırken yeni işlere girmek düşüşü hızlandırır." },
        { k: "B", t: "Küçül ve odaklan: parça çeşidini azalt, parkları sat, ana ürüne, tuğlaya dön.", s: 95, tag: "cerrah",
          r: "Zor bir liste: projeler kapanır, bazı ekipler gider. Ama ilk kez herkes şirketi neyin ayakta tuttuğunu biliyor." },
        { k: "C", t: "Üretimi ucuz bir ülkeye taşı, maliyeti kes. Kalite biraz düşse de idare eder.", s: 40, tag: "kasa",
          r: "Maliyet düşer ama Tumla’yı Tumla yapan şey parçaların milimetrik oturması; kaliteden kısarsan elinde sıradan bir oyuncak kalır. Üretimin bir kısmı gerçekten Macaristan, Çek Cumhuriyeti ve Meksika’ya taşındı, ama şirketi toparlayan bu olmadı." },
        { k: "D", t: "Şirketi büyük bir rakibe sat. Aile hiç değilse parasını alsın.", s: 25, tag: "kalkan",
          r: "Belki aile kurtulur ama marka bir rakibin portföyünde sessizce kaybolur. Masadan kalkmak da bir karar, ama CEO’luk değil." }
      ],
      real: {
        who: "Rasmus Lindvang",
        role: "Tumla CEO’su",
        k: "B",
        text: [
          "Lindvang işe nakdi korumakla başladı: parça çeşidini ciddi biçimde azalttı, kârsız işleri kapattı ya da sattı; kısa süre sonra tema parklarının çoğunluk hissesini de elden çıkardı.",
          "Odağı tuğlaya ve sevilen temalara geri çekti, hayran topluluğunu dinlemeye başladı.",
          "Yaklaşık on yıl sonra Tumla dünyanın en büyük ve en kârlı oyuncak şirketleri arasındaydı."
        ]
      }
    },
    {
      area: "Strateji",
      place: ["Finlandiya", " · 2010’ların başı"],
      company: "Korvala",
      title: "Tahttaki telefoncu",
      body: [
        "Korvala, pazarının zirvesindeki telefon üreticisi. Neredeyse herkesin cebinde bir Korvala var ya da yakın zamana kadar vardı.",
        "Ama birkaç yıl önce Amerikalı bir bilgisayar şirketi dokunmatik telefonunu çıkardı, arama motoru devinin ücretsiz sistemi de hızla yayılıyor. Şirketin kendi akıllı telefon sistemi eskidi, uygulama geliştiriciler ilgisini kaybetti. Ortaklıkla geliştirilen yeni sistem ise henüz hazır değil.",
        "Akıllı telefonda pazar payı geriliyor, hisse düşüyor. Yeni CEO sensin ve bir platform seçmek zorundasın."
      ],
      stats: [["Telefon pazarında", "Zirvede"], ["İşletim sistemi", "Kendi, eski"], ["Rakipler", "ABD’li iki dev"]],
      ask: "Hangi yola girersin?",
      opts: [
        { k: "A", t: "Arama motoru devinin ücretsiz sistemine geç. Herkesin kullandığı yere katıl, farkı donanım ve tasarımla yarat.", s: 75, tag: "cerrah",
          r: "Asyalı dev üreticilerle aynı sistemde yarışmak zor ama uygulamalar ve kullanıcılar hazır. Sonradan bazı yorumcular Korvala’nın bu yolu seçmesi gerektiğini savundu." },
        { k: "B", t: "Yazılım devi Tallbridge’le ortaklık kur, akıllı telefonlarında ana sistem olarak onun telefon sistemini seç.", s: 35, tag: "kumar",
          r: "Tallbridge para ve destek veriyor, sen de en büyük ortağı oluyorsun. Ama şirketin geleceğini pazarın henüz çok küçük bir kısmını tutan bir sisteme bağlıyorsun." },
        { k: "C", t: "Geliştirmekte olduğumuz yeni sistemi bitir, yolumuza bağımsız devam edelim.", s: 45, tag: "kalkan",
          r: "Bağımsız kalırsın ama yarışa yıllar geç girersin. Geliştiriciler üçüncü bir sistemi bekleyecek mi?" },
        { k: "D", t: "Akıllı telefonu bırak; ucuz ve sağlam telefonlarda dünya lideri olarak kal.", s: 25, tag: "kasa",
          r: "Bugünü idare eder, yarını kaybettirir. Ucuz telefon pazarı da birkaç yıl içinde akıllı telefona dönecek." }
      ],
      real: {
        who: "Gordon Stoddard",
        role: "Korvala CEO’su",
        k: "B",
        text: [
          "Stoddard göreve geldikten birkaç ay sonra çalışanlara şirketin durumunu açıkça anlattı ve Korvala’yı Tallbridge’in telefon sistemine bağladı. Eski sistem rafa kalkmaya başladı.",
          "Tallbridge’in sistemi beklenen ivmeyi yakalayamadı. Yaklaşık iki buçuk yıl sonra Korvala telefon işini, patent lisansıyla birlikte birkaç milyar avroya Tallbridge’e satmak için anlaştı. Satış ertesi yıl tamamlandı.",
          "Korvala bugün telekom altyapısı üreten bir şirket olarak yoluna devam ediyor."
        ]
      }
    }
  ];

  var S002 = [
    {
      area: "Marka",
      place: ["ABD", " · 2000’lerin sonu"],
      company: "Brascina Pizza",
      title: "Lezzette sonuncu",
      body: [
        "Brascina, Amerika’nın on milyarlarca dolarlık pizza pazarında ikinci büyük zincir. Dünyada binlerce şubesi var, adı hızlı eve teslimatla anılıyor.",
        "Ama müşteriler pizzanı sevmiyor; internette hamurunu kartona benzetiyorlar. Bir tüketici araştırmasında lezzette sonuncusun, bir çocuk eğlence merkezi zinciriyle aynı sıradasın. Rakipler aynı indirimleri yapıyor, dondurulmuş pizzalar da iyileşiyor. Kâr son birkaç yılda yarıya yakın düştü, gelir bu yıl da geriliyor.",
        "Mutfak ekibi iki yıla yakın süredir yeni bir tarif üzerinde çalışıyor: yeni hamur, yeni sos, yeni peynir. Şirketin ABD işini sen yönetiyorsun. Tarif hazır; şimdi markayı nasıl toparlayacağına karar vermelisin."
      ],
      stats: [["Pazardaki yeri", "ABD 2.si"], ["Lezzet anketi", "Sonuncu"], ["Son yıllarda kâr", "Yarıya yakın düştü"]],
      ask: "Brascina’yı nasıl toparlarsın?",
      opts: [
        { k: "A", t: "Fiyatla öne geç. Durgunlukta insanlar ucuz arıyor; iki pizzaya kalıcı indirim yap, reklam bütçesinin tamamını kampanyaya ver.", s: 20, tag: "kasa",
          r: "Siparişler kısa süre artar ama rakipler aynı indirimi ertesi hafta yapar. Marj daralır, lezzet sorunu yerinde durur." },
        { k: "B", t: "Yeni tarifi önce birkaç şehirde dene. Sonuç iyiyse yıl içinde ülkeye yay; şube sahiplerine zaman tanı, reklamda yalnızca “yeni tarif” de.", s: 50, tag: "kalkan",
          r: "Riski küçültürsün, şube sahipleri de rahat eder. Ama sessiz bir değişiklik, yıllardır pizzanı beğenmeyen müşteriyi geri kazanmaya yetmeyebilir." },
        { k: "C", t: "Yeni tarife bütün ülkede tek seferde geç. Reklamlarda müşterilerin “hamur karton gibi” eleştirilerini kendin göster, beğenmeyene parasını geri ver.", s: 85, tag: "kumar",
          r: "Kendi ürününü televizyonda kötülemek büyük risk; yeni pizza da beğenilmezse ikinci şansın olmaz. Tutarsa insanlar markana yeniden bakar." },
        { k: "D", t: "Lezzet tartışmasına girme, gücüne odaklan: menüyü sadeleştir, kârsız ürünleri kes, parayı teslimat hızına ve internetten siparişe yatır.", s: 40, tag: "cerrah",
          r: "Teslimatta zaten iyisin, internetten sipariş de büyüyor; maliyetler düşer. Ama pizzayı beğenmeyen müşteriyi hızlı teslimat geri getirmez." }
      ],
      real: {
        who: "Owen Marchbank",
        role: "Brascina’nın ABD başkanı, kısa süre sonra CEO’su",
        k: "C",
        text: [
          "Yıl bitmeden yeni pizza bütün ABD şubelerindeydi. Belgesel tarzı reklamlarda müşteriler eski hamurun “karton gibi”, sosun “ketçap gibi” olduğunu söylüyor, ardından şefler ve yöneticiler yeni tarifi anlatıyordu. Birkaç haftalık kampanyaya on milyonlarca dolar harcandı; çalışanlar yüz binlerce saat eğitim aldı, beğenmeyene para iadesi sözü verildi.",
          "Ertesi yılın ilk çeyreğinde ABD’deki mevcut şubelerin satışı yüzde onu aşkın arttı; şirket yükselişi yeni tarife ve açık sözlü kampanyaya bağladı.",
          "Hisse sonraki yedi yılda yaklaşık yirmi kat değer kazandı ve büyük teknoloji şirketlerinin hisselerini geride bıraktı. Aynı dönemin sonunda Brascina, dünya genelindeki satışlarda eski pazar liderini geçerek en büyük pizza zinciri oldu."
        ]
      }
    },
    {
      area: "Fiyatlama",
      place: ["ABD", " · 2010’ların başı"],
      company: "Sinevia",
      title: "İki iş, tek fiyat",
      body: [
        "Sinevia, Amerika’da yaklaşık 25 milyon üyesi olan bir film ve dizi kiralama şirketi. Standart pakette üyeler ayda yaklaşık 10 dolara internetten sınırsız izliyor, bir yandan da postayla DVD kiralıyor. Bu paketin fiyatı daha birkaç ay önce artırılmıştı.",
        "İnternetten izleme hızla büyüyor: yeni üyelerin dörtte üçe yakını 8 dolar civarındaki yalnız internet paketini seçiyor. Stüdyolar ve kanallarla yeni lisans anlaşmaları imzaladın; içerik harcaman yılın ikinci yarısında daha da artacak. DVD gönderimleri büyük olasılıkla zirveyi gördü, yine de disk kataloğun internettekinin beş katı.",
        "Bir e-ticaret devi ve televizyon kanallarının ortak sitesi de internetten film ve dizi sunuyor. Pakette DVD şu an aylık 2 dolar kadarlık bir ek gibi duruyor. Sinevia’nın CEO’su sensin ve fiyatı yeniden kurman gerekiyor."
      ],
      stats: [["ABD’deki üye", "~25 milyon"], ["Paket fiyatı", "~10 dolar"], ["Yalnız internet seçen", "Yeni üyelerin dörtte üçü kadarı"]],
      ask: "Fiyatı nasıl kurarsın?",
      opts: [
        { k: "A", t: "Paketi şimdi ikiye böl: internet ve DVD ayrı ayrı 8 dolar civarı, ikisini isteyen yaklaşık 16 dolar öder. Mevcut üyelere birkaç ay süre tanı, herkesi internete yönlendir.", s: 50, tag: "cerrah",
          r: "DVD’nin maliyetini artık internet üyeleri taşımaz, yön netleşir. Ama iki hizmeti birlikte kullanan milyonlarca üyenin faturası bir anda yaklaşık %60 artar." },
        { k: "B", t: "Paketi koru, fiyatı 12 dolar civarına çıkar. Mevcut üyeler bir yıl eski fiyattan devam etsin; zammı yeni filmler ve dizilerle birlikte duyur.", s: 75, tag: "kalkan",
          r: "Zam hoş karşılanmaz ama yumuşak geçer, sadık üyeni korursun. Gelir artar; DVD’nin yükü ise bir süre daha internet büyümesini yavaşlatır." },
        { k: "C", t: "Fiyata dokunma, üyeyi ürkütme. Yeni lisans anlaşması imzalama; içerik harcamasını bu yıl sabit tutup kârı koru.", s: 25, tag: "kasa",
          r: "Üyeler memnun, çeyrek kârlı görünür. Ama rakipler kataloglarını büyütürken sen yerinde sayarsın; internetteki kataloğun eskir." },
        { k: "D", t: "Hamle yap: internet paketini 6 dolar civarına indir, borç alıp içerik harcamasını ikiye katla. Pazarı rakiplerden önce kap.", s: 35, tag: "kumar",
          r: "Üye sayısı hızla artabilir ama gelir düşerken maliyet katlanır. Stüdyolar fiyat artırırsa borçla ayakta kalmaya çalışırsın." }
      ],
      real: {
        who: "Leon Prewitt",
        role: "Sinevia’nın CEO’su",
        k: "A",
        text: [
          "Prewitt o yaz paketi ikiye böldü: internet ve DVD ayrı ayrı 8 dolar civarı. İkisini birlikte kullananın faturası yaklaşık 10 dolardan 16 dolara, yüzde 60 kadar yükseldi; yeni üyeler için hemen, mevcut üyeler için birkaç ay sonra. Pek çok üye öfkelendi.",
          "Birkaç ay sonra Prewitt şirket adına özür diledi, DVD işini Diskvan adlı ayrı bir markaya taşıyacağını duyurdu. Birkaç hafta sonra Diskvan açılmadan iptal edildi, zam kaldı. Şirket ayrı fiyatlarda ısrar etti ama geçişin hızını yanlış ayarladığını kabul etti.",
          "Sonraki çeyrekte ABD’deki üye sayısı yüz binlerce azaldı. Hisse bir yıl içinde zam öncesindeki değerinin beşte birine yakın bir seviyeye düştü. Şirket internete yatırıma devam etti; hisse iki yıl kadar sonra yaklaşık dört katına çıkıp borsanın en çok kazandıran hisselerinden biri oldu."
        ]
      }
    },
    {
      area: "Portföy",
      place: ["ABD", " · 1980’lerin ortası"],
      company: "Brenmark",
      title: "Fiyat yarışındaki çipçi",
      body: [
        "Brenmark yaklaşık yirmi yıl önce kuruldu. İlk büyük başarısı bellek çipleriydi: ürünü pazara ilk süren, işi sıfırdan kuran oydu. Pek çok çalışan belleğe hâlâ duygusal olarak bağlı.",
        "Şimdi sermayesi güçlü Japon devleri daha ucuz ve daha iyi bellek üretiyor; verimleri belirgin biçimde yüksek. Dolar değer kazandı, fiyat kırma ve damping başladı. Geçen yılın sonunda talep de sert düştü: kapasite fazlası var, fiyatlar hızla geriliyor.",
        "Öte yandan bir zamanlar yan iş olan işlemciler kişisel bilgisayarlarda standart hâline geldi; yeni nesil 32 bitlik B32 yolda. Yönetim bir yıldır karar veremeden dolanıyor. Şirketin başkanı sensin. Kurucu ortak ve CEO Walter Enright’la odada yalnızsınız."
      ],
      stats: [["Kuruluş", "1960’ların sonu"], ["Bellek pazar payı", "Çok küçük"], ["B32’ye yatırılan", "Yüz milyon $ civarı"]],
      ask: "Hangi yola girersin?",
      opts: [
        { k: "A", t: "Bellekte kal ve rekabet et: yeni nesil çiplere rakiplerden fazla yatırım yap, fiyatta geri adım atma.", s: 20, tag: "kumar",
          r: "Kimliği korursun ama verimde bu kadar gerideyken her yeni nesil daha büyük zarar demek. Bellek yarışı, işlemcilere lazım olan parayı tüketir." },
        { k: "B", t: "Washington’a git: damping şikâyeti aç, koruma iste. Bu arada bir Japon ortakla üretim anlaşması yap, zaman kazan.", s: 40, tag: "kasa",
          r: "Koruma bir işe yarar: şirket başka bir bellek türünde damping şikâyetini kazandı ve pazar payını korudu. Ama maliyet farkı kapanmaz, karar yalnızca ertelenir." },
        { k: "C", t: "Kimseyi çıkarma. Herkes maaşından fedakârlık etsin, fabrikalar açık kalsın; pazar düzelince toparlanırız.", s: 30, tag: "kalkan",
          r: "Ekip ve güven korunur. Ama masraflar çok daha büyük bir şirkete göre kurulu, ciro ise neredeyse yarıya iniyor; fedakârlık bu farkı kapatmaz." },
        { k: "D", t: "Bellek yarışından çekil. Fabrikaları kapat, kadroyu küçült; parayı ve en iyi ekipleri işlemcilere ver.", s: 92, tag: "cerrah",
          r: "Şirketin doğduğu işi bırakırsın, binlerce kişi gider. Ama kalan her kuruş, standardını senin belirlediğin pazara akar." }
      ],
      real: {
        who: "Paul Dressler ve Walter Enright",
        role: "Brenmark’ın başkanı ve CEO’su",
        k: "D",
        text: [
          "Yıl ortasında Dressler ile Enright bellek işinden çıkma kararını kendileri verdi. Birkaç ay sonra karar çalışanlara duyuruldu; hemen ardından B32 tanıtıldı.",
          "İki yıl içinde çok sayıda eski fabrika kapandı, kadro yaklaşık üçte bir küçüldü. Şirket ertesi yıl ağır zarar etti; bu, tarihinin en zor dönemlerinden biriydi. Üç bellek işinden ikisini bıraktı, programlanabilir bellek çiplerinde kaldı.",
          "İşlemciler şirketin ana işi oldu. Önceki kuşakta üretim lisansı dağıtıp kendi rakiplerini yaratmışlardı; Dressler’in yeni ilkesi, tek üretici olunabilecek yerlere gitmekti. Şirket kişisel bilgisayar işlemcilerinin hâkimi oldu; yıllar sonra bilgisayarların büyük çoğunluğunda onun çipi vardı. Bellekten çıkış, sonradan şirket tarihinin en iyi kararlarından biri sayıldı."
        ]
      }
    }
  ];

  var S003 = [
    {
      area: "Finansman",
      place: ["ABD", " · 2000’lerin ortası"],
      company: "Fennick",
      title: "Kahramanları başkası için çalışıyor",
      body: [
        "Fennick köklü bir çizgi roman şirketi. Yaklaşık on yıl önce iflas başvurusu yaptı, iki yıl süren bir yeniden yapılanmadan sonra toparlanabildi. Bugün parasını karakterlerini film stüdyolarına lisanslayarak kazanıyor.",
        "Bu lisanslar kırıntı getiriyor. En ünlü kahramanının iki filmi gişe, DVD ve televizyonla milyarlarca dolar kazandı; Fennick’e düşen bunun çok küçük bir kısmı oldu. En bilinen karakterlerin çoğu zaten başka stüdyoların elinde.",
        "Stüdyolar hasılatın genellikle küçük bir yüzdesini veriyor. Yönetim kurulu temkinli ve tek bir şartı var: şirket kendi kasasından tek kuruş koymayacak. Fennick’in yeni CEO’su sensin."
      ],
      stats: [["İki filmin getirisi", "Milyarlarca $"], ["Fennick’e düşen", "Çok küçük bir pay"], ["Stüdyoların verdiği pay", "Küçük bir yüzde"]],
      ask: "Karakterlerini nasıl paraya çevirirsin?",
      opts: [
        { k: "A", t: "İkinci planda kalmış bir düzine kadar karakterin film haklarını teminat ver, yarım milyar dolarlık kredi bul, filmleri kendin yap.", s: 90, tag: "kumar",
          r: "Kasadan para çıkmaz ama ilk filmler tutmazsa karakterler alacaklılara geçer. Üstelik en ünlü kahramanların bu pakette yok." },
        { k: "B", t: "Lisansa devam et ama pazarlığı sertleştir: hasılattan daha büyük pay, ürün gelirinde söz hakkı, senaryoda onay.", s: 40, tag: "kasa",
          r: "Risksiz ve hemen para getirir. Ama ünlü karakterlerin zaten stüdyolardayken pazarlık gücün sınırlı; bu payın üstüne çıkmak zor." },
        { k: "C", t: "Filme hiç girme. İflastan yeni çıkan şirketi yeniden riske atma; dergileri ve oyuncak işini büyüt, ekibi koru.", s: 30, tag: "kalkan",
          r: "Şirket güvende kalır, ekip dağılmaz. Ama karakterlerinin değeri yine başkalarının filmlerinde, başkalarının kasasında büyür." },
        { k: "D", t: "Kütüphaneyi büyük bir stüdyoya satmak için görüşmelere başla. Değer yüksekken parayı al, riski alıcı taşısın.", s: 15, tag: "cerrah",
          r: "Hızlı ve temiz bir çıkış. Ama karakterler kendi filmini hiç denemeden el değiştirir; birkaç yıl sonra şirketin tamamı milyarlarca dolara satıldı." }
      ],
      real: {
        who: "Victor Oakes",
        role: "Fennick CEO’su",
        k: "A",
        text: [
          "Planı, film biriminin başkanı ve operasyon sorumlusu olarak işe alınan Nathan Ashby hazırladı. Oakes ve yönetim kurulu, şirket tek kuruş koymayacaksa denemesine izin verdi. Son anda banka bütçelerin üçte birini Fennick’in koymasını istedi; şirket beş yabancı pazarın haklarını önceden satarak bu açığı kapattı.",
          "O yıl yarım milyar dolar civarında bir kredi tamamlandı. Kredi rücusuzdu, yani şirketin geri kalanına dokunulamazdı; teminat bir düzine kadar karakterin sinema haklarıydı. Her biri belli bir bütçe sınırı içinde, sınırlı sayıda film çekilebilecekti. İlk filmler tutmazsa kalan karakterlerin hakları alacaklılara geçecekti.",
          "Zırhlı mucit Halvard’ın hakları ertesi yıl başka bir stüdyodan geri dönünce ilk film için o seçildi. Birkaç yıl sonra vizyona giren film dünyada yarım milyar doları aşkın hasılat yaptı. Ertesi yıl dünyanın en büyük eğlence şirketlerinden biri Fennick’i milyarlarca dolara satın almak için anlaştı."
        ]
      }
    },
    {
      area: "Marka",
      place: ["Birleşik Krallık", " · 2000’lerin ortası"],
      company: "Quillford",
      title: "Ekose her yerde",
      body: [
        "Quillford yaklaşık yüz elli yıllık bir İngiliz dış giyim markası. Ününü sağlam kumaşına ve kuşaklardır ürettiği trençkota borçlu; astarındaki ekose dünyanın en tanınan desenlerinden biri.",
        "Son yıllarda bu desen her şeye basıldı. Dünya çapında yaklaşık iki düzine lisans ortağı ekoseyi kendi bildiği gibi kullanıyor: şemsiye, eşarp, şapka, çanta, hatta anahtarlık. Her ülkede başka bir koleksiyon, başka bir fiyat var. Pazar tezgâhları taklitlerle dolu; desen o kadar yaygın ki gerçeğini taklidinden ayırmak zor.",
        "Lisanslar zahmetsiz para getiriyor, rakamlar da hâlâ fena değil. Ama lüks müşteriler sessizce uzaklaşıyor; marka pahalı mağazalarda değil, pazar tezgâhlarında öne çıkıyor ve ucuz görünmeye başladı. Yönetim kurulu dışarıdan yeni bir CEO getirdi. O kişi sensin."
      ],
      stats: [["Lisans ortağı", "~iki düzine"], ["Yıllık gelir", "1 milyar sterlinin altında"], ["Taklit", "Her pazarda"]],
      ask: "Quillford’u nereye götürürsün?",
      opts: [
        { k: "A", t: "Lisansları genişlet: yeni ülkelere, yeni ürün gruplarına aç. Desen zaten herkesçe tanınıyor; yatırım yapmadan nakit topla, kasayı güçlendir.", s: 10, tag: "kasa",
          r: "Kasaya zahmetsiz para girer. Ama her yeni lisans deseni biraz daha sıradanlaştırır; taklitçinin işi kolaylaşır, uzaklaşan lüks müşteri ise hiç dönmez." },
        { k: "B", t: "Ekoseyi tamamen bırak. Yeni bir logo, yeni bir desen, yepyeni bir kimlik tasarla; taklitçiler eski deseni kopyalamaya devam etsin.", s: 30, tag: "kumar",
          r: "Taklit derdi bir anda biter. Ama yüz elli yılda kurulan tanınırlığı da bırakırsın; yeni bir kimliği tanıtmak yıllar ve büyük bütçe ister. Sorun desenin kendisinde değil, nasıl kullanıldığındaydı." },
        { k: "C", t: "Lisansları tek tek geri al, ekoseyi az sayıda ürüne indir, bütün ülkelerdeki tasarımı tek bir kreatif direktöre bağla.", s: 92, tag: "cerrah",
          r: "Pahalı ve yavaş: kolay lisans gelirinden vazgeçersin, bazı ortaklıkları geri almak yüklü ödeme ister, bazı ürün grupları kapanır. Ama marka ilk kez her ülkede aynı sesle konuşur ve ekose yeniden seçkin görünür." },
        { k: "D", t: "Kimseyi küstürme: lisans ortaklarıyla çalışmayı sürdür, fiyatları düşür, ekoseyi seven geniş kitleye daha çok mağazada sat.", s: 20, tag: "kalkan",
          r: "Ortaklar ve mevcut müşteriler memnun kalır, satış adedi bir süre artar. Ama ucuzlayan bir lüks marka kolay kolay yeniden pahalanamaz; marjlar daralır, gerçeğiyle taklidi arasındaki fark iyice kapanır." }
      ],
      real: {
        who: "Lydia Hensby",
        role: "Quillford CEO’su",
        k: "C",
        text: [
          "Hensby ilk iş olarak ekoseyi ürünlerin yüzde onundan azına indirdi; desen artık her yerde değil, seçili parçalarda ve astarda duruyordu. Ardından lisansları birer birer geri almaya başladı. Gelirin beşte biri kadarını getiren bir Avrupa ülkesine özel koleksiyonu da kapattı; o ülkenin tasarımı da merkeze bağlandı. Kolay lisans parası azaldı, geri alımların bedeli de yüklüydü.",
          "Trençkotu markanın merkezine koydu ve dünyanın her yerindeki bütün tasarımı şirketin kreatif direktörüne bağladı; her ülkede aynı koleksiyon, aynı tasarım dili vardı. Dijitale rakiplerinden önce girdi: siteyi baştan kurdu, müşterilerin trençkotlarıyla fotoğraf paylaştığı ayrı bir site açtı, defileleri internetten canlı yayınladı.",
          "Gelir beş-altı yıl içinde iki katını aştı. Quillford pahalı mağazaların vitrinlerine geri döndü, yeni lüks pazarlarda da hızla büyüdü; vaka, lisanslarla dağılan bir markayı toparlamanın en çok anlatılan örneklerinden biri sayılıyor."
        ]
      }
    },
    {
      area: "Satın alma",
      place: ["ABD", " · 2000’lerin sonu"],
      company: "Kestrin",
      title: "Kapıdaki dev teklif",
      body: [
        "Kestrin internetin en tanınan adlarından biri. Ama çevrim içi reklam parasının büyük kısmı arama liderine akıyor; üç yıl önce senden küçük olan bu rakip artık pazara hükmediyor.",
        "Son çeyrekte kâr beşte bir kadar düştü. Yaklaşık bin çalışanı, kadronun küçük bir bölümünü çıkarmaya hazırlanıyorsun; hisse dört yılı aşkın sürenin en düşük seviyesinde. Şirketin kurucu ortaklarından birisin ve yedi aydır CEO’sun.",
        "Yazılım devi Vantrell bu ay teklifini açıkladı: hisse başı 30 dolar civarı, yarısı nakit yarısı hisse, toplam kırk milyar doları aşkın. Bu, bir önceki kapanışın yüzde altmış kadar üstü. Ama hissen iki yıl önce 40 doları aşmıştı ve bir yıl önce gelen birleşme önerisini zaten geri çevirmiştin."
      ],
      stats: [["Teklif", "Hisse başı ~30 $"], ["Prim", "~%60"], ["Çeyreklik kâr", "Beşte bir düşüş"]],
      ask: "Kestrin’in başındasın. Teklife cevabın ne?",
      opts: [
        { k: "A", t: "Kabul et. Yüzde altmış kadar prim, dört yılın dibindeki hisse için güçlü; ortaklar kazancı bugün cebine koyar.", s: 75, tag: "kasa",
          r: "Bağımsızlık biter ve bedelin yarısı alıcının hissesine bağlı kalır. Yine de ortaklar için güçlü bir çıkıştı: aynı yılın sonunda hisse teklifin üçte birinin altındaydı." },
        { k: "B", t: "Masada kal: rakamın düşük olduğunu söyle, birkaç dolar daha iste ve anlaşmayı hızla bitir.", s: 85, tag: "cerrah",
          r: "Hem değeri zorlarsın hem anlaşmayı kaçırmazsın. Alıcının fiyatı biraz yükseltmeye hazır olduğu sonradan ortaya çıktı; kilit nokta farkı makul tutmaktı." },
        { k: "C", t: "Zaman kazan: başka alıcıları masaya çağır, arama lideriyle bir ortaklık seçeneğini de konuş.", s: 45, tag: "kalkan",
          r: "Rakip bir teklif fiyatı yükseltebilir, gelmezse yalnızca zaman kaybedersin. Arama lideriyle ortaklık ise alıcıyı ürkütür ve rekabet soruları doğurur." },
        { k: "D", t: "Reddet: teklif şirketin değerinin çok altında. Bağımsız kal, kendi dönüşüm planını uygula.", s: 35, tag: "kumar",
          r: "Kurucunun gözünden anlaşılır: hisse iki yıl önce 40 doları aşmıştı. Ama dönüşümün sonuç vermesi yıllar alacaktı ve ne piyasa ne de alıcı o kadar sabırlıydı." }
      ],
      real: {
        who: "Adrian Voss",
        role: "Kestrin’in kurucu ortağı ve CEO’su",
        k: "D",
        text: [
          "Voss ve yönetim kurulu teklifi hızla geri çevirdi; onlara göre rakam şirketin değerini yansıtmıyordu. Pazarlık aylarca sürdü. Vantrell teklifi birkaç milyar dolar artırmaya hazırdı; Voss ve diğer kurucu ortak bundan da yüksek bir fiyat istedi.",
          "Birkaç ay sonra Vantrell teklifini geri çekti. Ertesi işlem gününde Kestrin hissesi sert düştü. Kestrin, reklam alanının bir kısmını arama liderine bırakan bir anlaşmaya yöneldi; yıl bitmeden arama lideri bu anlaşmadan çekildi.",
          "Yıl sonuna doğru hisse teklifin üçte birinin altındaydı. Vantrell anlaşmasını kapatamadığı için sert eleştirilen Voss, bir yılı aşkın süre sonra CEO’luğu bırakacağını açıkladı."
        ]
      }
    },
    {
      area: "Dönüşüm",
      place: ["Japonya", " · 2000’lerin başı"],
      company: "Hoshimura",
      title: "Pazarı daralan film devi",
      body: [
        "Hoshimura yetmiş yıllık bir Japon film devi. Renkli film, fotoğraf kâğıdı, baskı ürünleri. Birkaç yıl önce satışların yarısından fazlası, kârın yaklaşık üçte ikisi fotoğraf ürünlerinden geldi. Onlarca yıl tek bir hedef vardı: Amerikalı dev Wexley’i geçmek.",
        "Sonra dijital fotoğraf makinesi geldi. Dünyada renkli film talebi geriliyor, pazar her yıl biraz daha küçülüyor. Hoshimura da dijital makine satıyor ama pazar kalabalık, rekabet sert. Fabrikalar, fotoğraf laboratuvarları ve dünyaya yayılmış satış ağı hâlâ filme göre kurulu.",
        "Elinde matbaa ve ofis malzemeleri gibi yan işler, üç yıl önce çoğunluk hissesi alınan bir fotokopi ortaklığı ve filmden kalma güçlü bir kimya ve kaplama birikimi var. Şirkete kırk yıl önce girdin; dört yıldır başkansın, geçen yıl CEO oldun. Yönetim kurulu senden bir plan bekliyor."
      ],
      stats: [["Kuruluş", "1930’lar"], ["Fotoğrafın satış payı", "Yarıdan fazla"], ["Fotoğrafın kâr payı", "~üçte iki"]],
      ask: "Hoshimura’yı nereye götürürsün?",
      opts: [
        { k: "A", t: "Bütün gücü dijitale ver. Filmden gelen parayla dijital fotoğraf makinesi ve baskı hizmetlerinde dünya lideri ol; fotoğraf işi bitmesin, biçim değiştirsin.", s: 35, tag: "kumar",
          r: "Dijital makine pazarı hızla kalabalıklaştı, büyüme yavaşladı, fiyatlar düştü. Filmin kârını tek başına yerine koyması zordu." },
        { k: "B", t: "Filmi sonuna kadar sağ. Yeni yatırımı durdur, maliyetleri kıs, nakdi temettüyle hissedarlara dağıt; talep düşse de film daha yıllarca para getirir.", s: 20, tag: "kasa",
          r: "Bu çeyreği, belki birkaç yılı idare eder. Ama şirketi her yıl küçülen tek bir işe bağlar; talep azaldıkça nakit de azalır." },
        { k: "C", t: "Film tarafını küçült, binlerce kişilik kadroyu ve kapasiteyi kes. Film kimyasını ekran malzemelerine, kozmetiğe ve yarı iletkene taşı; eksikleri satın al.", s: 90, tag: "cerrah",
          r: "Pahalı ve zorlu: binlerce kişi gider, yüz milyarı aşkın yen harcanır. Ama şirketin asıl varlığının film değil, filmin arkasındaki kimya olduğunu gören yol bu." },
        { k: "D", t: "Kimseyi kapı dışarı etme. Fabrikaları ve çalışanları yeni işlere adım adım kaydır, dönüşümü on yıla yay; çalışanların güveni bozulmasın.", s: 45, tag: "kalkan",
          r: "İnsana saygılı, güveni korur. Ama film talebi senin takvimini beklemiyor; her geciken yıl zararı büyütür." }
      ],
      real: {
        who: "Masao Hirota",
        role: "Hoshimura CEO’su",
        k: "C",
        text: [
          "Hirota’nın CEO olarak ilk işi, şirketin hedefini Wexley’i yenmekten filmsiz bir geleceğe hazırlanmaya çevirmek oldu. Göreve gelince kuruluş yıl dönümünü hedefleyen orta vadeli bir plan hazırladı: yeni büyüme alanları, yönetimin her kademesinde yapısal reform, grup yönetiminin güçlendirilmesi.",
          "Dijital geçiş beklenenden hızlı gelince asıl yeniden yapılanma birkaç yıl içinde geldi: fotoğraf bölümünde binlerce kişilik kesinti, fabrika ve laboratuvarların birleştirilmesi, dijital makine üretiminin Çin’e kayması. Maliyet iki mali yılda yüz milyarlarca yen; ayrılanlara cömert tazminat ödendi.",
          "Film kimyası LCD ekran malzemelerine, kozmetiğe ve yarı iletkene taşındı. Kısa süre sonra kolajen bilgisine dayanan bir cilt bakımı serisi çıktı, ardından bu alanlarda birkaç şirket satın alındı. Dönüşüm on yıldan uzun sürdü; Wexley ise birkaç yıl sonra iflas koruması için başvurdu."
        ]
      }
    }
  ];

  var S004 = [
    {
      area: "Pazarlama",
      place: ["Birleşik Krallık", " · 1990’ların başı"],
      company: "Yarrowmont · Ulmcroft",
      title: "Süpürge alana iki bilet",
      body: [
        "Yarrowmont, ABD’nin köklü ev aletleri üreticilerinden biri. Birleşik Krallık’taki birimi Ulmcroft tanınmış bir süpürge ve çamaşır makinesi markası, ama ekonomi durgun ve depolar dolu. Ulmcroft yönetimi bir kampanya başlattı: yaklaşık 100 sterlin ve üstü alışveriş yapana Avrupa’ya iki kişilik ücretsiz gidiş-dönüş uçak bileti. Hesaba göre koşullar sıkı olduğu için çoğu müşteri başvuruyu tamamlamayacak, bilet işini yürüten seyahat ortağı da otel ve araç kiralama komisyonlarıyla maliyeti dengeleyecekti.",
        "Kısa süre sonra kampanyaya ABD uçuşları da eklendi ve talep tahminin çok üstüne fırladı. İnsanlar yalnızca bilet için en ucuz süpürgeyi aldı; gazetelerin ikinci el ilanları kutusu açılmamış süpürgelerle doldu. Fabrika vardiya ekledi. Seyahat ortağı başvurulara yetişemedi; işlemler yavaşlatılınca müşteriler kızdı, basın konuyu her gün manşete taşıdı.",
        "Maliyet tahmini her hafta büyüyor; şimdiden kampanyanın getirdiği satışı aştı. Ulmcroft’un yöneticileri ABD’deki genel merkezden karar bekliyor. Yarrowmont’un CEO’su sensin."
      ],
      stats: [["Kampanya eşiği", "~100 £ ve üstü alışveriş"], ["Hediye", "İki kişilik uçak bileti"], ["Maliyet tahmini", "Satışın üstünde, artıyor"]],
      ask: "Söz verilen biletler için ne yaparsın?",
      opts: [
        { k: "A", t: "Bilet bekleyenlere uçuş yerine değeri yüksek bir indirim çeki öner; çoğunun kabul edeceğine bahse gir: kabul edenler kuyruktan çıksın, maliyet de bir anda düşsün.", s: 30, tag: "kumar",
          r: "Bazı müşteriler kabul eder. Ama çoğu süpürgeyi zaten bilet için aldı; çeki sözden dönmek olarak okur ve basındaki konu büyümeye devam eder." },
        { k: "B", t: "Geçerli her başvuruyu karşıla, maliyeti ana şirket üstlensin; başvuruları hızlandırmak için ek ekip kur.", s: 55, tag: "kalkan",
          r: "Doğru niyet ve çok pahalı bir söz: ödeyeceğin bedel kampanyanın getirdiği satışın üstünde. Ama başvuruları gerçekten işleyemezsen müşteri sözü değil gecikmeyi hatırlar." },
        { k: "C", t: "Küçük yazılardaki koşulları harfiyen uygula: tarih, havalimanı ve süre şartlarına tam uymayan başvuruları reddet, maliyeti makul düzeyde tut.", s: 15, tag: "kasa",
          r: "Kâğıt üzerinde haklısın. Ama süpürgeyi bilet için alan yüz binlerce müşteri bunu bir kandırmaca olarak görür; biletlerden kazandığını marka itibarında fazlasıyla kaybedersin." },
        { k: "D", t: "Ulmcroft’u hemen sat; Avrupa’dan çekil, yönetimin dikkatini ve parayı ABD’deki ana işe ver.", s: 25, tag: "cerrah",
          r: "Ne kadar büyüyeceği belli olmayan bir bilet borcunu kimse indirimsiz üstlenmez; en kötü anda, en düşük fiyata satarsın. Üstelik sözü veren hâlâ senin şirketin." }
      ],
      real: {
        who: "Stuart Lockridge",
        role: "Yarrowmont CEO’su",
        k: "B",
        text: [
          "Lockridge geri adım atmadı. Geçerli her başvurunun karşılanacağını açıkladı ve maliyeti ana şirketin üstleneceğini söyledi. Ulmcroft’un başkanı ve kampanyadan sorumlu iki üst düzey pazarlama yöneticisi görevden alındı; başvuruları işlemek için ek ekip kuruldu, havayollarından toplu koltuk alındı.",
          "Sonraki yıllarda iki yüz bini aşkın kişi bu kampanyayla uçtu; maliyet yaklaşık 50 milyon sterline ulaşarak kampanyanın getirdiği satışı çok aştı. Söz verildi ama uygulama geride kaldı: en az bu kadar başvuru sahibi biletini hiç alamadı, müşterilerle anlaşmazlık 1990’ların sonuna kadar sürdü.",
          "Marka Birleşik Krallık’ta ciddi itibar kaybı yaşadı, pazar payı belirgin biçimde geriledi. Birkaç yıl sonra Yarrowmont, Avrupa’daki ev aletleri işini Avrupalı bir rakibe kayıpla sattı. Vaka bugün pazarlama derslerinde, hesabı eksik yapılmış bir promosyonun ve eksik tutulan bir sözün ne kadar pahalıya mal olabileceğinin örneği olarak anlatılıyor."
        ]
      }
    },
    {
      area: "Finansman",
      place: ["ABD", " · 2000’lerin ortası"],
      company: "Brayton Motors",
      title: "Logoyu bile rehin ver",
      body: [
        "Brayton, yüz yılı aşkın geçmişi olan bir Amerikan otomobil devi; kurucu ailenin hâlâ sözü geçiyor. Kârının büyük kısmı büyük ve çok yakıt tüketen araçlardan geliyor. Pazar payı yıllardır geriliyor ve bu yılın şirket tarihindeki en büyük zararla kapanması bekleniyor.",
        "Birkaç ay önce dışarıdan yeni bir CEO geldi. Yeniden yapılanma planı fabrika kapatmak, on binlerce kişilik kadroyu küçültmek ve yeni modeller geliştirmek için yıllarca milyarlarca dolar gerektirecek. Kredi şu an ucuz ve bol; ama Brayton’un notu zaten yatırım derecesinin altında ve bu pencere kapanabilir.",
        "Bankalar büyük bir kredi vermeye hazır; karşılığında neredeyse her şeyi teminat istiyorlar: fabrikaları, finans şirketini, markaları, hatta logoyu. Brayton’un finans direktörüsün; planı yönetim kuruluna sen sunacaksın."
      ],
      stats: [["Hedeflenen kredi", "On milyarlarca $"], ["Teminat", "Neredeyse her şey"], ["Kredi notu", "Yatırım derecesinin altında"]],
      ask: "Brayton’un finans direktörüsün. Ne önerirsin?",
      opts: [
        { k: "A", t: "Kredi ucuzken alabildiğin en büyük krediyi şimdi al; karşılığında fabrikaları, finans şirketindeki payı, markaları ve logoyu rehin ver.", s: 90, tag: "kumar",
          r: "Şirketin neredeyse tamamını ipotek etmek demek; işler kötü giderse elinde bir şey kalmaz. Ama kimseden yardım istemeden yıllarca dayanacak nakdi şimdiden kasaya koyarsın." },
        { k: "B", t: "Nakit bitmeden mahkeme korumasına başvur; borçları ve sözleşmeleri baştan yapılandır.", s: 30, tag: "cerrah",
          r: "Kâğıt üzerinde temiz bir başlangıç. Ama alıcılar garantinin ve yedek parçanın akıbetinden korkar, satışlar sert düşer ve şirketin kontrolü mahkemeye geçer." },
        { k: "C", t: "Önce lüks markaları sat; elde edilen parayla yeniden yapılanmayı finanse et, ana şirketi rehin verme.", s: 45, tag: "kalkan",
          r: "Bu markalar sonunda zaten satıldı. Ama hepsini birden ve hızla satmak zor; gelecek para da yıllarca sürecek yeniden yapılanmayı karşılamaya yetmez." },
        { k: "D", t: "Bekle: önce maliyetleri kes, sonuçlar düzelince daha ucuza borçlan.", s: 20, tag: "kasa",
          r: "Bir yıl sonra kredi piyasaları kapandı. Bekleyenler için geriye tek kapı kaldı: devletin kapısı." }
      ],
      real: {
        who: "Glen Hadley",
        role: "Brayton’un finans direktörü",
        k: "A",
        text: [
          "Plan, yeni CEO gelmeden önce hazine ekibinde başlamıştı. Yıl sonuna doğru on milyarlarca dolarlık finansman duyuruldu; yeni CEO planı yüzlerce bankacıya kendisi anlattı. Finansman birkaç hafta içinde, teminatlı kredi ve dönüştürülebilir tahvilin birleşimiyle kapandı.",
          "Teminat olarak ABD’deki ana fabrikalar, logo dahil fikri mülkiyet, finans şirketindeki ve İsveçli lüks markadaki paylar verildi. O yıl on milyarlarca dolarlık rekor zararla kapandı. Lüks markalar sonraki birkaç yılda satıldı.",
          "Kriz yılında iki büyük rakip devlet yardımı aldı ve mahkeme korumasına girdi; Brayton ikisine de ihtiyaç duymadı. Ertesi yılı milyarlarca dolar kârla kapattı. Birkaç yıl sonra notu yeniden yatırım derecesine çıktı; teminatlar ve logo serbest bırakıldı."
        ]
      }
    },
    {
      area: "Rekabet",
      place: ["İsviçre", " · 1980’lerin başı"],
      company: "Daubrin · Eldermatt",
      title: "Zamanı kaçıran saatçiler",
      body: [
        "İsviçre yüzyıllardır dünyanın saatçisi. Yakın zamana kadar dünyada satılan saatlerin yaklaşık yarısı buradan çıkıyordu; vadilere yayılmış yüzlerce atölye ve fabrika, ince işçilikli mekanik saatleriyle tanınıyor.",
        "Sonra Asya’dan pilli kuvars saatler geldi: daha doğru, çok daha ucuz. İşin tuhafı, ilk kuvars kol saati prototiplerinden bazıları İsviçre’de yapılmıştı; ama sanayi mekanik saate güvenmeyi sürdürdü. Japon ve Hong Konglu üreticiler on yıl içinde kitle pazarını aldı. Ülkenin en büyük iki saat grubu Daubrin ve Eldermatt yıllardır para kaybediyor, borçlarını çeviremiyor; oysa ikisinin çatısı altında da dünyaca tanınan lüks markalar var.",
        "Alacaklı bankalar iki grubun geleceği için dışarıdan bir danışman tuttu. Masada bir Japon saat devinin ünlü markaları satın alma teklifi de duruyor. Bankalar birkaç ay içinde net bir öneri bekliyor. O danışman sensin."
      ],
      stats: [["Dünya pazar payı", "~yarıdan ~%15’e"], ["Sektördeki çalışan", "~üçte bire indi"], ["En büyük iki grup", "Ağır borçlu"]],
      ask: "Bankalara ne önerirsin?",
      opts: [
        { k: "A", t: "Japon devin teklifini kabul et: ünlü markaları sat, borçları kapat, kalan fabrikaları küçült.", s: 20, tag: "kasa",
          r: "Bankalar paralarını alır, bilanço hızla temizlenir. Ama ülkenin en değerli markaları yabancı bir rakibin portföyüne geçer; elde kalan küçük fabrikalar da sipariş bulmakta zorlanır." },
        { k: "B", t: "Kitle pazarını tamamen bırak; yalnızca pahalı mekanik saatlere çekil, fabrikaların çoğunu kapat, iki grubu lüks markalar etrafında küçült.", s: 45, tag: "cerrah",
          r: "Lüks markalar kârlı ve korunur. Ama ucuz ve orta segmenti Asya’ya bırakınca parça üreticileri ölçeğini kaybeder, yetişmiş ustalar ve mühendisler sektörden ayrılır; zamanla lüks üretim de pahalanır ve daralır." },
        { k: "C", t: "Bankalardan süre iste; iki grubu ayrı ayrı ayakta tut, ustaları ve fabrikaları koru, kuvars saate yavaş yavaş geç.", s: 25, tag: "kalkan",
          r: "Ustalar ve fabrikalar bir süre daha yerinde kalır. Ama iki grup ayrı ayrı para kaybetmeye devam eder; Asya’yla fiyat farkı her ay açılırken yavaş geçiş zaman kaybettirir ve bankaların sabrı da sınırlı." },
        { k: "D", t: "İki grubu birleştir, lüks markaları koru ve kitle pazarına İsviçre’de üretilecek yeni, çok ucuz bir saatle geri dön.", s: 90, tag: "kumar",
          r: "Büyük bir bahis: para kaybeden iki grubu birleştirip ucuz saatte Asya’yla, üstelik İsviçre maliyetiyle yarışıyorsun. Ama parça sayısını ve montajı kökten değiştirirsen maliyet farkı kapanır; saat de zaman ölçen bir alet olmaktan çıkıp renkli, sezonluk bir moda ürününe dönüşür." }
      ],
      real: {
        who: "Anselm Imhasly",
        role: "Bankaların tuttuğu danışman; sonra birleşik grubun başı",
        k: "D",
        text: [
          "Imhasly’nin raporu iki kolay yolu da reddetti: markaları satmak da kitle pazarını bırakmak da İsviçre saatçiliğinin üretim tabanını kaybettirecekti. Rapor bunun yerine kitle pazarına İsviçre’de üretilecek yeni, ucuz bir saatle dönülmesini önerdi. Bankalar ikna oldu; Daubrin ve Eldermatt tek bir grupta birleşti, yönetim sadeleşti, fazla fabrikalar kapandı.",
          "Gruplardan birinin mühendisleri o sırada tam böyle bir saat geliştiriyordu: geleneksel saatlerden çok daha az parçalı, plastik kasalı ve tamamen otomatik hatlarda birleştirilen bir kuvars saat. Imhasly bu saati stratejinin merkezine koydu. Zabbo adıyla çıkan saat ucuzdu ama İsviçre’de üretiliyordu; renkli, sezonluk koleksiyonlarla bir moda aksesuarı gibi pazarlandı ve pek çok kişi birden fazla Zabbo almaya başladı. Imhasly birkaç yıl sonra bir yatırımcı grubuyla birlikte birleşik grubun çoğunluk hissesini aldı ve başına geçti.",
          "1990’ların başında toplam Zabbo satışları yüz milyon adedi aştı. Lüks markalar da yeniden büyüdü; birleşik grup dünyanın en büyük saat şirketlerinden biri oldu ve İsviçre, kaybettiği kitle pazarında yeniden söz sahibi oldu."
        ]
      }
    },
    {
      area: "Liderlik",
      place: ["Japonya", " · 2010’ların ortası"],
      company: "Kagemori",
      title: "Kimseyi kovmadan",
      body: [
        "Kagemori, yüz yılı aşkın geçmişi olan bir Japon oyun şirketi. Hem konsollarını hem oyunlarını kendisi yapıyor; dünyaca ünlü karakterleri yalnızca kendi cihazlarında oynanabiliyor.",
        "Yeni ev konsolu tutmadı. Yılın ilk ayında şirket yıllık tahminlerini sert biçimde aşağı çekti: satış beklentisi üçte bir kadar düştü, konsol satış hedefi ise başlangıçtakinin üçte birinin altına indi. Yüz milyar yen civarında faaliyet kârı beklenirken artık faaliyet zararı öngörülüyor; bu üst üste üçüncü faaliyet zararı olacak. Temettü yarıdan fazla düşüyor.",
        "Yatırımcılar ve analistler istifadan, akıllı telefonlara geçmekten, işten çıkarmalardan söz ediyor. Kagemori’nin başkanısın; ay sonundaki sonuç toplantısında ne yapacağını açıklayacaksın."
      ],
      stats: [["Satış tahmini", "Üçte bir kadar düşüş"], ["Faaliyet sonucu", "Kârdan zarara"], ["Konsol hedefi", "Üçte birin altına"]],
      ask: "Kagemori’nin başkanısın. Bu başarısızlığın hesabını nasıl verirsin?",
      opts: [
        { k: "A", t: "Şirketi yeniden yapılandır: maliyetleri kes, kadroyu küçült, yatırımcılara kararlılık göster.", s: 25, tag: "cerrah",
          r: "Yatırımcılar alkışlayabilir. Ama şirketin asıl sermayesi oyun ekipleri; korkmuş bir ekip bir sonraki büyük oyunu yapamaz." },
        { k: "B", t: "Ünlü karakterleri hemen akıllı telefonlara taşı; yeni gelir kapısını bugünden aç.", s: 40, tag: "kumar",
          r: "Hızlı gelir getirebilir. Ama donanımla yazılımı birlikte yapan modelden vazgeçmek ve bir sonraki konsolun değerini baştan düşürmek demek." },
        { k: "C", t: "Konsolun fiyatını sert indir, eldeki stoku bitir, platformdan erkenden çık.", s: 20, tag: "kasa",
          r: "Zarar derinleşir; konsolu yeni almış oyuncular ve oyun yapan şirketler yüzüstü bırakıldığını hisseder. Bir sonraki konsol şüpheyle doğar." },
        { k: "D", t: "Kimseyi çıkarma. Kendi maaşını yarıya indir, öteki yöneticilerinkini de kes, hisse geri al; şirketin modelini koru.", s: 85, tag: "kalkan",
          r: "Sembolik bir adım; zararı kapatmaz. Ama sorumluluğu en tepeden üstlenir ve oyunları yapan ekibi korur." }
      ],
      real: {
        who: "Haruki Ueshiro",
        role: "Kagemori’nin başkanı",
        k: "D",
        text: [
          "Ay sonunda yönetim kurulu birkaç aylığına maaşları kesti: Ueshiro’nunki yaklaşık yarıya indi, öteki üst yöneticilerinki de belirgin biçimde azaldı. Yaklaşık yüz milyar yenlik hisse geri alımı açıklandı. Ueshiro istifa etmedi; kesinti, sorumluluğu en tepeden üstlenmenin sembolik bir yolu olarak görüldü.",
          "Şirket işten çıkarma yapmama çizgisini önceki yıllarda da korumuştu; birkaç yıl önce el konsolunun zayıf başlangıcından sonra da başkanın maaşı yarıya inmişti.",
          "O mali yıl on milyarlarca yen faaliyet zararıyla kapandı; ertesi yıl şirket faaliyet kârına döndü. Yaklaşık bir yıl sonra bir mobil oyun şirketiyle karşılıklı hisse takasıyla ortaklık kuruldu ve Kagemori akıllı telefon oyunlarına girdi."
        ]
      }
    }
  ];

  var S005 = [
    {
      area: "Pazarlama",
      place: ["ABD", " · 2000’lerin sonu"],
      company: "Morivo Motors",
      title: "İşini kaybedersen geri al",
      body: [
        "Morivo, Amerika’da uzun yıllar “ucuz ama sıradan” diye bilinmiş bir Koreli otomobil markası. Son yıllarda kalite ve uzun garantiyle itibar kazandı ama pazar payı hâlâ yaklaşık %3.",
        "Finans krizi derinleşiyor. Otomobil satışları bir yıl öncesine göre üçte bir civarında düşüyor; büyük Amerikan üreticiler devletten destek istiyor. Rakipler indirim ve sıfır faiz yarışında. Ama asıl sorun fiyat değil: insanlar parası olsa bile işini kaybetme korkusuyla yeni araba almıyor.",
        "Yılbaşından sonra yeni bir kampanya başlayacak, kısa süre sonra da yılın en çok izlenen maç yayınında reklam alanın var. Morivo’nun Amerika şirketinin vekil CEO’susun; pazarlama ve finans ekiplerin masaya birkaç fikir getirdi."
      ],
      stats: [["Pazar payı", "Küçük"], ["Sektör satışları", "Üçte bir düşüşte"], ["Müşterinin korkusu", "İşsiz kalmak"]],
      ask: "Morivo’nun Amerika şirketinin başındasın. Kriz kışında ne yaparsın?",
      opts: [
        { k: "A", t: "Reklam ve pazarlama bütçesini kıs, stokları azalt; kriz geçene kadar nakdi koru.", s: 20, tag: "kasa",
          r: "Nakit korunur ama korku dolu bir pazarda sessiz kalan marka unutulur. O kış birçok üretici reklamı kıstı; boşalan alanı cesur davrananlar doldurdu." },
        { k: "B", t: "Müşteriye söz ver: arabayı aldıktan sonraki bir yıl içinde işini kaybedersen arabayı geri ver, kalan borcun bir kısmını biz üstlenelim.", s: 90, tag: "kumar",
          r: "Riskin fiyatını kimse tam bilemez: işsizlik hızla artarsa iade edilen arabalar sana döner. Ama müşterinin asıl korkusunu doğrudan hedefler. Sonradan iade edilen araba sayısı yüzlerle sınırlı kaldı." },
        { k: "C", t: "Ödeme güvencesi sun: işini kaybeden müşterinin taksitlerini birkaç ay boyunca şirket ödesin.", s: 65, tag: "kalkan",
          r: "Ölçülü, hesaplanabilir bir güvence ve insanlara iyi bir mesaj. Ama büyük rakipler de benzerini sundu; seni kalabalıktan ayırmaz." },
        { k: "D", t: "Satış hedefini ve üretimi hemen düşür, bayilere giden arabaları azalt; krize küçülerek gir.", s: 40, tag: "cerrah",
          r: "Stok ve maliyet kontrolü sağlam bir refleks. Ama talep hızla düşerken yalnızca küçülmek, pazar payını korumak değil rakiplere bırakmak demek." }
      ],
      real: {
        who: "Dean Halloway",
        role: "Morivo’nun Amerika şirketinin vekil CEO’su",
        k: "B",
        text: [
          "Halloway’in ekibi pazarlama ve finans biriminden gelen fikri birkaç hafta içinde onaylattı. Yılbaşından hemen sonra duyurulan güvenceye göre yeni araba alan ya da kiralayan müşteri, bir yıl içinde elinde olmayan bir nedenle işini kaybederse, en az iki taksit ödemiş olmak şartıyla arabayı geri verebiliyordu. Kalan borçla arabanın değeri arasındaki farkın birkaç bin dolara kadarını şirket üstleniyordu.",
          "Kampanya o büyük maç yayınında ülke çapına yayıldı; kısa süre sonra güvenceye, işini kaybeden müşterinin birkaç aylık taksitini şirketin ödediği bir ek geldi. Sektör satışları ilk ayda üçte birden fazla düşerken Morivo’nun satışı arttı.",
          "Morivo o yılı satışlarını artırarak kapattı; sektör beşte bir kadar küçüldü, pazar payı belirgin biçimde yükseldi. Geri verilen araba sayısı program boyunca birkaç yüzle sınırlı kaldı. Güvence iki yıl kadar sonra sona erdi."
        ]
      }
    },
    {
      area: "Platform",
      place: ["ABD", " · 2010’ların başı"],
      company: "Calder Interactive · Orvia 3",
      title: "Her gün internete bağlan",
      body: [
        "Calder büyük bir yazılım şirketi. Yeni konsolu Orvia 3, birkaç ay sonra yılbaşı sezonundan önce çıkacak. Tanıtımda üç şey duyurdu: oyunlar diske değil hesaba bağlı bir dijital lisansla çalışacak, konsol günde bir kez internete bağlanıp lisansı kontrol edecek, ikinci el satış ve arkadaşa ödünç verme yayıncının koyduğu kurallara bağlı olacak.",
        "Şirkete göre bu yapı, dijital oyun kütüphanesini aileyle paylaşmanın önünü açıyor; yayıncılar da ikinci el pazarından zaten hoşlanmıyor. Ama oyuncular kırgın: forumlar dolu, ön siparişlerde ana rakip öne geçti. Büyük oyun fuarında rakip, disklerin eskisi gibi çalışacağını açıkladı ve konsolunu 100 dolar daha ucuza koydu; salon alkışla doldu.",
        "Çıkışa yaklaşık beş ay var. Calder’in eğlence biriminin başındasın; ekibin masaya birkaç seçenek getirdi."
      ],
      stats: [["Çıkışa kalan", "~5 ay"], ["Rakibin fiyatı", "100 dolar ucuz"], ["Ön siparişler", "Rakip önde"]],
      ask: "Calder’in eğlence biriminin başındasın. Ne yaparsın?",
      opts: [
        { k: "A", t: "Politikayı koru; büyük bir kampanyayla dijital lisansın faydalarını anlat.", s: 25, tag: "kasa",
          r: "Yayıncılarla yapılan anlaşmalar yerinde kalır. Ama oyuncu neyi kaybettiğini net görüyor; anlatmak fikrini değiştirmez ve ön siparişler rakipte kalır." },
        { k: "B", t: "Çıkıştan önce günlük kontrolü, ikinci el ve ödünç verme sınırlarını kaldır; diskler bugünkü gibi çalışsın, dijital paylaşımı şimdilik rafa koy.", s: 85, tag: "cerrah",
          r: "Geri adım gibi görünür ve sevilen bir özelliği de bırakırsın. Ama tartışmanın kaynağını tek hamlede kaldırırsın; konuşma yeniden oyunlara döner." },
        { k: "C", t: "Ortada bir yol bul: kontrolü haftada bire indir, ikinci el satışa seçili mağazalarda izin ver.", s: 40, tag: "kalkan",
          r: "Yarım adım kimseyi tam ikna etmez: oyuncu için kısıt hâlâ orada, yayıncılar da kuralların belirsizleşmesinden hoşlanmaz." },
        { k: "D", t: "Politikayı koru ama konsolu rakibin altında fiyatla; aradaki farkı oyun ve abonelik gelirinden çıkar.", s: 35, tag: "kumar",
          r: "Her konsolda para kaybedersin. Üstelik oyuncunun itirazı fiyat değil, oyununu ödünç verememek; ucuzluk bu kırgınlığı gidermez." }
      ],
      real: {
        who: "Graham Kettley",
        role: "Calder’in eğlence biriminin başkanı",
        k: "B",
        text: [
          "Fuardan yaklaşık on gün sonra Kettley kısa bir açıklamayla politikayı değiştirdi: günlük internet kontrolü kalktı, diskli oyunlar eskisi gibi ödünç verilip ikinci el satılabilecekti, bölge kilidi de olmayacaktı. Dijital kütüphaneyi paylaşma planı ise şimdilik rafa kalktı.",
          "Tartışma büyük ölçüde kapandı ama ilk izlenim kalıcı oldu. Orvia 3 yılbaşı sezonunda çıktı ve ilk gününde bir milyon adedi aştı; yine de rakip o kuşak boyunca önde kaldı ve kabaca iki katı sattığı tahmin ediliyor.",
          "Ertesi yıl fiyatı düşürmek için kamera aksesuarı kutudan çıkarıldı. Sonraki yıllarda eski kuşağın oyunları da yeni konsolda oynanabilir oldu. Vaka, çıkıştan önce dinlemenin ve geri adımın zamanlamasının değerini anlatıyor."
        ]
      }
    },
    {
      area: "Sahiplik",
      place: ["Fransa", " · 2010’ların başı"],
      company: "Maison Corvelle",
      title: "Kapıdaki lüks devi",
      body: [
        "Corvelle bir buçuk asrı aşkın geçmişi olan bir lüks moda evi: el yapımı çantalar, eyerler, ipek eşarplar. Şirket borsada ama hisselerin yaklaşık dörtte üçü kurucunun torunlarından oluşan kalabalık bir ailede. Son sözü ailenin kontrol ettiği bir ortaklık söylüyor.",
        "Bir cumartesi günü dünyanın en büyük lüks grubu Grenholt, Corvelle’in yedide birine yakınına sahip olduğunu açıklıyor; birkaç gün sonra oran altıda bire yaklaşıyor. Payı birkaç yıldır, bildirim eşiğinin altında kalan ve sonradan hisseye çevrilebilen türev sözleşmelerle bankalar üzerinden topladığı ortaya çıkıyor.",
        "Grenholt teklif vermeyeceğini, kontrol ya da yönetim kurulunda koltuk istemediğini söylüyor. Hisse pazartesi sert yükseliyor; geniş ailede payını satmayı düşünenler olabilir. Corvelle’in aileden olmayan yöneticisisin; kararı aile konseyiyle birlikte vereceksin."
      ],
      stats: [["Grenholt’un payı", "Altıda bire yakın"], ["Ailenin payı", "~dörtte üç"], ["İlk işlem günü", "Sert yükseliş"]],
      ask: "Corvelle’in başındasın. Grenholt’a karşı ne yaparsın?",
      opts: [
        { k: "A", t: "Uzlaş: Grenholt’u pasif bir yatırımcı olarak kabul et, pahalı hukuki süreçlerden ve yeni yapılardan kaçın.", s: 25, tag: "kasa",
          r: "Kısa vadede masrafsız. Ama bu kadar büyük bir payla başlayan bir ortak, payını satmak isteyen tek bir aile koluyla çoğunluğa yaklaşabilir." },
        { k: "B", t: "Dost bir yatırımcı bul: ona büyük bir pay satarak Grenholt’u dengele.", s: 40, tag: "kumar",
          r: "Grenholt’u dengeler ama bağımsızlığı bu kez başka biriyle bölüşürsün; yeni ortağın yarın ne isteyeceği de belli değil." },
        { k: "C", t: "Grenholt’a payını geri satması için yüksek bir fiyat öner, gerekirse borçlan; sorunu tek hamlede kes.", s: 30, tag: "cerrah",
          r: "Sorunu keser ama bedeli sen belirlemezsin: Grenholt satmak zorunda değil ve fiyatı istediği kadar yükseltebilir. Borç da bağımsızlığı başka yoldan zayıflatır." },
        { k: "D", t: "Aileyi kilitle: payların yarısından fazlasını uzun yıllar satılamayan ortak bir aile şirketine koy, kalanlarda önalım hakkı al; pay toplama yöntemini de düzenleyiciye taşı.", s: 90, tag: "kalkan",
          r: "Yavaş ve hukuki açıdan yorucu bir yol; aileyi tek ses olmaya zorlar. Ama kontrolü kalıcı olarak güvenceye alır ve Grenholt’un payını bir pazarlık kozuna çevirir." }
      ],
      real: {
        who: "Philippe Rocheval",
        role: "Corvelle’in yöneticisi; kararı aile konseyiyle aldı",
        k: "D",
        text: [
          "Aile önce bir araya geldi ve birlikte hareket edeceğini açıkladı. Birkaç hafta sonra, payların yarısından fazlasını uzun yıllar satılamayacak ortak bir aile şirketinde toplama ve kalan paylarda önalım hakkı kurma planını duyurdu. Düzenleyici kısa süre sonra zorunlu satın alma teklifinden muafiyet verdi; yapı yaklaşık bir yıl içinde işler hâle geldi.",
          "Rocheval, Grenholt’un pay toplama yöntemini düzenleyiciye taşıdı; sonraki yıllarda iki taraf da hukuki yollara başvurdu. Birkaç yıl sonra piyasa düzenleyicisi, pay toplamayı piyasaya zamanında bildirmediği için Grenholt’a milyonlarca avro ceza verdi. Düzenleyiciye göre Grenholt payın önemli kısmını açıklama günündeki fiyatın yarısından da ucuza almıştı.",
          "Yaklaşık dört yıl sonra ticaret mahkemesi başkanının arabuluculuğuyla uzlaşma sağlandı. Grenholt, o güne kadar beşte biri aşmış Corvelle payının tamamını kendi hissedarlarına dağıttı ve beş yıl boyunca Corvelle hissesi almamayı kabul etti. Aile şirketi bugün payların yarısından fazlasını elinde tutuyor."
        ]
      }
    }
  ];

  var S006 = [
    {
      area: "İletişim",
      place: ["Birleşik Krallık", " · 2010’ların sonu"],
      company: "Pellbrook Chicken",
      title: "Tavuksuz tavukçu",
      body: [
        "Pellbrook, kızarmış tavuğuyla bilinen küresel bir fast food zinciri. Birleşik Krallık’ta yüzlerce restoranı var ve menünün neredeyse tamamı her gün gelen taze tavuğa dayanıyor.",
        "Kış ortasında dağıtım yeni bir lojistik firmasına ve tek bir merkez depoya geçti. Birkaç gün içinde sistem çöktü: tavuk restoranlara ulaşmıyor. Birkaç gün sonra restoranların yarıdan fazlası kapalı; sosyal medya zincirle dalga geçiyor.",
        "Tam toparlanmanın haftalar sürebileceği söyleniyor ve bir şey söylemen gerekiyor. Pellbrook’un Birleşik Krallık genel müdürüsün; pazarlama ekibin masaya birkaç seçenek getirdi."
      ],
      stats: [["Restoran", "~900"], ["Kapalı restoran", "Yarıdan fazlası"], ["Dağıtım", "Tek depo"]],
      ask: "Pellbrook’un Birleşik Krallık işinin başındasın. Kamuoyuna ne dersin?",
      opts: [
        { k: "A", t: "Ulusal gazetelere kendinle dalga geçen, kısa ve açık sözlü bir özür ilanı ver; hatayı süslemeden kabul et.", s: 85, tag: "kumar",
          r: "Krizi hafife aldığın düşünülebilir; işi duran çalışanları ve bayileri kızdırabilir. Ama alay edilen bir markanın en iyi cevabı şakayı önce kendisinin yapmasıdır; özür hem dürüst hem akılda kalıcı olur." },
        { k: "B", t: "Yeni lojistik sözleşmesini bitir, eski dağıtıcıya dön; sorun çözülene kadar konuşma, çözünce açıklama yap.", s: 45, tag: "cerrah",
          r: "Eski dağıtıcı sonradan kısmen yeniden devreye alındı; yani işin operasyon tarafı doğru. Ama sessiz kaldığın her gün şaka seninle ilgili yapılmaya devam eder." },
        { k: "C", t: "Resmî bir açıklamayla suçu lojistik firmasına yükle; açık kalan restoranlarda menüyü daralt.", s: 20, tag: "kasa",
          r: "Teknik olarak doğru olabilir ama müşteri kapalı kapıda lojistik firmasının değil senin logonu görüyor. Suçu başkasına atmak alayı öfkeye çevirir." },
        { k: "D", t: "Çalışanlara ve bayilere gelir güvencesi ver, ciddi bir kurumsal özür yayımla, tüm reklamları durdur.", s: 55, tag: "kalkan",
          r: "Çalışanları ve bayileri korumak doğru bir adım. Ama sıradan bir kurumsal özür gürültüde kaybolur ve alayı durdurmaz." }
      ],
      real: {
        who: "Clare Whitmore",
        role: "Pellbrook’un Birleşik Krallık ve İrlanda genel müdürü; ilanı pazarlama ekibiyle hazırladı",
        k: "A",
        text: [
          "Kısa süre sonra iki ulusal gazetede, markanın kendisiyle dalga geçtiği kısa ve açık sözlü bir özür ilanı çıktı. İlan hatayı süslemeden kabul ediyor; müşterilere, çalışanlara ve bayilere teşekkür ediyordu.",
          "İlan kısa sürede dünyaya yayıldı ve sonradan reklamcılığın büyük ödüllerini aldı. İlan çıktığında restoranların çoğu yeniden açılmıştı; birkaç hafta içinde neredeyse tamamı hizmetteydi. Bu arada eski dağıtıcı, kuzeydeki yüzlerce restoran için yeniden devreye alındı.",
          "Şirket resmî bir maliyet açıklamadı; basın kaybı günde milyon sterlin civarında olarak tahmin etti. Tam toparlanma yaklaşık üç hafta sürdü, ama marka bu krizden alay konusu olarak değil, iyi bir özrün örneği olarak çıktı."
        ]
      }
    },
    {
      area: "Strateji",
      place: ["ABD", " · 1990’ların başı"],
      company: "Nordahl Systems",
      title: "Parçalara bölünen dev",
      body: [
        "Nordahl, dünyanın en büyük bilgisayar şirketi; büyük kurumların ana bilgisayarlarını o kuruyor ve işletiyor. Ama kişisel bilgisayarlar ve küçük sunucular pazarı değiştirdi. Şirket geçen yıl milyarlarca dolar zarar etti; birkaç yıl önce yüz binlerce kişiyi bulan çalışan sayısı hızla azalıyor.",
        "Önceki yönetim şirketi, satılabilecek ya da halka açılabilecek bir düzineden fazla yarı bağımsız birime bölmeye başladı. Bankacılar parçalara ayırmayı değer yaratmanın en hızlı yolu olarak görüyor. Ana bilgisayar fiyatların yüksek, rakipler daha ucuz.",
        "Birkaç ay önce şirketin tarihinde ilk kez dışarıdan bir CEO geldi: sen. Mühendis değilsin; daha önce tüketim ürünleri ve finans şirketleri yönettin. Analistler radikal bir yön değişikliği bekliyor ve ikinci çeyrek sonuçları bu ay açıklanacak."
      ],
      stats: [["Geçen yılki zarar", "Milyarlarca $"], ["Çalışan (zirvede)", "Yüz binlerce"], ["Bağımsız birim", "Bir düzineden fazla"]],
      ask: "Nordahl’ın yeni CEO’susun. Şirketin geleceği için ne yaparsın?",
      opts: [
        { k: "A", t: "Bölünmeyi tamamla: birimleri ayrı şirketler olarak halka aç ya da sat; her biri kendi pazarında çevikleşsin.", s: 35, tag: "cerrah",
          r: "Bankacıların sevdiği, kısa vadede değer gösteren bir yol. Ama büyük müşteriler parçaların değil, birlikte çalışan tek bir bütünün peşinde; bölündüğünde bunu kimse sunamaz." },
        { k: "B", t: "Radikal bir yön değişikliği ilan et: ana bilgisayardan çık, tüm gücünü kişisel bilgisayarlara ve tüketici pazarına ver.", s: 30, tag: "kumar",
          r: "En büyük nakit kaynağını bırakıp kalabalık, kârı düşük ve zaten geride olduğun bir pazara koşarsın. Yeni strateji kâğıtta güzel durur ama kasayı boşaltır." },
        { k: "C", t: "Şirketi bütün tut: müşteriler her şeyi birleştirecek tek bir ortak istiyor. Maliyetleri tek seferde ve sert biçimde kes, ana bilgisayar fiyatlarını düşür.", s: 85, tag: "kalkan",
          r: "Bankacıların tavsiyesinin tam tersi; ağır bir zarar yazar, on binlerce kişiyle yollarını ayırırsın. Ama her parçayı birleştirebilen tek şirket olmak, parçaların toplamından daha değerli olabilir." },
        { k: "D", t: "Ana bilgisayar marjlarını koru; işten çıkarmaları yıllara yayarak sessizce yap.", s: 20, tag: "kasa",
          r: "Kısa vadede kâr tablosu iyi görünür. Ama daha ucuz rakipler müşterileri almaya devam eder; yavaş yavaş kaybetmek, tek seferlik sert bir küçülmeden daha pahalıya gelir." }
      ],
      real: {
        who: "Richard Hollinsby",
        role: "Nordahl’ın CEO’su",
        k: "C",
        text: [
          "Yaz ortasında Nordahl ikinci çeyrekte rekor bir zarar açıkladı; bunun büyük kısmı yeniden yapılanma gideriydi. O yıl ayrılan on binlerce kişinin üstüne ertesi yıl sonuna kadar on binlercesi daha ayrılacaktı; çeyreklik temettü yarıdan fazla indi. Hollinsby uzun vadeli planları bir kenara bırakıp önce nakit ve maliyetlere odaklandı.",
          "Bölünme planını rafa kaldırdı; şirketi bir arada tutmak ilk büyük stratejik adımı oldu. Ana bilgisayar fiyatları düşürüldü ve şirket, başka üreticilerin parçalarını da birleştiren hizmet işine yöneldi; bu iş birkaç yıl içinde hız kazandı.",
          "Nordahl o yılı da milyarlarca dolar zararla kapattı; yıl sonunda çalışan sayısı zirvedekinin üçte ikisinin altına inmişti. Ertesi yıl şirket yeniden kâra döndü."
        ]
      }
    },
    {
      area: "Marka",
      place: ["ABD", " · 2000’lerin sonu"],
      company: "Ristaldi Coffee",
      title: "Üç saatliğine kepenk",
      body: [
        "Ristaldi, bir mahalle kahvecisi olarak başlayıp dünyanın en büyük kahve zincirine dönüştü. İnsanların evle iş arasında oturup iyi kahve içtiği bir yer olmayı vaat ediyordu.",
        "Ama hızlı büyüme bedelini ödetiyor: mağazalar kalabalık, otomatik makineler hızı artırdı ama tezgâhtaki ustalık kayboldu, kahvenin tadı sıradanlaştı. Ucuz rakipler kapıda; birkaç hafta önce büyük bir hamburger zinciri menüsüne espresso bazlı içecekler ekledi.",
        "Şirketi büyüten eski CEO olarak yılın başında yeniden başa döndün. Çalışanların ve müşterilerin gözü ilk hamlende; markanın neden sıradanlaştığına bir cevap vermen gerekiyor."
      ],
      stats: [["Şirket mağazası (ABD)", "Yedi binden fazla"], ["Barista", "Yüz binden fazla"], ["CEO’nun dönüşü", "Yılın başı"]],
      ask: "Ristaldi’nin başına geri döndün. Markayı nasıl toparlarsın?",
      opts: [
        { k: "A", t: "Fiyatla yarış: indirimler ve ucuz menüyle yeni rakiplere müşteri kaptırma.", s: 25, tag: "kasa",
          r: "Kısa vadede müşteri getirebilir. Ama pahalı ve özel olmakla bilinen bir markanın ucuzla yarışması, asıl sorunu, yani sıradanlaşmayı derinleştirir." },
        { k: "B", t: "Zarar eden mağazaları kapat, yeni açılışları dondur; önce büyümeyi durdur.", s: 50, tag: "cerrah",
          r: "Aylar sonra yüzlerce mağaza gerçekten kapandı; bu gerekliydi. Ama yalnızca küçülmek, ürünün neden kötüleştiği sorusuna cevap vermez." },
        { k: "C", t: "Baristaları sessizce, vardiya vardiya ve mesai dışında yeniden eğit; dışarıya hiçbir şey belli etme.", s: 45, tag: "kalkan",
          r: "Mağazalar açık kalır, risk yoktur. Ama değişim yavaş yayılır ve ne çalışana ne de müşteriye bir şeylerin değiştiğini hissettirir." },
        { k: "D", t: "Ülkedeki tüm şirket mağazalarını aynı akşam birkaç saatliğine kapat; herkese aynı anda espresso eğitimi ver ve bunu açıkça duyur.", s: 85, tag: "kumar",
          r: "Milyonlarca dolarlık satış kaybı, rakiplere bedava reklam ve “demek kahveniz kötüymüş” diye okunma riski. Ama çalışanlara ve müşterilere işin özüne döndüğünü tek hamlede gösterir." }
      ],
      real: {
        who: "Martin Ebersole",
        role: "Ristaldi’yi küçük bir kahveciden dev zincire büyüten eski CEO; yılın başında geri döndü",
        k: "D",
        text: [
          "Birkaç hafta sonra bir salı akşamüstü Ristaldi’nin ülkedeki yedi binden fazla şirket mağazası üç saatliğine kapandı; yüz binden fazla çalışan aynı anda espresso eğitimi aldı. Lisanslı mağazalar açık kaldı.",
          "Basın satış kaybını milyonlarca dolar olarak tahmin etti. Aynı akşam büyük bir çörek zinciri küçük boy latte ve espresso içeceklerini bir doların altında sattı.",
          "Eğitim tek başına yetmedi: yaz başında ülkede yüzlerce mağazanın kapanacağı açıklandı, on binden fazla pozisyon etkilendi. Ama iki yıl kadar sonra şirket rekor kırdı: gelir 10 milyar doları aştı, net kâr bir önceki yıla göre iki katından fazla arttı."
        ]
      }
    },
    {
      area: "Yeni pazar",
      place: ["ABD", " · 1990’ların başı"],
      company: "Wennvik",
      title: "Bardak yerine vazo",
      body: [
        "Wennvik, İskandinavya’dan çıkıp Avrupa’ya yayılmış, sade tasarımlı ve düşük fiyatlı bir mobilya perakendecisi. Dünyanın her yerinde aynı ürünler, aynı ölçüler. 1980’lerin ortasında ABD’ye girdi; ilk mağazalar büyük ilgiyle açıldı.",
        "Birkaç yıl sonra tablo değişti: insanlar geliyor, geziyor ama eli boş çıkıyor. Yataklar Avrupa ölçülerinde, Amerikan çarşaflarına uymuyor. Mutfak dolapları Amerikan buzdolaplarına ve bulaşık makinelerine oturmuyor. Perdeler Amerikan pencereleri için kısa, çekmeceler katlanmış giysileri almayacak kadar sığ. Bardaklar o kadar küçük ki müşteriler buzlu içecekleri için bardak yerine vazo alıyor. Ürünlerin çoğu Avrupa’dan geliyor; dolar zayıf olduğu için etiketler de beklenenden pahalı.",
        "ABD işi zarar ediyor. Merkezde “ürünümüz her yerde aynıdır” diyenler çoğunlukta. ABD operasyonunun başına yeni biri getirildi. O kişi sensin."
      ],
      stats: [["ABD’deki mağaza", "Yarım düzine kadar"], ["Yıllık satış", "~150 milyon $"], ["ABD işi", "Zararda"]],
      ask: "Wennvik’in ABD işinin başındasın. Ne yaparsın?",
      opts: [
        { k: "A", t: "Ürünlere dokunma: büyük bir kampanyayla farkı “otantik Avrupa tarzı” diye pazarla, mağaza sayısını da hızla artır. Ölçüler de tasarımın bir parçası.", s: 25, tag: "kumar",
          r: "Tek yelpaze, tek üretim, tek ölçü: merkez memnun olur, yeni mağazalar da her yerde göze çarpar. Ama müşteri bir tarz değil, evine uyan bir yatak arıyor; “farklı” ile “kullanışsız” arasındaki çizgi ince." },
        { k: "B", t: "Yalnızca en çok şikâyet edilen birkaç ürünü (yatak, bardak) ABD ölçüsüne getir, gerisini aynı tut; üretimi Avrupa’da bırak.", s: 45, tag: "kalkan",
          r: "Hızlı ve ucuz bir düzeltme: en çok duyulan şikâyetler biter, merkez de fazla itiraz etmez. Ama fiyat sorunu yerinde kalır; mağazadan eli boş çıkan müşteri azalır ama kaybolmaz." },
        { k: "C", t: "Yelpazenin önemli bir kısmını ABD ölçülerine göre yeniden tasarla; ürünlerin daha büyük kısmını ABD’deki ve yakın ülkelerdeki tedarikçilerden al, fiyatları düşür.", s: 90, tag: "cerrah",
          r: "Merkezin “her yerde aynı ürün” ilkesinden vazgeçersin; yeni tedarikçiler, yeni kalıplar, yeni bir ürün yelpazesi demek. Ama müşterinin mağazadan neden eli boş çıktığına doğrudan cevap verirsin." },
        { k: "D", t: "ABD’den çık: mağazaları kapat ya da sat, sermayeyi Avrupa’daki kârlı büyümeye yönlendir.", s: 20, tag: "kasa",
          r: "Zarar hemen durur, bilanço rahatlar. Ama dünyanın en büyük tüketim pazarını, sorunun ürünün kendisinde değil ölçüsünde olduğunu görmeden bırakmış olursun." }
      ],
      real: {
        who: "Erland Västholm",
        role: "Wennvik’in ABD operasyonunun başı",
        k: "C",
        text: [
          "Västholm işe mağazalarda müşterileri dinleyerek başladı ve merkezi ikna etti: yataklar Amerikan çarşaflarına, mutfak dolapları Amerikan cihazlarına göre yeniden ölçülendi; perdeler uzadı, çekmeceler derinleşti, bardaklar büyüdü. Birkaç yıl içinde ABD’de satılan ürünlerin önemli bir kısmı bu pazar için uyarlanmıştı.",
          "Aynı dönemde tedarik de değişti: ürünlerin giderek daha büyük kısmı ABD’deki ve çevre ülkelerdeki üreticilerden alınmaya başlandı. Nakliye ve kur yükü azaldı, fiyatlar düştü.",
          "Sonuç kısa sürede görüldü: ABD satışları yaklaşık üç yılda üç katına çıktı ve yeni mağazalar açılmaya başladı. Marka ve tarz aynı kaldı; değişen, her pazarın kendi ölçüsünü almasıydı."
        ]
      }
    }
  ];

  var S007 = [
    {
      area: "Dağıtım",
      place: ["ABD", " · 2000’lerin başı"],
      company: "Varnley Computers",
      title: "Raftaki kutu",
      body: [
        "Varnley masaüstü ve dizüstü bilgisayar yapan bir şirket. Ürünleri tasarımıyla seviliyor ama büyük elektronik zincirlerinin rafında, onlarca benzer kutunun arasında duruyor. Mağaza çalışanları müşteriyi çoğu zaman daha çok sattıkları rakip bilgisayarlara yönlendiriyor.",
        "Pazar payı yüzde 3 ile 5 arasında. Şirket, ürünlerinin ancak dokunulup denenince anlaşıldığını düşünüyor; oysa rafta kutudan başka bir şey görünmüyor. Yönetimde bir grup, mağazalardan tümüyle çekilip yalnızca internetten satmayı öneriyor.",
        "Varnley’in CEO’susun; masada birkaç seçenek var."
      ],
      stats: [["Pazar payı", "%3–5"], ["Satış yolu", "Elektronik zincirleri"], ["Rafta görünürlük", "Düşük"]],
      ask: "Varnley’in CEO’susun. Ne yaparsın?",
      opts: [
        { k: "A", t: "Zincirlerin içinde Varnley köşeleri kur; oraya kendi eğittiğin satış danışmanlarını yerleştir.", s: 40, tag: "kalkan",
          r: "Görünürlük artar ama köşe yine zincirin düzeninde kalır; yerleşim, ışık ve kasadaki deneyim sana ait değil. Danışman maliyeti de her mağazada ayrı ödenir." },
        { k: "B", t: "Kendi mağazalarını aç: önce bir depoda tam boy bir deneme mağazası kur, sonra iki mağazayla kalabalık alışveriş merkezlerinde başla.", s: 85, tag: "kumar",
          r: "Pahalı ve geri dönüşü zor bir adım. Ama müşterinin ürünü nasıl gördüğünü, denediğini ve satın aldığını baştan sona sen tasarlarsın." },
        { k: "C", t: "Mağazalardan çekil; masrafı kıs, yalnızca internetten ve telefonla sat.", s: 30, tag: "cerrah",
          r: "Masraf düşer ama ürünü görmeden alan müşteri az. Yeni müşteri bulmak zorlaşır ve pay daha da daralır." },
        { k: "D", t: "Bugünkü düzeni koru; mağazaya büyük para ayırma, yeni ürünler kendini anlatsın.", s: 35, tag: "kasa",
          r: "Büyük bir mağaza masrafına girmezsin. Ama ürün ne kadar iyi olursa olsun rafta öteki kutulardan farksız durur; anlatacak biri olmadan fark anlaşılmaz." }
      ],
      real: {
        who: "Elliot Branscombe",
        role: "Varnley’in CEO’su",
        k: "B",
        text: [
          "Branscombe perakendeden deneyimli bir yönetici getirdi. Ekip yaklaşık bir yıl boyunca, şirket merkezinin hemen yanındaki bir depoda tam boy bir deneme mağazası kurdu; mağaza bir kez baştan düzenlendi ve ürünler türüne göre değil, müşterinin yapmak istediği işe göre dizildi: müzik, fotoğraf, film.",
          "İlk iki mağaza bir bahar ayında açıldı. Basındaki yorumcuların çoğu fikre şüpheyle baktı; birkaç yıl içinde mağazaların kapanacağını yazanlar bile oldu.",
          "Mağazalar yaklaşık üç yılda yıllık bir milyar dolar satışı geçti; bu, o döneme göre görülmemiş bir hızdı. İçerideki danışma masası, müşterinin satın almadan önce aklına takılan her şeyi sorabildiği bir köşe oldu ve on yıl içinde mağaza sayısı 300’ü aştı. Vaka, ürünü anlatan yeri kendin kurmanın değerini gösteriyor."
        ]
      }
    },
    {
      area: "Yeni pazar",
      place: ["İsviçre", " · 1980’lerin sonu"],
      company: "Holmstedt · Ondriva",
      title: "Kapsül kimin için?",
      body: [
        "Holmstedt büyük bir gıda şirketi. Birkaç yıl önce Ondriva adlı bir kapsül kahve sistemi çıkardı: makineye tek porsiyonluk bir kapsül takılıyor, düğmeye basınca bir fincan kahve hazır. Ürün ilk olarak ofislere ve restoranlara satıldı.",
        "Sonuç beklenenin altında. Restoranlar kendi büyük makinelerini bırakmak istemiyor, ofisler fiyatı yüksek buluyor; satışlar hedefin çok gerisinde ve şirketin içinde birimin kapatılmasını önerenler var. Öte yandan küçük bir ankette, sistemi evde deneyen ailelerin çoğu memnun kalmış.",
        "Ondriva’nın başına yeni geldin; yönetim senden bir plan bekliyor."
      ],
      stats: [["Satışlar", "Hedefin çok altında"], ["İlk müşteri", "Ofis ve restoran"], ["Evde deneyenler", "Çoğu memnun"]],
      ask: "Ondriva’nın başındasın. Ne yaparsın?",
      opts: [
        { k: "A", t: "Birimi kapat; makine ve kapsül yatırımını durdur, parayı ana kahve işine geri koy.", s: 20, tag: "kasa",
          r: "Kayıp burada durur ve ana iş rahatlar. Ama evde deneyenlerin verdiği işaret masada kalır; fikri başka bir şirket geliştirebilir." },
        { k: "B", t: "Kapsülleri süpermarket raflarına koy; her mağazada satılsın, reklamı da büyük yap.", s: 40, tag: "kumar",
          r: "Bir anda çok yere ulaşırsın ama kapsül rafta sıradan bir kahve paketine dönüşür; fiyat karşılaştırması başlar ve ürünün özel hissi kaybolur." },
        { k: "C", t: "Ofisleri bırak, evlere yönel: makineyi ev aleti markaları yapsın, kapsülü yalnızca üyelere bir kulüpten gönder.", s: 90, tag: "cerrah",
          r: "Bir pazarı bırakıp tümüyle yenisine geçersin; ilk yıllar yavaş ilerler. Ama makineyi başkaları yapar ve satar, sen kapsüle ve müşteriyle ilişkiye odaklanırsın; her sipariş kimin ne içtiğini de gösterir." },
        { k: "D", t: "Ofislerde kal ama daha küçük ve daha ucuz bir makine çıkar; sözleşmeleri yıllık yap.", s: 35, tag: "kalkan",
          r: "Bugünkü müşteriyi korursun. Ama sorun yalnızca fiyat değildi; ofisler ve restoranlar bu sistemi pek istemiyor, daha ucuz makine bunu değiştirmez." }
      ],
      real: {
        who: "Henri Vauclair",
        role: "Ondriva’nın CEO’su",
        k: "C",
        text: [
          "Vauclair odağı evlere çevirdi. Makineleri tanınmış ev aleti üreticileri yaptı ve büyük mağazalarda sattı; kapsüller ise yalnızca üyelerin telefonla ya da postayla sipariş verdiği bir kulüp üzerinden gönderildi.",
          "İlk yıllar yavaş geçti ama kulüp her yıl büyüdü. Kulüp, şirkete hangi müşterinin hangi kahveyi sevdiğini gösterdi; yeni tatlar bu bilgiyle seçildi. Yıllar sonra ilk butik mağaza açıldı.",
          "Sonraki yıllarda Ondriva’nın yıllık geliri milyarlarca dolara ulaştı. Değişen ürün değildi; değişen, ürünün kime ve nasıl satıldığıydı."
        ]
      }
    },
    {
      area: "Ambalaj",
      place: ["ABD", " · 2000’lerin sonu"],
      company: "Orrindale",
      title: "Yeni kutu, eski müşteri",
      body: [
        "Orrindale ülkenin en çok satan portakal suyu markası. Kutusunun üstündeki, içinden pipet çıkan portakal resmi yıllardır markayı rafta tanıtan şeydi.",
        "Yeni ajans ambalajı baştan çizdi: pipetli portakal gitti, yerine sade bir bardak portakal suyu fotoğrafı ve küçük, yatay bir logo geldi. Kutular rafa çıktı ve birkaç hafta içinde satışlar belirgin biçimde düştü. Müşteriler yeni kutunun market markası gibi durduğunu, rafta Orrindale’i bulamadıklarını yazıyor.",
        "Yeni tasarıma milyonlarca dolar harcandı. Markanın başındasın; ekip senden bir karar bekliyor."
      ],
      stats: [["Satışlar", "Hızla düşüyor"], ["Müşteri yorumu", "Market markası gibi"], ["Rakipler", "Payı topluyor"]],
      ask: "Orrindale markasının başındasın. Ne yaparsın?",
      opts: [
        { k: "A", t: "Eski ambalaja hızla dön; müşterileri dinlediğini sade bir dille duyur.", s: 85, tag: "cerrah",
          r: "Pahalı bir tasarımı bırakmak kolay değil; ajans da ekip de bunu bir hata kabulü gibi görebilir. Ama müşterinin aradığı kutu geri gelir ve konuşma kısa sürede kapanır." },
        { k: "B", t: "Tasarımı koru; büyük bir reklam kampanyasıyla yeni kutuyu tanıt, müşteri alışsın.", s: 30, tag: "kumar",
          r: "Yatırım boşa gitmez ve marka kararlı görünür. Ama müşteri markayı rafta bulamıyorsa, reklam onu mağazada yönlendiremez; kayıp her hafta sürer." },
        { k: "C", t: "Yeni kutuyu koru ama pipetli portakalı ve eski logoyu üstüne geri ekle.", s: 50, tag: "kalkan",
          r: "Tanıdık işaret geri gelir ama ortaya iki tasarımın karışımı çıkar. Yeniden basım ve rafların değişmesi de aylar alır." },
        { k: "D", t: "Yeni kutuyla birlikte geçici bir indirim başlat; satışlar dönene kadar fiyatı düşür.", s: 30, tag: "kasa",
          r: "Kısa sürede hacmi toplar ama marjı düşürür; müşteri ucuzluğa alışır, ambalaj sorunu da yerinde kalır." }
      ],
      real: {
        who: "Megan Ashcroft",
        role: "Orrindale’in marka başkanı",
        k: "A",
        text: [
          "Ashcroft iki ay dolmadan eski ambalaja dönüleceğini duyurdu. Şirket tasarımı kötülemedi; müşterilerin sesini duyduğunu sade bir dille anlattı.",
          "Pipetli portakal birkaç hafta içinde raflara döndü. Bu arada satışlar iki ayda yaklaşık yüzde 20 düşmüş, kısa dönemdeki kayıp da yaklaşık 30 milyon doları bulmuştu; marka zamanla eski satış düzeyine yeniden ulaştı.",
          "Ambalaj yalnızca bir süs değil; müşterinin markayı rafta bulma yolu. Hızlı geri dönüş de kaybı sınırladı."
        ]
      }
    }
  ];

  var S008 = [
    {
      area: "Odak",
      place: ["Kanada", " · 2010’ların başı"],
      company: "Tinsmere",
      title: "Asıl ürün hangisi?",
      body: [
        "Tinsmere küçük bir oyun şirketi. Birkaç yıldır tarayıcıda oynanan, renkli ve sakin bir çevrimiçi oyun geliştiriyor; yatırımcılardan yaklaşık 17 milyon dolar topladı.",
        "Oyunu sevenler çok seviyor ama yeni oyuncu gelmiyor; aylık oyuncu sayısı hedefin çok altında. Bu arada ekip, şirket içinde yazışmak için küçük bir araç yaptı. Farklı şehirlerdeki herkes bu araçla kolayca anlaşıyor ve onu her gün kullanıyor.",
        "Kasada bir süre daha yetecek para var. Tinsmere’in kurucusu ve CEO’susun; ne yapacağına karar vermelisin."
      ],
      stats: [["Toplanan yatırım", "~17 milyon $"], ["Oyuncu sayısı", "Hedefin altında"], ["İç araç", "Ekip her gün kullanıyor"]],
      ask: "Tinsmere’in kurucususun. Ne yaparsın?",
      opts: [
        { k: "A", t: "Oyuna devam et; pazarlama bütçesini artır ve bir mobil sürüm çıkar.", s: 25, tag: "kumar",
          r: "Oyun bu ilgiyi hak ediyor olabilir. Ama yeni oyuncu bulma sorunu yıllardır sürüyor; bütçe biter ve ekip aynı soruyla baş başa kalır." },
        { k: "B", t: "Oyunu sürdür; aracı yan proje olarak dene, sonuç görürsen odağı ona kaydır.", s: 45, tag: "kalkan",
          r: "İki işi birlikte yürütmek parayı ve dikkati ikiye böler. Hiçbiri yeterli ilgiyi görmez; karar bir yıl sonraya ertelenmiş olur." },
        { k: "C", t: "Şirketi kapat; kalan parayı yatırımcılara geri ver.", s: 35, tag: "kasa",
          r: "Dürüst ve temiz bir çıkış. Ama en değerli şeyi, ekibin her gün kullandığı aracı da masada bırakırsın." },
        { k: "D", t: "Oyunu kapat; küçük bir ekiple iç yazışma aracını şirketlere satılan bir ürüne dönüştür.", s: 90, tag: "cerrah",
          r: "Yıllarca emek verilen bir ürünü bırakırsın; bu, ekip için zor bir gün olur. Ama zaten her gün kullanılan ve sevilen bir şeye odaklanırsın; kalan para bu yeni işe gider." }
      ],
      real: {
        who: "Isaac Pemberly",
        role: "Tinsmere’in kurucusu",
        k: "D",
        text: [
          "Pemberly oyunun kapanacağını duyurdu. Ayrılan çalışanların yeni iş bulmasına ekipçe destek oldu ve yatırımcılara kalan parayı geri vermeyi önerdi. Yatırımcıların çoğu parayı geri almak yerine yeni bir şey denemesini istedi.",
          "Küçük bir ekip iç yazışma aracını bir ürüne dönüştürdü. Araç bir yılı biraz aşkın bir süre sonra şirketlere açıldı; birkaç ay içinde şirketin değeri yaklaşık bir milyar dolara ulaştı.",
          "Şirket yıllar sonra yaklaşık 28 milyar dolara satıldı. En değerli ürün bazen asıl işin yanında, kendi ihtiyacın için yaptığın şey oluyor."
        ]
      }
    },
    {
      area: "Fiyatlama",
      place: ["ABD", " · 2010’ların başı"],
      company: "Wrenmore",
      title: "Kuponsuz mağaza",
      body: [
        "Wrenmore ülke çapında binden fazla mağazası olan köklü bir perakende zinciri. Müşteriler kupona, indirim günlerine ve sürekli kampanyaya alışkın: şirket bir yılda yaklaşık 600 ayrı indirim yapıyor ve ürünlerin çoğu etiket fiyatının çok altında satılıyor.",
        "Wrenmore’un yeni CEO’susun. Bu düzenin karmaşık ve müşteri için yorucu olduğunu düşünüyorsun; planın hazır: kuponları ve indirim günlerini kaldırmak, yerine üç basamaklı sade bir fiyat düzeni getirmek ve mağazaları marka köşeleriyle yenilemek.",
        "Şimdi planını ne kadar hızlı ve nasıl uygulayacağına karar vereceksin."
      ],
      stats: [["Yıllık indirim", "~600"], ["Yıllık satış", "~17 milyar $"], ["Mağaza", "1.000’den fazla"]],
      ask: "Wrenmore’un CEO’susun. Ne yaparsın?",
      opts: [
        { k: "A", t: "Yeni fiyat düzenini bütün mağazalarda aynı anda başlat; test yapmadan, büyük bir reklamla duyur.", s: 30, tag: "kumar",
          r: "Değişim hızlı olur ve karışıklık kısa sürer. Ama müşterinin tepkisini ölçmeden bütün zinciri tek bir fikre bağlarsın; yanlış çıkarsa geri dönüş pahalıya gelir." },
        { k: "B", t: "Önce birkaç bölgede dene; müşteri tepkisini ölç, düzeni buna göre ayarla, sonra bütün mağazalara yay.", s: 85, tag: "kalkan",
          r: "Yavaş görünür ve fikri rakiplere erken gösterirsin. Ama müşterinin kuponsuz alışverişe nasıl baktığını küçük ölçekte öğrenir, gerekirse planı değiştirirsin." },
        { k: "C", t: "Kuponları ve indirim günlerini koru; yalnızca mağazaların görünümünü yenile.", s: 50, tag: "kasa",
          r: "Satışlar yerinde kalır ve müşteri alıştığı düzeni bulur. Ama marj daralmaya devam eder; sürekli indirime alışmış müşteri tabanı da değişmez." },
        { k: "D", t: "İndirim sayısını yarıya indir; en çok kullanılan kuponları tut, marka köşelerini adım adım aç.", s: 55, tag: "cerrah",
          r: "Müşteri değişimi hisseder ama uzaklaşmaz; marj biraz toparlanır. Yine de yarım bir düzen, sade fiyat fikrini anlatmayı zorlaştırır." }
      ],
      real: {
        who: "Graham Tillotson",
        role: "Wrenmore’un CEO’su",
        k: "A",
        text: [
          "Tillotson yeni düzeni test etmeden bütün mağazalarda aynı anda başlattı. Kuponlar ve indirim günleri kalktı; fiyatlar üç basamaklı sade bir düzene geçti.",
          "Müşteriler indirim yakalamanın keyfini kaybettiklerini hissetti ve mağazaya daha seyrek gelmeye başladı. Bir yıl içinde yıllık satış yaklaşık 17 milyar dolardan 13 milyar dolara geriledi.",
          "Tillotson bir buçuk yıl kadar sonra görevden ayrıldı ve kuponlar geri geldi. Alışkanlıkları değiştiren büyük bir fikri önce küçük ölçekte denemek, geri dönüşü kolaylaştırır."
        ]
      }
    },
    {
      area: "Yurt dışı",
      place: ["Almanya", " · 2000’lerin ortası"],
      company: "Brindlemar Stores",
      title: "Uzak pazarda büyük mağaza",
      body: [
        "Brindlemar ABD’nin en büyük perakende zinciri. Birkaç yıl önce Almanya’ya girmek için önce 21, sonra 74 mağazalık iki yerel zinciri satın aldı; zamanla birkaçını kapattı, bugün yaklaşık 85 mağazası var. Mağazaların çoğu eski ve şehir merkezlerinin dışında.",
        "Almanya’da indirim marketleri çok güçlü; fiyatta onları geçmek zor. ABD’den getirilen alışkanlıklar da tutmadı: kapıda müşteriyi selamlayan görevliler, kasada poşete koyma hizmeti ve sürekli gülümseme kuralı müşterilere de çalışanlara da yabancı geldi. Pazar payı yaklaşık yüzde 2’de kaldı; şirket her yıl yüz milyonlarca dolar kaybediyor.",
        "Brindlemar’ın uluslararası biriminin başındasın; yönetim senden bir yol bekliyor."
      ],
      stats: [["Mağaza", "~85"], ["Pazar payı", "~%2"], ["Yıllık sonuç", "Yüz milyonlarca $ kayıp"]],
      ask: "Brindlemar’ın uluslararası biriminin başındasın. Ne yaparsın?",
      opts: [
        { k: "A", t: "Bir zincir daha satın al; ölçeği büyüterek fiyatta indirim marketlerine yetiş.", s: 25, tag: "kumar",
          r: "Ölçek alım gücünü artırır ama sorun yalnızca büyüklük değil; konumlar, alışkanlıklar ve rekabet aynı kalır. Kayıp da büyüyebilir." },
        { k: "B", t: "Yönetimi tümüyle yerel bir ekibe bırak; ABD alışkanlıklarını kaldır, mağazaları Alman müşteriye göre düzenle.", s: 50, tag: "kalkan",
          r: "Doğru bir adım ama geç kalınmış olabilir; eski konumlar ve fiyattaki fark yerinde kalır. Toparlanma yıllar sürebilir." },
        { k: "C", t: "Mağazaları yerel bir perakendeciye sat ve Almanya’dan çık; parayı ve ekibi büyüyen pazarlara aktar.", s: 85, tag: "cerrah",
          r: "Kayıp tek seferde hesaplara yazılır ve bu dışarıdan başarısızlık gibi görünür. Ama her yıl süren kaybı durdurursun; para ve ekip daha umut veren pazarlara gider." },
        { k: "D", t: "En iyi mağazaları tut, diğerlerini kapat; masrafı kıs ve bekle.", s: 40, tag: "kasa",
          r: "Kayıp azalır ama bitmez; küçük bir ağla alım gücü daha da düşer ve pazar payı yerinden oynamaz." }
      ],
      real: {
        who: "Craig Denholm",
        role: "Brindlemar’ın uluslararası biriminin başkanı",
        k: "C",
        text: [
          "Denholm, 85 Alman mağazasının yerel bir perakende zincirine satılacağını duyurdu. Brindlemar Almanya’dan çıktı ve yaklaşık bir milyar dolarlık kaybı tek seferde hesaplarına yazdı.",
          "Satıştan sonra şirket yurt dışında büyümeyi bırakmadı. Sonraki adımlarında yerel ortaklarla ve yerel yöneticilerle daha çok çalışmaya yöneldi.",
          "Büyük bir şirket bile başka bir pazarın alışkanlıklarını kendi düzeniyle değiştiremiyor; zamanında çıkmak da bir karardır."
        ]
      }
    },
    {
      area: "Satın alma",
      place: ["ABD", " · 1990’ların ortası"],
      company: "Ashvane Foods · Zestwick",
      title: "Yüksek bir teklif",
      body: [
        "Ashvane büyük bir gıda şirketi; kahvaltılık gevreklerinin yanında çok satan bir spor içeceği markası da var. Şimdi Zestwick’i almak istiyor: eğlenceli reklamları ve küçük dükkânlardaki güçlü satışlarıyla bilinen bir buzlu çay ve meyve içeceği markası.",
        "Satıcılar 1,7 milyar dolar istiyor. Ashvane’in ekibi, spor içeceğini büyüttükleri süpermarket ağıyla Zestwick’i de büyütebileceklerini düşünüyor. Ama Zestwick’in satışlarının çoğu, bağımsız dağıtıcıların taşıdığı küçük dükkânlardan ve büfelerden geliyor; son çeyrekte büyüme de yavaşladı.",
        "Teklif masada ve süre kısa. Ashvane’in CEO’susun; kararı sen vereceksin."
      ],
      stats: [["İstenen fiyat", "1,7 milyar $"], ["Satışın çoğu", "Küçük dükkânlar"], ["Son çeyrek", "Büyüme yavaşladı"]],
      ask: "Ashvane’in CEO’susun. Ne yaparsın?",
      opts: [
        { k: "A", t: "İstenen fiyattan satın al; Zestwick’i spor içeceğinin süpermarket ağına taşı.", s: 25, tag: "kumar",
          r: "Hızlı bir büyüme hamlesi. Ama iki markanın satış yolları farklı; dağıtıcılarla uzlaşmadan yapılan değişiklik satışları aksatabilir ve yüksek fiyatın karşılığını almak zorlaşır." },
        { k: "B", t: "Önce dağıtıcılarla görüş, satış yolunu incele; daha düşük bir teklif ver, kabul edilmezse masadan kalk.", s: 85, tag: "cerrah",
          r: "Fırsatı kaçırabilirsin ve markayı bir rakip alabilir. Ama ödeyeceğin fiyat, gerçekten büyütebileceğin işe göre belirlenir." },
        { k: "C", t: "Teklifi geri çevir; parayı spor içeceğini yurt dışında büyütmeye harca.", s: 70, tag: "kasa",
          r: "Bildiğin işe yatırım yaparsın ve risk düşük kalır. Ama yeni bir kategoriye girme fırsatı da masada kalır." },
        { k: "D", t: "Küçük bir pay al; iki yıl sonra kalanını alma hakkı iste.", s: 55, tag: "kalkan",
          r: "İşi içeriden tanırsın ve büyük kararı ertelersin. Ama satıcı bunu istemeyebilir; kabul etse bile kalan payın fiyatı yükselebilir." }
      ],
      real: {
        who: "Douglas Merrifield",
        role: "Ashvane’in CEO’su",
        k: "A",
        text: [
          "Merrifield Zestwick’i istenen fiyattan, 1,7 milyar dolara satın aldı. Pek çok analist bu fiyatın markanın değerinin yaklaşık bir milyar dolar üstünde olduğunu düşünüyordu.",
          "Ashvane, Zestwick’i süpermarket ağına taşımaya çalıştı ama bağımsız dağıtıcılar küçük dükkânlardaki işlerini bırakmak istemedi. Markayı sevdiren eğlenceli reklamların yerine de daha sıradan kampanyalar geldi ve satışlar düştü.",
          "İki yılı biraz aşkın bir süre sonra Ashvane, Zestwick’i 300 milyon dolara sattı. Vaka, bir markanın değerini onu satan düzenle birlikte düşünmek gerektiğini anlatıyor."
        ]
      }
    }
  ];

  var S009 = [
    {
      area: "Büyüme",
      place: ["ABD", " · 2000’lerin sonu"],
      company: "Kipfold",
      title: "Pahalı müşteri",
      body: [
        "Kipfold dosyaları bilgisayarlar arasında kendiliğinden eşitleyen bir bulut depolama hizmeti. Temel paket ücretsiz; daha fazla alan isteyen kullanıcı yılda yaklaşık 99 dolar ödüyor.",
        "Şirket büyümek için arama reklamlarını denedi ama sonuç hayal kırıklığı oldu: her yeni kullanıcı için 200 ile 400 dolar arasında ödüyor. Oysa ücretli bir kullanıcı yılda yalnızca 99 dolar getiriyor ve kullanıcıların çoğu ücretsiz pakette kalıyor.",
        "Kullanıcılar ürünü seviyor ve arkadaşlarına anlatıyor. Kipfold’un kurucusu ve CEO’susun; büyümeyi nasıl sürdüreceğine karar vermelisin."
      ],
      stats: [["Kullanıcı başı reklam", "200–400 $"], ["Yıllık ücret", "~99 $"], ["Kullanıcı memnuniyeti", "Yüksek"]],
      ask: "Kipfold’un kurucususun. Ne yaparsın?",
      opts: [
        { k: "A", t: "Reklamı kes; ürünün içine iki taraflı bir davet ödülü koy: arkadaşını getiren de davetle gelen de ücretsiz ek alan alsın.", s: 90, tag: "cerrah",
          r: "Reklamın hızlı etkisini bırakırsın ve sonuç kullanıcıların isteğine bağlı kalır. Ama ödülün maliyeti birkaç gigabaytlık alan; ürünü seven kullanıcılar onu kendi çevresine taşır." },
        { k: "B", t: "Büyük bir yatırım topla ve reklam bütçesini katla; pazarı rakiplerden önce kap.", s: 25, tag: "kumar",
          r: "Hızlı büyürsün ama her yeni kullanıcı ilk yıl getirdiğinin iki katından fazlasına mal olur; büyüdükçe kayıp da büyür." },
        { k: "C", t: "Fiyatı yükselt; her ücretli kullanıcıdan daha çok gelir al ve reklamı bununla öde.", s: 30, tag: "kasa",
          r: "Kullanıcı başına gelir artar ama ücretli pakete geçenlerin sayısı azalır; reklamın maliyet sorunu da yerinde kalır." },
        { k: "D", t: "Bir bilgisayar üreticisiyle anlaş; hizmet yeni bilgisayarlarda yüklü gelsin.", s: 50, tag: "kalkan",
          r: "Çok sayıda kullanıcıya ulaşırsın ama bu kullanıcılar ürünü kendileri seçmedi; çoğu hiç açmayabilir. Gelirin bir kısmı da ortağa gider." }
      ],
      real: {
        who: "Tobias Kellaway",
        role: "Kipfold’un kurucusu",
        k: "A",
        text: [
          "Kellaway reklamı büyük ölçüde bıraktı ve ürüne iki taraflı bir davet ödülü ekledi: arkadaşını getiren de davetle gelen de ücretsiz ek depolama alanı alıyordu. Davet göndermek birkaç tıklama sürüyordu.",
          "Kayıtlar kalıcı olarak yaklaşık yüzde 60 arttı. Kısa sürede yeni kayıtların önemli bir kısmı davetlerden gelmeye başladı.",
          "Kullanıcı sayısı bir buçuk yıldan kısa sürede 100 binden 4 milyona çıktı. Vaka, kullanıcıyı reklamla kazanmak yerine memnun kullanıcıların davetiyle büyümenin gücünü gösteriyor."
        ]
      }
    },
    {
      area: "İş modeli",
      place: ["ABD", " · 2010’ların başı"],
      company: "Ostervale Software",
      title: "Kutu mu, abonelik mi?",
      body: [
        "Ostervale tasarımcıların ve fotoğrafçıların kullandığı yazılımları yapıyor. Bu yazılımları tek bir paket hâlinde, kutuda satıyor: tam paketin fiyatı 1.300 ile 2.600 dolar arasında; her 18–24 ayda bir yeni sürüm çıkıyor.",
        "Bu düzende gelir sürüm yıllarında yükseliyor, arada düşüyor. Müşterilerin bir kısmı birkaç sürümü atlıyor; izinsiz kopya da yaygın. Şirket bulut tabanlı bir abonelik hazırladı: ayda yaklaşık 50 dolara bütün yazılımlar ve her güncelleme.",
        "Kutulu sürüm hâlâ gelirin büyük kısmını getiriyor. Ostervale’in CEO’susun; geçişin nasıl olacağına karar vereceksin."
      ],
      stats: [["Kutulu paket", "1.300–2.600 $"], ["Abonelik", "~50 $/ay"], ["Yeni sürüm", "18–24 ayda bir"]],
      ask: "Ostervale’in CEO’susun. Ne yaparsın?",
      opts: [
        { k: "A", t: "Kutuyu koru, aboneliği şimdilik rafa kaldır; bu yılın gelirini riske atma.", s: 30, tag: "kasa",
          r: "Bugünkü gelir yerinde kalır. Ama gelirdeki iniş çıkış sürer, izinsiz kopya da azalmaz; bulut tarafındaki hazırlık boşa gider." },
        { k: "B", t: "İki modeli de süresiz sürdür; müşteri hangisini isterse onu seçsin.", s: 45, tag: "kalkan",
          r: "İtiraz az olur. Ama iki ayrı ürün hattı, iki ayrı fiyat ve destek düzeni demek; ekip ikiye bölünür ve geçiş hiç tamamlanmaz." },
        { k: "C", t: "Kutulu paketin fiyatını büyük ölçüde indir; daha çok kişiye satarak izinsiz kopyanın önüne geç.", s: 25, tag: "kumar",
          r: "Satış adedi artabilir ama gelir düşer; sürüm yıllarındaki iniş çıkış da yerinde kalır." },
        { k: "D", t: "Yeni sürümleri yalnızca abonelikle çıkar; eski kutulu sürüm çalışmaya devam etsin, mevcut müşterilere ilk yıl için indirim ver.", s: 90, tag: "cerrah",
          r: "İlk yıllarda gelir düşer ve sadık müşterilerin bir kısmı itiraz eder. Ama gelir düzenli hâle gelir, ürün sürekli güncellenir ve izinsiz kopya cazibesini yitirir." }
      ],
      real: {
        who: "Simon Achterberg",
        role: "Ostervale’in CEO’su",
        k: "D",
        text: [
          "Achterberg, kutulu paketin son sürümünün çıktığını ve yeni sürümlerin yalnızca abonelikle geleceğini duyurdu. Kutulu sürümü olanlar onu kullanmaya devam edebiliyordu; onlara ilk yıl için indirimli fiyat sunuldu.",
          "Tepki büyük oldu: aboneliğe karşı başlatılan bir imza kampanyasına yaklaşık 50 bin kişi katıldı. Geçiş yıllarında yıllık gelir 4,4 milyar dolardan yaklaşık 4,1 milyar dolara geriledi; buna rağmen hisse fiyatı yükseldi, çünkü yatırımcılar düzenli abonelik gelirine güveniyordu.",
          "Birkaç yıl içinde yıllık gelir yaklaşık 7,3 milyar dolara çıktı. Kısa vadeli bir düşüşü göze almak, birkaç yıl sonra kendini fazlasıyla ödedi."
        ]
      }
    },
    {
      area: "Menü",
      place: ["ABD", " · 2010’ların ortası"],
      company: "Pottridge Burgers",
      title: "Kahvaltı saati",
      body: [
        "Pottridge ülkenin en büyük hamburger zincirlerinden biri. Kahvaltı menüsü çok seviliyor ama sabah 10.30’da bitiyor; müşteriler yıllardır kahvaltının gün boyu sunulmasını istiyor.",
        "Mutfak buna hazır değil: ızgara alanı sınırlı, yumurta hamburgerden farklı bir ısıda pişiyor ve öğle yoğunluğunda iki menüyü birlikte hazırlamak ekibi zorlayabilir. Franchise sahipleri endişeli. Bu arada mağaza başı satışlar birkaç yıldır artmıyor.",
        "Pottridge’in ABD biriminin başındasın; karar senden bekleniyor."
      ],
      stats: [["Kahvaltının bitişi", "10.30"], ["Mağaza başı satış", "Birkaç yıldır yatay"], ["Franchise sahipleri", "Endişeli"]],
      ask: "Pottridge’in ABD biriminin başındasın. Ne yaparsın?",
      opts: [
        { k: "A", t: "Saatleri koru; müşteriyi sabah erken gelmeye çeken yeni kampanyalar yap.", s: 30, tag: "kasa",
          r: "Mutfak düzeni değişmez. Ama müşterinin istediği başka: kahvaltıyı kendi saatinde yemek. Kampanya bu isteği karşılamaz." },
        { k: "B", t: "Önümüzdeki ay tam kahvaltı menüsünü bütün mağazalarda gün boyu sun.", s: 35, tag: "kumar",
          r: "Büyük bir duyuru olur ama mutfaklar hazırlıksız yakalanır; servis yavaşlar ve franchise sahiplerinin desteği azalır." },
        { k: "C", t: "Kahvaltı menüsünü daralt; en çok satan birkaç ürünü gün boyu sun. Önce tek bir şehirde dene, sonra ülkeye yay.", s: 90, tag: "cerrah",
          r: "Bazı sevilen ürünler gün boyu menüde yer almaz ve bu bir kısım müşteriyi üzer. Ama mutfak düzeni yönetilebilir kalır; test de franchise sahiplerine somut bir sonuç gösterir." },
        { k: "D", t: "Kahvaltıyı öğlene kadar uzat; gün boyu sunmayı sonra düşün.", s: 50, tag: "kalkan",
          r: "Küçük bir adım; mutfak zamanla alışır. Ama müşterinin isteği öğleden sonra ve akşam da kahvaltı yapabilmekti; yarım çözüm pek ilgi çekmez." }
      ],
      real: {
        who: "Curtis Fenwright",
        role: "Pottridge’in ABD biriminin başkanı",
        k: "C",
        text: [
          "Fenwright gün boyu kahvaltıyı önce bahar aylarında tek bir şehirde denedi. Menü, mutfağı zorlamayacak birkaç ürünle sınırlandı; ızgara düzeni de buna göre ayarlandı.",
          "Test olumlu sonuç verince gün boyu kahvaltı sonbaharda bütün ülkeye yayıldı. Duyuru büyük ilgi gördü.",
          "O yılın son çeyreğinde mağaza başı satışlar yaklaşık yüzde 6 arttı; bu, yaklaşık dört yılın en iyi çeyreğiydi. Müşterinin uzun süredir istediği bir şeyi mutfağın taşıyabileceği ölçüde sunmak, satışa hemen yansıdı."
        ]
      }
    }
  ];

  var S010 = [
    {
      area: "Konumlandırma",
      place: ["ABD", " · 1960’ların başı"],
      company: "Tavrin Car Rental",
      title: "İkinciyiz, biliyoruz",
      body: [
        "Tavrin ülkenin ikinci büyük araç kiralama şirketi. Lider, havalimanı tezgâhlarının çoğunu ve pazarın yarısından fazlasını elinde tutuyor; Tavrin’in payı yaklaşık yüzde 10. Şirket on yılı aşkın süredir para kaybediyor ve bu sürede birkaç kez el değiştirdi.",
        "Yeni reklam ajansı alışılmadık bir fikirle geldi: Tavrin’in ikinci olduğunu açıkça söyleyen ve tam da bu yüzden daha çok çabalayacağını vaat eden bir kampanya. Fikir ön testte pek beğenilmedi; şirket içinde de zayıf yanı ilan etmenin doğru olmadığını düşünenler var.",
        "Reklam bütçen liderinkinin yalnızca küçük bir bölümü kadar. Tavrin’in CEO’susun; ekibin masaya birkaç seçenek getirdi."
      ],
      stats: [["Pazar payı", "~%10"], ["Liderin payı", "Yarıdan fazla"], ["Kâr", "10 yılı aşkın süredir yok"]],
      ask: "Tavrin’in CEO’susun. Ne yaparsın?",
      opts: [
        { k: "A", t: "Liderin diliyle klasik reklamlar yap; aradaki farkı kapatmak için maliyetleri kıs.", s: 30, tag: "kasa",
          r: "Kasayı korursun ama küçük bütçeyle liderin yanında duyulmazsın. Tavrin ilanlarda sıradan bir kiralama şirketi olarak kalır, müşteri de alıştığı tezgâha gitmeye devam eder." },
        { k: "B", t: "Lideri hiç anmadan hafta sonu indirimleri ve kampanyalarla müşteri topla.", s: 40, tag: "kalkan",
          r: "Bir miktar müşteri gelir ama indirim marjı daraltır ve lider aynı indirimi kolayca verebilir. Tavrin’i diğerlerinden ayıran bir şey ortaya çıkmaz." },
        { k: "C", t: "Kâr etmeyen şubeleri kapat; birkaç büyük havalimanına odaklan.", s: 35, tag: "cerrah",
          r: "Masraf düşer ama şirket küçülür. Seyahat eden müşteri gittiği her şehirde aynı şirketi bulmak istiyor; her yerde olmayan bir marka onun için ikinci seçenek bile olmaz." },
        { k: "D", t: "İkinci olduğunu açıkça söyleyen kampanyayı yayınla; vaadi içeride de tut: temiz araç, dolu depo, kısa kuyruk.", s: 90, tag: "kumar",
          r: "Riskli: zayıf yanını herkese ilan ediyorsun ve vaat tutmazsa reklam ters etki yapar. Ama küçük bütçeyle akılda kalmanın yolu bu olabilir; çalışanlara da somut bir hedef verir." }
      ],
      real: {
        who: "Ambrose Dellacourt",
        role: "Tavrin’in CEO’su",
        k: "D",
        text: [
          "Dellacourt kampanyayı ajansın önerdiği biçimde, hiçbir değişiklik yapmadan yayına aldı. İlanlar Tavrin’in ikinci olduğunu açıkça söylüyor ve bu yüzden daha çok çabaladığını anlatıyordu.",
          "Vaadi tutmak için içeride de düzen değişti: tezgâhta bekleme süreleri kısaltıldı, araçlar temiz ve depoları dolu teslim edilmeye başlandı, çalışanlar kampanya sloganını taşıyan rozetler taktı.",
          "Bir yıl içinde Tavrin yıllar sonra ilk kez kâr etti; birkaç yılda pazar payı kabaca üç katına çıktı. Lider sonunda kendi reklamlarıyla cevap vermek zorunda kaldı. İkinci olmak, doğru anlatılınca bir eksik olmaktan çıkıp müşteriye verilmiş bir söze dönüştü."
        ]
      }
    },
    {
      area: "Perakende",
      place: ["ABD", " · 2010’ların başı"],
      company: "Juniver Electronics",
      title: "Mağazada bak, internetten al",
      body: [
        "Juniver ülkenin en büyük elektronik mağazası zinciri; yaklaşık 1.000 büyük mağazası var. Müşteriler mağazaya gelip televizyonu, telefonu, kamerayı inceliyor, sonra telefonlarından daha ucuza internetten sipariş veriyor.",
        "Satışlar üst üste düşüyor; hisse bir yılda yarıdan fazla değer kaybetti. Basında mağazaların internet satıcıları için ücretsiz bir vitrine dönüştüğü yazılıyor ve zincirin geleceği tartışılıyor.",
        "Yönetim kurulu dışarıdan bir isim aradı ve seni seçti. Juniver’in yeni CEO’susun; ekibin masaya birkaç seçenek getirdi."
      ],
      stats: [["Mağaza", "~1.000"], ["Satışlar", "Üst üste düşüşte"], ["Hisse", "Bir yılda yarıdan fazla düştü"]],
      ask: "Juniver’in yeni CEO’susun. Ne yaparsın?",
      opts: [
        { k: "A", t: "İnternet fiyatlarını eşle; mağazalarda büyük markalara kendi köşelerini kirala ve internet siparişlerini en yakın mağazadan gönder.", s: 85, tag: "kalkan",
          r: "Fiyat eşlemek marjdan bir parça götürür ve markalarla anlaşmak zaman alır. Ama mağaza, müşterinin yalnızca baktığı yer olmaktan çıkıp aldığı yer olur; mağaza ağının bir yük değil bir avantaj olduğunu gösterirsin." },
        { k: "B", t: "Fiyatlara dokunma; uzman satış ekibini öne çıkaran bir kampanya yap.", s: 25, tag: "kasa",
          r: "Marj korunur ama müşteri zaten mağazadaki uzmanı dinleyip ucuz olandan alıyordu. Kampanya bu alışkanlığı değiştirmez ve satışlar düşmeye devam eder." },
        { k: "C", t: "Fiyatları internetin de altına çek; marjdan vazgeç, kârı hacimden çıkar.", s: 30, tag: "kumar",
          r: "Bir süre mağazalar kalabalıklaşır ama her satışta para kaybedersin. İnternet satıcılarının maliyeti daha düşük; bu fiyat yarışını uzun süre sürdüremezsin." },
        { k: "D", t: "Mağazaların yarısını kapat; ağırlığı internet satışına ver.", s: 35, tag: "cerrah",
          r: "Kira ve personel masrafı hızla düşer. Ama Juniver’in internette rakiplerinden üstün bir yanı yok; elindeki en büyük varlığı, müşteriye yakın mağazaları elden çıkarmış olursun." }
      ],
      real: {
        who: "Felix Tranholm",
        role: "Juniver’in CEO’su",
        k: "A",
        text: [
          "Tranholm göreve geldiği yıl internet fiyatlarını kalıcı olarak eşleme sözü verdi. Müşteri artık mağazada gördüğü ürünü daha ucuza bulmak için başka yere gitmek zorunda değildi.",
          "Büyük markalar mağazaların içinde kendi köşelerini açtı; bu köşelerin kirası ve markaların desteği maliyetleri hafifletti. İnternet siparişleri en yakın mağazadan gönderilmeye başlandı, şirket genelinde masraflar da elden geçirildi.",
          "Satışlar düşmeyi bıraktı, kârlılık toparlandı; hisse dip seviyesinden birkaç yıl içinde kabaca dört katına çıktı. Mağazalar kapanmadı, rolleri değişti."
        ]
      }
    },
    {
      area: "Üyelik",
      place: ["ABD", " · 2000’lerin ortası"],
      company: "Ilvanta Online",
      title: "Sepet kargoda takılıyor",
      body: [
        "Ilvanta hızla büyüyen bir internet mağazası. 25 doların üstündeki siparişlerde kargo ücretsiz ama teslimat yaklaşık bir hafta sürüyor; hızlı kargo isteyen her siparişte ayrıca ödüyor.",
        "Müşteri şikâyetlerinin başında kargo geliyor: kimi ücretsiz kargo sınırını geçmek için sepete gereksiz ürün ekliyor, kimi kargo ücretini görünce sepeti bırakıyor. Bir mühendis yıllık bir üyelik öneriyor; finans ekibi ise temkinli, en çok alışveriş yapanların kargo masrafının şirkete kalacağını hesaplıyor.",
        "Ilvanta’nın kurucusu ve CEO’susun; ekibin masaya birkaç seçenek getirdi."
      ],
      stats: [["Ücretsiz kargo", "25 doların üstü"], ["Standart teslimat", "~1 hafta"], ["Hızlı kargo", "Sipariş başına ücretli"]],
      ask: "Ilvanta’nın kurucusu ve CEO’susun. Ne yaparsın?",
      opts: [
        { k: "A", t: "Kargo indirimlerini kaldır, ücretsiz kargo sınırını yükselt; marjı koru.", s: 25, tag: "cerrah",
          r: "Kâr tablosu kısa vadede düzelir ama zaten en çok şikâyet edilen konuyu daha da zorlaştırırsın. Müşteri, kargoyu daha ucuza bulduğu mağazaya gider." },
        { k: "B", t: "Hızlı kargoyu sipariş başına küçük, sabit bir ücrete indir.", s: 45, tag: "kalkan",
          r: "Hızlı kargo daha cazip hâle gelir ve bazı siparişler artar. Ama her siparişte ödenen bir ücret, küçük de olsa, bir sonraki siparişin önünde engel olarak kalır." },
        { k: "C", t: "Yılda yaklaşık 80 dolara sınırsız, ücretsiz iki günlük kargo sunan bir üyelik başlat.", s: 90, tag: "kumar",
          r: "Riskli bir bahis: üyeliğe önce en çok alışveriş yapanlar katılır ve kargo masrafı artar. Ama bir kez ödeyen müşteri ‘nasılsa ödedim’ diye düşünür; aklına ilk Ilvanta gelir ve daha sık sipariş verir." },
        { k: "D", t: "Bugünkü düzeni koru; kargo ücretlerine dokunma.", s: 30, tag: "kasa",
          r: "Masraflar öngörülebilir kalır. Ama müşterinin en büyük itirazı yerinde durur; sepetler yine kargo ekranında bırakılır." }
      ],
      real: {
        who: "Desmond Farrowby",
        role: "Ilvanta’nın kurucusu ve CEO’su",
        k: "C",
        text: [
          "Farrowby finans ekibinin çekincelerine rağmen üyeliği başlattı: yılda yaklaşık 80 dolara sınırsız, ücretsiz iki günlük kargo; küçük bir ek ücretle de ertesi gün teslimat.",
          "İlk aylarda en çok alışveriş yapanlar katıldı ve kargo masrafı arttı. Ama üyeler eskisinden çok daha sık sipariş vermeye başladı; bir şey almak istediklerinde önce Ilvanta’ya bakıyorlardı.",
          "Üyelik zamanla şirketin merkezine yerleşti; üye sayısı on milyonlarla ölçülür oldu, pakete film ve müzik gibi ayrıcalıklar eklendi. Kargo, bir masraf kalemi olmaktan çıkıp müşteriyi geri getiren bir alışkanlığa dönüştü."
        ]
      }
    }
  ];

  // ---------- sayılar ----------
  // date: sayının açıldığı gün (Türkiye saati); ileri tarihli sayılar o gün kendiliğinden açılır
  var ISSUES = [
    { no: "001", date: "2026-10-15", cases: S001 },
    { no: "002", date: "2026-10-16", cases: S002 },
    { no: "003", date: "2026-10-19", cases: S003 },
    { no: "004", date: "2026-10-26", cases: S004 },
    { no: "005", date: "2026-11-02", cases: S005 },
    { no: "006", date: "2026-11-09", cases: S006 },
    { no: "007", date: "2026-11-16", cases: S007 },
    { no: "008", date: "2026-11-23", cases: S008 },
    { no: "009", date: "2026-11-30", cases: S009 },
    { no: "010", date: "2026-12-07", cases: S010 }
  ];
  function todayTR() {
    try {
      var p = {};
      new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" })
        .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      if (p.year && p.month && p.day) return p.year + "-" + p.month + "-" + p.day;
    } catch (e) { /* eski tarayıcı */ }
    return new Date(Date.now() + 3 * 36e5).toISOString().slice(0, 10);
  }
  var TODAY = todayTR();
  var RELEASED = ISSUES.filter(function (x) { return x.date <= TODAY; });
  if (!RELEASED.length) RELEASED = [ISSUES[0]];
  var CUR = RELEASED[RELEASED.length - 1], LATEST = CUR.no;
  var qs = /[?&]s=(\d{3})\b/.exec(location.search);
  if (qs) RELEASED.forEach(function (x) { if (x.no === qs[1]) CUR = x; });
  // içeriği yayından sonra değişen sayının cevap anahtarı yenilenir; eski cevaplar yeni dosyalara karışmaz.
  // 001: birinci dosya iki kez değişti (v2, sonra v3: Lavenhurst). Bildirim onayı ayrı tutulur, eski "wishceo.s001" kaydından okunmaya devam eder (loadList).
  // Puan ve seçenek metni aynı kalıp yalnız etiket (tag) ya da anlatım değişirse anahtar yenilenmez; karne tipi kayıtlı cevaplardan yeniden hesaplanır (001: Tumla D, Korvala C etiketleri).
  var KEYV = { "001": "v3" };
  function keyOf(no) { return "wishceo.s" + no + (KEYV[no] || ""); }
  var ISSUE = CUR.no, CASES = CUR.cases, KEY = keyOf(ISSUE);

  var TYPES = {
    cerrah: { name: "Budayıcı", desc: "Neyin bırakılacağını bilirsin. Duygusal bağlara değil, şirketi neyin ayakta tuttuğuna bakarsın ve zor kararı erken alırsın." },
    kalkan: { name: "Kalkan", desc: "Önce insanlar, sonra rakamlar. Güven bir kez giderse hiçbir bütçenin onu geri getiremeyeceğini bilirsin." },
    kumar: { name: "Kumarbaz", desc: "Masaya bütün fişleri sürersin. Tutarsa kitaplara geçersin. Tutmazsa da geçersin, ama başka bir bölüme." },
    kasa: { name: "Kasa Bekçisi", desc: "Bu çeyreği toparlarsın, tablolar temiz görünür. Sorun şu: şirketler çeyrek değil, on yıl yaşar." }
  };
  var TAG_ORDER = ["cerrah", "kalkan", "kumar", "kasa"];

  // ---------- durum ----------
  var state = { answers: CASES.map(function () { return null; }), cur: 0, joined: false, consent: "" };
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && Array.isArray(s.answers) && s.answers.length === CASES.length) {
        state.answers = s.answers.map(function (a, i) { return opt(i, a) ? a : null; });
      }
    } catch (e) { /* gizli sekme vb. */ }
    loadList();
    state.cur = firstOpen();
    if (state.cur === -1) state.cur = CASES.length - 1;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ answers: state.answers })); } catch (e) { /* yok say */ }
  }
  // bildirim listesi sayıdan bağımsız; eski "wishceo.s001" kaydındaki onay buraya taşınır
  function loadList() {
    try {
      var l = JSON.parse(localStorage.getItem(LIST_KEY) || "null"), migrate = false;
      if (!l) { l = JSON.parse(localStorage.getItem("wishceo.s001") || "null"); migrate = !!(l && l.joined); }
      if (l) { state.joined = !!l.joined; state.consent = typeof l.consent === "string" ? l.consent : ""; }
      if (migrate) saveList();
    } catch (e) { /* gizli sekme vb. */ }
  }
  function saveList() {
    try { localStorage.setItem(LIST_KEY, JSON.stringify({ joined: state.joined, consent: state.consent })); } catch (e) { /* yok say */ }
  }
  function optOf(c, k) { return c.opts.filter(function (o) { return o.k === k; })[0] || null; }
  function opt(i, k) { return optOf(CASES[i], k); }
  function firstOpen() { for (var i = 0; i < CASES.length; i++) if (!state.answers[i]) return i; return -1; }
  function done() { return firstOpen() === -1; }

  // ---------- yardımcılar ----------
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function tier(s) { return s >= 80 ? "hi" : s >= 50 ? "mid" : "lo"; }
  function reduced() { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function site() { return /(^|\.)wishceo\.com$/.test(location.hostname) ? "https://wishceo.com" : location.origin; }

  // ---------- oyun ----------
  var elSteps, elCase, elReport;

  function renderSteps() {
    var open = firstOpen();
    elSteps.innerHTML = CASES.map(function (c, i) {
      var a = state.answers[i], o = a && opt(i, a);
      var cls = "step" + (i === state.cur ? " is-cur" : "") + (o ? " is-done t-" + tier(o.s) : "");
      var can = o || i === open;
      return '<li><button type="button" class="' + cls + '" data-i="' + i + '"' + (can ? "" : " disabled") +
        (i === state.cur ? ' aria-current="step"' : "") + '>' +
        '<span class="step-n">' + pad(i + 1) + '</span><span class="step-t">' + esc(c.title) + '</span>' +
        '<span class="step-s">' + (o ? o.s : "—") + '</span></button></li>';
    }).join("");
  }

  function renderCase(focus) {
    var i = state.cur, c = CASES[i], a = state.answers[i];
    var html =
      '<header class="case-head"><span>Dosya ' + pad(i + 1) + " / " + pad(CASES.length) + "</span><span>" + esc(c.area) + "</span></header>" +
      '<div class="case-main">' +
      '<p class="case-meta">' + esc(c.place[0] + c.place[1]) + "</p>" +
      '<h3 class="case-title" tabindex="-1">' + esc(c.title) + "</h3>" +
      '<p class="case-co">' + esc(c.company) + "</p>" +
      '<div class="case-body">' + c.body.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>" +
      '<dl class="stats">' + c.stats.map(function (s) { return "<div><dt>" + esc(s[0]) + "</dt><dd>" + esc(s[1]) + "</dd></div>"; }).join("") + "</dl>" +
      '<p class="ask">' + esc(c.ask) + "</p>" +
      '<div class="opts" role="group" aria-label="Seçenekler">' +
      c.opts.map(function (o) {
        var cls = "opt" + (a ? (o.k === a ? " is-picked" : " is-dim") : "") + (a && o.k === c.real.k ? " is-real" : "");
        return '<button type="button" class="' + cls + '" data-k="' + o.k + '"' + (a ? ' aria-disabled="true"' : "") + ">" +
          '<span class="opt-k">' + o.k + '</span><span class="opt-t">' + esc(o.t) + "</span>" +
          (a && o.k === c.real.k ? '<span class="opt-real">Vakadaki CEO</span>' : "") + "</button>";
      }).join("") +
      "</div></div>";
    if (a) html += afterHtml(i);
    elCase.innerHTML = html;
    renderSteps();
    if (focus) {
      var t = $(".case-title", elCase);
      t.focus({ preventScroll: true });
      var top = elSteps.getBoundingClientRect().top + scrollY - 12;
      if (Math.abs(scrollY - top) > 40) scrollTo({ top: top, behavior: reduced() ? "auto" : "smooth" });
    }
  }

  function afterHtml(i) {
    var c = CASES[i], o = opt(i, state.answers[i]), ro = opt(i, c.real.k), diff = o.s - ro.s, last = i === CASES.length - 1;
    var cmp = o.k === c.real.k ? "Vakadaki CEO ile aynı kararı verdin."
      : diff > 0 ? "Vakadaki CEO’dan " + diff + " puan iyi. Yönetim kurulu not aldı."
      : "Vakadaki CEO’nun kararı " + (-diff) + " puan daha iyiydi.";
    return '<div class="after">' +
      '<div class="verdict t-' + tier(o.s) + '" tabindex="-1">' +
      '<div class="stamp' + (reduced() ? "" : " anim") + '" aria-hidden="true"><b>' + o.s + "</b><span>puan</span></div>" +
      '<p class="lbl">Senin kararın · ' + o.k + "</p>" +
      '<p class="verdict-r">' + esc(o.r) + "</p>" +
      '<p class="sr">Puanın: ' + o.s + " / 100</p>" +
      "</div>" +
      '<div class="truth">' +
      '<p class="lbl">Vakada ne oldu</p>' +
      '<p class="truth-who">' + esc(c.real.who) + " <span>" + esc(c.real.role) + " · seçimi " + c.real.k + "</span></p>" +
      c.real.text.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
      '<p class="truth-cmp">' + esc(cmp) + "</p>" +
      '<p class="truth-note">Bu dosya gerçek bir olaya dayanıyor; şirket, ürün ve kişi adları değiştirildi.</p>' +
      "</div>" +
      '<div class="after-nav"><button type="button" class="btn btn-ink" data-act="' + (last || done() ? "report" : "next") + '">' +
      (done() ? "CEO karnemi göster" : "Sonraki dosya") + ' <span aria-hidden="true">→</span></button></div>' +
      "</div>";
  }

  function pick(k) {
    var i = state.cur;
    if (state.answers[i] || !opt(i, k)) return;
    state.answers[i] = k;
    save();
    renderCase(false);
    var v = $(".after", elCase);
    if (v) {
      var vd = $(".verdict", v);
      if (vd) vd.focus({ preventScroll: true });
      var r = v.getBoundingClientRect();
      if (r.top > innerHeight * 0.6) scrollTo({ top: scrollY + r.top - innerHeight * 0.25, behavior: reduced() ? "auto" : "smooth" });
    }
    if (done()) renderReport();
  }

  // ---------- karne ----------
  function result() {
    var count = {}, sum = {}, total = 0;
    state.answers.forEach(function (k, i) {
      var o = opt(i, k);
      count[o.tag] = (count[o.tag] || 0) + 1;
      sum[o.tag] = (sum[o.tag] || 0) + o.s;
      total += o.s;
    });
    var type = TAG_ORDER.slice().sort(function (x, y) {
      return (count[y] || 0) - (count[x] || 0) || (sum[y] || 0) - (sum[x] || 0) || TAG_ORDER.indexOf(x) - TAG_ORDER.indexOf(y);
    })[0];
    var score = Math.round(total / CASES.length);
    var board = score >= 80 ? "Yönetim kurulu seni sevdi." : score >= 60 ? "Yönetim kurulu seni izliyor."
      : score >= 40 ? "Yönetim kurulu acil toplantı istedi." : "Yönetim kurulu yeni CEO arıyor.";
    var real = Math.round(CASES.reduce(function (t, c, i) { return t + opt(i, c.real.k).s; }, 0) / CASES.length);
    return { type: type, score: score, board: board, real: real };
  }

  function squares() {
    return state.answers.map(function (k, i) { var t = tier(opt(i, k).s); return t === "hi" ? "🟩" : t === "mid" ? "🟨" : "🟥"; }).join("");
  }
  function shareText() {
    var r = result();
    return "WishCEO · Sayı " + ISSUE + "\n" + squares() + " " + r.score + "/100\nCEO tipim: " + TYPES[r.type].name + "\nSen olsan ne yapardın?";
  }

  function renderReport() {
    if (!done()) { elReport.hidden = true; return; }
    var r = result(), t = TYPES[r.type];
    elReport.innerHTML =
      '<div class="report-card">' +
      '<header class="case-head"><span>CEO karnesi</span><span>Sayı ' + ISSUE + "</span></header>" +
      '<div class="report-grid">' +
      '<div class="report-type">' +
      '<p class="lbl">CEO tipin</p>' +
      '<h3 tabindex="-1">' + esc(t.name) + "</h3>" +
      '<p class="report-desc">' + esc(t.desc) + "</p>" +
      "</div>" +
      '<div class="report-score">' +
      '<p class="lbl">Ortalama puan</p>' +
      '<p class="big"><b>' + r.score + "</b><span>/100</span></p>" +
      '<p class="board">' + esc(r.board) + "</p>" +
      '<p class="vs">Vakadaki CEO’ların ortalaması: ' + r.real + "</p>" +
      "</div></div>" +
      '<table class="rows"><caption class="sr">Dosya dosya kararların</caption>' +
      "<thead><tr><th scope=\"col\">Dosya</th><th scope=\"col\">Sen</th><th scope=\"col\">Gerçek</th><th scope=\"col\">Puan</th></tr></thead><tbody>" +
      CASES.map(function (c, i) {
        var o = opt(i, state.answers[i]);
        return '<tr><th scope="row"><span class="n">' + pad(i + 1) + "</span> " + esc(c.title) + "</th><td>" + o.k + "</td><td>" + c.real.k +
          '</td><td><span class="pill t-' + tier(o.s) + '">' + o.s + "</span></td></tr>";
      }).join("") +
      "</tbody></table>" +
      '<div class="share">' +
      '<button type="button" class="btn btn-ink" data-act="share">Sonucumu paylaş</button>' +
      '<a class="btn btn-line" data-net="wa" target="_blank" rel="noopener">WhatsApp</a>' +
      '<a class="btn btn-line" data-net="x" target="_blank" rel="noopener">X</a>' +
      '<a class="btn btn-line" data-net="li" target="_blank" rel="noopener">LinkedIn</a>' +
      '<button type="button" class="btn btn-ghost" data-act="reset">Baştan oyna</button>' +
      "</div>" +
      '<p class="share-msg" role="status" aria-live="polite"></p>' +
      '<a class="report-cta" href="#liste">Yeni sayı çıkınca haber verelim mi? <b>Bildirim al</b> <span aria-hidden="true">↓</span></a>' +
      "</div>";
    var url = site() + "/?s=" + ISSUE, text = shareText();
    $('[data-net="wa"]', elReport).href = "https://wa.me/?text=" + encodeURIComponent(text + "\n" + url);
    $('[data-net="x"]', elReport).href = "https://x.com/intent/post?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url);
    $('[data-net="li"]', elReport).href = "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url);
    elReport.hidden = false;
  }

  function showReport() {
    renderReport();
    var top = elReport.getBoundingClientRect().top + scrollY - 16;
    scrollTo({ top: top, behavior: reduced() ? "auto" : "smooth" });
    var h = $("h3", elReport);
    if (h) h.focus({ preventScroll: true });
  }

  function share() {
    var text = shareText(), url = site() + "/?s=" + ISSUE, msg = $(".share-msg", elReport);
    if (navigator.share) {
      navigator.share({ text: text, url: url }).catch(function (e) { if (e && e.name !== "AbortError") copy(text + "\n" + url, msg); });
      return;
    }
    copy(text + "\n" + url, msg);
  }
  function copy(s, msg) {
    var ok = function () { msg.textContent = "Sonucun panoya kopyalandı. İstediğin yere yapıştır."; };
    var fail = function () { msg.textContent = "Kopyalanamadı. Metni elle seç: " + s.replace(/\n/g, " · "); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(ok, fail);
    else fail();
  }

  function reset() {
    state.answers = CASES.map(function () { return null; });
    state.cur = 0;
    save();
    elReport.hidden = true;
    elReport.innerHTML = "";
    renderCase(true);
  }

  // ---------- bildirim listesi ----------
  function initWaitlist() {
    var f = $("#wl"), input = $("#wl-email"), ok = $("#wl-ok"), btn = $("button", f), msg = $(".wl-status", f), busy = false;
    var label = btn.textContent;
    function say(s, kind) { msg.textContent = s; msg.className = "wl-status" + (kind ? " is-" + kind : ""); }
    function joined() {
      f.classList.add("is-done");
      input.disabled = true;
      btn.disabled = true;
      btn.textContent = "Listedesin";
      // Onay kutusu gelmeden önce yazılanların onay kaydı yok: kutuyu işaretli göstermeyelim
      ok.checked = !!state.consent;
      ok.disabled = true;
      ok.closest(".wl-check").hidden = !state.consent;
      say("Listedesin. Yeni sayı çıktığında haber vereceğiz.", "ok");
    }
    if (state.joined) joined();
    ok.addEventListener("change", function () { if (ok.checked) ok.removeAttribute("aria-invalid"); });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy || state.joined) return;
      var email = input.value.trim();
      if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(email)) {
        input.setAttribute("aria-invalid", "true");
        say("Geçerli bir e-posta adresi yaz.", "err");
        input.focus();
        return;
      }
      input.removeAttribute("aria-invalid");
      if (!ok.checked) {
        ok.setAttribute("aria-invalid", "true");
        say("Bildirim almak için e-posta onayı kutusunu işaretle.", "err");
        ok.focus();
        return;
      }
      ok.removeAttribute("aria-invalid");
      var at = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
      var fields = [["E-posta", email], ["Onay", "evet · yeni sayı duyurusu e-postası (6563 md. 6) · " + at],
        ["Liste", "WishCEO yeni sayı bildirimi · Sayı " + ISSUE]];
      if (done()) {
        var r = result();
        fields.push(["CEO tipi", TYPES[r.type].name], ["Puan", r.score + "/100"],
          ["Kararlar", state.answers.map(function (k, i) { return pad(i + 1) + ":" + k; }).join(" ")]);
      } else {
        fields.push(["Oyun", "Bitirmedi (" + state.answers.filter(Boolean).length + "/" + CASES.length + ")"]);
      }
      busy = true;
      btn.disabled = true;
      btn.textContent = "Kaydediliyor…";
      say("", "");
      fetch(FORM_END, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ page: location.pathname || "/", fields: fields, hp: $(".hp", f).value })
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (j) {
            if (res.status === 429) throw new Error("rate");
            if (!res.ok || !j.ok) throw new Error("fail");
          });
        })
        .then(function () { state.joined = true; state.consent = at; saveList(); joined(); })
        .catch(function (err) {
          btn.disabled = false;
          btn.textContent = label;
          say(err && err.message === "rate" ? "Çok fazla deneme oldu. Birkaç dakika sonra tekrar dene."
            : "Kaydedemedik. Bağlantını kontrol edip tekrar dene.", "err");
        })
        .then(function () { busy = false; });
    });
  }

  // ---------- sayfa: sayı bilgisi ve arşiv ----------
  var WORDS = ["", "Bir", "İki", "Üç", "Dört", "Beş", "Altı"];
  var WORDS_LO = ["", "bir", "iki", "üç", "dört", "beş", "altı"];
  function yearOf(c) { return (c.place[1] || "").replace(/^\s*·\s*/, ""); }
  function fillPage() {
    var n = CASES.length;
    Array.prototype.forEach.call(document.querySelectorAll("[data-issue]"), function (el) { el.textContent = "Sayı " + ISSUE; });
    var intro = $("#oyun-intro");
    if (intro && WORDS[n]) intro.textContent = WORDS[n] + " şirket, " + WORDS_LO[n] + " kriz. Hangisinde vakadaki CEO’dan daha iyi iş çıkarırsın?";
    var meta = $("#hero-meta");
    if (meta) meta.textContent = n + " dosya · " + n + " karar · 1 CEO karnesi · Üyelik yok";
    var idx = $("#index-list");
    if (idx) idx.innerHTML = CASES.map(function (c, i) {
      var y = yearOf(c);
      return '<li><a href="#oyun"><span class="n">' + pad(i + 1) + '</span><span class="t">' + esc(c.title) +
        '</span><span class="m">' + esc(c.area + " · " + c.place[0] + (y ? ", " + y : "")) + "</span></a></li>";
    }).join("");
    // şerit hep en son açılan sayıyı gösterir (?s= ile eski sayı açılsa da); ileri tarihli sayılar RELEASED'da yok
    var NEWEST = RELEASED[RELEASED.length - 1];
    var tick = '<span>Sayı ' + NEWEST.no + ' · En yeni <b class="up">▲</b></span>' + NEWEST.cases.map(function (c, i) {
      var y = yearOf(c);
      return "<span>Dosya " + pad(i + 1) + " · " + esc(c.place[0] + (y ? ", " + y : "")) + " · " + esc(c.title) + ' <b class="dn">▼</b></span>';
    }).join("") + (RELEASED.length > 1 ? '<span>Arşiv · önceki sayılar açık <b class="up">▲</b></span>' : '<span>Yeni sayılar yolda <b class="up">▲</b></span>');
    Array.prototype.forEach.call(document.querySelectorAll(".ticker-group"), function (g) { g.innerHTML = tick; });
  }
  function avgScore(iss) {
    try {
      var s = JSON.parse(localStorage.getItem(keyOf(iss.no)) || "null");
      if (!s || !Array.isArray(s.answers) || s.answers.length !== iss.cases.length) return null;
      var sum = 0;
      for (var i = 0; i < iss.cases.length; i++) {
        var o = optOf(iss.cases[i], s.answers[i]);
        if (!o) return null;
        sum += o.s;
      }
      return Math.round(sum / iss.cases.length);
    } catch (e) { return null; }
  }
  function renderArchive() {
    var sec = $("#arsiv"), list = $("#arsiv-list");
    if (!sec || !list) return;
    var items = RELEASED.filter(function (x) { return x !== CUR; }).reverse();
    if (!items.length) { sec.hidden = true; return; }
    list.innerHTML = items.map(function (x) {
      var sc = avgScore(x);
      var m = "Sayı " + x.no + (x.no === LATEST ? " · En yeni" : "") + " · " + x.cases.length + " dosya" + (sc === null ? "" : " · Karnen " + sc + "/100");
      return '<li><a href="/?s=' + x.no + '#oyun"><span class="bl-m">' + esc(m) + '</span><span class="bl-t">' +
        esc(x.cases.map(function (c) { return c.company; }).join(", ")) + "</span></a></li>";
    }).join("");
    sec.hidden = false;
  }

  // ---------- başlat ----------
  function init() {
    elSteps = $("#steps");
    elCase = $("#case");
    elReport = $("#report");
    if (elSteps) { elSteps.style.setProperty("--n", CASES.length); elSteps.classList.toggle("many", CASES.length > 3); }
    var d = $("#today");
    if (d) try { d.textContent = new Date(CUR.date + "T12:00:00+03:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" }); } catch (e) { /* sabit tarih kalsın */ }
    var tk = $(".ticker-stop");
    if (tk) {
      tk.hidden = false;
      tk.addEventListener("click", function () {
        var p = tk.getAttribute("aria-pressed") !== "true";
        tk.setAttribute("aria-pressed", String(p));
        tk.textContent = p ? "▶" : "❚❚";
        tk.parentNode.classList.toggle("is-paused", p);
      });
    }
    fillPage();
    renderArchive();
    load();
    renderCase(false);
    renderReport();

    elCase.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.k) return pick(b.dataset.k);
      if (b.dataset.act === "next") { state.cur = firstOpen(); renderCase(true); }
      if (b.dataset.act === "report") showReport();
    });
    elSteps.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || b.disabled) return;
      state.cur = +b.dataset.i;
      renderCase(true);
    });
    elReport.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.act === "share") share();
      if (b.dataset.act === "reset") reset();
    });
    initWaitlist();
  }

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
