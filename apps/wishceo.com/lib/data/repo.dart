import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'calendar.dart';
import 'models.dart';

export 'calendar.dart' show todayTr, trDate;

/// Webdeki ?ornek-sponsor karşılığı: --dart-define=ORNEK_SPONSOR=true
const kOrnekSponsor = bool.fromEnvironment('ORNEK_SPONSOR');

const kSite = 'https://wishceo.com';

/// Sitedeki sayı dosyasının metni; yoksa (404) ya da ulaşılamazsa null.
typedef IssueFetch = Future<String?> Function(String no);

class CareerData {
  const CareerData({
    required this.company,
    required this.intro,
    required this.endings,
    required this.cards,
  });
  final String company;
  final List<String> intro;
  final Map<String, String> endings; // "nakit_0", "nakit_100", ...
  final List<CareerCard> cards;

  String ending(Meter m, bool high) =>
      endings['${m.name}_${high ? 100 : 0}'] ?? '';

  factory CareerData.fromJson(Map<String, dynamic> j) => CareerData(
    company: j['company'] as String,
    intro: (j['intro'] as List).cast<String>(),
    endings: (j['endings'] as Map<String, dynamic>).cast<String, String>(),
    cards: [
      for (final c in j['cards'] as List)
        CareerCard.fromJson(c as Map<String, dynamic>),
    ],
  );
}

class AppData {
  AppData({
    required this.issues,
    required this.career,
    String? today,
    IssueDate? next,
  }) : today = today ?? todayTr(),
       next = next ?? nextAfter(today ?? todayTr());

  /// Yüklenebilen sayılar (eskiden yeniye).
  final List<Issue> issues;
  final CareerData career;
  final String today; // yyyy-mm-dd

  /// Arşivde "Yakında" diye görünen tek sayı; içeriği yüklenmez.
  final IssueDate next;

  /// Bugüne kadar açılmış sayılar (eskiden yeniye).
  List<Issue> get released => [
    for (final i in issues)
      if (i.date.compareTo(today) <= 0) i,
  ];

  /// Bugünün vakası = açılmış en yeni sayı.
  Issue get current => released.last;

  /// Takvime göre açılmış en yeni sayı henüz indirilemedi (site Pazartesi
  /// gece yarısından biraz sonra güncellenir ya da bağlantı yok).
  bool get latestMissing => releasedOn(today).last.no != current.no;

  /// Açılmış her sayı için sırayla ağ, önbellek ve uygulama paketi denenir.
  /// Ağdan yalnız son iki sayı ve elde hiç olmayanlar istenir; böylece yeni
  /// sayı ve sonradan düzeltilen sayı gelir, eski sayılar çevrimdışı açılır.
  static Future<AppData> load({
    AssetBundle? bundle,
    SharedPreferences? prefs,
    IssueFetch? fetch,
    String? today,
  }) async {
    final b = bundle ?? rootBundle;
    final day = today ?? todayTr();
    final get = fetch ?? fetchIssue;
    final career = CareerData.fromJson(
      jsonDecode(await b.loadString('assets/career.json'))
          as Map<String, dynamic>,
    );

    Issue? parse(IssueDate d, String? raw) {
      if (raw == null) return null;
      try {
        return Issue.parse(d.no, d.date, raw);
      } on FormatException {
        return null;
      }
    }

    Future<Issue?> one(IssueDate d, bool recent) async {
      final key = 'wishceo.sayi.${d.no}';
      final local =
          parse(d, prefs?.getString(key)) ?? parse(d, await _asset(b, d.no));
      if (local != null && !recent) return local;
      String? raw;
      try {
        raw = await get(d.no).timeout(const Duration(seconds: 8));
      } catch (_) {
        raw = null;
      }
      final net = parse(d, raw);
      if (net == null) return local;
      try {
        await prefs?.setString(key, raw!);
      } catch (_) {
        // Önbelleğe yazılamazsa sayı yine de bu oturumda açılır.
      }
      return net;
    }

    final dates = releasedOn(day);
    final loaded = await Future.wait([
      for (var i = 0; i < dates.length; i++)
        one(dates[i], i >= dates.length - 2),
    ]);
    final issues = loaded.whereType<Issue>().toList();
    if (issues.isEmpty) {
      throw StateError('Hiçbir sayı yüklenemedi');
    }
    progress.attach(prefs);
    return AppData(issues: issues, career: career, today: day);
  }
}

