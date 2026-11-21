// Mağaza ekran görüntülerini üretir (3x, gerçek fontlar, alfasız PNG).
// Çalıştırma: flutter test --no-pub tool/shots_test.dart
// Çıktı: build/shots/<cihaz>/*.png (depoya girmez). Ağ kullanmaz; veriler
// assets/ altından okunur. Boyutlar: README, Mağaza görselleri.
// Test yardımcıları tool/ altında da kullanılır (analyzer yalnız test/'i tanır).
// ignore_for_file: invalid_use_of_visible_for_testing_member
import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wishceo/data/calendar.dart';
import 'package:wishceo/data/models.dart';
import 'package:wishceo/data/repo.dart';
import 'package:wishceo/main.dart';

import 'rgb_png.dart';

const _boundary = Key('ekran');

/// Mantıksal boyut; 3x ile mağaza pikseline çıkar.
const _devices = {
  'ios-6.3': Size(402, 874), // 1206x2622, App Store'un zorunlu iPhone boyutu
  'ios-6.9': Size(440, 956), // 1320x2868, büyük iPhone
  'android': Size(360, 640), // 1080x1920, Play telefon
};
late String _dir;
const _iconFont =
    '/opt/homebrew/share/flutter/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf';

Future<void> _loadFonts() async {
  final roboto = FontLoader('Roboto');
  for (final w in ['Regular', 'Italic', 'Medium', 'Bold', 'Black']) {
    final bytes = File('assets/fonts/Roboto-$w.ttf').readAsBytesSync();
    roboto.addFont(Future.value(ByteData.sublistView(bytes)));
  }
  await roboto.load();
  final icons = FontLoader('MaterialIcons')
    ..addFont(
      Future.value(ByteData.sublistView(File(_iconFont).readAsBytesSync())),
    );
  await icons.load();
}

/// Paketteki açılmış sayılar (tool/bundle_issues.dart), 004 bugünün sayısı.
AppData _data() {
  const today = '2026-10-30';
  return AppData(
    issues: [
      for (final d in releasedOn(today))
        Issue.parse(
          d.no,
          d.date,
          File('assets/sayilar/${d.no}.json').readAsStringSync(),
        ),
    ],
    career: CareerData.fromJson(
      jsonDecode(File('assets/career.json').readAsStringSync())
          as Map<String, dynamic>,
    ),
    today: today,
  );
}

Future<void> _snap(WidgetTester t, String name) async {
  await t.pumpAndSettle();
  final ro = t.renderObject<RenderRepaintBoundary>(find.byKey(_boundary));
  await t.runAsync(() async {
    final img = await ro.toImage(pixelRatio: 3);
    final rgba = await img.toByteData(format: ui.ImageByteFormat.rawRgba);
    File('$_dir/$name.png').writeAsBytesSync(
      rgbPng(img.width, img.height, rgba!.buffer.asUint8List()),
    );
  });
}

/// Küçük ekranda düğme ekran dışında kalabilir: önce kaydırıp görünür yapar.
Future<void> _tap(WidgetTester t, Finder f) async {
  final scroll = find.byType(Scrollable);
  if (scroll.evaluate().isNotEmpty) {
    await t.scrollUntilVisible(f, 200, scrollable: scroll.first);
  }
  await t.ensureVisible(f);
  await t.pumpAndSettle();
  await t.tap(f);
  await t.pumpAndSettle();
}

void main() {
  setUp(() {
    progress.clearForTest();
    SharedPreferences.setMockInitialValues({});
  });
  for (final e in _devices.entries) {
    testWidgets(
      'ekran görüntüleri: ${e.key}',
      (t) => _shots(t, e.key, e.value),
    );
  }
}

Future<void> _shots(WidgetTester t, String device, Size size) async {
  await _loadFonts();
  t.view.physicalSize = size * 3;
  t.view.devicePixelRatio = 3;
  addTearDown(t.view.reset);
  _dir = 'build/shots/$device';
  Directory(_dir).createSync(recursive: true);

  final data = _data();
  await t.pumpWidget(
    RepaintBoundary(
      key: _boundary,
      child: WishCeoApp(data: data),
    ),
  );
  await _snap(t, '01-ana-sayfa');

  // Kariyer: birkaç çeyrek oyna, kartı sağa doğru yarım çek.
  await _tap(t, find.textContaining('Kariyere başla'));
  await _tap(t, find.byKey(const Key('basla')));
  for (final k in ['sag', 'sol', 'sag']) {
    await t.tap(find.byKey(Key(k)));
    await t.pumpAndSettle();
  }
  final g = await t.startGesture(size.center(Offset.zero));
  await g.moveBy(const Offset(20, 0));
  await g.moveBy(const Offset(55, 0));
  await t.pump();
  await _snap(t, '02-kariyer-karti');
  await g.moveBy(const Offset(-75, 0));
  await g.up();
  await t.pumpAndSettle();

  // Görevden alınana kadar hep sola. Küçük ekranda sonuç listesi tembel
  // kurulur; 'tekrar' görünmeyebilir, bu yüzden kart düğmesi kaybolunca durur.
  for (var i = 0; i < 200; i++) {
    if (find.byKey(const Key('sol')).evaluate().isEmpty) break;
    await t.tap(find.byKey(const Key('sol')));
    await t.pumpAndSettle();
  }
  expect(find.byKey(const Key('sol')), findsNothing);
  await _snap(t, '03-gorevden-alinma');
  await t.scrollUntilVisible(
    find.byKey(const Key('tekrar')),
    200,
    scrollable: find.byType(Scrollable).first,
  );
  t.state<NavigatorState>(find.byType(Navigator)).pop();
  await t.pumpAndSettle();

  // Bugünün vakası: ilk dosya, bir karar, sonra hepsini bitir.
  await _tap(t, find.textContaining('Dosyaları aç'));
  await _snap(t, '04-vaka');
  final cases = data.current.cases;
  for (var i = 0; i < cases.length; i++) {
    final opts = [...cases[i].opts]..sort((a, b) => b.s.compareTo(a.s));
    final pick = opts[[0, opts.length - 1, 1][i % 3]];
    await _tap(t, find.textContaining(pick.t));
    if (i == 0) await _snap(t, '04b-vaka-karar');
    await _tap(
      t,
      find.textContaining(
        i == cases.length - 1 ? 'CEO karnemi göster' : 'Sonraki dosya',
      ),
    );
  }
  await _snap(t, '05-karne');
  await _tap(t, find.text('Sonucumu paylaş'));
  await _snap(t, '06-paylasim-karti');
}
