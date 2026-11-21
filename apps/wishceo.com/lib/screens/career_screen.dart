import 'dart:math';

import 'package:flutter/material.dart';

import '../data/models.dart';
import '../data/repo.dart';
import '../game/career_game.dart';
import '../game/scoring.dart';
import '../theme.dart';
import '../widgets.dart';
import 'share_screen.dart';

/// Kartın karar sayılması için gereken yatay kaydırma (pt).
const _threshold = 100.0;

/// Kariyer modu: Reigns tarzı kaydırmalı kartlar.
class CareerScreen extends StatefulWidget {
  const CareerScreen({
    super.key,
    required this.data,
    this.rng,
    this.skipIntro = false,
  });
  final CareerData data;

  /// Testlerde deste sırası sabitlensin diye.
  final Random? rng;
  final bool skipIntro;

  @override
  State<CareerScreen> createState() => _CareerScreenState();
}

class _CareerScreenState extends State<CareerScreen>
    with SingleTickerProviderStateMixin {
  late final CareerGame _game = CareerGame(widget.data.cards, rng: widget.rng);
  late bool _intro = !widget.skipIntro && widget.data.intro.isNotEmpty;
  bool _newBest = false;

  double _dx = 0; // kartın yatay kayması
  double _width = 360;
  Tween<double> _tween = Tween(begin: 0, end: 0);
  Curve _curve = Curves.easeOut;
  bool? _flying; // null: yerine dönüyor; true/false: sağa/sola gidiyor

  late final AnimationController _anim = AnimationController(vsync: this)
    ..addListener(
      () =>
          setState(() => _dx = _tween.transform(_curve.transform(_anim.value))),
    );

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  bool get _busy => _anim.isAnimating || _game.over;

  void _animateTo(double target, {bool? choose}) {
    _tween = Tween(begin: _dx, end: target);
    _curve = choose == null ? Curves.easeOutBack : Curves.easeIn;
    _flying = choose;
    _anim.duration = Duration(milliseconds: choose == null ? 220 : 200);
    _anim.forward(from: 0).whenComplete(_landed);
  }

  void _landed() {
    if (!mounted) return;
    final right = _flying;
    setState(() {
      _dx = 0;
      _flying = null;
      if (right != null) {
        _game.choose(right);
        if (_game.over) _newBest = progress.recordCareer(_game.quarters);
      }
    });
  }

  void _fly(bool right) {
    if (_busy) return;
    _animateTo((right ? 1 : -1) * _width * 1.3, choose: right);
  }

  void _onPanUpdate(DragUpdateDetails d) {
    if (_busy) return;
    setState(() => _dx += d.delta.dx);
  }

  void _onPanEnd(DragEndDetails d) {
    if (_busy) return;
    final v = d.velocity.pixelsPerSecond.dx;
    final flick = v.abs() > 900 && _dx.abs() > 30 && v.sign == _dx.sign;
    if (_dx.abs() > _threshold || flick) {
      _fly(_dx > 0);
    } else {
      _animateTo(0);
    }
  }

  void _restart() => setState(() {
    _game.start();
    _newBest = false;
    _dx = 0;
  });

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(widget.data.company),
      actions: [
        if (!_intro)
          Padding(
            padding: const EdgeInsets.only(right: 18),
            child: Center(
              child: Text(
                _game.period,
                style: const TextStyle(fontSize: 14, color: C.ink2),
              ),
            ),
          ),
      ],
    ),
    body: SafeArea(
      top: false,
      child: Narrow(
        child: _intro ? _introView() : (_game.over ? _overView() : _playView()),
      ),
    ),
  );

  Widget _introView() => ListView(
    padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
    children: [
      Panel(
        color: C.ink,
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Kicker('Kariyer modu', color: C.redL),
            const SizedBox(height: 8),
            Text(
              '${widget.data.company} şirketinin yeni CEO’susun',
              style: const TextStyle(
                fontSize: 26,
                height: 1.15,
                fontWeight: FontWeight.w800,
                color: C.onInk,
              ),
            ),
            for (final p in widget.data.intro) ...[
              const SizedBox(height: 12),
              Text(
                p,
                style: const TextStyle(
                  fontSize: 16,
                  height: 1.5,
                  color: C.onInk2,
                ),
              ),
            ],
          ],
        ),
      ),
      const SizedBox(height: 16),
      const Panel(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Nasıl oynanır',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
            ),
            SizedBox(height: 10),
            _Rule(
              'Her kart bir çeyrek. Kartı sağa ya da sola kaydır, ya da alttaki düğmelere dokun.',
            ),
            _Rule(
              'Kartı kaydırırken üstteki noktalar hangi göstergenin değişeceğini gösterir. Büyük nokta, büyük etki.',
            ),
            _Rule(
              'Nakit, Marka, Ekip ya da Pazar payı 0’a veya 100’e değerse kurul seni görevden alır.',
            ),
          ],
        ),
      ),
      const SizedBox(height: 20),
      FilledButton(
        key: const Key('basla'),
        onPressed: () => setState(() => _intro = false),
        child: const Text('Göreve başla'),
      ),
    ],
  );

  Widget _playView() {
    final g = _game;
    final card = g.current;
    final side = _dx.abs() > 16 ? (_dx > 0 ? card.right : card.left) : null;
    final t = (_dx.abs() / _threshold).clamp(0.0, 1.0);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
      child: Column(
        children: [
          _Meters(
            meters: g.meters,
            preview: side == null ? null : g.effect(side),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Text(
                  g.board,
                  style: const TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w600,
                    color: C.ink2,
                  ),
                ),
              ),
              Text(
                '${g.quarters} çeyrek',
                style: const TextStyle(fontSize: 13, color: C.muted),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: LayoutBuilder(
              builder: (context, box) {
                _width = box.maxWidth;
                final h = min(box.maxHeight, 460.0);
                return Center(
                  child: SizedBox(
                    height: h,
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        // Destenin arkası
                        Positioned.fill(
                          child: Transform.rotate(
                            angle: .035,
                            child: Container(
                              decoration: BoxDecoration(
                                color: C.rule2,
                                border: Border.all(color: C.rule),
                              ),
                            ),
                          ),
                        ),
                        Positioned.fill(
                          child: GestureDetector(
                            onPanUpdate: _onPanUpdate,
                            onPanEnd: _onPanEnd,
                            child: Transform.translate(
                              offset: Offset(_dx, _dx.abs() * .06),
                              child: Transform.rotate(
                                angle: _dx / _width * .35,
                                child: TweenAnimationBuilder<double>(
                                  key: ValueKey('${g.quarters}-${card.id}'),
                                  tween: Tween(begin: .94, end: 1),
                                  duration: const Duration(milliseconds: 180),
                                  curve: Curves.easeOut,
                                  builder: (context, s, child) =>
                                      Transform.scale(scale: s, child: child),
                                  child: _CardFace(
                                    card: card,
                                    side: side,
                                    t: t,
                                    right: _dx > 0,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: OutlinedButton(
                    key: const Key('sol'),
                    onPressed: () => _fly(false),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 12,
                      ),
                    ),
                    child: Arrowed(card.left.label, back: true),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton(
                    key: const Key('sag'),
                    onPressed: () => _fly(true),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 12,
                      ),
                    ),
                    child: Arrowed(card.right.label),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _overView() {
    final g = _game;
    final (m, high) = g.firedBy!;
    final type = types[g.typeTag]!;
    final years = g.quarters ~/ 4;
    final rest = g.quarters % 4;
    final span = years == 0
        ? '${g.quarters} çeyrek'
        : (rest == 0 ? '$years yıl' : '$years yıl $rest çeyrek');

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 32),
      children: [
        _Meters(meters: g.meters),
        const SizedBox(height: 16),
        Panel(
          color: C.ink,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Kicker(
                high ? '${m.label} 100’e dayandı' : '${m.label} sıfıra indi',
                color: C.redL,
              ),
              const SizedBox(height: 8),
              const Text(
                'Görevden alındın',
                style: TextStyle(
                  fontSize: 32,
                  height: 1.05,
                  fontWeight: FontWeight.w800,
                  color: C.onInk,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                widget.data.ending(m, high),
                style: const TextStyle(
                  fontSize: 16,
                  height: 1.5,
                  color: C.onInk2,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Kicker('Kariyerin', color: C.muted),
              const SizedBox(height: 6),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${g.quarters}',
                    style: const TextStyle(
                      fontSize: 56,
                      height: 1,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const Flexible(
                    child: Padding(
                      padding: EdgeInsets.only(bottom: 6, left: 6),
                      child: Text(
                        'çeyrek dayandın',
                        style: TextStyle(fontSize: 18, color: C.muted),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                _newBest
                    ? 'Yeni rekor! $span koltukta kaldın.'
                    : 'En iyi kariyerin: ${progress.bestCareer} çeyrek',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: _newBest ? C.green : C.ink2,
                ),
              ),
              const SizedBox(height: 14),
              const Divider(color: C.rule, height: 1),
              const SizedBox(height: 14),
              const Kicker('CEO tipin', color: C.muted),
              const SizedBox(height: 4),
              Text(
                type.name,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                type.desc,
                style: const TextStyle(
                  fontSize: 15,
                  height: 1.5,
                  color: C.ink2,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        FilledButton(
          key: const Key('tekrar'),
          onPressed: _restart,
          child: const Text('Tekrar dene'),
        ),
        const SizedBox(height: 10),
        OutlinedButton(
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => ShareScreen.career(
                company: widget.data.company,
                quarters: g.quarters,
                tag: g.typeTag,
              ),
            ),
          ),
          child: const Text('Paylaş'),
        ),
        const SizedBox(height: 4),
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Ana sayfa'),
        ),
      ],
    );
  }
}

class _Rule extends StatelessWidget {
  const _Rule(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(top: 8, right: 10),
          child: SizedBox(width: 6, height: 6, child: ColoredBox(color: C.red)),
        ),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontSize: 15, height: 1.45, color: C.ink2),
          ),
        ),
      ],
    ),
  );
}

/// Dört gösterge. Kart kaydırılırken etkilenecek göstergelerin üstünde nokta çıkar (yön gizli).
class _Meters extends StatelessWidget {
  const _Meters({required this.meters, this.preview});
  final Map<Meter, int> meters;
  final Map<Meter, int>? preview;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      for (final m in Meter.values)
        Expanded(
          child: _MeterBar(meter: m, value: meters[m]!, fx: preview?[m] ?? 0),
        ),
    ],
  );
}

class _MeterBar extends StatelessWidget {
  const _MeterBar({required this.meter, required this.value, required this.fx});
  final Meter meter;
  final int value;
  final int fx;

  @override
  Widget build(BuildContext context) {
    final danger = value <= 20 || value >= 80;
    final dot = fx == 0 ? 0.0 : (fx.abs() >= 12 ? 11.0 : 6.0);
    return Semantics(
      label: '${meter.label} $value',
      child: Column(
        children: [
          SizedBox(
            height: 14,
            child: Center(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 120),
                width: dot,
                height: dot,
                decoration: const BoxDecoration(
                  color: C.ink,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Container(
            width: 38,
            height: 48,
            decoration: BoxDecoration(
              color: C.card,
              border: Border.all(
                color: danger ? C.red : C.ink,
                width: danger ? 2 : 1,
              ),
            ),
            alignment: Alignment.bottomCenter,
            child: TweenAnimationBuilder<double>(
              tween: Tween(end: value / 100),
              duration: const Duration(milliseconds: 380),
              curve: Curves.easeOutCubic,
              builder: (context, f, _) => FractionallySizedBox(
                heightFactor: f,
                widthFactor: 1,
                child: ColoredBox(color: danger ? C.red : C.ink),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            meter.label,
            maxLines: 1,
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: danger ? C.red : C.ink2,
            ),
          ),
        ],
      ),
    );
  }
}

/// Kartın yüzü. Kaydırırken üst kenarda seçeneğin adı belirir.
class _CardFace extends StatelessWidget {
  const _CardFace({
    required this.card,
    required this.side,
    required this.t,
    required this.right,
  });
  final CareerCard card;
  final CardSide? side;
  final double t;
  final bool right;

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: C.card,
      border: Border.all(color: C.ink),
      boxShadow: const [
        BoxShadow(
          color: Color(0x1A000000),
          blurRadius: 18,
          offset: Offset(0, 8),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 56,
          child: Opacity(
            opacity: side == null ? 0 : t,
            child: Align(
              alignment: right ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 12),
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                color: C.ink,
                child: Text(
                  side?.label ?? '',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: C.onInk,
                  ),
                ),
              ),
            ),
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(22, 0, 22, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Kicker(card.who),
                const SizedBox(height: 10),
                Text(
                  card.text,
                  style: const TextStyle(
                    fontSize: 20,
                    height: 1.42,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                const Text(
                  'Kartı kaydır ya da aşağıdan seç',
                  style: TextStyle(
                    fontSize: 12.5,
                    color: C.muted,
                    letterSpacing: .3,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}