Future<String?> _asset(AssetBundle b, String no) async {
  try {
    return await b.loadString('assets/sayilar/$no.json', cache: false);
  } catch (_) {
    return null;
  }
}

/// https://wishceo.com/sayilar/NNN.json; açılmamış sayı sitede 404 döner.
Future<String?> fetchIssue(String no) async {
  final client = HttpClient()
    ..connectionTimeout = const Duration(seconds: 4)
    ..userAgent = 'WishCEO-App/1.0';
  try {
    final req = await client.getUrl(Uri.parse('$kSite/sayilar/$no.json'));
    final res = await req.close().timeout(const Duration(seconds: 6));
    if (res.statusCode != HttpStatus.ok) {
      await res.drain<void>();
      return null;
    }
    final bytes = <int>[];
    await for (final chunk in res.timeout(const Duration(seconds: 6))) {
      bytes.addAll(chunk);
      if (bytes.length > 256 * 1024) return null;
    }
    return utf8.decode(bytes);
  } catch (_) {
    return null;
  } finally {
    client.close(force: true);
  }
}

/// Uygulamada sponsor satırı yok (mağaza beyanı: reklam yok); sayıdaki
/// sponsor alanı yalnız ORNEK_SPONSOR önizlemesinde görünür.
String sponsorOf(CaseItem c) =>
    kOrnekSponsor ? (c.sponsor ?? 'Örnek Sponsor') : '';

const _kKariyer = 'wishceo.kariyer';

/// Cevaplar ve kariyer rekoru. Cihazda kalır (shared_preferences), hiçbir
/// yere gönderilmez. Testlerde attach çağrılmazsa yalnız bellekte tutulur.
class Progress extends ChangeNotifier {
  SharedPreferences? _prefs;
  final Map<String, List<String?>> _answers = {};
  int _bestCareer = 0;
  int get bestCareer => _bestCareer;

  void attach(SharedPreferences? prefs) {
    if (prefs == null || identical(prefs, _prefs)) return;
    _prefs = prefs;
    _answers.clear();
    _bestCareer = prefs.getInt(_kKariyer) ?? 0;
    notifyListeners();
  }

  String _key(Issue i) => 'wishceo.s${i.no}';

  /// Sayının içeriği değişirse (parmak izi) eski cevaplar yok sayılır.
  List<String?> answersOf(Issue i) =>
      _answers.putIfAbsent('${i.no}:${i.fp}', () {
        final list = List<String?>.filled(i.cases.length, null);
        final raw = _prefs?.getString(_key(i));
        if (raw == null) return list;
        try {
          final j = jsonDecode(raw) as Map<String, dynamic>;
          final a = j['answers'] as List;
          if (j['fp'] == i.fp && a.length == list.length) {
            for (var x = 0; x < a.length; x++) {
              final k = a[x];
              if (k is String && i.cases[x].optOf(k) != null) list[x] = k;
            }
          }
        } catch (_) {
          // Bozuk kayıt: baştan başlanır.
        }
        return list;
      });

  void answer(Issue i, int index, String k) {
    final list = answersOf(i);
    list[index] = k;
    _write(
      () =>
          _prefs?.setString(_key(i), jsonEncode({'answers': list, 'fp': i.fp})),
    );
    notifyListeners();
  }

  void reset(Issue i) {
    _answers.remove('${i.no}:${i.fp}');
    _write(() => _prefs?.remove(_key(i)));
    notifyListeners();
  }

  /// Kariyer bitince çağrılır; yeni rekorsa true döner.
  bool recordCareer(int quarters) {
    if (quarters <= _bestCareer) return false;
    _bestCareer = quarters;
    _write(() => _prefs?.setInt(_kKariyer, quarters));
    notifyListeners();
    return true;
  }

  void _write(Future<bool>? Function() op) {
    try {
      op()?.catchError((Object _) => false);
    } catch (_) {
      // Kayıt yazılamazsa oyun bellekte sürer.
    }
  }

  @visibleForTesting
  void clearForTest() {
    _prefs = null;
    _answers.clear();
    _bestCareer = 0;
  }
}

final progress = Progress();
