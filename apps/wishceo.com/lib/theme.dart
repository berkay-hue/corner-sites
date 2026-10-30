import 'package:flutter/material.dart';

/// Web sitesindeki (wishceo.com) renk değişkenlerinin karşılığı.
abstract final class C {
  static const paper = Color(0xFFF2EEE5);
  static const card = Color(0xFFFBF9F4);
  static const ink = Color(0xFF15130F);
  static const ink2 = Color(0xFF3B372F);
  static const muted = Color(0xFF6B6559);
  static const rule = Color(0xFFD8D1C2);
  static const rule2 = Color(0xFFBDB4A2);
  static const red = Color(0xFFC0341D);
  static const redL = Color(0xFFF07A62);
  static const green = Color(0xFF1F6B48);
  static const amber = Color(0xFF94600F);
  static const onInk = Color(0xFFE9E4D8);
  static const onInk2 = Color(0xFFA39C8C);
  static const inkRule = Color(0xFF3A352C);
}

/// Dokunma hedefleri en az 44 pt.
const double kTap = 52;

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: C.red,
    primary: C.ink,
    onPrimary: C.onInk,
    secondary: C.red,
    surface: C.paper,
    onSurface: C.ink,
  );
  final base = ThemeData(
    useMaterial3: true,
    fontFamily: 'Roboto',
    colorScheme: scheme,
    scaffoldBackgroundColor: C.paper,
  );
  final shape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(10));
  // Bileşen temaları ThemeData.fontFamily'yi miras almaz; açıkça veriyoruz.
  const label = TextStyle(
    fontFamily: 'Roboto',
    fontSize: 16,
    fontWeight: FontWeight.w700,
    letterSpacing: .2,
  );
  return base.copyWith(
    textTheme: base.textTheme.apply(bodyColor: C.ink, displayColor: C.ink),
    appBarTheme: const AppBarTheme(
      backgroundColor: C.paper,
      foregroundColor: C.ink,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontFamily: 'Roboto',
        fontSize: 17,
        fontWeight: FontWeight.w700,
        color: C.ink,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: C.ink,
        foregroundColor: C.onInk,
        minimumSize: const Size(kTap, kTap),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        shape: shape,
        textStyle: label,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: C.ink,
        minimumSize: const Size(kTap, kTap),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        side: const BorderSide(color: C.ink, width: 1.4),
        shape: shape,
        textStyle: label,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: C.ink2,
        minimumSize: const Size(kTap, 44),
        textStyle: const TextStyle(
          fontFamily: 'Roboto',
          fontSize: 15,
          fontWeight: FontWeight.w500,
        ),
      ),
    ),
  );
}

Color tierColor(String tier) => switch (tier) {
  'hi' => C.green,
  'mid' => C.amber,
  _ => C.red,
};
