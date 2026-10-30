import '../data/models.dart';

// Webdeki app.js ile aynı kurallar: tier, CEO tipleri, karne hesabı.

String tier(int s) => s >= 80
    ? 'hi'
    : s >= 50
    ? 'mid'
    : 'lo';

class CeoType {
  const CeoType(this.name, this.desc);
  final String name;
  final String desc;
}

const tagOrder = ['cerrah', 'kalkan', 'kumar', 'kasa'];

const types = <String, CeoType>{
  'cerrah': CeoType(
    'Budayıcı',
    'Neyin bırakılacağını bilirsin. Duygusal bağlara değil, şirketin gerçekte neyle para kazandığına bakarsın ve zor kararı erken alırsın.',
  ),
  'kalkan': CeoType(
    'İnsan Odaklı',
    'Önce insanlar, sonra rakamlar. Güven bir kez giderse hiçbir bütçenin onu geri getiremeyeceğini bilirsin.',
  ),
  'kumar': CeoType(
    'Kumarbaz',
    'Masaya bütün fişleri sürersin. Tutarsa kitaplara geçersin. Tutmazsa da geçersin, ama başka bir bölüme.',
  ),
  'kasa': CeoType(
    'Kasa Odaklı',
    'Bu çeyreği toparlarsın, tablolar temiz görünür. Sorun şu: şirketler çeyrekle değil, on yılla ölçülür.',
  ),
};

String boardLine(int score) => score >= 80
    ? 'Yönetim kurulu seni sevdi.'
    : score >= 60
    ? 'Yönetim kurulu seni izliyor.'
    : score >= 40
    ? 'Yönetim kurulu acil toplantı istedi.'
    : 'Yönetim kurulu yeni CEO arıyor.';

/// En çok seçilen etiket; eşitlikte puan toplamı, sonra sabit sıra.
String dominantTag(Map<String, int> count, [Map<String, int> sum = const {}]) {
  final order = [...tagOrder];
  order.sort((x, y) {
    final c = (count[y] ?? 0) - (count[x] ?? 0);
    if (c != 0) return c;
    final s = (sum[y] ?? 0) - (sum[x] ?? 0);
    if (s != 0) return s;
    return tagOrder.indexOf(x) - tagOrder.indexOf(y);
  });
  return order.first;
}

class IssueResult {
  const IssueResult({
    required this.type,
    required this.score,
    required this.board,
    required this.real,
    required this.tiers,
  });
  final String type;
  final int score;
  final String board;
  final int real;
  final List<String> tiers;

  String squaresText() => tiers
      .map(
        (t) => t == 'hi'
            ? '🟩'
            : t == 'mid'
            ? '🟨'
            : '🟥',
      )
      .join();
}

IssueResult issueResult(Issue issue, List<String?> answers) {
  final count = <String, int>{}, sum = <String, int>{};
  var total = 0, real = 0;
  final tiers = <String>[];
  for (var i = 0; i < issue.cases.length; i++) {
    final c = issue.cases[i];
    final o = c.optOf(answers[i]);
    if (o == null) throw StateError('Vaka ${i + 1} cevapsız');
    count[o.tag] = (count[o.tag] ?? 0) + 1;
    sum[o.tag] = (sum[o.tag] ?? 0) + o.s;
    total += o.s;
    real += c.opt(c.real.k).s;
    tiers.add(tier(o.s));
  }
  final n = issue.cases.length;
  final score = (total / n).round();
  return IssueResult(
    type: dominantTag(count, sum),
    score: score,
    board: boardLine(score),
    real: (real / n).round(),
    tiers: tiers,
  );
}

/// Sitedeki paylaşım bağlantısı: aynı sayıyı açar.
String issueShareUrl(Issue issue) => 'https://wishceo.com/?s=${issue.no}';

/// Webdeki paylaşım metni + bağlantı (app.js kopyalama yedeğiyle aynı).
String issueShareText(Issue issue, IssueResult r) =>
    'WishCEO · Sayı ${issue.no}\n${r.squaresText()} ${r.score}/100\nCEO tipim: ${types[r.type]!.name}\nSen olsan ne yapardın?\n${issueShareUrl(issue)}';

String careerShareText(String company, int quarters, String tag) =>
    'WishCEO · Kariyer modu\n$company CEO’su olarak $quarters çeyrek dayandım.\nCEO tipim: ${types[tag]!.name}\nSen olsan ne yapardın?\nhttps://wishceo.com/';

String compareLine(CaseItem c, CaseOpt picked) {
  final diff = picked.s - c.opt(c.real.k).s;
  if (picked.k == c.real.k) return 'Vakadaki CEO ile aynı kararı verdin.';
  if (diff == 0) {
    return 'Vakadaki CEO’dan farklı karar verdin, ikinizin puanı aynı.';
  }
  if (diff > 0) {
    return 'Vakadaki CEO’dan $diff puan iyi. Yönetim kurulu not aldı.';
  }
  return 'Vakadaki CEO’nun kararı ${-diff} puan daha iyiydi.';
}
