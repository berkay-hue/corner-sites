// Açılmış sayıları sitenin kaynağından uygulama paketine kopyalar:
//   dart run tool/bundle_issues.dart            (bugün, Türkiye saati)
//   dart run tool/bundle_issues.dart 2026-11-02 (o güne kadar açılanlar)
// Açılmamış sayı pakete girmez; mağaza paketinden ileri sayı okunamaz.

import 'dart:io';

import 'package:wishceo/data/calendar.dart';
import 'package:wishceo/data/models.dart';

void main(List<String> args) {
  final today = args.isNotEmpty ? args.first : todayTr();
  final src = Directory('../../sites/wishceo.com/sayilar');
  final out = Directory('assets/sayilar')..createSync(recursive: true);
  final keep = <String>{};
  for (final d in releasedOn(today)) {
    final f = File('${src.path}/${d.no}.json');
    if (!f.existsSync()) {
      stderr.writeln('${d.no}: kaynakta yok, atlandı');
      continue;
    }
    final raw = f.readAsStringSync();
    Issue.parse(d.no, d.date, raw); // bozuksa burada durur
    File('${out.path}/${d.no}.json').writeAsStringSync(raw);
    keep.add('${d.no}.json');
  }
  for (final f in out.listSync().whereType<File>()) {
    final name = f.uri.pathSegments.last;
    if (!keep.contains(name)) {
      stderr.writeln('$name: $today itibarıyla açılmamış, pakette olmamalı');
      exitCode = 1;
    }
  }
  stdout.writeln('${keep.length} sayı: ${(keep.toList()..sort()).join(' ')}');
}
