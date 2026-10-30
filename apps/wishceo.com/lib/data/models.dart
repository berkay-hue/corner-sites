// Vaka verisi (wishceo.com/sayilar/NNN.json ile aynı biçim) ve kariyer kartları
// (assets/career.json).

import 'dart:convert';

class CaseOpt {
  const CaseOpt({
    required this.k,
    required this.t,
    required this.s,
    required this.tag,
    required this.r,
  });
  final String k;
  final String t;
  final int s;
  final String tag;
  final String r;

  factory CaseOpt.fromJson(Map<String, dynamic> j) => CaseOpt(
    k: j['k'] as String,
    t: j['t'] as String,
    s: (j['s'] as num).toInt(),
    tag: j['tag'] as String,
    r: j['r'] as String,
  );
}

class CaseReal {
  const CaseReal({
    required this.who,
    required this.role,
    required this.k,
    required this.text,
  });
  final String who;
  final String role;
  final String k;
  final List<String> text;

  factory CaseReal.fromJson(Map<String, dynamic> j) => CaseReal(
    who: j['who'] as String,
    role: j['role'] as String,
    k: j['k'] as String,
    text: List<String>.from(j['text'] as List),
  );
}

class CaseItem {
  const CaseItem({
    required this.area,
    required this.place,
    required this.company,
    required this.title,
    required this.body,
    required this.stats,
    required this.ask,
    required this.opts,
    required this.real,
    this.sponsor,
  });
  final String area;
  final String place;
  final String company;
  final String title;
  final List<String> body;
  final List<(String, String)> stats;
  final String ask;
  final List<CaseOpt> opts;
  final CaseReal real;
  final String? sponsor;

  CaseOpt opt(String k) => opts.firstWhere((o) => o.k == k);

  /// Kayıtlı ya da eski bir cevap artık seçeneklerde yoksa null.
  CaseOpt? optOf(String? k) {
    for (final o in opts) {
      if (o.k == k) return o;
    }
    return null;
  }

  factory CaseItem.fromJson(Map<String, dynamic> j) => CaseItem(
    area: j['area'] as String,
    place: (j['place'] as List).cast<String>().join(),
    company: j['company'] as String,
    title: j['title'] as String,
    body: List<String>.from(j['body'] as List),
    stats: [
      for (final s in j['stats'] as List)
        ((s as List)[0] as String, s[1] as String),
    ],
    ask: j['ask'] as String,
    opts: [
      for (final o in j['opts'] as List)
        CaseOpt.fromJson(o as Map<String, dynamic>),
    ],
    real: CaseReal.fromJson(j['real'] as Map<String, dynamic>),
    sponsor: j['sponsor'] as String?,
  );
}

class Issue {
  const Issue({required this.no, required this.date, required this.cases});
  final String no;
  final String date; // yyyy-mm-dd, Türkiye saatiyle açılış günü
  final List<CaseItem> cases;

  /// Sitedeki /sayilar/NNN.json: vakaların düz dizisi. Biçim bozuksa
  /// FormatException fırlatır; app.js'teki validCase ile aynı kontroller.
  factory Issue.parse(String no, String date, String raw) {
    try {
      final list = jsonDecode(raw) as List;
      if (list.isEmpty) throw const FormatException('boş sayı');
      final cases = [
        for (final c in list) CaseItem.fromJson(c as Map<String, dynamic>),
      ];
      for (final c in cases) {
        final keys = c.opts.map((o) => o.k).toSet();
        if (c.opts.isEmpty ||
            keys.length != c.opts.length ||
            !keys.contains(c.real.k) ||
            c.real.text.isEmpty) {
          throw FormatException('geçersiz vaka: ${c.company}');
        }
      }
      return Issue(no: no, date: date, cases: cases);
    } on FormatException {
      rethrow;
    } catch (e) {
      throw FormatException('Sayı $no okunamadı: $e');
    }
  }

  /// Kayıtlı cevapların hâlâ bu içeriğe ait olup olmadığını anlamak için
  /// vaka başlıkları ve seçenek harflerinden FNV-1a parmak izi. Yazım
  /// düzeltmesi cevapları silmez; vaka ya da seçenek değişirse silinir.
  String get fp {
    final key = [
      for (final c in cases) '${c.title}|${c.opts.map((o) => o.k).join()}',
    ].join('\n');
    var h = 0x811c9dc5;
    for (final b in utf8.encode(key)) {
      h = ((h ^ b) * 0x01000193) & 0xffffffff;
    }
    return h.toRadixString(16).padLeft(8, '0');
  }
}

enum Meter {
  nakit('Nakit'),
  marka('Marka'),
  ekip('Ekip'),
  pazar('Pazar payı');

  const Meter(this.label);
  final String label;
}

class CardSide {
  const CardSide({required this.label, required this.fx, required this.tag});
  final String label;
  final Map<Meter, int> fx;
  final String tag;

  factory CardSide.fromJson(Map<String, dynamic> j) {
    final fx = j['fx'] as Map<String, dynamic>;
    return CardSide(
      label: j['label'] as String,
      fx: {for (final m in Meter.values) m: (fx[m.name] as num? ?? 0).toInt()},
      tag: j['tag'] as String,
    );
  }
}

class CareerCard {
  const CareerCard({
    required this.id,
    required this.who,
    required this.text,
    required this.left,
    required this.right,
  });
  final String id;
  final String who;
  final String text;
  final CardSide left;
  final CardSide right;

  factory CareerCard.fromJson(Map<String, dynamic> j) => CareerCard(
    id: j['id'] as String,
    who: j['who'] as String,
    text: j['text'] as String,
    left: CardSide.fromJson(j['left'] as Map<String, dynamic>),
    right: CardSide.fromJson(j['right'] as Map<String, dynamic>),
  );
}
