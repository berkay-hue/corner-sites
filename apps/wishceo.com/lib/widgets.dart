import 'package:flutter/material.dart';

import 'theme.dart';

/// Webdeki logo: italik kırmızı "Wish" + "CEO".
class Wordmark extends StatelessWidget {
  const Wordmark({super.key, this.size = 30, this.dark = false});
  final double size;
  final bool dark;

  @override
  Widget build(BuildContext context) => Text.rich(
    TextSpan(
      children: [
        TextSpan(
          text: 'Wish',
          style: TextStyle(
            fontStyle: FontStyle.italic,
            fontWeight: FontWeight.w400,
            color: dark ? C.redL : C.red,
          ),
        ),
        const TextSpan(text: 'CEO'),
      ],
    ),
    semanticsLabel: 'WishCEO',
    style: TextStyle(
      fontSize: size,
      height: 1,
      fontWeight: FontWeight.w700,
      letterSpacing: -.5,
      color: dark ? C.onInk : C.ink,
    ),
  );
}

/// Küçük, büyük harfli üst başlık (webdeki .kicker).
class Kicker extends StatelessWidget {
  const Kicker(this.text, {super.key, this.color = C.red});
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) => Text(
    trUpper(text),
    style: TextStyle(
      fontSize: 12,
      height: 1.3,
      fontWeight: FontWeight.w500,
      letterSpacing: 1.2,
      color: color,
    ),
  );
}

/// Paylaşım kartındaki renkli kareler (emoji yerine çizim; çevrimdışı web yapısında emoji fontu yok).
class Squares extends StatelessWidget {
  const Squares(this.tiers, {super.key, this.size = 22});
  final List<String> tiers;
  final double size;

  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      for (final t in tiers)
        Container(
          width: size,
          height: size,
          margin: EdgeInsets.only(right: size * .2),
          decoration: BoxDecoration(
            color: tierColor(t),
            borderRadius: BorderRadius.circular(size * .14),
          ),
        ),
    ],
  );
}

/// Puan rozeti (webdeki .pill).
class Pill extends StatelessWidget {
  const Pill(this.score, this.tier, {super.key});
  final int score;
  final String tier;

  @override
  Widget build(BuildContext context) => Container(
    constraints: const BoxConstraints(minWidth: 46),
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
    color: tierColor(tier),
    child: Text(
      '$score',
      textAlign: TextAlign.center,
      style: const TextStyle(
        color: Colors.white,
        fontSize: 14,
        fontWeight: FontWeight.w500,
        height: 1,
      ),
    ),
  );
}

/// İnce çizgili kutu (web kartlarının karşılığı).
class Panel extends StatelessWidget {
  const Panel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.color = C.card,
    this.border = C.ink,
  });
  final Widget child;
  final EdgeInsets padding;
  final Color color;
  final Color border;

  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: padding,
    decoration: BoxDecoration(
      color: color,
      border: Border.all(color: border),
    ),
    child: child,
  );
}

/// Telefon genişliğinde ortalanmış içerik; tablet/masaüstünde 520 pt'yi geçmez.
class Narrow extends StatelessWidget {
  const Narrow({super.key, required this.child});
  final Widget child;

  // Android 15+ uygulamayı kenardan kenara çizer; alt gezinme çubuğunun ve
  // yatay çentiğin altında içerik kalmasın. Üst boşluğu AppBar/SafeArea verir.
  @override
  Widget build(BuildContext context) => SafeArea(
    top: false,
    child: Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520),
        child: child,
      ),
    ),
  );
}

/// Düğme yazısı + ok. Ok bir ikon; paketlenen Roboto'da ok karakteri yok.
class Arrowed extends StatelessWidget {
  const Arrowed(this.text, {super.key, this.back = false});
  final String text;
  final bool back;

  @override
  Widget build(BuildContext context) {
    final icon = Icon(back ? Icons.arrow_back : Icons.arrow_forward, size: 18);
    final label = Flexible(child: Text(text, textAlign: TextAlign.center));
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: back
          ? [icon, const SizedBox(width: 6), label]
          : [label, const SizedBox(width: 8), icon],
    );
  }
}

const kPad = EdgeInsets.symmetric(horizontal: 20);

/// Türkçe büyük harf: "i" → "İ" (Dart'ın toUpperCase'i "I" yapar).
String trUpper(String s) => s.replaceAll('i', 'İ').toUpperCase();
