// WishCEO: sayı sayı CEO oyunu, arşiv, CEO karnesi, paylaşım ve yeni sayı bildirimi.
// Vakalar kamuya açık kaynaklarda belgelenmiş gerçek olaylardan uyarlanmıştır; şirket, ürün ve kişi adları kurgusaldır, rakamlar yuvarlanmıştır. Kaynaklar her vakanın `sources` alanında.
(function () {
  "use strict";

  var FORM_END = "https://corner-forms.berkay-999.workers.dev/submit";
  var LIST_KEY = "wishceo.liste";

  // tag: karnede CEO tipini belirler (cerrah, kalkan, kumar, kasa)
  // sources: oyuncuya gösterilen kaynaklar; t ve pub Türkçe özet, lang bağlantının dili
  var S001 = [
    {
      area: "Kriz yönetimi",
      place: ["ABD", " · Ekim 1982"],
      company: "Hartwell & Hartwell · Soranol",
      title: "Rafta zehir var",
      body: [
        "Soranol, Amerika’nın en çok satan ağrı kesicisi. Pazarın yaklaşık üçte biri sende ve ürün şirketin en kârlı kalemlerinden biri.",
        "Birkaç gün içinde Chicago bölgesinde yedi kişi ölüyor. Hepsi güçlü formül Soranol kapsülü almış. Biri kapsüllerin içine siyanür koymuş, şişeleri market raflarına geri bırakmış.",
        "Fabrikada sorun yok; zehirli şişeler yalnızca Chicago bölgesinde. Ama haberler her saat ürünün adını veriyor ve ülke panikte."
      ],
      stats: [["Pazar payı", "~%35"], ["Ölü", "7"], ["Zehirli şişeler", "Chicago"]],
      ask: "Hartwell & Hartwell’in başındasın. İlk hamlen ne?",
      opts: [
        { k: "A", t: "Yalnızca Chicago’daki şişeleri toplat. Sorun yerel, fabrikada hata yok.", s: 35, tag: "kasa",
          r: "Mantıklı görünüyor ama “ya başka şehirde de varsa?” sorusuna cevabın yok. Bir vaka daha çıkarsa marka biter." },
        { k: "B", t: "Ülkedeki bütün Soranol kapsüllerini raflardan çek, halka “kullanmayın” de.", s: 95, tag: "kalkan",
          r: "Pahalı, belki yüz milyon dolar. Ama mesaj net: önce insanların güvenliği, sonra satışlar." },
        { k: "C", t: "Hiçbir şey toplatma. “Ürünümüz güvenli, sabotajın sorumlusu biz değiliz” açıklaması yap.", s: 10, tag: "kasa",
          r: "Teknik olarak haklısın. Ama insanlar ölürken “suç bizde değil” diyen bir marka o rafa bir daha çıkamaz." },
        { k: "D", t: "Soranol adını göm, aynı ilacı yeni bir isimle piyasaya sür.", s: 30, tag: "kumar",
          r: "Yıllar içinde kurulmuş güveni kendi elinle siliyorsun. Üstelik insanlar aynı ilacın kılık değiştirdiğini fark eder." }
      ],
      real: {
        who: "Edward Hallam",
        role: "Hartwell & Hartwell CEO’su",
        k: "B",
        text: [
          "Hallam ülke çapındaki bütün Soranol kapsüllerini geri çağırdı: yaklaşık 31 milyon şişe, yaklaşık 100 milyon dolar. O sırada FBI ve FDA bunu gerekli görmüyordu. Halka kapsülleri kullanmamasını, ellerindekini tabletle değiştirmesini söyledi; basına kapıyı kapatmadı.",
          "İki ay içinde Soranol üç katmanlı mühürlü yeni ambalajla rafa döndü. Pazar payı önce %7 civarına düştü, bir yıl içinde büyük ölçüde geri geldi.",
          "Zehirleyen kişi bugüne kadar bulunamadı; cinayetlerden kimse yargılanmadı, dosya hâlâ açık. Bu karar kriz yönetimi derslerinde en çok anlatılan örneklerden biri."
        ]
      },
      sources: [
        { t: "Krizi yöneten CEO’nun kararları ve mirası", pub: "Knowledge at Wharton", year: "2012", lang: "en",
          url: "https://knowledge.wharton.upenn.edu/article/tylenol-and-the-legacy-of-jjs-james-burke/" },
        { t: "Markayı kurtarma mücadelesi, olayların sıcağında", pub: "Fortune", year: "1982", lang: "en",
          url: "https://fortune.com/article/the-fight-to-save-tylenol-fortune-1982/" },
        { t: "Mühürlü ambalaj kuralı: ilaç mevzuatında dönüm noktaları", pub: "ABD FDA", year: "", lang: "en",
          url: "https://www.fda.gov/about-fda/fda-history/milestones-us-food-and-drug-law" },
        { t: "1982 zehirlenmelerinin kronolojisi", pub: "History.com", year: "", lang: "en",
          url: "https://www.history.com/articles/extra-strength-tylenol-poisonings-1982" },
        { t: "Baş şüphelinin ölümü; dosya hâlâ açık", pub: "PBS NewsHour / AP", year: "2023", lang: "en",
          url: "https://www.pbs.org/newshour/nation/james-lewis-suspect-in-the-1982-tylenol-murders-dies-at-76" }
      ]
    },
    {
      area: "Dönüşüm",
      place: ["Danimarka", " · 2004"],
      company: "Tumla Group",
      title: "Her şeye giren oyuncakçı",
      body: [
        "Tumla yetmiş yılı aşkın bir aile şirketi. Son on yılda markasını her yere taşıdı: tema parkları, giyim, takı, video oyunları, bir televizyon dizisi.",
        "Ürün yelpazesi şişti. Yeni setler yalnızca bir kez kullanılan özel parçalarla dolu; kalıplar, depolar, maliyetler patladı. Satışlar düşüyor, şirket zarar ediyor, kasadaki para hızla eriyor.",
        "Aile, otuzlu yaşlarındaki eski bir danışmanı CEO yaptı. O kişi sensin."
      ],
      stats: [["Kuruluş", "1932"], ["Tema parkı", "4"], ["Son bilanço", "Zarar"]],
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
          "Lindvang ilk kuralı koydu: önce hayatta kal, sonra büyü. Parça çeşidini ciddi biçimde azalttı, kârsız işleri kapattı ya da sattı; 2005’te tema parklarının çoğunluk hissesini sattı.",
          "Odağı tuğlaya ve sevilen temalara geri çekti, hayran topluluğunu dinlemeye başladı.",
          "On yıl sonra Tumla dünyanın en büyük ve en kârlı oyuncak şirketleri arasındaydı."
        ]
      },
      sources: [
        { t: "Zarardan kâra dönüş", pub: "NBC News / AP", year: "2006", lang: "en",
          url: "https://www.nbcnews.com/id/wbna11367083" },
        { t: "Harvard vaka çalışması: dönüşümün dersleri", pub: "Harvard Business School", year: "2013", lang: "en",
          url: "https://www.library.hbs.edu/working-knowledge/hbs-cases-lego" },
        { t: "Kendini yeniden icat eden marka", pub: "The Guardian", year: "2017", lang: "en",
          url: "https://www.theguardian.com/lifeandstyle/2017/jun/04/how-lego-clicked-the-super-brand-that-reinvented-itself" },
        { t: "Fazla yenilik şirketi nasıl batmanın eşiğine getirdi", pub: "Knowledge at Wharton", year: "2012", lang: "en",
          url: "https://knowledge.wharton.upenn.edu/article/innovation-almost-bankrupted-lego-until-it-rebuilt-with-a-better-blueprint/" }
      ]
    },
    {
      area: "Strateji",
      place: ["Finlandiya", " · Şubat 2011"],
      company: "Korvala",
      title: "Tahttaki telefoncu",
      body: [
        "Korvala dünyada en çok telefon satan şirket. Neredeyse herkesin cebinde bir Korvala var ya da yakın zamana kadar vardı.",
        "Ama 2007’de Amerikalı bir bilgisayar şirketi dokunmatik telefonunu çıkardı, arama motoru devinin ücretsiz sistemi de hızla yayılıyor. Şirketin kendi akıllı telefon sistemi eskidi, uygulama geliştiriciler ilgisini kaybetti. Ortaklıkla geliştirilen yeni sistem ise henüz hazır değil.",
        "Akıllı telefonda pazar payı eriyor, hisse düşüyor. Yeni CEO sensin ve bir platform seçmek zorundasın."
      ],
      stats: [["Telefon satışında", "Dünya 1.si"], ["İşletim sistemi", "Kendi, eski"], ["Rakipler", "ABD’li iki dev"]],
      ask: "Hangi yola girersin?",
      opts: [
        { k: "A", t: "Arama motoru devinin ücretsiz sistemine geç. Herkesin kullandığı yere katıl, farkı donanım ve tasarımla yarat.", s: 75, tag: "cerrah",
          r: "Asyalı dev üreticilerle aynı sistemde yarışmak zor ama uygulamalar ve kullanıcılar hazır. Sonradan bazı yorumcular Korvala’nın bu yolu seçmesi gerektiğini savundu." },
        { k: "B", t: "Yazılım devi Tallbridge’le ortaklık kur, akıllı telefonlarında ana sistem olarak onun telefon sistemini seç.", s: 35, tag: "kumar",
          r: "Tallbridge para ve destek veriyor, sen de en büyük ortağı oluyorsun. Ama şirketin geleceğini pazarın henüz yalnızca %2 kadarını tutan bir sisteme bağlıyorsun." },
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
          "Stoddard Şubat 2011’de çalışanlara meşhur “yanan platform” notunu yazdı ve Korvala’yı Tallbridge’in telefon sistemine bağladı. Eski sistem rafa kalkmaya başladı.",
          "Tallbridge’in sistemi beklenen ivmeyi yakalayamadı. Eylül 2013’te Korvala telefon işini Tallbridge’e satmak için anlaştı: patent lisansı dahil yaklaşık 5,4 milyar avro. Satış Nisan 2014’te tamamlandı.",
          "Korvala bugün telekom altyapısı üreten bir şirket olarak yoluna devam ediyor."
        ]
      },
      sources: [
        { t: "Çalışanlara yazılan “yanan platform” notu", pub: "Engadget", year: "2011", lang: "en",
          url: "https://www.engadget.com/2011-02-08-nokia-ceo-stephen-elop-rallies-troops-in-brutally-honest-burnin.html" },
        { t: "Ortaklık duyurusu ve pazar payı rakamları", pub: "Mail & Guardian / Reuters", year: "2011", lang: "en",
          url: "https://mg.co.za/business/2011-02-11-nokia-microsoft-join-forces-in-smartphone-war/" },
        { t: "Telefon işinin satışında 5 detay", pub: "Webrazzi", year: "2013", lang: "tr",
          url: "https://webrazzi.com/2013/09/04/microsoft-nokia-satin-almasinda-5-detay/" },
        { t: "Satışın tamamlandığını bildiren resmî bildirim", pub: "ABD SEC (6-K)", year: "2014", lang: "en",
          url: "https://www.sec.gov/Archives/edgar/data/924613/000110465914030586/a14-11232_16k.htm" }
      ]
    }
  ];

  var S002 = [
    {
      area: "Marka",
      place: ["ABD", " · Aralık 2009"],
      company: "Brascina Pizza",
      title: "Lezzette sonuncu",
      body: [
        "Brascina, Amerika’nın 36 milyar dolarlık pizza pazarında ikinci büyük zincir. Dünyada 9.000’e yakın şubesi var, adı hızlı eve teslimatla anılıyor.",
        "Ama müşteriler pizzanı sevmiyor; internette hamurunu kartona benzetiyorlar. Bir tüketici araştırmasında lezzette sonuncusun, bir çocuk eğlence merkezi zinciriyle aynı sıradasın. Rakipler aynı indirimleri yapıyor, dondurulmuş pizzalar da iyileşiyor. Kâr 2006’dan 2008’e yarıya indi, gelir 2009’da da düşüyor.",
        "Mutfak ekibi iki yıla yakın süredir yeni bir tarif üzerinde çalışıyor: yeni hamur, yeni sos, yeni peynir. Şirketin ABD işini sen yönetiyorsun. Tarif hazır; şimdi markayı nasıl toparlayacağına karar vermelisin."
      ],
      stats: [["Pazardaki yeri", "ABD 2.si"], ["Lezzet anketi", "Sonuncu"], ["Kâr, 2006–2008", "Yarıya indi"]],
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
        role: "Brascina’nın ABD başkanı, Mart 2010’dan itibaren CEO’su",
        k: "C",
        text: [
          "Aralık 2009 sonunda yeni pizza bütün ABD şubelerindeydi. Belgesel tarzı reklamlarda müşteriler eski hamurun “karton gibi”, sosun “ketçap gibi” olduğunu söylüyor, ardından şefler ve yöneticiler yeni tarifi anlatıyordu. Altı haftalık kampanyaya yaklaşık 75 milyon dolar harcandı; çalışanlar 200.000 saat eğitim aldı, beğenmeyene para iadesi sözü verildi.",
          "2010’un ilk çeyreğinde ABD’deki mevcut şubelerin satışı %14 arttı. Mart 2010’da CEO olan Ballard, “çok daha iyi bir pizza ve bunu müşterilere anlatırken gösterdiğimiz dürüstlük karşılığını veriyor” dedi.",
          "Hisse 2010’dan 2017’ye %2.000’den fazla değer kazandı ve büyük teknoloji şirketlerinin hisselerini geride bıraktı. 2017’de Brascina, dünya genelindeki satışlarda eski pazar liderini geçerek en büyük pizza zinciri oldu."
        ]
      },
      sources: [
        { t: "Zincirin yeni tarifi ve lezzet anketindeki yeri", pub: "NBC News / Reuters", year: "2009", lang: "en",
          url: "https://www.nbcnews.com/id/wbna34450329" },
        { t: "“Karton gibi hamur” reklamları ve şirketin durumu", pub: "NBC News / AP", year: "2010", lang: "en",
          url: "https://www.nbcnews.com/id/wbna34812047" },
        { t: "İlk çeyrek sonuçları: mevcut şube satışlarında sıçrama", pub: "ABD SEC (8-K)", year: "2010", lang: "en",
          url: "https://www.sec.gov/Archives/edgar/data/0001286681/000119312510105392/dex991.htm" },
        { t: "CEO’nun gözünden tarif değişikliği ve kampanya", pub: "AnnArbor.com", year: "2012", lang: "en",
          url: "https://www.annarbor.com/business-review/patrick-doyle-pizza-relaunch-could-have-been-the-end-of-dominos/" },
        { t: "Hissenin yedi yıllık yükselişi ve dünya liderliği", pub: "CNBC", year: "2018", lang: "en",
          url: "https://www.cnbc.com/2018/03/01/no-point-1-pizza-chain-dominos-outperformed-amazon-google-and-apple-stocks.html" }
      ]
    },
    {
      area: "Fiyatlama",
      place: ["ABD", " · Temmuz 2011"],
      company: "Sinevia",
      title: "İki iş, tek fiyat",
      body: [
        "Sinevia, Amerika’da yaklaşık 25 milyon üyesi olan bir film ve dizi kiralama şirketi. Standart pakette üyeler ayda 9,99 dolara internetten sınırsız izliyor, bir yandan da postayla DVD kiralıyor. Bu paketin fiyatı daha geçen kasımda artırılmıştı.",
        "İnternetten izleme hızla büyüyor: yeni üyelerin dörtte üçe yakını 7,99 dolarlık yalnız internet paketini seçiyor. Stüdyolar ve kanallarla yeni lisans anlaşmaları imzaladın; içerik harcaman yılın ikinci yarısında daha da artacak. DVD gönderimleri büyük olasılıkla zirveyi gördü, yine de disk kataloğun internettekinin beş katı.",
        "Bir e-ticaret devi ve televizyon kanallarının ortak sitesi de internetten film ve dizi sunuyor. Pakette DVD şu an aylık 2 dolarlık bir ek gibi duruyor. Sinevia’nın CEO’su sensin ve fiyatı yeniden kurman gerekiyor."
      ],
      stats: [["ABD’deki üye", "~25 milyon"], ["Paket fiyatı", "9,99 dolar"], ["Yalnız internet seçen", "Yeni üyenin ~%75’i"]],
      ask: "Fiyatı nasıl kurarsın?",
      opts: [
        { k: "A", t: "Paketi şimdi ikiye böl: internet ve DVD ayrı ayrı 7,99 dolar, ikisini isteyen 15,98 öder. Mevcut üyelere eylüle kadar süre tanı, herkesi internete yönlendir.", s: 50, tag: "cerrah",
          r: "DVD’nin maliyetini artık internet üyeleri taşımaz, yön netleşir. Ama iki hizmeti birlikte kullanan milyonlarca üyenin faturası bir anda %60 artar." },
        { k: "B", t: "Paketi koru, fiyatı 11,99 dolara çıkar. Mevcut üyeler bir yıl eski fiyattan devam etsin; zammı yeni filmler ve dizilerle birlikte duyur.", s: 75, tag: "kalkan",
          r: "Zam can sıkar ama yumuşak geçer, sadık üyeni korursun. Gelir artar; DVD’nin yükü ise bir süre daha internet büyümesini yavaşlatır." },
        { k: "C", t: "Fiyata dokunma, üyeyi ürkütme. Yeni lisans anlaşması imzalama; içerik harcamasını bu yıl sabit tutup kârı koru.", s: 25, tag: "kasa",
          r: "Üyeler memnun, çeyrek kârlı görünür. Ama rakipler kataloglarını büyütürken sen yerinde sayarsın; internetteki kataloğun eskir." },
        { k: "D", t: "Saldırıya geç: internet paketini 5,99 dolara indir, borç alıp içerik harcamasını ikiye katla. Pazarı rakiplerden önce kap.", s: 35, tag: "kumar",
          r: "Üye sayısı hızla artabilir ama gelir düşerken maliyet katlanır. Stüdyolar fiyat artırırsa borçla ayakta kalmaya çalışırsın." }
      ],
      real: {
        who: "Leon Prewitt",
        role: "Sinevia’nın CEO’su",
        k: "A",
        text: [
          "Prewitt 12 Temmuz 2011’de paketi ikiye böldü: internet ve DVD ayrı ayrı 7,99 dolar. İkisini birlikte kullananın faturası 9,99’dan 15,98 dolara, %60 yükseldi; yeni üyeler için hemen, mevcut üyeler için eylülde. Pek çok üye öfkelendi.",
          "Eylül ortasında Prewitt değişikliği iyi anlatamadıklarını kabul etti, DVD işini Diskvan adlı ayrı bir markaya taşıyacağını duyurdu. 10 Ekim’de Diskvan açılmadan iptal edildi, zam kaldı. Şirket hissedar mektubunda ayrı fiyatların doğru olduğunu ama “oraya ne kadar hızlı gidileceğini yanlış hesapladıklarını” yazdı.",
          "Üçüncü çeyrekte ABD’deki üye sayısı yaklaşık 800.000 azalıp 23,8 milyona indi. Temmuz 2011’de 300 dolar civarındaki hisse, bir yıl sonra 54 dolara düştü. Şirket internete yatırıma devam etti; hisse 2013’te yaklaşık %300 yükselip S&P 500’ün en çok kazandıran hissesi oldu."
        ]
      },
      sources: [
        { t: "Yeni fiyatlar: DVD artık ayrı bir paket", pub: "TechCrunch", year: "2011", lang: "en",
          url: "https://techcrunch.com/2011/07/12/netflix-dvd-only/" },
        { t: "İkinci çeyrek hissedar mektubu: yalnız internet paketinin yükselişi", pub: "ABD SEC (8-K)", year: "2011", lang: "en",
          url: "https://www.sec.gov/Archives/edgar/data/0001065280/000119312511196126/dex991.htm" },
        { t: "Ayrı DVD markasından vazgeçildi, zam kaldı", pub: "NPR", year: "2011", lang: "en",
          url: "https://www.npr.org/sections/thetwo-way/2011/10/10/141209082/netflix-kills-qwikster-price-hike-lives-on" },
        { t: "Üçüncü çeyrek hissedar mektubu: üye kaybı ve özeleştiri", pub: "ABD SEC (8-K)", year: "2011", lang: "en",
          url: "https://www.sec.gov/Archives/edgar/data/0001065280/000119312511278716/d246709dex991.htm" },
        { t: "2013’ün en çok kazandıran S&P 500 hisseleri", pub: "Kiplinger", year: "2013", lang: "en",
          url: "https://www.kiplinger.com/article/investing/t052-c008-s003-best-s-p-500-stocks-of-2013.html" }
      ]
    },
    {
      area: "Portföy",
      place: ["ABD", " · 1985"],
      company: "Brenmark",
      title: "Fiyat savaşındaki çipçi",
      body: [
        "Brenmark on yedi yıl önce kuruldu. İlk büyük başarısı bellek çipleriydi: ürünü pazara ilk süren, işi sıfırdan kuran oydu. Pek çok çalışan belleğe hâlâ duygusal olarak bağlı.",
        "Şimdi sermayesi güçlü Japon devleri daha ucuz ve daha iyi bellek üretiyor; verimleri yüzde 40’a kadar yüksek. Dolar değer kazandı, fiyat kırma ve damping başladı. Geçen yılın sonunda talep de çöktü: kapasite fazlası var, fiyatlar serbest düşüşte.",
        "Öte yandan bir zamanlar yan iş olan işlemciler kişisel bilgisayarlarda standart hâline geldi; yeni nesil 32 bitlik B32 yolda. Yönetim bir yıldır karar veremeden dolanıyor. Şirketin başkanı sensin. Kurucu ortak ve CEO Walter Enright’la odada yalnızsınız."
      ],
      stats: [["Kuruluş", "1968"], ["Bellek pazar payı (1984)", "%1,3"], ["B32’ye yatırılan", "~100 milyon $"]],
      ask: "Hangi yola girersin?",
      opts: [
        { k: "A", t: "Bellekte kal ve savaş: yeni nesil çiplere rakiplerden fazla yatırım yap, fiyatta geri adım atma.", s: 20, tag: "kumar",
          r: "Kimliği korursun ama verimde bu kadar gerideyken her yeni nesil daha büyük zarar demek. Bellek savaşı, işlemcilere lazım olan parayı yakar." },
        { k: "B", t: "Washington’a git: damping şikâyeti aç, koruma iste. Bu arada bir Japon ortakla üretim anlaşması yap, zaman kazan.", s: 40, tag: "kasa",
          r: "Koruma bir işe yarar: şirket başka bir bellek türünde damping şikâyetini kazandı ve pazar payını korudu. Ama maliyet farkı kapanmaz, karar yalnızca ertelenir." },
        { k: "C", t: "Kimseyi çıkarma. Herkes maaşından fedakârlık etsin, fabrikalar açık kalsın; pazar düzelince toparlanırız.", s: 30, tag: "kalkan",
          r: "Ekip ve güven korunur. Ama masraflar 2–3 milyar dolarlık bir şirkete göre kurulu, ciro ise 1–1,5 milyar dolara iniyor; fedakârlık bu farkı kapatmaz." },
        { k: "D", t: "Bellek savaşından çekil. Fabrikaları kapat, kadroyu küçült; parayı ve en iyi ekipleri işlemcilere ver.", s: 92, tag: "cerrah",
          r: "Şirketin doğduğu işi bırakırsın, binlerce kişi gider. Ama kalan her kuruş, standardını senin belirlediğin pazara akar." }
      ],
      real: {
        who: "Paul Dressler ve Walter Enright",
        role: "Brenmark’ın başkanı ve CEO’su",
        k: "D",
        text: [
          "1985 ortasında Dressler, Enright’a sordu: “Biri bizi devralıp kapı dışarı etse, yeni gelen ne yapardı?” Enright’ın yanıtı kısaydı: “Bellek işinden çıkardı.” Dressler bunu kendilerinin yapmasını önerdi. Karar 10 Ekim 1985’te çalışanlara duyuruldu; bir hafta sonra B32 tanıtıldı.",
          "İki yılda sekiz eski fabrika kapandı, kadro 7.200 kişi azaldı; bu, çalışanların neredeyse üçte biriydi. Şirket 1986’da ağır zarar etti; hissedar mektubu o yılı “şirket tarihinin en zor yılı” diye andı. Üç bellek işinden ikisini bıraktı, programlanabilir bellek çiplerinde kaldı.",
          "İşlemciler şirketin ana işi oldu. Önceki kuşakta üretim lisansı dağıtıp kendi rakiplerini yaratmışlardı; Dressler’in yeni ilkesi, tek üretici olunabilecek yerlere gitmekti. Şirket kişisel bilgisayar işlemcilerinin hâkimi oldu; yıllar sonra her beş bilgisayardan dördünde onun çipi vardı. Dressler bellekten çıkışı “verdiğimiz en iyi iş kararı” diye andı."
        ]
      },
      sources: [
        { t: "Kurucu ile başkanın “yeni gelen ne yapardı?” sorusu", pub: "NPR", year: "2012", lang: "en",
          url: "https://www.npr.org/2012/04/06/150057676/intel-legends-moore-and-grove-making-it-last" },
        { t: "Bellek savaşından işlemci liderliğine", pub: "SemiWiki", year: "2013", lang: "en",
          url: "https://semiwiki.com/semiconductor-manufacturers/intel/2948-revisiting-andy-groves-only-the-paranoid-survive/" },
        { t: "1986 hissedar mektubu: fabrika kapanışları ve yeniden yapılanma", pub: "A Letter a Day", year: "2020", lang: "en",
          url: "https://aletteraday.substack.com/p/letter-15-intel-1986" },
        { t: "Bellekten çıkış ve bir hafta sonra gelen yeni işlemci", pub: "The Chip Letter", year: "2024", lang: "en",
          url: "https://thechipletter.substack.com/p/intels-transformation-20" },
        { t: "Bellek işinden çıkışlar ve Japon rakiplerin verim üstünlüğü", pub: "TrendForce", year: "2026", lang: "en",
          url: "https://www.trendforce.com/news/2026/08/21/news-intel-and-memory-a-history-of-exits-and-a-new-bid-to-return/" }
      ]
    }
  ];

  var S003 = [
    {
      area: "Finansman",
      place: ["ABD", " · 2005"],
      company: "Fennick",
      title: "Kahramanları başkası için çalışıyor",
      body: [
        "Fennick köklü bir çizgi roman şirketi. Dokuz yıl önce iflas başvurusu yaptı, iki yıl süren bir kavgadan sonra ayağa kalkabildi. Bugün parasını karakterlerini film stüdyolarına lisanslayarak kazanıyor.",
        "Bu lisanslar kırıntı getiriyor. En ünlü kahramanının iki filmi gişe, DVD ve televizyonla yaklaşık 3 milyar dolar kazandı; Fennick’e düşen 62 milyon dolar oldu. En bilinen karakterlerin çoğu zaten başka stüdyoların elinde.",
        "Stüdyolar hasılatın genellikle yüzde 5’ini ya da daha azını veriyor. Yönetim kurulu temkinli ve tek bir şartı var: şirket kendi kasasından tek kuruş koymayacak. Fennick’in yeni CEO’su sensin."
      ],
      stats: [["İki filmin getirisi", "~3 milyar $"], ["Fennick’e düşen", "62 milyon $"], ["Stüdyoların verdiği pay", "%5 ya da altı"]],
      ask: "Karakterlerini nasıl paraya çevirirsin?",
      opts: [
        { k: "A", t: "İkinci planda kalmış 10 karakterin film haklarını teminat ver, yarım milyar dolarlık kredi bul, filmleri kendin yap.", s: 90, tag: "kumar",
          r: "Kasadan para çıkmaz ama ilk filmler tutmazsa karakterler alacaklılara geçer. Üstelik en ünlü kahramanların bu pakette yok." },
        { k: "B", t: "Lisansa devam et ama pazarlığı sertleştir: hasılattan daha büyük pay, ürün gelirinde söz hakkı, senaryoda onay.", s: 40, tag: "kasa",
          r: "Risksiz ve hemen para getirir. Ama ünlü karakterlerin zaten stüdyolardayken pazarlık gücün sınırlı; yüzde 5’in üstüne çıkmak zor." },
        { k: "C", t: "Filme hiç girme. İflastan yeni çıkan şirketi yeniden riske atma; dergileri ve oyuncak işini büyüt, ekibi koru.", s: 30, tag: "kalkan",
          r: "Şirket güvende kalır, ekip dağılmaz. Ama karakterlerinin değeri yine başkalarının filmlerinde, başkalarının kasasında büyür." },
        { k: "D", t: "Kütüphaneyi büyük bir stüdyoya satmak için görüşmelere başla. Değer yüksekken parayı al, riski alıcı taşısın.", s: 15, tag: "cerrah",
          r: "Hızlı ve temiz bir çıkış. Ama karakterler kendi filmini hiç denemeden el değiştirir; dört yıl sonra şirketin tamamı yaklaşık 4 milyar dolara satıldı." }
      ],
      real: {
        who: "Victor Oakes",
        role: "Fennick CEO’su",
        k: "A",
        text: [
          "Planı, film biriminin başkanı ve operasyon sorumlusu olarak işe alınan Nathan Ashby hazırladı. Oakes ve yönetim kurulu, şirket tek kuruş koymayacaksa denemesine izin verdi. Son anda banka bütçelerin üçte birini Fennick’in koymasını istedi; şirket beş yabancı pazarın haklarını önceden satarak bu açığı kapattı.",
          "Eylül 2005’te 525 milyon dolarlık kredi tamamlandı. Kredi rücusuzdu, yani şirketin geri kalanına dokunulamazdı; teminat 10 karakterin sinema haklarıydı. Her biri en fazla 165 milyon dolarlık en çok 10 film çekilebilecekti. İlk dört film tutmazsa kalan altı karakterin hakları alacaklılara geçecekti.",
          "Zırhlı mucit Quillon’un hakları 2006’da başka bir stüdyodan geri dönünce ilk film için o seçildi. Mayıs 2008’de vizyona giren film dünyada yaklaşık 585 milyon dolar hasılat yaptı. 31 Ağustos 2009’da dünyanın en büyük eğlence şirketlerinden biri Fennick’i yaklaşık 4 milyar dolara satın almak için anlaştı."
        ]
      },
      sources: [
        { t: "525 milyon dolarlık film finansmanının resmi duyurusu", pub: "ABD SEC (8-K)", year: "2005", lang: "en",
          url: "https://www.sec.gov/Archives/edgar/data/933730/000111667905002263/ex99-1.htm" },
        { t: "Kırıntı lisanslardan kendi filmlerine: perde arkası", pub: "Slate", year: "2012", lang: "en",
          url: "https://slate.com/business/2012/09/marvel-comics-and-the-movies-the-business-story-behind-the-avengers.html" },
        { t: "Film stüdyosunun kuruluş hikâyesi ve pazarlıkları", pub: "The Hollywood Reporter", year: "2016", lang: "en",
          url: "https://www.hollywoodreporter.com/movies/movie-features/marvel-studios-origin-secrets-revealed-889795/" },
        { t: "İflastan kurtuluş ve 2005’teki cesur kredi kararı", pub: "TheWrap", year: "2012", lang: "en",
          url: "https://www.thewrap.com/how-spider-man-and-his-marvel-super-friends-were-saved-bankruptcy-46456/" },
        { t: "4 milyar dolarlık satın alma duyurusu", pub: "Alıcı şirketin basın bülteni", year: "2009", lang: "en",
          url: "https://thewaltdisneycompany.com/press-releases/disney-to-acquire-marvel-entertainment/" }
      ]
    },
    {
      area: "Kriz yönetimi",
      place: ["Güney Kore", " · Eylül 2016"],
      company: "Jinsol Elektronik · Arden Pro",
      title: "Cepteki kıvılcım",
      body: [
        "Arden Pro, Jinsol’un yılın en iddialı telefonu: büyük ekran, kalem, yaklaşık 885 dolarlık fiyat. Satışa çıkalı iki hafta oldu, on pazarda raflarda.",
        "Sonra haberler geliyor: ısınıp alev alan telefonlar. 1 Eylül itibarıyla 35 vaka bildirildi. İç inceleme sorunu batarya hücresinde görüyor; Çin’de satılan cihazlarda başka bir batarya kullanılıyor.",
        "Yaklaşık 2,5 milyon cihaz satıldı; bunların bir milyondan fazlası kullanıcıların elinde, gerisi depolarda ve yolda. Oran çok düşük, ama yanan her telefonun fotoğrafı ürünün adıyla dolaşıyor."
      ],
      stats: [["Satılan cihaz", "~2,5 milyon"], ["Bildirilen vaka", "35"], ["Satışta", "~2 hafta"]],
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
          "Yoon 2 Eylül’de satışı durdurdu ve satılmış bütün Arden Pro’ların yenisiyle değiştirileceğini açıkladı. Değişim cihazları kısa sürede müşterilere gönderilmeye başladı.",
          "Ama değişim cihazlarında da yanma vakaları görüldü. 10 Ekim’de satış ve değişim yeniden durduruldu, ertesi gün üretime tamamen son verildi; kullanıcılara para iadesi ya da başka bir telefon önerildi. Hisse bir günde yaklaşık %8 düştü; geri çağırmanın maliyeti en az 5,3 milyar dolar olarak açıklandı.",
          "Ocak 2017’de bağımsız laboratuvarlarla yürütülen inceleme, iki ayrı tedarikçinin bataryalarında iki farklı kusur buldu. Satılan ve etkinleştirilen yaklaşık 3 milyon cihazın %96’sı geri dönmüştü. Şirket sekiz adımlı yeni bir batarya güvenlik kontrolü getirdi."
        ]
      },
      sources: [
        { t: "Şirketin açıklaması: satılan cihazlar yenisiyle değiştirilecek", pub: "Şirketin haber odası", year: "2016", lang: "en",
          url: "https://news.samsung.com/global/statement-on-galaxy-note7" },
        { t: "Pil yangınları sonrası küresel geri çağırma", pub: "Daily FT / Reuters", year: "2016", lang: "en",
          url: "https://www.ft.lk/IT-Telecom-Tech/samsung-recalls-galaxy-note-7-phones-after-battery-fires/50-566134" },
        { t: "Model tamamen üretimden kaldırıldı", pub: "TechCrunch", year: "2016", lang: "en",
          url: "https://techcrunch.com/2016/10/11/samsung-kills-the-galaxy-note-7-for-good/" },
        { t: "Geri çağırmanın maliyeti en az 5,3 milyar dolar", pub: "VOA / AP", year: "2016", lang: "en",
          url: "https://www.voanews.com/a/samsung-note-7-recall-cost-least-five-point-three-billion/3550593.html" },
        { t: "Soruşturma: patlamaların nedeni iki tedarikçinin pilleri", pub: "PCWorld", year: "2017", lang: "en",
          url: "https://www.pcworld.com/article/411785/samsung-blames-batteries-from-two-makers-for-note7-explosions.html" }
      ]
    },
    {
      area: "Satın alma",
      place: ["ABD", " · Şubat 2008"],
      company: "Kestrin",
      title: "Kapıdaki 44 milyar",
      body: [
        "Kestrin internetin en tanınan adlarından biri. Ama çevrim içi reklam parasının büyük kısmı arama liderine akıyor; üç yıl önce senden küçük olan bu rakip artık pazara hükmediyor.",
        "Son çeyrekte kâr %23 düştü. 1.000’e kadar çalışanı, kadronun yaklaşık %7’sini çıkarmaya hazırlanıyorsun; hisse dört yılı aşkın sürenin en düşük seviyesinde. Şirketin kurucu ortaklarından birisin ve yedi aydır CEO’sun.",
        "Yazılım devi Brennick 1 Şubat’ta teklifini açıkladı: hisse başı 31 dolar, yarısı nakit yarısı hisse, toplam yaklaşık 44,6 milyar dolar. Bu, bir önceki kapanışın %62 üstü. Ama hissen iki yıl önce 43 doları görmüştü ve bir yıl önce gelen birleşme önerisini zaten geri çevirmiştin."
      ],
      stats: [["Teklif", "Hisse başı 31 $"], ["Prim", "%62"], ["Çeyreklik kâr", "−%23"]],
      ask: "Kestrin’in başındasın. Teklife cevabın ne?",
      opts: [
        { k: "A", t: "Kabul et. %62 prim, dört yılın dibindeki hisse için güçlü; ortaklar kazancı bugün cebine koyar.", s: 75, tag: "kasa",
          r: "Bağımsızlık biter ve bedelin yarısı alıcının hissesine bağlı kalır. Yine de ortaklar için güçlü bir çıkıştı: aynı yılın sonunda hisse 11 doların altındaydı." },
        { k: "B", t: "Masada kal: rakamın düşük olduğunu söyle, birkaç dolar daha iste ve anlaşmayı hızla bitir.", s: 85, tag: "cerrah",
          r: "Hem değeri zorlarsın hem anlaşmayı kaçırmazsın. Alıcının fiyatı biraz yükseltmeye hazır olduğu sonradan ortaya çıktı; kilit nokta farkı makul tutmaktı." },
        { k: "C", t: "Zaman kazan: başka alıcıları masaya çağır, arama lideriyle bir ortaklık seçeneğini de konuş.", s: 45, tag: "kumar",
          r: "Rakip bir teklif fiyatı yükseltebilir, gelmezse yalnızca zaman kaybedersin. Arama lideriyle ortaklık ise alıcıyı ürkütür ve rekabet soruları doğurur." },
        { k: "D", t: "Reddet: teklif şirketin değerinin çok altında. Bağımsız kal, kendi dönüşüm planını uygula.", s: 35, tag: "kumar",
          r: "Kurucunun gözünden anlaşılır: hisse iki yıl önce 43 dolardı. Ama dönüşümün sonuç vermesi yıllar alacaktı ve ne piyasa ne de alıcı o kadar sabırlıydı." }
      ],
      real: {
        who: "Adrian Voss",
        role: "Kestrin’in kurucu ortağı ve CEO’su",
        k: "D",
        text: [
          "Voss ve yönetim kurulu teklifi Şubat’ta hızla geri çevirdi; onlara göre rakam şirketin değerini yansıtmıyordu. Pazarlık aylarca sürdü. Brennick 33 dolara, yani yaklaşık 5 milyar dolar daha fazlasına çıkmaya hazır olduğunu söyledi; Voss ve diğer kurucu ortak 37 dolar istedi.",
          "3 Mayıs’ta Brennick teklifini geri çekti. Ertesi işlem gününde Kestrin hissesi %15 düşerek 24 dolar civarına indi. Kestrin, reklam alanının bir kısmını arama liderine bırakan bir anlaşmaya yöneldi; Kasım’da arama lideri bu anlaşmadan çekildi.",
          "Kasım 2008’de hisse 11 doların altındaydı. Brennick anlaşmasını kapatamadığı için sert eleştirilen Voss, 17 ay sonra CEO’luğu bırakacağını açıkladı."
        ]
      },
      sources: [
        { t: "Teklifin resmî duyurusu", pub: "Alıcı şirketin basın merkezi", year: "2008", lang: "en",
          url: "https://news.microsoft.com/2008/02/01/microsoft-proposes-acquisition-of-yahoo-for-31-per-share/" },
        { t: "Teklif öncesi çeyrek sonuçları ve işten çıkarmalar", pub: "The Honolulu Advertiser / AP", year: "2008", lang: "en",
          url: "https://honoluluadvertiser.com/article/2008/Jan/30/bz/hawaii801300412.html" },
        { t: "Alıcının teklifi geri çekme açıklaması", pub: "Alıcı şirketin basın merkezi", year: "2008", lang: "en",
          url: "https://news.microsoft.com/2008/05/03/microsoft-withdraws-proposal-to-acquire-yahoo/" },
        { t: "Geri çekilmenin ardından hisse düşüşü", pub: "NBC News / AP", year: "2008", lang: "en",
          url: "https://www.nbcnews.com/id/wbna24464481" },
        { t: "CEO’nun görevi bırakması", pub: "Fortune", year: "2008", lang: "en",
          url: "https://fortune.com/2008/11/18/yahoo-ceo-jerry-yang-to-step-down/" }
      ]
    },
    {
      area: "Dönüşüm",
      place: ["Japonya", " · 2004"],
      company: "Hoshimura",
      title: "Pazarı eriyen film devi",
      body: [
        "Hoshimura yetmiş yıllık bir Japon film devi. Renkli film, fotoğraf kâğıdı, baskı kimyasalları. 2000’de satışların yaklaşık %60’ı, kârın yaklaşık üçte ikisi fotoğraf ürünlerinden geldi. Onlarca yıl tek bir hedef vardı: Amerikalı dev Wexley’i geçmek.",
        "Sonra dijital fotoğraf makinesi geldi. Dünyada renkli film talebi geriliyor, pazar her yıl biraz daha küçülüyor. Hoshimura da dijital makine satıyor ama pazar kalabalık, rekabet sert. Fabrikalar, fotoğraf laboratuvarları ve dünyaya yayılmış satış ağı hâlâ filme göre kurulu.",
        "Elinde tıbbi görüntüleme ve matbaa malzemeleri gibi yan işler, üç yıl önce çoğunluk hissesi alınan bir fotokopi ortaklığı ve filmden kalma güçlü bir kimya ve kaplama birikimi var. Şirkete kırk yıl önce girdin; dört yıldır başkansın, geçen yıl CEO oldun. Yönetim kurulu senden bir plan bekliyor."
      ],
      stats: [["Kuruluş", "1934"], ["Fotoğrafın satış payı (2000)", "~%60"], ["Fotoğrafın kâr payı (2000)", "~üçte iki"]],
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
          "Hirota’nın CEO olarak ilk işi, şirketin hedefini Wexley’i yenmekten filmsiz bir geleceğe hazırlanmaya çevirmek oldu. Şubat 2004’te kuruluşun 75. yılını hedefleyen orta vadeli bir plan hazırladı: yeni büyüme alanları, yönetimin her kademesinde yapısal reform, grup yönetiminin güçlendirilmesi.",
          "Dijital geçiş beklenenden hızlı gelince asıl ameliyat Ocak 2006’da geldi: fotoğraf bölümünde yaklaşık 5.000 kişilik kesinti, fabrika ve laboratuvarların birleştirilmesi, dijital makine üretiminin Çin’e kayması. Maliyet iki mali yılda yaklaşık 165 milyar yen; ayrılanlara cömert tazminat ödendi.",
          "Film kimyası LCD ekran malzemelerine, tıbba ve yarı iletkene taşındı. 2007’de kolajen bilgisine dayanan bir cilt bakımı serisi çıktı, 2008’de bir Japon ilaç şirketinin kontrolü alındı. Hirota’nın deyişiyle dönüşüm on yıldan uzun sürdü; Wexley ise 2012’de iflas koruması için başvurdu."
        ]
      },
      sources: [
        { t: "Film biriminde 5.000 kişilik iş kesintisi", pub: "Photography Blog", year: "2006", lang: "en",
          url: "https://www.photographyblog.com/news/5000_job_losses_at_fujifilm" },
        { t: "Şirketi dönüştüren CEO’nun portresi", pub: "Korea JoongAng Daily", year: "2016", lang: "en",
          url: "https://www.koreajoongangdaily.com/business/innovator-komori-transformed-fujifilm/11729119" },
        { t: "Krizden inovasyonla çıkış: çekirdek iş yok olurken", pub: "Stone Bridge Press", year: "2015", lang: "en",
          url: "https://www.stonebridge.com/catalog/innovating-out-of-crisis" },
        { t: "Şirketin cilt bakımı markası büyümeye hazırlanıyor", pub: "The Daily Star", year: "2013", lang: "en",
          url: "https://www.thedailystar.net/news/skincare-brand-astalift-poised-for-expansion" },
        { t: "Grubun tarihçesi", pub: "Şirketin kurumsal sitesi", year: "", lang: "en",
          url: "https://holdings.fujifilm.com/en/about/history" }
      ]
    }
  ];

  // ---------- sayılar ----------
  // date: sayının açıldığı gün (Türkiye saati); ileri tarihli sayılar o gün kendiliğinden açılır
  var ISSUES = [
    { no: "001", date: "2026-10-15", cases: S001 },
    { no: "002", date: "2026-10-16", cases: S002 },
    { no: "003", date: "2026-10-19", cases: S003 }
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
  var ISSUE = CUR.no, CASES = CUR.cases, KEY = "wishceo.s" + ISSUE;

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

  function srcHtml(c) {
    return '<div class="src"><p class="lbl">Kaynaklar</p><ol role="list">' +
      c.sources.map(function (s) {
        return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer" hreflang="' + s.lang + '">' +
          esc(s.t) + '<span class="ext" aria-hidden="true">↗</span><span class="sr"> (yeni sekmede açılır)</span></a>' +
          "<span>" + esc(s.pub + (s.year ? " · " + s.year : "") + (s.lang === "en" ? " · İngilizce" : "")) + "</span></li>";
      }).join("") +
      '</ol><p class="src-note">Bu dosya gerçek bir olaya dayanıyor; şirket, ürün ve kişi adları değiştirildi.</p></div>';
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
      srcHtml(c) +
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
  function yearOf(c) { var m = /\d{4}/.exec(c.place[1] || ""); return m ? m[0] : ""; }
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
    var tick = CASES.map(function (c, i) {
      var y = yearOf(c);
      return "<span>Dosya " + pad(i + 1) + " · " + esc(c.place[0] + (y ? " " + y : "")) + " · " + esc(c.title) + ' <b class="dn">▼</b></span>';
    }).join("") + (RELEASED.length > 1 ? '<span>Arşiv · önceki sayılar açık <b class="up">▲</b></span>' : '<span>Yeni sayılar yolda <b class="up">▲</b></span>');
    Array.prototype.forEach.call(document.querySelectorAll(".ticker-group"), function (g) { g.innerHTML = tick; });
  }
  function avgScore(iss) {
    try {
      var s = JSON.parse(localStorage.getItem("wishceo.s" + iss.no) || "null");
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
    if (d) try { d.textContent = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { /* sabit tarih kalsın */ }
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
