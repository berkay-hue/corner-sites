// Sayı takvimi: sites/wishceo.com/app.js içindeki ISSUES ile aynı.
// 005'ten sonra her Pazartesi (Türkiye saatiyle 00:00) yeni sayı açılır;
// site her Pazar 21:05 UTC'de yayına alır.

/// Ekran görüntüsü ve test için gün sabitlenebilir: --dart-define=BUGUN=2026-10-18
const _bugunOverride = String.fromEnvironment('BUGUN');

class IssueDate {
  const IssueDate(this.no, this.date);
  final String no; // "005"
  final String date; // yyyy-mm-dd

  @override
  bool operator ==(Object other) =>
      other is IssueDate && other.no == no && other.date == date;

  @override
  int get hashCode => Object.hash(no, date);

  @override
  String toString() => '$no@$date';
}

const _ilkDort = [
  IssueDate('001', '2026-10-15'),
  IssueDate('002', '2026-10-16'),
  IssueDate('003', '2026-10-19'),
  IssueDate('004', '2026-10-26'),
];

String _ymd(DateTime t) {
  String two(int n) => n.toString().padLeft(2, '0');
  return '${t.year}-${two(t.month)}-${two(t.day)}';
}

/// n. sayının açılış günü (n >= 1).
IssueDate issueDate(int n) {
  if (n <= _ilkDort.length) return _ilkDort[n - 1];
  final d = DateTime.utc(2026, 11, 2).add(Duration(days: 7 * (n - 5)));
  return IssueDate(n.toString().padLeft(3, '0'), _ymd(d));
}

/// Bugüne kadar açılmış sayılar, eskiden yeniye.
List<IssueDate> releasedOn(String today) => [
  for (var n = 1; issueDate(n).date.compareTo(today) <= 0; n++) issueDate(n),
];

/// Bugünden sonra açılacak ilk sayı.
IssueDate nextAfter(String today) {
  var n = 1;
  while (issueDate(n).date.compareTo(today) <= 0) {
    n++;
  }
  return issueDate(n);
}

/// Türkiye saatiyle bugünün tarihi (yyyy-mm-dd). Türkiye 2016'dan beri
/// yaz saati uygulamıyor, sabit UTC+3.
String todayTr([DateTime? now]) {
  if (_bugunOverride.isNotEmpty) return _bugunOverride;
  return _ymd((now ?? DateTime.now()).toUtc().add(const Duration(hours: 3)));
}

const _aylar = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

/// "2026-10-26" → "26 Ekim 2026"
String trDate(String ymd) {
  final p = ymd.split('-');
  return '${int.parse(p[2])} ${_aylar[int.parse(p[1]) - 1]} ${p[0]}';
}
