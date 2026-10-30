// Uygulama ikonlarını ve Play mağaza görsellerini sitenin favicon'undan çizer.
// Çalıştırma: flutter test --no-pub tool/store_art_test.dart
// Yazdıkları (hepsi depoda):
//   ios/Runner/Assets.xcassets/AppIcon.appiconset/*.png  opak, köşesiz kare
//   android/app/src/main/res/mipmap-*/ic_launcher.png     Android 7.x için
//   store/play/icon-512.png, store/play/feature-1024x500.png
// Android 8+ ikonu vektör: res/drawable-v26/ic_launcher_foreground.xml.
import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wishceo/theme.dart';

import 'rgb_png.dart';

/// sites/wishceo.com/favicon.svg'deki W, 64 birimlik kutuda.
Path _w() => Path()
  ..moveTo(10, 18)
  ..lineTo(18.5, 18)
  ..lineTo(24.5, 39.5)
  ..lineTo(31, 18)
  ..lineTo(35, 18)
  ..lineTo(41.5, 39.5)
  ..lineTo(47.5, 18)
  ..lineTo(54, 18)
  ..lineTo(44, 48)
  ..lineTo(39.5, 48)
  ..lineTo(33, 27.5)
  ..lineTo(26.5, 48)
  ..lineTo(22, 48)
  ..close();

/// 64 birimlik favicon'u [size] piksele çizer. [rounded] köşeler saydam kalır.
void _mark(Canvas c, double size, {bool rounded = false}) {
  c.save();
  c.scale(size / 64);
  final bg = Paint()..color = C.ink;
  if (rounded) {
    c.drawRRect(RRect.fromLTRBR(0, 0, 64, 64, const Radius.circular(12)), bg);
  } else {
    c.drawRect(const Rect.fromLTWH(0, 0, 64, 64), bg);
  }
  c.drawPath(_w(), Paint()..color = C.paper);
  c.drawRect(const Rect.fromLTWH(10, 53, 44, 3), Paint()..color = C.red);
  c.restore();
}

/// [opaque]: alfa kanalsız 24 bit PNG. App Store ikonu ve Play öne çıkan
/// görseli alfa kabul etmez; motorun PNG'si hep RGBA olduğu için elle yazılır.
Future<void> _png(
  String path,
  int w,
  int h,
  void Function(Canvas c) paint, {
  bool opaque = false,
}) async {
  final rec = ui.PictureRecorder();
  paint(Canvas(rec));
  final img = await rec.endRecording().toImage(w, h);
  final Uint8List out;
  if (opaque) {
    final rgba = await img.toByteData(format: ui.ImageByteFormat.rawRgba);
    out = rgbPng(w, h, rgba!.buffer.asUint8List());
  } else {
    final png = await img.toByteData(format: ui.ImageByteFormat.png);
    out = png!.buffer.asUint8List();
  }
  File(path)
    ..parent.createSync(recursive: true)
    ..writeAsBytesSync(out);
}

Future<void> _loadRoboto() async {
  final roboto = FontLoader('Roboto');
  for (final w in ['Regular', 'Black']) {
    final bytes = File('assets/fonts/Roboto-$w.ttf').readAsBytesSync();
    roboto.addFont(Future.value(ByteData.sublistView(bytes)));
  }
  await roboto.load();
}

void _text(
  Canvas c,
  String s,
  Offset at,
  double size,
  Color color, {
  FontWeight weight = FontWeight.w400,
  double maxWidth = 1000,
}) {
  final tp = TextPainter(
    text: TextSpan(
      text: s,
      style: TextStyle(
        fontFamily: 'Roboto',
        fontSize: size,
        fontWeight: weight,
        color: color,
        height: 1.15,
      ),
    ),
    textDirection: TextDirection.ltr,
  )..layout(maxWidth: maxWidth);
  tp.paint(c, at);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('iOS ikonları: Contents.json\'daki her boyut, opak', () async {
    const dir = 'ios/Runner/Assets.xcassets/AppIcon.appiconset';
    final images =
        (jsonDecode(File('$dir/Contents.json').readAsStringSync())
                as Map<String, dynamic>)['images']
            as List;
    final done = <String>{};
    for (final i in images.cast<Map<String, dynamic>>()) {
      final name = i['filename'] as String;
      if (!done.add(name)) continue;
      final pt = double.parse((i['size'] as String).split('x').first);
      final scale = int.parse((i['scale'] as String).replaceAll('x', ''));
      final px = (pt * scale).round();
      await _png(
        '$dir/$name',
        px,
        px,
        (c) => _mark(c, px.toDouble()),
        opaque: true,
      );
    }
    expect(done, contains('Icon-App-1024x1024@1x.png'));
  });

  test('Android 7.x ikonları (8+ vektör)', () async {
    const sizes = {
      'mdpi': 48,
      'hdpi': 72,
      'xhdpi': 96,
      'xxhdpi': 144,
      'xxxhdpi': 192,
    };
    for (final e in sizes.entries) {
      // Eski launcher'lar maske uygulamaz: favicon gibi yuvarlak köşe.
      final px = e.value;
      await _png(
        'android/app/src/main/res/mipmap-${e.key}/ic_launcher.png',
        px,
        px,
        (c) => _mark(c, px.toDouble(), rounded: true),
      );
    }
  });

  test('Play: 512 ikon ve 1024x500 öne çıkan görsel', () async {
    await _loadRoboto();
    // Play maskeyi kendi uygular; tam kare yüklenir.
    await _png('store/play/icon-512.png', 512, 512, (c) => _mark(c, 512));
    await _png('store/play/feature-1024x500.png', 1024, 500, opaque: true, (c) {
      c.drawRect(const Rect.fromLTWH(0, 0, 1024, 500), Paint()..color = C.ink);
      c.save();
      c.translate(72, 130);
      _mark(c, 240);
      c.restore();
      _text(
        c,
        'WishCEO',
        const Offset(372, 132),
        96,
        C.paper,
        weight: FontWeight.w900,
      );
      c.drawRect(const Rect.fromLTWH(376, 258, 120, 6), Paint()..color = C.red);
      _text(
        c,
        'Şirket batıyor, CEO sensin.\nGerçek krizlerde kararı sen ver.',
        const Offset(376, 288),
        34,
        C.onInk,
        maxWidth: 600,
      );
    });
  });
}
