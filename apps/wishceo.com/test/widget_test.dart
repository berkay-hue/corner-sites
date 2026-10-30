import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:share_plus_platform_interface/share_plus_platform_interface.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wishceo/data/calendar.dart';
import 'package:wishceo/data/models.dart';
import 'package:wishceo/data/repo.dart';
import 'package:wishceo/game/career_game.dart';
import 'package:wishceo/game/scoring.dart';
import 'package:wishceo/main.dart';

CareerCard _card(String id, {int left = -30, int right = 30}) => CareerCard(
  id: id,
  who: 'Finans direktörü',
  text: 'Kart $id',
  left: CardSide(label: 'Sol', fx: {Meter.nakit: left}, tag: 'kasa'),
  right: CardSide(label: 'Sağ', fx: {Meter.nakit: right}, tag: 'kumar'),
);

CaseItem _case(String company) => CaseItem(
  area: 'Perakende',
  place: 'Bir şehir',
  company: company,
  title: '$company zor durumda',
  body: const ['Kısa bir kriz.'],
  stats: const [('Çalışan', '120')],
  ask: 'Ne yaparsın?',
  opts: const [
    CaseOpt(k: 'A', t: 'Birinci yol', s: 90, tag: 'cerrah', r: 'İyi.'),
    CaseOpt(k: 'B', t: 'İkinci yol', s: 55, tag: 'kalkan', r: 'Orta.'),
    CaseOpt(k: 'C', t: 'Üçüncü yol', s: 20, tag: 'kumar', r: 'Kötü.'),
  ],
  real: const CaseReal(
    who: 'Ayla Demir',
    role: 'CEO',
    k: 'B',
    text: ['Böyle yaptı.'],
  ),
);

/// Sitedeki /sayilar/NNN.json biçiminde tek vakalık sayı.
String _raw(String company, {String realK = 'B'}) => jsonEncode([
  {
    'area': 'Perakende',
    'place': ['Bir şehir'],
    'company': company,
    'title': '$company zor durumda',
    'body': ['Kısa bir kriz.'],
    'stats': [
      ['Çalışan', '120'],
    ],
    'ask': 'Ne yaparsın?',
    'opts': [
      {'k': 'A', 't': 'Birinci yol', 's': 90, 'tag': 'cerrah', 'r': 'İyi.'},
      {'k': 'B', 't': 'İkinci yol', 's': 55, 'tag': 'kalkan', 'r': 'Orta.'},
    ],
    'real': {
      'who': 'Ayla Demir',
      'role': 'CEO',
      'k': realK,
      'text': ['Böyle yaptı.'],
    },
  },
]);

final _career = CareerData(
  company: 'Lunavik',
  intro: const ['Giriş metni.'],
  endings: const {'nakit_0': 'Kasa boşaldı.', 'nakit_100': 'Kasa taştı.'},
  cards: [_card('k1'), _card('k2')],
);

/// Uygulama açılmamış sayıyı yüklemez; arşivde yalnız tarihi görünür (003).
AppData _data() => AppData(
  issues: [
    Issue(
      no: '001',
      date: '2026-10-15',
      cases: [_case('Birinci'), _case('İkinci')],
    ),
    Issue(no: '002', date: '2026-10-16', cases: [_case('Üçüncü')]),
  ],
  career: _career,
  today: '2026-10-18',
);

/// Testte asset paketi: yalnız verilen dosyalar var.
class _Bundle extends CachingAssetBundle {
  _Bundle(this.files);
  final Map<String, String> files;

  @override
  Future<ByteData> load(String key) async {
    final s = files[key];
    if (s == null) throw FlutterError('Asset yok: $key');
    return ByteData.sublistView(utf8.encode(s));
  }
}

final _careerJson = File('assets/career.json').readAsStringSync();

class _FakeShare extends SharePlatform {
  final shared = <ShareParams>[];
  ShareResult result = const ShareResult('ok', ShareResultStatus.success);

  @override
  Future<ShareResult> share(ShareParams params) async {
    shared.add(params);
    return result;
  }
}

// SharePlus.instance ilk erişimde platformu yakalar; testlerin hepsi bunu kullanır.
final _share = _FakeShare();

