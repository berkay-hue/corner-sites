// Alfa kanalsız 24 bit PNG yazar. App Store ikonu, Play öne çıkan görseli ve
// mağaza ekran görüntüleri alfa kabul etmez; motorun PNG'si hep RGBA'dır.
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

/// [rgba] satır satır RGBA; saydam piksel varsa StateError atar.
Uint8List rgbPng(int w, int h, Uint8List rgba) {
  final raw = BytesBuilder();
  for (var y = 0; y < h; y++) {
    raw.addByte(0); // filtre yok
    for (var x = 0; x < w; x++) {
      final i = (y * w + x) * 4;
      if (rgba[i + 3] != 255) {
        throw StateError('saydam piksel ($x,$y): opak görsel olamaz');
      }
      raw.add(rgba.sublist(i, i + 3));
    }
  }
  final ihdr = ByteData(13)
    ..setUint32(0, w)
    ..setUint32(4, h)
    ..setUint8(8, 8) // bit derinliği
    ..setUint8(9, 2); // RGB
  final b = BytesBuilder()
    ..add([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  void chunk(String type, List<int> data) {
    final td = [...ascii.encode(type), ...data];
    b
      ..add((ByteData(4)..setUint32(0, data.length)).buffer.asUint8List())
      ..add(td)
      ..add((ByteData(4)..setUint32(0, _crc(td))).buffer.asUint8List());
  }

  chunk('IHDR', ihdr.buffer.asUint8List());
  chunk('IDAT', ZLibCodec(level: 9).encode(raw.takeBytes()));
  chunk('IEND', const []);
  return b.takeBytes();
}

final _crcTable = List<int>.generate(256, (n) {
  var c = n;
  for (var k = 0; k < 8; k++) {
    c = (c & 1) != 0 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  }
  return c;
});

int _crc(List<int> data) {
  var c = 0xFFFFFFFF;
  for (final x in data) {
    c = _crcTable[(c ^ x) & 0xFF] ^ (c >>> 8);
  }
  return c ^ 0xFFFFFFFF;
}
