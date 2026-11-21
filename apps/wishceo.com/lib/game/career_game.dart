import 'dart:math';

import '../data/models.dart';
import 'scoring.dart';

/// Kariyer modu: her kart bir çeyrek. Bir gösterge 0'a ya da 100'e değerse kurul görevden alır.
class CareerGame {
  CareerGame(this.deck, {Random? rng}) : _rng = rng ?? Random() {
    start();
  }

  final List<CareerCard> deck;
  final Random _rng;

  final Map<Meter, int> meters = {};
  final Map<String, int> tags = {};
  final List<CareerCard> _pile = [];
  late CareerCard current;
  int quarters = 0;
  (Meter, bool)? firedBy; // (gösterge, üst sınır mı)

  bool get over => firedBy != null;

  void start() {
    for (final m in Meter.values) {
      meters[m] = 50;
    }
    tags.clear();
    _pile.clear();
    quarters = 0;
    firedBy = null;
    current = _draw(null);
  }

  CareerCard _draw(CareerCard? last) {
    if (_pile.isEmpty) {
      _pile.addAll(deck);
      _pile.shuffle(_rng);
      // Deste yenilenince aynı kart üst üste gelmesin.
      if (last != null && _pile.length > 1 && _pile.last.id == last.id) {
        _pile.insert(0, _pile.removeLast());
      }
    }
    return _pile.removeLast();
  }

  /// 2. yıldan sonra her yıl kart etkileri %25 sertleşir; dengeli oyun da bir gün biter.
  double get scale => 1 + max(0, quarters ~/ 4 - 1) * 0.25;

  /// Bu çeyrekte bir seçeneğin göstergelere gerçek etkisi.
  Map<Meter, int> effect(CardSide side) => {
    for (final m in Meter.values) m: ((side.fx[m] ?? 0) * scale).round(),
  };

  void choose(bool right) {
    if (over) return;
    final side = right ? current.right : current.left;
    final fx = effect(side);
    for (final m in Meter.values) {
      meters[m] = (meters[m]! + fx[m]!).clamp(0, 100);
    }
    tags[side.tag] = (tags[side.tag] ?? 0) + 1;
    for (final m in Meter.values) {
      final v = meters[m]!;
      if (v <= 0 || v >= 100) {
        firedBy = (m, v >= 100);
        return;
      }
    }
    quarters++;
    current = _draw(current);
  }

  /// Yıl 1 · Ç 1 biçiminde şu anki çeyrek.
  String get period => 'Yıl ${quarters ~/ 4 + 1} · Ç ${quarters % 4 + 1}';

  /// Kurulun ruh hâli: göstergeler ortadan ne kadar uzaksa o kadar düşük.
  int get mood {
    var worst = 0;
    for (final v in meters.values) {
      worst = max(worst, (v - 50).abs());
    }
    return 100 - 2 * worst;
  }

  String get board => boardLine(mood);

  String get typeTag => dominantTag(tags);
}