void _phone(WidgetTester t) {
  t.view.physicalSize = const Size(390, 844);
  t.view.devicePixelRatio = 1;
  addTearDown(t.view.reset);
}

/// Kaydırılabilir listede öğeyi bulup ekrana getirir.
Future<void> _show(WidgetTester t, Finder f) async {
  await t.scrollUntilVisible(f, 200, scrollable: find.byType(Scrollable).first);
  await t.ensureVisible(f);
  await t.pumpAndSettle();
}

/// Panoya yazılanı yakalar.
String? Function() _clipboard(WidgetTester t) {
  String? copied;
  t.binding.defaultBinaryMessenger.setMockMethodCallHandler(
    SystemChannels.platform,
    (call) async {
      if (call.method == 'Clipboard.setData') {
        copied = (call.arguments as Map)['text'] as String?;
      }
      return null;
    },
  );
  addTearDown(
    () => t.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      null,
    ),
  );
  return () => copied;
}

/// Ana sayfadan bugünün sayısını oynayıp paylaşım ekranını açar.
Future<void> _openShare(WidgetTester t) async {
  _phone(t);
  await t.pumpWidget(WishCeoApp(data: _data()));
  await t.pumpAndSettle();
  await _show(t, find.textContaining('Dosyaları aç'));
  await t.tap(find.textContaining('Dosyaları aç'));
  await t.pumpAndSettle();
  await _show(t, find.text('Birinci yol'));
  await t.tap(find.text('Birinci yol'));
  await t.pumpAndSettle();
  final next = find.textContaining('CEO karnemi göster');
  await _show(t, next);
  await t.tap(next);
  await t.pumpAndSettle();
  expect(find.textContaining('Karne'), findsWidgets);
  final share = find.text('Sonucumu paylaş');
  await _show(t, share);
  await t.tap(share);
  await t.pumpAndSettle();
  expect(find.text('Sayı 002'), findsOneWidget);
  expect(find.text('90'), findsOneWidget);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() => SharePlatform.instance = _share);

  setUp(() {
    progress.clearForTest();
    SharedPreferences.setMockInitialValues({});
    _share.shared.clear();
    _share.result = const ShareResult('ok', ShareResultStatus.success);
  });

  group('CareerGame', () {
    test('alt sınırda kovulur', () {
      final g = CareerGame([_card('k1'), _card('k2')], rng: Random(1));
      expect(g.period, 'Yıl 1 · Ç 1');
      expect(g.mood, 100);
      g.choose(false);
      expect(g.meters[Meter.nakit], 20);
      expect(g.quarters, 1);
      expect(g.over, isFalse);
      g.choose(false);
      expect(g.over, isTrue);
      expect(g.firedBy, (Meter.nakit, false));
      expect(g.meters[Meter.nakit], 0);
      expect(g.quarters, 1);
      expect(g.typeTag, 'kasa');
    });

    test('üst sınırda kovulur', () {
      final g = CareerGame([_card('k1'), _card('k2')], rng: Random(2));
      g.choose(true);
      g.choose(true);
      expect(g.firedBy, (Meter.nakit, true));
      expect(g.typeTag, 'kumar');
    });

    test('2. yıldan sonra etkiler sertleşir', () {
      final g = CareerGame([_card('k1', left: -4, right: 4)], rng: Random(3));
      expect(g.scale, 1);
      for (var i = 0; i < 8; i++) {
        g.choose(i.isEven);
      }
      expect(g.quarters, 8);
      expect(g.scale, 1.25);
      expect(g.effect(g.current.right)[Meter.nakit], 5);
    });

    test('deste aynı kartı üst üste vermez', () {
      final g = CareerGame([
        _card('k1', left: -1, right: 1),
        _card('k2', left: -1, right: 1),
      ], rng: Random(4));
      var last = g.current.id;
      for (var i = 0; i < 30; i++) {
        g.choose(i.isEven);
        expect(g.current.id, isNot(last));
        last = g.current.id;
      }
    });
  });

  group('Puanlama', () {
    test('kademe ve kurul cümlesi', () {
      expect(
        [tier(80), tier(79), tier(50), tier(49)],
        ['hi', 'mid', 'mid', 'lo'],
      );
      expect(boardLine(80), 'Yönetim kurulu seni sevdi.');
      expect(boardLine(60), 'Yönetim kurulu seni izliyor.');
      expect(boardLine(40), 'Yönetim kurulu acil toplantı istedi.');
      expect(boardLine(39), 'Yönetim kurulu yeni CEO arıyor.');
    });

    test('eşitlikte puan toplamı, sonra sabit sıra', () {
      expect(
        dominantTag({'kasa': 1, 'kumar': 1}, {'kasa': 20, 'kumar': 90}),
        'kumar',
      );
      expect(dominantTag({'kasa': 1, 'kumar': 1}), 'kumar');
      expect(dominantTag({}), 'cerrah');
    });

    test('karne ve paylaşım metni (sitedeki gibi linkli)', () {
      final issue = _data().issues.first;
      final r = issueResult(issue, ['A', 'C']);
      expect(r.score, 55);
      expect(r.real, 55);
      expect(r.tiers, ['hi', 'lo']);
      final text = issueShareText(issue, r);
      expect(text, startsWith('WishCEO · Sayı 001\n'));
      expect(text, contains('55/100'));
      expect(text, endsWith('\nhttps://wishceo.com/?s=001'));
      final career = careerShareText('Lunavik', 7, 'kalkan');
      expect(career, contains('7 çeyrek dayandım'));
      expect(career, endsWith('\nhttps://wishceo.com/'));
    });

    test('cevabı olmayan vaka karneyi bozmaz, hata verir', () {
      final issue = _data().issues.first;
      expect(() => issueResult(issue, ['A', 'Z']), throwsStateError);
    });
  });

  group('Takvim', () {
    test('005 ve sonrası her Pazartesi', () {
      expect(issueDate(4), const IssueDate('004', '2026-10-26'));
      expect(issueDate(5), const IssueDate('005', '2026-11-02'));
      expect(issueDate(6), const IssueDate('006', '2026-11-09'));
      expect(issueDate(16), const IssueDate('016', '2027-01-18'));
    });

    test('açılmış sayılar ve sıradaki', () {
      expect(releasedOn('2026-11-01').map((d) => d.no), [
        '001',
        '002',
        '003',
        '004',
      ]);
      expect(releasedOn('2026-11-02').last.no, '005');
      expect(nextAfter('2026-11-01'), const IssueDate('005', '2026-11-02'));
      expect(nextAfter('2026-11-02'), const IssueDate('006', '2026-11-09'));
      expect(nextAfter('2026-10-18'), const IssueDate('003', '2026-10-19'));
    });

    test('gün Türkiye saatiyle döner (UTC+3)', () {
      expect(todayTr(DateTime.utc(2026, 11, 1, 20, 59)), '2026-11-01');
      expect(todayTr(DateTime.utc(2026, 11, 1, 21)), '2026-11-02');
      expect(trDate('2026-11-02'), '2 Kasım 2026');
    });
  });

  group('Sayı dosyası', () {
    test('geçerli dosya okunur', () {
      final i = Issue.parse('009', '2026-11-30', _raw('Deneme'));
      expect(i.cases.single.company, 'Deneme');
      expect(i.cases.single.place, 'Bir şehir');
      expect(i.cases.single.stats.single, ('Çalışan', '120'));
    });

    test('bozuk dosya FormatException verir', () {
      for (final raw in [
        '[]',
        '{bozuk',
        '{"a": 1}',
        _raw('Deneme', realK: 'Z'),
        '[{"company": "Eksik"}]',
      ]) {
        expect(
          () => Issue.parse('009', '2026-11-30', raw),
          throwsFormatException,
          reason: raw,
        );
      }
    });

    test('parmak izi başlık ve seçenek harfleriyle değişir', () {
      final a = Issue.parse('009', '2026-11-30', _raw('Deneme'));
      final b = Issue.parse('009', '2026-11-30', _raw('Deneme'));
      final c = Issue.parse('009', '2026-11-30', _raw('Başka'));
      expect(a.fp, b.fp);
      expect(a.fp, isNot(c.fp));
    });
  });

  group('Yükleme', () {
    Map<String, String> bundle(Map<String, String> sayilar) => {
      'assets/career.json': _careerJson,
      for (final e in sayilar.entries) 'assets/sayilar/${e.key}.json': e.value,
    };

    test('eski sayı paketten; son iki sayı ağdan ve önbelleğe', () async {
      final prefs = await SharedPreferences.getInstance();
      final asked = <String>[];
      final d = await AppData.load(
        bundle: _Bundle(bundle({'001': _raw('P1'), '002': _raw('P2')})),
        prefs: prefs,
        today: '2026-10-20',
        fetch: (no) async {
          asked.add(no);
          return no == '003' ? _raw('N3') : null;
        },
      );
      expect(asked..sort(), ['002', '003']);
      expect(d.issues.map((i) => i.no), ['001', '002', '003']);
      expect(d.current.cases.single.company, 'N3');
      expect(d.issues[1].cases.single.company, 'P2');
      expect(d.next, const IssueDate('004', '2026-10-26'));
      expect(prefs.getString('wishceo.sayi.003'), isNotNull);
      expect(prefs.getString('wishceo.sayi.002'), isNull);
      expect(d.latestMissing, isFalse);

      // Çevrimdışı: 003 önbellekten açılır.
      final off = await AppData.load(
        bundle: _Bundle(bundle({'001': _raw('P1'), '002': _raw('P2')})),
        prefs: prefs,
        today: '2026-10-20',
        fetch: (_) async => null,
      );
      expect(off.current.no, '003');
      expect(off.current.cases.single.company, 'N3');
    });

    test('ağdaki düzeltme önbellekteki eski metni geçer', () async {
      SharedPreferences.setMockInitialValues({
        'wishceo.sayi.002': _raw('Eski'),
      });
      final prefs = await SharedPreferences.getInstance();
      final d = await AppData.load(
        bundle: _Bundle(bundle({'001': _raw('P1')})),
        prefs: prefs,
        today: '2026-10-18',
        fetch: (no) async => no == '002' ? _raw('Yeni') : null,
      );
      expect(d.current.cases.single.company, 'Yeni');
      expect(prefs.getString('wishceo.sayi.002'), _raw('Yeni'));
    });

    test('bozuk ya da ulaşılamayan sayı elenir', () async {
      final d = await AppData.load(
        bundle: _Bundle(bundle({'001': _raw('P1'), '002': _raw('P2')})),
        today: '2026-10-20',
        fetch: (no) async {
          if (no == '002') throw const SocketException('ağ yok');
          return '{bozuk';
        },
      );
      expect(d.issues.map((i) => i.no), ['001', '002']);
      expect(d.current.no, '002');
      expect(d.latestMissing, isTrue); // 003 açıldı ama inmedi
    });

    test('hiç sayı yoksa hata verir', () async {
      await expectLater(
        AppData.load(
          bundle: _Bundle(bundle({})),
          today: '2026-10-20',
          fetch: (_) async => null,
        ),
        throwsStateError,
      );
    });

    test('açılmamış sayı istenmez', () async {
      final asked = <String>[];
      await AppData.load(
        bundle: _Bundle(bundle({})),
        today: '2026-11-01',
        fetch: (no) async {
          asked.add(no);
          return _raw('N$no');
        },
      );
      expect(asked, isNot(contains('005')));
      expect(asked.toSet(), {'001', '002', '003', '004'});
    });
  });

  group('Kayıt', () {
    test('cevaplar cihazda kalır, içerik değişince sıfırlanır', () async {
      final prefs = await SharedPreferences.getInstance();
      final issue = Issue.parse('009', '2026-11-30', _raw('Deneme'));
      final p1 = Progress()..attach(prefs);
      p1.answer(issue, 0, 'A');
      expect(p1.recordCareer(5), isTrue);
      expect(p1.recordCareer(3), isFalse);
      await Future<void>.delayed(Duration.zero);

      final p2 = Progress()..attach(prefs);
      expect(p2.answersOf(issue), ['A']);
      expect(p2.bestCareer, 5);
      final changed = Issue.parse('009', '2026-11-30', _raw('Başka'));
      expect(p2.answersOf(changed), [null]);

      p2.reset(issue);
      await Future<void>.delayed(Duration.zero);
      expect((Progress()..attach(prefs)).answersOf(issue), [null]);
    });

    test('bozuk kayıt baştan başlatır', () async {
      SharedPreferences.setMockInitialValues({'wishceo.s009': '{bozuk'});
      final prefs = await SharedPreferences.getInstance();
      final issue = Issue.parse('009', '2026-11-30', _raw('Deneme'));
      expect((Progress()..attach(prefs)).answersOf(issue), [null]);
    });
  });

  group('Veri dosyaları', () {
    final career = jsonDecode(_careerJson) as Map<String, dynamic>;
    final sayilar = {
      for (final f in Directory('assets/sayilar').listSync().whereType<File>())
        f.uri.pathSegments.last: f.readAsStringSync(),
    };

    test('kariyer destesi geçerli', () {
      final data = CareerData.fromJson(career);
      expect(data.cards.length, greaterThanOrEqualTo(40));
      expect(data.cards.map((c) => c.id).toSet().length, data.cards.length);
      for (final m in Meter.values) {
        expect(data.ending(m, false), isNotEmpty);
        expect(data.ending(m, true), isNotEmpty);
      }
      for (final c in data.cards) {
        for (final s in [c.left, c.right]) {
          expect(tagOrder, contains(s.tag), reason: c.id);
          expect(s.fx.values.any((v) => v != 0), isTrue, reason: c.id);
          expect(s.label.length, lessThanOrEqualTo(28), reason: c.id);
        }
      }
    });

    test('pakette yalnız açılmış ve sitedekiyle aynı sayılar var', () {
      expect(sayilar.keys, contains('001.json'));
      final today = todayTr();
      for (final e in sayilar.entries) {
        final m = RegExp(r'^(\d{3})\.json$').firstMatch(e.key);
        expect(m, isNotNull, reason: e.key);
        final d = issueDate(int.parse(m!.group(1)!));
        expect(d.date.compareTo(today) <= 0, isTrue, reason: e.key);
        final issue = Issue.parse(d.no, d.date, e.value);
        expect(issue.cases.length, inInclusiveRange(3, 4), reason: e.key);
        final site = File('../../sites/wishceo.com/sayilar/${e.key}');
        if (site.existsSync()) {
          expect(e.value, site.readAsStringSync(), reason: e.key);
        }
      }
    });

    test('dış link yok', () {
      final all = [jsonEncode(career), ...sayilar.values].join('\n');
      for (final w in ['http', 'www.']) {
        expect(all.toLowerCase(), isNot(contains(w)), reason: w);
      }
    });
  });

  group('Ekranlar', () {
    testWidgets('ana sayfa iki modu ve bugünün sayısını gösterir', (t) async {
      _phone(t);
      await t.pumpWidget(WishCeoApp(data: _data()));
      await t.pumpAndSettle();
      expect(find.text('Sen olsan ne yapardın?'), findsOneWidget);
      expect(find.textContaining(RegExp('Sayı 002|SAYI 002')), findsOneWidget);
      expect(find.textContaining('Kariyere başla'), findsOneWidget);
    });

    testWidgets('arşiv sıradaki sayıyı yalnız tarihiyle gösterir', (t) async {
      _phone(t);
      await t.pumpWidget(WishCeoApp(data: _data()));
      await t.pumpAndSettle();
      await _show(t, find.text('Arşiv · geçmiş sayılar'));
      await t.tap(find.text('Arşiv · geçmiş sayılar'));
      await t.pumpAndSettle();
      expect(find.textContaining('Sayı 003 · 19 Ekim 2026'), findsOneWidget);
      expect(find.textContaining('Birinci'), findsOneWidget);
    });

    testWidgets('gizlilik ve iletişim ekranı açılır', (t) async {
      _phone(t);
      await t.pumpWidget(WishCeoApp(data: _data()));
      await t.pumpAndSettle();
      final link = find.text('Gizlilik ve iletişim');
      await _show(t, link);
      await t.tap(link);
      await t.pumpAndSettle();
      expect(
        find.textContaining('hiçbir kişisel veri toplamaz'),
        findsOneWidget,
      );
      expect(
        find.text('https://wishceo.com/gizlilik#uygulama'),
        findsOneWidget,
      );
      await _show(t, find.text('https://wishceo.com/destek'));
      expect(find.text('info@saascorner.co'), findsOneWidget);
    });

    testWidgets('yükleme hatasında tekrar denenir', (t) async {
      _phone(t);
      var calls = 0;
      await t.pumpWidget(
        WishCeoApp(
          loader: () async {
            calls++;
            if (calls == 1) throw StateError('ağ yok');
            return _data();
          },
        ),
      );
      await t.pumpAndSettle();
      expect(find.text('Vakalar açılamadı.'), findsOneWidget);
      await t.tap(find.text('Tekrar dene'));
      await t.pump();
      // Deneme sürerken eski hata değil bekleme görünür.
      expect(find.text('Vakalar açılamadı.'), findsNothing);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      await t.pumpAndSettle();
      expect(calls, 2);
      expect(find.text('Sen olsan ne yapardın?'), findsOneWidget);
    });

    testWidgets('yeni sayı inmediyse öne gelince yeniden denenir', (t) async {
      _phone(t);
      final today = todayTr();
      final all = [
        for (final d in releasedOn(today))
          Issue(no: d.no, date: d.date, cases: [_case(d.no)]),
      ];
      var calls = 0;
      var missing = true;
      await t.pumpWidget(
        WishCeoApp(
          loader: () async {
            calls++;
            return AppData(
              issues: missing ? all.sublist(0, all.length - 1) : all,
              career: _career,
              today: today,
            );
          },
        ),
      );
      await t.pumpAndSettle();
      Future<void> resume() async {
        t.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
        t.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
        await t.pumpAndSettle();
      }

      await resume();
      expect(calls, 2);
      missing = false;
      await resume();
      expect(calls, 3);
      await resume(); // en yeni sayı geldi, aynı gün yeniden yüklenmez
      expect(calls, 3);
    });

    testWidgets('kariyer: iki sola kaydırmada kurul görevden alır', (t) async {
      _phone(t);
      await t.pumpWidget(WishCeoApp(data: _data()));
      await t.pumpAndSettle();
      await t.tap(find.textContaining('Kariyere başla'));
      await t.pumpAndSettle();
      await t.tap(find.byKey(const Key('basla')));
      await t.pumpAndSettle();
      await t.tap(find.byKey(const Key('sol')));
      await t.pumpAndSettle();
      await t.tap(find.byKey(const Key('sol')));
      await t.pumpAndSettle();
      expect(find.text('Kasa boşaldı.'), findsOneWidget);
      expect(find.byKey(const Key('tekrar')), findsOneWidget);
    });
  });

  group('Paylaşım', () {
    testWidgets('cihaz menüsüyle linkli metin paylaşılır', (t) async {
      await _openShare(t);
      await _show(t, find.text('Sonucu paylaş'));
      await t.tap(find.text('Sonucu paylaş'));
      await t.pumpAndSettle();
      final p = _share.shared.single;
      expect(p.text, startsWith('WishCEO · Sayı 002'));
      expect(p.text, endsWith('\nhttps://wishceo.com/?s=002'));
      expect(p.sharePositionOrigin, isNotNull);
      expect(find.textContaining('panoya kopyalandı'), findsNothing);
    });

    testWidgets('paylaşım yoksa metin panoya kopyalanır', (t) async {
      _share.result = ShareResult.unavailable;
      await _openShare(t);
      final copied = _clipboard(t);
      await _show(t, find.text('Sonucu paylaş'));
      await t.tap(find.text('Sonucu paylaş'));
      await t.pump();
      await t.pump(const Duration(milliseconds: 300));
      expect(copied(), startsWith('WishCEO · Sayı 002'));
      expect(find.textContaining('panoya kopyalandı'), findsOneWidget);
    });

    testWidgets('metni kopyala düğmesi', (t) async {
      await _openShare(t);
      final copied = _clipboard(t);
      await _show(t, find.text('Metni kopyala'));
      await t.tap(find.text('Metni kopyala'));
      await t.pump();
      await t.pump(const Duration(milliseconds: 300));
      expect(copied(), contains('https://wishceo.com/?s=002'));
      expect(_share.shared, isEmpty);
      expect(find.textContaining('panoya kopyalandı'), findsOneWidget);
    });
  });
}
