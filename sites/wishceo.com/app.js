// WishCEO: sayı sayı CEO oyunu, arşiv, CEO karnesi, paylaşım ve yeni sayı bildirimi.
// Vakalar gerçek şirket krizlerinden uyarlanmıştır; şirket, ürün ve kişi adları kurgusaldır, rakamlar yuvarlanmıştır. Dosyalarda dış bağlantı yoktur.
(function () {
  "use strict";

  var FORM_END = "https://corner-forms.berkay-999.workers.dev/submit";
  var LIST_KEY = "wishceo.liste";

  // tag: karnede CEO tipini belirler (cerrah, kalkan, kumar, kasa)
  var S001 = [
    {
      area: "Kriz yönetimi",
      place: ["Hindistan", " · 2000’lerin başı"],
      company: "Mervale India · Velora",
      title: "Bayram öncesi rafta kurt",
      body: [
        "Velora, Hindistan’ın en çok satan sütlü çikolatası. Pazarın kabaca dörtte üçü sende ve yılın en büyük satış dönemi olan bayram sezonu birkaç hafta sonra başlıyor.",
        "Bir eyaletin gıda denetim kurumu, şikâyet üzerine incelediği birkaç Velora paketinde böcek ve kurt bulunduğunu açıklıyor ve eyalet genelinde stoklara el koyuyor. Görüntüler her akşam haber bültenlerinde.",
        "Fabrika denetimlerinde sorun çıkmıyor; asıl şüpheli, ürünün sıcak ve nemli dükkânlarda uzun süre beklemesi. Ama ince folyo ambalaj sızdırmaz değil ve anne babalar çocuklarına aldıkları çikolatayı sorguluyor."
      ],
      stats: [["Pazar payı", "~%70+"], ["Kusurlu paket", "Birkaç tane"], ["Bayram sezonuna", "Birkaç hafta"]],
      ask: "Mervale India’nın başındasın. İlk hamlen ne?",
      opts: [
        { k: "A", t: "Sorunlu eyaletteki bütün stoğu, maliyeti ne olursa olsun hemen toplat. Ambalajı sonra düşünürsün.", s: 55, tag: "cerrah",
          r: "Hızlı ve görünür bir adım. Ama asıl açık ambalajda; aynı folyo rafa döndükçe aynı haber başka bir eyalette yine çıkabilir." },
        { k: "B", t: "Fabrikada sorun olmadığını, suçun dükkânlardaki kötü depolamada olduğunu açıkla; bayram kampanyasını aynen sürdür.", s: 20, tag: "kasa",
          r: "Teknik olarak kısmen haklısın. Ama tüketiciye “suç bakkalda” demek kibirli duyulur; güven sorusu yine markana döner." },
        { k: "C", t: "Velora’yı kendi cebinden mühürlü, sızdırmaz bir ambalaja geçir; bayileri depolama konusunda eğit, açıkça konuş ve güvenilen bir yüzle “içiniz rahat olsun” de.", s: 90, tag: "kalkan",
          r: "Pahalı ve yavaş: yeni ambalaj aylar sürer ve maliyeti artırır. Ama sorunun kökünü kapatıyor ve aileye “seni ciddiye alıyorum” diyorsun." },
        { k: "D", t: "Velora’yı bir süreliğine raftan tamamen kaldır; bayramdan sonra yeni adla ve yeni tarifle geri dön.", s: 25, tag: "kumar",
          r: "En büyük satış sezonunu rakiplere bırakıyorsun. Üstelik onlarca yılda kurulmuş bir adı silmek, sorunun sandığından büyük olduğu izlenimini verir." }
      ],
      real: {
        who: "Vikram Sethna",
        role: "Mervale India genel müdürü",
        k: "B",
        text: [
          "Şirketin ilk tepkisi savunmaydı: sorunu fabrikaya değil, dükkânlardaki kötü depolamaya bağladı. Basın bunu soğuk buldu ve bayram sezonunda satışlar ciddi düştü.",
          "Ardından yön değişti. Şirket yüz binlerce dükkâna ulaşan bir bayi eğitim programı başlattı, Velora’yı birkaç ay içinde daha pahalı, mühürlü bir ambalaja geçirdi ama fiyatı artırmadı. Ülkenin en sevilen oyuncularından biri kampanyanın yüzü oldu.",
          "Pazar payı birkaç puan geriledi, ertesi yıl satışlarla birlikte toparlandı. Vaka Hindistan’da kriz iletişimi derslerinde iki yüzüyle anlatılıyor: geç kalan savunma ve ardından gelen somut düzeltme."
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
        "Ürün yelpazesi şişti. Yeni setler yalnızca bir kez kullanılan özel parçalarla dolu; kalıplar, depolar, maliyetler patladı. Satışlar düşüyor, şirket zarar ediyor, kasadaki para hızla eriyor.",
        "Aile, otuzlu yaşlarındaki eski bir danışmanı CEO yaptı. O kişi sensin."
      ],
      stats: [["Kuruluş", "1930’lar"], ["Tema parkı", "Birkaç"], ["Son bilanço", "Zarar"]],
      ask: "Neyi değiştirirsin?",
      opts: [
        { k: "A", t: "Daha çok yenilik: yeni dijital ürünler, yeni filmler, yeni parklar. Büyüyerek çıkarız.", s: 15, tag: "kumar",
          r: "Şirketi bu hâle getiren tam da buydu. Kasa boşalırken yeni cephe açmak batışı hızlandırır." },
        { k: "B", t: "Küçül ve odaklan: parça çeşidini azalt, parkları sat, ana ürüne, tuğlaya dön.", s: 95, tag: "cerrah",
          r: "Acı bir liste: projeler kapanır, bazı ekipler gider. Ama ilk kez herkes şirketi neyin ayakta tuttuğunu biliyor." },
        { k: "C", t: "Üretimi ucuz bir ülkeye taşı, maliyeti kes. Kalite biraz düşse de idare eder.", s: 40, tag: "kasa",
          r: "Maliyet düşer ama Tumla’yı Tumla yapan şey parçaların milimetrik oturması; kaliteden kısarsan elinde sıradan bir oyuncak kalır. Üretimin bir kısmı gerçekten Macaristan, Çek Cumhuriyeti ve Meksika’ya taşındı, ama şirketi kurtaran bu olmadı." },
        { k: "D", t: "Şirketi büyük bir rakibe sat. Aile hiç değilse parasını alsın.", s: 25, tag: "kasa",
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
        "Korvala dünyada en çok telefon satan şirket. Neredeyse herkesin cebinde bir Korvala var ya da yakın zamana kadar vardı.",
        "Ama birkaç yıl önce Amerikalı bir bilgisayar şirketi dokunmatik telefonunu çıkardı, arama motoru devinin ücretsiz sistemi de hızla yayılıyor. Şirketin kendi akıllı telefon sistemi eskidi, uygulama geliştiriciler ilgisini kaybetti. Ortaklıkla geliştirilen yeni sistem ise henüz hazır değil.",
        "Akıllı telefonda pazar payı eriyor, hisse düşüyor. Yeni CEO sensin ve bir platform seçmek zorundasın."
      ],
      stats: [["Telefon satışında", "Dünya 1.si"], ["İşletim sistemi", "Kendi, eski"], ["Rakipler", "ABD’li iki dev"]],
      ask: "Hangi yola girersin?",
      opts: [
        { k: "A", t: "Arama motoru devinin ücretsiz sistemine geç. Herkesin kullandığı yere katıl, farkı donanım ve tasarımla yarat.", s: 75, tag: "cerrah",
          r: "Asyalı dev üreticilerle aynı sistemde yarışmak zor ama uygulamalar ve kullanıcılar hazır. Sonradan bazı yorumcular Korvala’nın bu yolu seçmesi gerektiğini savundu." },
        { k: "B", t: "Yazılım devi Tallbridge’le ortaklık kur, akıllı telefonlarında ana sistem olarak onun telefon sistemini seç.", s: 35, tag: "kumar",
          r: "Tallbridge para ve destek veriyor, sen de en büyük ortağı oluyorsun. Ama şirketin geleceğini pazarın henüz çok küçük bir kısmını tutan bir sisteme bağlıyorsun." },
        { k: "C", t: "Geliştirmekte olduğumuz yeni sistemi bitir, yolumuza bağımsız devam edelim.", s: 45, tag: "kumar",
          r: "Bağımsız kalırsın ama yarışa yıllar geç girersin. Geliştiriciler üçüncü bir sistemi bekleyecek mi?" },
        { k: "D", t: "Akıllı telefonu bırak; ucuz ve sağlam telefonlarda dünya lideri olarak kal.", s: 25, tag: "kasa",
          r: "Bugünü kurtarır, yarını kaybettirir. Ucuz telefon pazarı da birkaç yıl içinde akıllı telefona dönecek." }
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
        { k: "A", t: "Fiyatla vur. Durgunlukta insanlar ucuz arıyor; iki pizzaya kalıcı indirim yap, reklam bütçesinin tamamını kampanyaya ver.", s: 20, tag: "kasa",
          r: "Siparişler kısa süre artar ama rakipler aynı indirimi ertesi hafta yapar. Marj erir, lezzet sorunu yerinde durur." },
        { k: "B", t: "Yeni tarifi önce birkaç şehirde dene. Sonuç iyiyse yıl içinde ülkeye yay; şube sahiplerine zaman tanı, reklamda yalnızca “yeni tarif” de.", s: 50, tag: "kalkan",
          r: "Riski küçültürsün, şube sahipleri de rahat eder. Ama sessiz bir değişiklik, yıllardır pizzanı beğenmeyen müşteriyi geri çağırmaya yetmeyebilir." },
        { k: "C", t: "Yeni tarife bütün ülkede tek seferde geç. Reklamlarda müşterilerin “hamur karton gibi” eleştirilerini kendin göster, beğenmeyene parasını geri ver.", s: 85, tag: "kumar",
          r: "Kendi ürününü televizyonda kötülemek büyük risk; yeni pizza da beğenilmezse ikinci şansın olmaz. Tutarsa insanlar markana yeniden bakar." },
        { k: "D", t: "Lezzet tartışmasına girme, gücüne odaklan: menüyü sadeleştir, kârsız ürünleri kes, parayı teslimat hızına ve internetten siparişe yatır.", s: 40, tag: "cerrah",
          r: "Teslimatta zaten iyisin, internetten sipariş de büyüyor; maliyetler düşer. Ama pizzayı beğenmeyen müşteriyi hızlı teslimat geri getirmez." }
      ],
      real: {
        who: "Owen Ballard",
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
          r: "Zam can sıkar ama yumuşak geçer, sadık üyeni korursun. Gelir artar; DVD’nin yükü ise bir süre daha internet büyümesini yavaşlatır." },
        { k: "C", t: "Fiyata dokunma, üyeyi ürkütme. Yeni lisans anlaşması imzalama; içerik harcamasını bu yıl sabit tutup kârı koru.", s: 25, tag: "kasa",
          r: "Üyeler memnun, çeyrek kârlı görünür. Ama rakipler kataloglarını büyütürken sen yerinde sayarsın; internetteki kataloğun eskir." },
        { k: "D", t: "Saldırıya geç: internet paketini 6 dolar civarına indir, borç alıp içerik harcamasını ikiye katla. Pazarı rakiplerden önce kap.", s: 35, tag: "kumar",
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
      title: "Fiyat savaşındaki çipçi",
      body: [
        "Brenmark yaklaşık yirmi yıl önce kuruldu. İlk büyük başarısı bellek çipleriydi: ürünü pazara ilk süren, işi sıfırdan kuran oydu. Pek çok çalışan belleğe hâlâ duygusal olarak bağlı.",
        "Şimdi sermayesi güçlü Japon devleri daha ucuz ve daha iyi bellek üretiyor; verimleri belirgin biçimde yüksek. Dolar değer kazandı, fiyat kırma ve damping başladı. Geçen yılın sonunda talep de çöktü: kapasite fazlası var, fiyatlar serbest düşüşte.",
        "Öte yandan bir zamanlar yan iş olan işlemciler kişisel bilgisayarlarda standart hâline geldi; yeni nesil 32 bitlik B32 yolda. Yönetim bir yıldır karar veremeden dolanıyor. Şirketin başkanı sensin. Kurucu ortak ve CEO Walter Enright’la odada yalnızsınız."
      ],
      stats: [["Kuruluş", "1960’ların sonu"], ["Bellek pazar payı", "Çok küçük"], ["B32’ye yatırılan", "Yüz milyon $ civarı"]],
      ask: "Hangi yola girersin?",
      opts: [
        { k: "A", t: "Bellekte kal ve savaş: yeni nesil çiplere rakiplerden fazla yatırım yap, fiyatta geri adım atma.", s: 20, tag: "kumar",
          r: "Kimliği korursun ama verimde bu kadar gerideyken her yeni nesil daha büyük zarar demek. Bellek savaşı, işlemcilere lazım olan parayı yakar." },
        { k: "B", t: "Washington’a git: damping şikâyeti aç, koruma iste. Bu arada bir Japon ortakla üretim anlaşması yap, zaman kazan.", s: 40, tag: "kasa",
          r: "Koruma bir işe yarar: şirket başka bir bellek türünde damping şikâyetini kazandı ve pazar payını korudu. Ama maliyet farkı kapanmaz, karar yalnızca ertelenir." },
        { k: "C", t: "Kimseyi çıkarma. Herkes maaşından fedakârlık etsin, fabrikalar açık kalsın; pazar düzelince toparlanırız.", s: 30, tag: "kalkan",
          r: "Ekip ve güven korunur. Ama masraflar çok daha büyük bir şirkete göre kurulu, ciro ise neredeyse yarıya iniyor; fedakârlık bu farkı kapatmaz." },
        { k: "D", t: "Bellek savaşından çekil. Fabrikaları kapat, kadroyu küçült; parayı ve en iyi ekipleri işlemcilere ver.", s: 92, tag: "cerrah",
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
        "Fennick köklü bir çizgi roman şirketi. Yaklaşık on yıl önce iflas başvurusu yaptı, iki yıl süren bir kavgadan sonra ayağa kalkabildi. Bugün parasını karakterlerini film stüdyolarına lisanslayarak kazanıyor.",
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
          "Zırhlı mucit Quillon’un hakları ertesi yıl başka bir stüdyodan geri dönünce ilk film için o seçildi. Birkaç yıl sonra vizyona giren film dünyada yarım milyar doları aşkın hasılat yaptı. Ertesi yıl dünyanın en büyük eğlence şirketlerinden biri Fennick’i milyarlarca dolara satın almak için anlaştı."
        ]
      }
    },
    {
      area: "Kriz yönetimi",
      place: ["Güney Kore", " · 2010’ların ortası"],
      company: "Jinsol Elektronik · Arden Pro",
      title: "Cepteki kıvılcım",
      body: [
        "Arden Pro, Jinsol’un yılın en iddialı telefonu: büyük ekran, kalem, yaklaşık 900 dolarlık fiyat. Satışa çıkalı iki hafta oldu, on pazarda raflarda.",
        "Sonra haberler geliyor: ısınıp alev alan telefonlar. İlk günlerde onlarca vaka bildirildi. İç inceleme sorunu batarya hücresinde görüyor; Çin’de satılan cihazlarda başka bir batarya kullanılıyor.",
        "Milyonlarca cihaz satıldı; bunların bir milyondan fazlası kullanıcıların elinde, gerisi depolarda ve yolda. Oran çok düşük, ama yanan her telefonun fotoğrafı ürünün adıyla dolaşıyor."
      ],
      stats: [["Satılan cihaz", "Milyonlarca"], ["Bildirilen vaka", "Onlarca"], ["Satışta", "~2 hafta"]],
      ask: "Jinsol’un mobil biriminin başındasın. İlk hamlen ne?",
      opts: [
        { k: "A", t: "Satışa devam et; servislerde ücretsiz batarya kontrolü yap, sorunlu çıkanları tek tek değiştir.", s: 15, tag: "kasa",
          r: "Oran düşük diye beklemek ucuz görünür. Ama satış sürerken çıkan her yeni yangın markanın tamamına yazılır ve kararı senin yerine başkaları verir." },
        { k: "B", t: "Satışı durdur, bütün cihazları geri çağır; müşteriyi bekletmeden birkaç hafta içinde yenisiyle değiştir.", s: 55, tag: "kalkan",
          r: "Hızlı ve cesur; güven için doğru refleks. Ama değişimi haftalara sığdırmak, kök nedenden emin olmadan yeni cihaz göndermek demekti." },
        { k: "C", t: "Satışı durdur, bütün cihazları geri çağır; sezon kaçsa da neden doğrulanmadan yeni cihaz gönderme.", s: 75, tag: "cerrah",
          r: "Sezonu kaybedersin, rakipler boşluğu doldurur. Ama ikinci bir partinin de yanma riskini küçültürsün. Sonradan yapılan bağımsız inceleme iki ayrı batarya kusuru buldu." },
        { k: "D", t: "Satışı sürdür, yalnızca sorunlu üretim partilerini topla; şarjı yazılım güncellemesiyle sınırla.", s: 20, tag: "kumar",
          r: "Maliyeti sınırlı tutar, satışı korursun. Ama sorunlu partiden emin değilsen her yeni vaka “neden hepsini toplamadınız?” sorusunu doğurur." }
      ],
      real: {
        who: "Yoon Tae-min",
        role: "Jinsol’un mobil biriminin başkanı",
        k: "B",
        text: [
          "Yoon birkaç gün içinde satışı durdurdu ve satılmış bütün Arden Pro’ların yenisiyle değiştirileceğini açıkladı. Değişim cihazları kısa sürede müşterilere gönderilmeye başladı.",
          "Ama değişim cihazlarında da yanma vakaları görüldü. Yaklaşık bir ay sonra satış ve değişim yeniden durduruldu, ertesi gün üretime tamamen son verildi; kullanıcılara para iadesi ya da başka bir telefon önerildi. Hisse bir günde belirgin biçimde düştü; geri çağırmanın maliyeti milyarlarca dolar olarak açıklandı.",
          "Birkaç ay sonra bağımsız laboratuvarlarla yürütülen inceleme, iki ayrı tedarikçinin bataryalarında iki farklı kusur buldu. Satılan ve etkinleştirilen milyonlarca cihazın neredeyse tamamı geri dönmüştü. Şirket çok adımlı yeni bir batarya güvenlik kontrolü getirdi."
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
        "Yazılım devi Tessarc bu ay teklifini açıkladı: hisse başı 30 dolar civarı, yarısı nakit yarısı hisse, toplam kırk milyar doları aşkın. Bu, bir önceki kapanışın yüzde altmış kadar üstü. Ama hissen iki yıl önce 40 doları aşmıştı ve bir yıl önce gelen birleşme önerisini zaten geri çevirmiştin."
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
          "Voss ve yönetim kurulu teklifi hızla geri çevirdi; onlara göre rakam şirketin değerini yansıtmıyordu. Pazarlık aylarca sürdü. Tessarc teklifi birkaç milyar dolar artırmaya hazırdı; Voss ve diğer kurucu ortak bundan da yüksek bir fiyat istedi.",
          "Birkaç ay sonra Tessarc teklifini geri çekti. Ertesi işlem gününde Kestrin hissesi sert düştü. Kestrin, reklam alanının bir kısmını arama liderine bırakan bir anlaşmaya yöneldi; yıl bitmeden arama lideri bu anlaşmadan çekildi.",
          "Yıl sonuna doğru hisse teklifin üçte birinin altındaydı. Tessarc anlaşmasını kapatamadığı için sert eleştirilen Voss, bir yılı aşkın süre sonra CEO’luğu bırakacağını açıkladı."
        ]
      }
    },
    {
      area: "Dönüşüm",
      place: ["Japonya", " · 2000’lerin başı"],
      company: "Hoshimura",
      title: "Pazarı eriyen film devi",
      body: [
        "Hoshimura yetmiş yıllık bir Japon film devi. Renkli film, fotoğraf kâğıdı, baskı kimyasalları. Birkaç yıl önce satışların yarısından fazlası, kârın yaklaşık üçte ikisi fotoğraf ürünlerinden geldi. Onlarca yıl tek bir hedef vardı: Amerikalı dev Wexley’i geçmek.",
        "Sonra dijital fotoğraf makinesi geldi. Dünyada renkli film talebi geriliyor, pazar her yıl biraz daha küçülüyor. Hoshimura da dijital makine satıyor ama pazar kalabalık, rekabet sert. Fabrikalar, fotoğraf laboratuvarları ve dünyaya yayılmış satış ağı hâlâ filme göre kurulu.",
        "Elinde tıbbi görüntüleme ve matbaa malzemeleri gibi yan işler, üç yıl önce çoğunluk hissesi alınan bir fotokopi ortaklığı ve filmden kalma güçlü bir kimya ve kaplama birikimi var. Şirkete kırk yıl önce girdin; dört yıldır başkansın, geçen yıl CEO oldun. Yönetim kurulu senden bir plan bekliyor."
      ],
      stats: [["Kuruluş", "1930’lar"], ["Fotoğrafın satış payı", "Yarıdan fazla"], ["Fotoğrafın kâr payı", "~üçte iki"]],
      ask: "Hoshimura’yı nereye götürürsün?",
      opts: [
        { k: "A", t: "Bütün gücü dijitale ver. Filmden gelen parayla dijital fotoğraf makinesi ve baskı hizmetlerinde dünya lideri ol; fotoğraf işi bitmesin, biçim değiştirsin.", s: 35, tag: "kumar",
          r: "Dijital makine pazarı hızla kalabalıklaştı, büyüme yavaşladı, fiyatlar düştü. Filmin kârını tek başına yerine koyması zordu." },
        { k: "B", t: "Filmi sonuna kadar sağ. Yeni yatırımı durdur, maliyetleri kıs, nakdi temettüyle hissedarlara dağıt; talep düşse de film daha yıllarca para getirir.", s: 20, tag: "kasa",
          r: "Bu çeyreği, belki birkaç yılı kurtarır. Ama şirketi her yıl küçülen tek bir işe bağlar; talep eridikçe nakit de erir." },
        { k: "C", t: "Film tarafını küçült, binlerce kişilik kadroyu ve kapasiteyi kes. Film kimyasını ekran malzemelerine, tıbba ve yarı iletkene taşı; eksikleri satın al.", s: 90, tag: "cerrah",
          r: "Pahalı ve sancılı: binlerce kişi gider, yüz milyarı aşkın yen yanar. Ama şirketin asıl varlığının film değil, filmin arkasındaki kimya olduğunu gören yol bu." },
        { k: "D", t: "Kimseyi kapı dışarı etme. Fabrikaları ve çalışanları yeni işlere adım adım kaydır, dönüşümü on yıla yay; çalışanların güveni bozulmasın.", s: 45, tag: "kalkan",
          r: "İnsana saygılı, güveni korur. Ama film talebi senin takvimini beklemiyor; her geciken yıl zararı büyütür." }
      ],
      real: {
        who: "Masao Hirota",
        role: "Hoshimura CEO’su",
        k: "C",
        text: [
          "Hirota’nın CEO olarak ilk işi, şirketin hedefini Wexley’i yenmekten filmsiz bir geleceğe hazırlanmaya çevirmek oldu. Göreve gelince kuruluş yıl dönümünü hedefleyen orta vadeli bir plan hazırladı: yeni büyüme alanları, yönetimin her kademesinde yapısal reform, grup yönetiminin güçlendirilmesi.",
          "Dijital geçiş beklenenden hızlı gelince asıl ameliyat birkaç yıl içinde geldi: fotoğraf bölümünde binlerce kişilik kesinti, fabrika ve laboratuvarların birleştirilmesi, dijital makine üretiminin Çin’e kayması. Maliyet iki mali yılda yüz milyarlarca yen; ayrılanlara cömert tazminat ödendi.",
          "Film kimyası LCD ekran malzemelerine, tıbba ve yarı iletkene taşındı. Kısa süre sonra kolajen bilgisine dayanan bir cilt bakımı serisi çıktı, ardından bir Japon ilaç şirketinin kontrolü alındı. Dönüşüm on yıldan uzun sürdü; Wexley ise birkaç yıl sonra iflas koruması için başvurdu."
        ]
      }
    }
  ];

  var S004 = [
    {
      area: "Kriz yönetimi",
      place: ["ABD", " · 1990’ların başı"],
      company: "Kelvara",
      title: "Kutudaki şırınga",
      body: [
        "Kelvara, Amerika’nın en büyük iki kola markasından biri. Ülkede yüzü aşkın dolum tesisi var; bir dolum hattı dakikada binlerce kutu dolduruyor ve her kutu bir saniyeden kısa süre açık kalıyor.",
        "Bir yaz günü ülkenin kuzeybatısında yaşlı bir çift, diyet kola kutusunun içinde bir şırınga bulduklarını söylüyor. Haber televizyona çıkınca başka eyaletlerden de benzer iddialar gelmeye başlıyor. Gazeteler, ürünlerini topyekûn raftan çeken şirket örneklerini hatırlatıyor ve senden aynısını bekliyor.",
        "Düzenleyici kurum soruşturma başlattı. Şu ana kadar kimse yaralanmadı ama bir hafta içinde iddialar ondan fazla eyalete yayıldı. Kelvara’nın Kuzey Amerika içecek işinin başındasın; birkaç gün içinde karar vermen gerekiyor."
      ],
      stats: [["Dolum tesisi", "Yüzü aşkın"], ["Hat hızı", "Dakikada binlerce kutu"], ["Kutunun açık kaldığı süre", "Bir saniyeden az"]],
      ask: "Kelvara’nın içecek işinin başındasın. Ne yaparsın?",
      opts: [
        { k: "A", t: "Bütün ülkede ürünü raflardan topla; güven geri gelene kadar satışı durdur.", s: 30, tag: "cerrah",
          r: "Ürünler gerçekten kurcalanmış olsa toplama işe yarardı. Burada toplama “bir sorun var” demek olur; yüz milyonlarca dolara mal olur ve taklit iddiaları durdurmaz." },
        { k: "B", t: "İddiaların sahte olduğunu söyle, iddia sahiplerini dolandırıcılıkla suçlayıp dava aç; “kusursuz üretim” reklamları yayınla.", s: 35, tag: "kumar",
          r: "Haklı çıksan bile müşterilerini yalancılıkla suçlayan şirket olursun. İddialardan biri gerçek çıkarsa marka bir daha toparlanamaz." },
        { k: "C", t: "Ürünü toplama ama her şeyi aç: dolum hattının görüntülerini televizyonlara ver, her gün açıklama yap, düzenleyiciyle aynı mesajı birlikte ver.", s: 90, tag: "kalkan",
          r: "Gerçek bir vaka çıkarsa çok ağır olur. Ama herkes kendi gözüyle görür: bu hızda çalışan kapalı bir hatta bir kutuya şırınga girmesi neredeyse imkânsız." },
        { k: "D", t: "Sessiz kal, konuşmayı düzenleyiciye bırak; reklamları duraklat ve fırtınanın geçmesini bekle.", s: 20, tag: "kasa",
          r: "Boşluğu söylentiler doldurur. Sessizlik suçu kabul etmek gibi okunur ve iddialar çoğalmaya devam eder." }
      ],
      real: {
        who: "Douglas Penhallow",
        role: "Kelvara’nın Kuzey Amerika içecek işinin başkanı",
        k: "C",
        text: [
          "Penhallow ürün toplamadı. Dolum hatlarının görüntüleri haber kanallarına verildi; şirket her gün düzenleyiciyle aynı mesajı verdi. Bir hafta kadar sonra düzenleyicinin başkanı iddiaların dayanaksız göründüğünü açıkladı ve o akşam Penhallow’la birlikte bir haber programına çıktı.",
          "Yüzlerce müfettiş iddiaları inceledi. Bir mağaza kamerası, bir kadının şırıngayı kutuya kendisinin soktuğunu gösterdi. İddialar yirmiden fazla eyaletten gelmişti; kısa sürede birçok eyalette sahte ihbarda bulunanlar tutuklandı, sayı sonradan onlarca kişiye çıktı.",
          "Ardından gazetelere, söylenecek yeni bir şey olmadığını esprili bir dille anlatan ilanlar verildi. Hisse kısa süre hafifçe geriledi, sonra toparlandı. Krizin maliyeti on milyonlarca dolarla sınırlı kaldı; ertesi ayki kupon kampanyasıyla şirket yıllardır en iyi yazını geçirdi."
        ]
      }
    },
    {
      area: "Finansman",
      place: ["ABD", " · 2000’lerin ortası"],
      company: "Brayton Motors",
      title: "Logoyu bile rehin ver",
      body: [
        "Brayton, yüz yılı aşkın geçmişi olan bir Amerikan otomobil devi; kurucu ailenin hâlâ sözü geçiyor. Kârının büyük kısmı büyük ve çok yakıt tüketen araçlardan geliyor. Pazar payı yıllardır eriyor ve bu yılın şirket tarihindeki en büyük zararla kapanması bekleniyor.",
        "Birkaç ay önce dışarıdan yeni bir CEO geldi. Yeniden yapılanma planı fabrika kapatmak, on binlerce kişilik kadroyu küçültmek ve yeni modeller geliştirmek için yıllarca milyarlarca dolar yakacak. Kredi şu an ucuz ve bol; ama Brayton’un notu zaten yatırım derecesinin altında ve bu pencere kapanabilir.",
        "Bankalar büyük bir kredi vermeye hazır; karşılığında neredeyse her şeyi teminat istiyorlar: fabrikaları, finans şirketini, markaları, hatta logoyu. Brayton’un finans direktörüsün; planı yönetim kuruluna sen sunacaksın."
      ],
      stats: [["Hedeflenen kredi", "On milyarlarca $"], ["Teminat", "Neredeyse her şey"], ["Kredi notu", "Yatırım derecesinin altında"]],
      ask: "Brayton’un finans direktörüsün. Ne önerirsin?",
      opts: [
        { k: "A", t: "Kredi ucuzken alabildiğin en büyük krediyi şimdi al; karşılığında fabrikaları, finans şirketindeki payı, markaları ve logoyu rehin ver.", s: 90, tag: "kumar",
          r: "Şirketin neredeyse tamamını ipotek etmek demek; işler kötü giderse elinde bir şey kalmaz. Ama kimseden yardım istemeden yıllarca dayanacak nakdi şimdiden kasaya koyarsın." },
        { k: "B", t: "Nakit bitmeden mahkeme korumasına başvur; borçları ve sözleşmeleri baştan yapılandır.", s: 30, tag: "cerrah",
          r: "Kâğıt üzerinde temiz bir başlangıç. Ama alıcılar garantinin ve yedek parçanın akıbetinden korkar, satışlar çöker ve şirketin kontrolü mahkemeye geçer." },
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
      area: "Kalite",
      place: ["Almanya", " · 1990’ların sonu"],
      company: "Steinhaal Automobil · Tondo",
      title: "Ani manevrada devrildi",
      body: [
        "Steinhaal, köklü bir Alman lüks otomobil üreticisi. Tondo, markanın ilk küçük şehir arabası: kısa, yüksek ve içi geniş; markayı gençlere ve ilk kez lüks araba alacaklara açmak için tasarlandı. Satışa yeni çıktı ve siparişler güçlü.",
        "Bir sonbahar günü İsveçli bir otomobil dergisi, yola fırlayan bir hayvandan kaçmayı taklit eden sert bir şerit değiştirme testinde Tondo’yu orta bir hızda devirdi. Kimse ciddi zarar görmedi ama görüntüler bütün Avrupa’ya yayıldı.",
        "Şirketin ilk açıklaması testin “aşırı” olduğuydu. Ama basın ve müşteriler tek bir şey soruyor: bu araba güvenli mi? Steinhaal’ın yönetim kurulunda otomobil biriminin başındasın; birkaç hafta içinde karar vermen gerekiyor."
      ],
      stats: [["Test hızı", "Orta hız"], ["Model", "Satışa yeni çıktı"], ["Şirketin ilk tepkisi", "“Aşırı test”"]],
      ask: "Steinhaal’ın otomobil biriminin başındasın. Ne yaparsın?",
      opts: [
        { k: "A", t: "Testin gerçek sürüşü yansıtmadığını açıkla; arabayı savun ve satışa devam et.", s: 15, tag: "kasa",
          r: "Kısa vadede satışlar sürer. Ama güvenlik sorununu inkâr eden lüks bir marka en değerli şeyini, güveni harcar; her yeni haber inkârı daha da zayıflatır." },
        { k: "B", t: "Teslimatları durdur; denge kontrol sistemini ücretsiz ve standart yap, süspansiyonu ve lastikleri değiştir, satılmış arabaları da geri çağırıp güncelle.", s: 90, tag: "cerrah",
          r: "Aylarca teslimat yapamazsın, yüz milyonlarca Alman markına mal olur ve hatayı herkesin önünde kabul edersin. Ama sorunu kökünden çözer, tartışmayı bir güvenlik sözüne çevirirsin." },
        { k: "C", t: "Satışa devam et ama her müşteriye ücretsiz kontrol, onarım ve iade hakkı sun.", s: 45, tag: "kalkan",
          r: "Müşteriye karşı nazik bir adım. Ama araba değişmeden satılmaya devam eder; ikinci bir devrilme olursa savunacak hiçbir şeyin kalmaz." },
        { k: "D", t: "Yalnızca lastikleri ve süspansiyonu değiştir; bağımsız bir kurumun testini tekrarlatıp arabanın güvenli olduğunu kanıtla.", s: 30, tag: "kumar",
          r: "Ucuz ve hızlı. Ama bütün itibarını tek bir teste bağlarsın; araba yeniden zorlanıp devrilirse bu kez savunman da kalmaz." }
      ],
      real: {
        who: "Klaus Wendermann",
        role: "Steinhaal’ın otomobil biriminin başı; kararı yönetim kuruluyla aldı",
        k: "B",
        text: [
          "Savunma tutmadı ve şirket yön değiştirdi. Birkaç hafta sonra yaklaşık üç aylık teslimat durdurması açıklandı: denge kontrol sistemi bütün Tondo’larda ücretsiz ve standart olacak, süspansiyon ve lastikler değişecek, teslim edilmiş arabalar da güncellenecekti.",
          "Denge kontrol sistemli ilk Tondo’lar birkaç ay sonra fabrikadan çıktı. Krizin maliyeti yüz milyonlarca Alman markını buldu. Yeniden tanıtım reklamlarında ünlü bir tenis yıldızı oynadı.",
          "Kısa süre sonra denge kontrol sistemi markanın bütün modellerinde standart oldu. Tondo ve onu izleyen kuşaklar milyonlarca sattı. Avrupa Birliği sistemi yıllar sonra yeni modellerde zorunlu kıldı."
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
        { k: "C", t: "Konsolun fiyatını sert indir, stokları erit, platformdan erkenden çık.", s: 20, tag: "kasa",
          r: "Zarar derinleşir; konsolu yeni almış oyuncular ve oyun yapan şirketler yüzüstü bırakıldığını hisseder. Bir sonraki konsol şüpheyle doğar." },
        { k: "D", t: "Kimseyi çıkarma. Kendi maaşını yarıya indir, öteki yöneticilerinkini de kes, hisse geri al; şirketin modelini koru.", s: 85, tag: "kalkan",
          r: "Sembolik bir adım; zararı kapatmaz. Ama sorumluluğu en tepeden üstlenir ve oyunları yapan ekibi korur." }
      ],
      real: {
        who: "Haruki Tsuboi",
        role: "Kagemori’nin başkanı",
        k: "D",
        text: [
          "Ay sonunda yönetim kurulu birkaç aylığına maaşları kesti: Tsuboi’ninki yaklaşık yarıya indi, öteki üst yöneticilerinki de belirgin biçimde azaldı. Yaklaşık yüz milyar yenlik hisse geri alımı açıklandı. Tsuboi istifa etmedi; kesinti, sorumluluğu en tepeden üstlenmenin sembolik bir yolu olarak görüldü.",
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
        { k: "A", t: "Reklam ve pazarlama bütçesini kıs, stokları erit; kriz geçene kadar nakdi koru.", s: 20, tag: "kasa",
          r: "Nakit korunur ama korku dolu bir pazarda sessiz kalan marka unutulur. O kış birçok üretici reklamı kıstı; boşalan alanı cesur davrananlar doldurdu." },
        { k: "B", t: "Müşteriye söz ver: arabayı aldıktan sonraki bir yıl içinde işini kaybedersen arabayı geri ver, kalan borcun bir kısmını biz üstlenelim.", s: 90, tag: "kumar",
          r: "Riskin fiyatını kimse tam bilemez: işsizlik hızla artarsa iade edilen arabalar sana döner. Ama müşterinin asıl korkusunu doğrudan hedefler. Sonradan iade edilen araba sayısı yüzlerle sınırlı kaldı." },
        { k: "C", t: "Ödeme güvencesi sun: işini kaybeden müşterinin taksitlerini birkaç ay boyunca şirket ödesin.", s: 65, tag: "kalkan",
          r: "Ölçülü, hesaplanabilir bir güvence ve insanlara iyi bir mesaj. Ama büyük rakipler de benzerini sundu; seni kalabalıktan ayırmaz." },
        { k: "D", t: "Satış hedefini ve üretimi hemen düşür, bayilere giden arabaları azalt; krize küçülerek gir.", s: 40, tag: "cerrah",
          r: "Stok ve maliyet kontrolü sağlam bir refleks. Ama talep çökerken yalnızca küçülmek, pazar payını korumak değil rakiplere bırakmak demek." }
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
      area: "Kalite",
      place: ["ABD", " · 2000’lerin ortası"],
      company: "Calder Interactive · Orvia 2",
      title: "Üç kırmızı ışık",
      body: [
        "Calder dünyanın en büyük yazılım şirketlerinden biri. Oyun konsolu Orvia 2, en büyük rakibinden bir yıl önce piyasaya çıktı ve on milyonu aşkın adede ulaştı. Konsol, şirketin oturma odasına girme stratejisinin merkezinde.",
        "Ama oyuncu forumları tek bir görüntüyle dolu: güç düğmesinin çevresinde yanan üç kırmızı ışık. Konsol açılmıyor. Tamir merkezleri tıkanmış; garantisi biten müşteri onarım için yüz doları aşkın para ödüyor. Garanti Amerika’da bir yıl, Avrupa’da iki yıl.",
        "Şirket arıza oranını açıklamıyor ama bağımsız tahminler çok yüksek. Mali yıl birkaç gün sonra kapanıyor. Eğlence ve cihazlar biriminin başındasın; çeyrek kapanmadan bir karar vermen gerekiyor."
      ],
      stats: [["Satılan konsol", "On milyonu aşkın"], ["Ücretli onarım", "Yüz doları aşkın"], ["Garanti (ABD)", "1 yıl"]],
      ask: "Calder’in eğlence biriminin başındasın. Ne yaparsın?",
      opts: [
        { k: "A", t: "Mevcut garantiyle devam et; tamir sürecini hızlandır, kamuoyuna açıklamayı sınırlı tut.", s: 15, tag: "kasa",
          r: "Bu çeyreği korur. Ama forumlar büyüdükçe her yeni kırmızı ışık markanın hanesine yazılır; ilk kuşak oyuncuyu kaybetmek konsolu kaybetmektir." },
        { k: "B", t: "Sessizce yeni bir donanım revizyonuna geç: yeni üretim sağlam olsun, eldeki konsolları kendi seyrine bırak.", s: 25, tag: "kumar",
          r: "Gelecek satışları kurtarabilir ama milyonlarca müşteriyi kendi kaderine bırakır. Arıza sürdükçe ilk alıcılar en yüksek sesli eleştirmenlerin olur." },
        { k: "C", t: "Bu arıza için garantiyi satın alımdan itibaren üç yıla çıkar, ödenmiş onarım ücretlerini iade et, bedeli bu çeyrekte tek seferde yaz.", s: 85, tag: "kalkan",
          r: "Bir milyar doları aşan bir gider demek. Ama oyuncuya “sorun bizde, bedeli de biz ödüyoruz” dersin ve belirsizliği tek hamlede kapatırsın." },
        { k: "D", t: "Satışı durdur, bütün konsolları geri çağır; tasarımı düzeltene kadar rafları boşalt.", s: 30, tag: "cerrah",
          r: "Sorunu kökten ele alır gibi görünür. Ama milyonlarca cihazı toplamak çok ağır, yılbaşı sezonu rakibe kalır ve sorunsuz cihazları da toplamış olursun." }
      ],
      real: {
        who: "Ian Fairley",
        role: "Calder’in eğlence ve cihazlar biriminin başkanı",
        k: "C",
        text: [
          "Fairley yeni mali yılın ilk günlerinde üç kırmızı ışık arızası için garantiyi dünya genelinde satın alma tarihinden itibaren üç yıla çıkardığını açıkladı. Onarım ve kargo ücretsiz oldu, daha önce para ödeyerek tamir ettirenlere ücretleri iade edildi. Açıklamada müşterilerden açıkça özür diledi.",
          "Bedeli ağırdı: biten çeyreğe bir milyar doları aşan gider yazıldı. Şirket arıza oranını hiçbir zaman açıklamadı; sonradan yapılan tahminlere göre konsolların yaklaşık dörtte biri ilk iki yılda arızalanmıştı.",
          "Konsol yeni donanım revizyonlarıyla on yılı aşkın süre satıldı ve on milyonlarca adede ulaştı; üretimi yaklaşık on yıl sonra sona erdi."
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
        { k: "A", t: "Savaşma: Grenholt’u pasif bir yatırımcı olarak kabul et, pahalı davalardan ve yeni yapılardan kaçın.", s: 25, tag: "kasa",
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
          "Aile önce safları sıkılaştırdı ve birlikte hareket edeceğini açıkladı. Birkaç hafta sonra, payların yarısından fazlasını uzun yıllar satılamayacak ortak bir aile şirketinde toplama ve kalan paylarda önalım hakkı kurma planını duyurdu. Düzenleyici kısa süre sonra zorunlu satın alma teklifinden muafiyet verdi; yapı yaklaşık bir yıl içinde işler hâle geldi.",
          "Rocheval, Grenholt’un pay toplama yöntemini düzenleyiciye taşıdı; yaklaşık iki yıl sonra suç duyurusunda bulundular, Grenholt da karşı dava açtı. Birkaç yıl sonra piyasa düzenleyicisi, pay toplamayı piyasaya zamanında bildirmediği için Grenholt’a milyonlarca avro ceza verdi. Düzenleyiciye göre Grenholt payın önemli kısmını açıklama günündeki fiyatın yarısından da ucuza almıştı.",
          "Yaklaşık dört yıl sonra ticaret mahkemesi başkanının arabuluculuğuyla barış geldi. Grenholt, o güne kadar beşte biri aşmış Corvelle payının tamamını kendi hissedarlarına dağıttı ve beş yıl boyunca Corvelle hissesi almamayı kabul etti. Aile şirketi bugün payların yarısından fazlasını elinde tutuyor."
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
        "Pellbrook, kızarmış tavuğuyla bilinen küresel bir fast food zinciri. Birleşik Krallık’ta yaklaşık 900 restoranı var ve menünün neredeyse tamamı her gün gelen taze tavuğa dayanıyor.",
        "Kış ortasında dağıtım yeni bir lojistik firmasına ve tek bir merkez depoya geçti. Birkaç gün içinde sistem çöktü: tavuk restoranlara ulaşmıyor. Birkaç gün sonra restoranların yarıdan fazlası kapalı; sosyal medya zincirle dalga geçiyor.",
        "Tam toparlanmanın haftalar sürebileceği söyleniyor ve bir şey söylemen gerekiyor. Pellbrook’un Birleşik Krallık genel müdürüsün; pazarlama ekibin masaya birkaç seçenek getirdi."
      ],
      stats: [["Restoran", "~900"], ["Kapalı restoran", "Yarıdan fazlası"], ["Dağıtım", "Tek depo"]],
      ask: "Pellbrook’un Birleşik Krallık işinin başındasın. Kamuoyuna ne dersin?",
      opts: [
        { k: "A", t: "Ulusal gazetelere kendinle dalga geçen, kısa ve açık sözlü bir özür ilanı ver; hatayı süslemeden kabul et.", s: 85, tag: "kumar",
          r: "Krizi hafife aldığın düşünülebilir; işi duran çalışanları ve bayileri kızdırabilir. Ama alay edilen bir markanın en iyi cevabı şakayı önce kendisinin yapmasıdır; özür hem dürüst hem akılda kalıcı olur." },
        { k: "B", t: "Yeni lojistik sözleşmesini bitir, eski dağıtıcıya dön; sorun çözülene kadar konuşma, çözünce açıklama yap.", s: 45, tag: "cerrah",
          r: "Eski dağıtıcı sonradan kısmen geri çağrıldı; yani işin operasyon tarafı doğru. Ama sessiz kaldığın her gün şaka seninle ilgili yapılmaya devam eder." },
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
        "Nordahl, dünyanın en büyük bilgisayar şirketi; büyük kurumların ana bilgisayarlarını o kuruyor ve işletiyor. Ama kişisel bilgisayarlar ve küçük sunucular pazarı değiştirdi. Şirket geçen yıl milyarlarca dolar zarar etti; birkaç yıl önce yüz binlerce kişiyi bulan çalışan sayısı hızla eriyor.",
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
          r: "Kısa vadede kâr tablosu iyi görünür. Ama daha ucuz rakipler müşterileri almaya devam eder; yavaş kanama tek bir derin kesikten pahalıya patlar." }
      ],
      real: {
        who: "Richard Ansell",
        role: "Nordahl’ın CEO’su",
        k: "C",
        text: [
          "Yaz ortasında Nordahl ikinci çeyrekte rekor bir zarar açıkladı; bunun büyük kısmı yeniden yapılanma gideriydi. O yıl ayrılan on binlerce kişinin üstüne ertesi yıl sonuna kadar on binlercesi daha ayrılacaktı; çeyreklik temettü yarıdan fazla indi. Ansell uzun vadeli planları bir kenara bırakıp önce nakit ve maliyetlere odaklandı.",
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
        { k: "A", t: "Fiyat savaşına gir: indirimler ve ucuz menüyle yeni rakiplere müşteri kaptırma.", s: 25, tag: "kasa",
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
      area: "Gıda güvenliği",
      place: ["Hindistan", " · 2010’ların ortası"],
      company: "Brunnhof · Ramiko",
      title: "İki dakikalık erişte",
      body: [
        "Ramiko, İsviçreli gıda devi Brunnhof’un Hindistan’daki en büyük markası: iki dakikada pişen hazır erişte. Pazarın yaklaşık dörtte üçü onun; bir kuşak bu erişteyle büyüdü.",
        "Bir bahar günü bir eyaletin gıda müfettişleri, numunelerde yasal sınırın birkaç katı kurşun bulduklarını açıkladı. “MSG eklenmemiştir” yazan paketlerde de MSG bulunduğu söylendi. Eyaletler birbiri ardına satışı yasaklıyor.",
        "Şirket testlerin yanlış olduğunu, ürünün güvenli olduğunu savunuyor ama yasakların sayısı artıyor. Brunnhof’un Hindistan şirketinin başındasın; bu akşam karar vermen gerekiyor."
      ],
      stats: [["Pazar payı", "~dörtte üç"], ["Kurşun", "Sınırın birkaç katı"], ["Çeşit", "Yaklaşık on"]],
      ask: "Ramiko’nun Hindistan işinin başındasın. Ne yaparsın?",
      opts: [
        { k: "A", t: "Testlere itiraz etmeye devam et, yasak olmayan eyaletlerde satışı sürdür; geri çekmek suçu kabul etmek olur.", s: 20, tag: "kasa",
          r: "İlk haftalarda şirketin tutumu buydu ve yavaş bulundu. Her yeni yasak güveni biraz daha aşındırır; satış sürse de her raf yeni bir manşet riski taşır." },
        { k: "B", t: "Ürünün güvenli olduğunu söylemeye devam ederek tüm ülkede raflardan çek; testlere mahkemede itiraz et.", s: 85, tag: "cerrah",
          r: "Milyarlarca rupilik ürün imha edilir, pazar payın aylarca sıfıra yakın kalır. Ama tartışma raftan mahkemeye taşınır ve tüketicinin sağlığını riske atmadığını gösterirsin." },
        { k: "C", t: "Yalnızca yasak getiren eyaletlerde ürünü topla; yetkililerle tam iş birliği yap, yeni testler iste.", s: 45, tag: "kalkan",
          r: "Ölçülü ve iş birliğine açık görünür. Ama yasaklar yayılırken her eyalette ayrı bir kriz yaşarsın; tüketici de “orada tehlikeliyse burada neden değil?” diye sorar." },
        { k: "D", t: "Mahkemeyle uğraşma: tarifi değiştir, yeni adla ve yeni ambalajla hızla yeniden piyasaya çık.", s: 30, tag: "kumar",
          r: "Hızlı görünür ama sorunu kabul etmek gibi okunur; yıllarca biriken marka adını da çöpe atarsın. Düzenleyiciyle hesaplaşma bitmez, yalnızca ertelenir." }
      ],
      real: {
        who: "Laurent Esmond",
        role: "Brunnhof’un Hindistan şirketinin genel müdürü; kararı merkezle birlikte aldı",
        k: "B",
        text: [
          "O gece şirket, ürünün güvenli olduğunu yineleyerek erişteyi tüm ülkede raflardan çektiğini açıkladı. Ertesi gün ülkenin gıda düzenleyicisi bütün çeşitlerin toplanmasını ve üretimin durdurulmasını emretti; Brunnhof’un küresel CEO’su başkentte basın toplantısı yaptı. Şirketin ilk tahminine göre maliyet birkaç milyar rupiydi; bunun yaklaşık üçte ikisi mağazalardaki üründü.",
          "Şirket yasağı mahkemeye taşıdı. Yaklaşık iki ay sonra bir eyalet yüksek mahkemesi, şirkete adil bir savunma hakkı tanınmadığı ve testlerin akredite olmayan laboratuvarlarda yapıldığı gerekçesiyle yasağı kaldırdı; satışa dönüş üç laboratuvarda yapılacak yeni testlere bağlandı. Bu arada Hindistan şirketinin başına yeni bir genel müdür gelmişti.",
          "Ramiko yıl bitmeden raflara döndü. Pazar payı yaklaşık beş ay sıfıra yakın kaldı; ertesi baharda yaklaşık yarıya çıktı, yaz sonunda liderliği geri aldı ve sonbaharda yarıyı aştı."
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
    { no: "006", date: "2026-11-09", cases: S006 }
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
  // 001: birinci dosya değişti (v2). Bildirim onayı ayrı tutulur, eski "wishceo.s001" kaydından okunmaya devam eder (loadList).
  var KEYV = { "001": "v2" };
  function keyOf(no) { return "wishceo.s" + no + (KEYV[no] || ""); }
  var ISSUE = CUR.no, CASES = CUR.cases, KEY = keyOf(ISSUE);

  var TYPES = {
    cerrah: { name: "Cerrah", desc: "Neyin kesileceğini bilirsin. Duygusal bağlara değil, şirketi neyin yaşattığına bakarsın ve zor kararı erken alırsın." },
    kalkan: { name: "Kalkan", desc: "Önce insanlar, sonra rakamlar. Güven bir kez giderse hiçbir bütçenin onu geri getiremeyeceğini bilirsin." },
    kumar: { name: "Kumarbaz", desc: "Masaya bütün fişleri sürersin. Tutarsa kitaplara geçersin. Tutmazsa da geçersin, ama başka bir bölüme." },
    kasa: { name: "Kasa Bekçisi", desc: "Bu çeyreği kurtarırsın, tablolar temiz görünür. Sorun şu: şirketler çeyrek değil, on yıl yaşar." }
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
          (a && o.k === c.real.k ? '<span class="opt-real">Gerçek CEO</span>' : "") + "</button>";
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
    var cmp = o.k === c.real.k ? "Gerçek CEO ile aynı kararı verdin."
      : diff > 0 ? "Gerçek CEO’dan " + diff + " puan iyi. Yönetim kurulu not aldı."
      : "Gerçek CEO’nun kararı " + (-diff) + " puan daha iyiydi.";
    return '<div class="after">' +
      '<div class="verdict t-' + tier(o.s) + '" tabindex="-1">' +
      '<div class="stamp' + (reduced() ? "" : " anim") + '" aria-hidden="true"><b>' + o.s + "</b><span>puan</span></div>" +
      '<p class="lbl">Senin kararın · ' + o.k + "</p>" +
      '<p class="verdict-r">' + esc(o.r) + "</p>" +
      '<p class="sr">Puanın: ' + o.s + " / 100</p>" +
      "</div>" +
      '<div class="truth">' +
      '<p class="lbl">Gerçekte ne oldu</p>' +
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
      '<p class="vs">Gerçek CEO’ların ortalaması: ' + r.real + "</p>" +
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
    if (intro && WORDS[n]) intro.textContent = WORDS[n] + " şirket, " + WORDS_LO[n] + " kriz. Hangisinde gerçek CEO’dan daha iyi iş çıkarırsın?";
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
