import 'package:flutter/material.dart';

import '../data/models.dart';
import '../data/repo.dart';
import '../game/scoring.dart';
import '../theme.dart';
import '../widgets.dart';
import 'report_screen.dart';

/// Bir sayının vakaları (bugünün ya da arşivden): dosyalar sırayla, her birinde bir karar, sonra "vakada ne oldu".
class CaseScreen extends StatefulWidget {
  const CaseScreen({super.key, required this.issue});
  final Issue issue;

  @override
  State<CaseScreen> createState() => _CaseScreenState();
}

class _CaseScreenState extends State<CaseScreen> {
  late final List<String?> _answers = progress.answersOf(widget.issue);
  late int _cur = _firstOpen();
  final _scroll = ScrollController();
  final _afterKey = GlobalKey();

  int _firstOpen() {
    final i = _answers.indexWhere((a) => a == null);
    return i < 0 ? _answers.length - 1 : i;
  }

  void _pick(String k) {
    if (_answers[_cur] != null) return;
    setState(() => progress.answer(widget.issue, _cur, k));
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ctx = _afterKey.currentContext;
      if (ctx != null) {
        Scrollable.ensureVisible(
          ctx,
          duration: const Duration(milliseconds: 380),
          curve: Curves.easeOutCubic,
        );
      }
    });
  }

  void _next() {
    final open = _answers.indexWhere((a) => a == null);
    if (open < 0) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => ReportScreen(issue: widget.issue),
        ),
      );
      return;
    }
    setState(() => _cur = open);
    _scroll.jumpTo(0);
  }

  void _open(int i) {
    setState(() => _cur = i);
    _scroll.jumpTo(0);
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final issue = widget.issue;
    final c = issue.cases[_cur];
    final picked = _answers[_cur];
    final n = issue.cases.length;
    final sponsor = sponsorOf(c);

    return Scaffold(
      appBar: AppBar(title: Text('Sayı ${issue.no}')),
      body: Narrow(
        child: Column(
          children: [
            _Steps(issue: issue, answers: _answers, cur: _cur, onTap: _open),
            Expanded(
              child: ListView(
                controller: _scroll,
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
                children: [
                  Kicker('Dosya ${_two(_cur + 1)} / ${_two(n)} · ${c.area}'),
                  const SizedBox(height: 6),
                  Text(
                    c.place,
                    style: const TextStyle(fontSize: 13, color: C.muted),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    c.title,
                    style: const TextStyle(
                      fontSize: 27,
                      height: 1.15,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -.3,
                    ),
                  ),
                  if (sponsor.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Bu vaka $sponsor katkısıyla hazırlandı.',
                      style: const TextStyle(
                        fontSize: 13,
                        fontStyle: FontStyle.italic,
                        color: C.muted,
                      ),
                    ),
                  ],
                  const SizedBox(height: 14),
                  Text(
                    c.company,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: C.ink2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  for (final p in c.body)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        p,
                        style: const TextStyle(fontSize: 16.5, height: 1.55),
                      ),
                    ),
                  _Stats(c.stats),
                  const SizedBox(height: 20),
                  Text(
                    c.ask,
                    style: const TextStyle(
                      fontSize: 19,
                      height: 1.3,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 14),
                  for (final o in c.opts)
                    _OptButton(
                      opt: o,
                      picked: picked,
                      isReal: o.k == c.real.k,
                      onTap: () => _pick(o.k),
                    ),
                  if (picked != null)
                    _After(
                      key: _afterKey,
                      c: c,
                      o: c.opt(picked),
                      last: _answers.every((a) => a != null),
                      onNext: _next,
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _two(int n) => n.toString().padLeft(2, '0');

class _Steps extends StatelessWidget {
  const _Steps({
    required this.issue,
    required this.answers,
    required this.cur,
    required this.onTap,
  });
  final Issue issue;
  final List<String?> answers;
  final int cur;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final firstOpen = answers.indexWhere((a) => a == null);
    return Container(
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: C.ink)),
      ),
      child: Row(
        children: [
          for (var i = 0; i < issue.cases.length; i++)
            Expanded(child: _step(i, firstOpen)),
        ],
      ),
    );
  }

  Widget _step(int i, int firstOpen) {
    final c = issue.cases[i];
    final a = answers[i];
    final s = a == null ? null : c.opt(a).s;
    // Cevaplanmış dosyalar ve sıradaki açık dosya seçilebilir; ilerisi kilitli.
    final enabled = a != null || i == firstOpen;
    final isCur = i == cur;
    return Semantics(
      button: true,
      selected: isCur,
      label: 'Dosya ${i + 1}, ${c.company}${s == null ? '' : ', $s puan'}',
      child: InkWell(
        onTap: enabled ? () => onTap(i) : null,
        child: Container(
          constraints: const BoxConstraints(minHeight: 58),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: isCur ? C.card : Colors.transparent,
            border: Border(
              top: BorderSide(
                color: isCur ? C.red : Colors.transparent,
                width: 3,
              ),
              left: i == 0 ? BorderSide.none : const BorderSide(color: C.rule2),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Dosya ${_two(i + 1)}',
                      style: TextStyle(
                        fontSize: 11.5,
                        letterSpacing: .6,
                        color: enabled ? C.muted : C.rule2,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      c.company,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isCur ? C.ink : (enabled ? C.ink2 : C.rule2),
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                s == null ? '—' : '$s',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: s == null ? C.muted : tierColor(tier(s)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Stats extends StatelessWidget {
  const _Stats(this.stats);
  final List<(String, String)> stats;

  @override
  Widget build(BuildContext context) => Container(
    decoration: const BoxDecoration(
      border: Border.symmetric(horizontal: BorderSide(color: C.ink)),
    ),
    child: Column(
      children: [
        for (var i = 0; i < stats.length; i++)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              border: i == 0
                  ? null
                  : const Border(top: BorderSide(color: C.rule)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 5,
                  child: Text(
                    trUpper(stats[i].$1),
                    style: const TextStyle(
                      fontSize: 11.5,
                      height: 1.4,
                      letterSpacing: .8,
                      color: C.muted,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 6,
                  child: Text(
                    stats[i].$2,
                    style: const TextStyle(
                      fontSize: 16,
                      height: 1.3,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    ),
  );
}

class _OptButton extends StatelessWidget {
  const _OptButton({
    required this.opt,
    required this.picked,
    required this.isReal,
    required this.onTap,
  });
  final CaseOpt opt;
  final String? picked;
  final bool isReal;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final done = picked != null;
    final isPicked = picked == opt.k;
    final dim = done && !isPicked;
    final bg = isPicked ? C.ink : C.paper;
    final fg = isPicked ? C.paper : C.ink;
    final showReal = done && isReal;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Opacity(
        opacity: dim && !isReal ? .5 : 1,
        child: Material(
          color: bg,
          child: InkWell(
            onTap: done ? null : onTap,
            child: Container(
              constraints: const BoxConstraints(minHeight: 64),
              padding: const EdgeInsets.fromLTRB(11, 11, 14, 11),
              decoration: BoxDecoration(
                border: Border.all(
                  color: isPicked || (dim && isReal) ? C.ink : C.rule2,
                  width: dim && isReal ? 1.6 : 1,
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: isPicked ? C.paper : Colors.transparent,
                      border: Border.all(color: isPicked ? C.paper : C.ink),
                    ),
                    child: Text(
                      opt.k,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: C.ink,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          opt.t,
                          style: TextStyle(
                            fontSize: 16,
                            height: 1.45,
                            color: fg,
                          ),
                        ),
                        if (showReal) ...[
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              border: Border.all(color: fg),
                            ),
                            child: Text(
                              'VAKADAKİ CEO',
                              style: TextStyle(
                                fontSize: 11,
                                height: 1,
                                letterSpacing: .9,
                                fontWeight: FontWeight.w500,
                                color: fg,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _After extends StatelessWidget {
  const _After({
    super.key,
    required this.c,
    required this.o,
    required this.last,
    required this.onNext,
  });
  final CaseItem c;
  final CaseOpt o;
  final bool last;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    final t = tier(o.s);
    return Container(
      margin: const EdgeInsets.only(top: 14),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: C.ink)),
      ),
      padding: const EdgeInsets.only(top: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Kicker('Senin kararın · ${o.k}', color: C.muted),
                    const SizedBox(height: 8),
                    Text(
                      o.r,
                      style: const TextStyle(fontSize: 16.5, height: 1.5),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Stamp(score: o.s, color: tierColor(t)),
            ],
          ),
          const SizedBox(height: 22),
          Panel(
            color: C.card,
            border: C.rule2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Kicker('Vakada ne oldu'),
                const SizedBox(height: 10),
                Text(
                  c.real.who,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${c.real.role} · seçimi ${c.real.k}',
                  style: const TextStyle(fontSize: 13.5, color: C.muted),
                ),
                const SizedBox(height: 12),
                for (final p in c.real.text)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Text(
                      p,
                      style: const TextStyle(fontSize: 16, height: 1.55),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Text(
            compareLine(c, o),
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: tierColor(t),
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Bu dosya gerçek bir olaya dayanıyor; şirket, ürün ve kişi adları değiştirildi.',
            style: TextStyle(
              fontSize: 13,
              fontStyle: FontStyle.italic,
              color: C.muted,
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onNext,
              child: Arrowed(last ? 'CEO karnemi göster' : 'Sonraki dosya'),
            ),
          ),
        ],
      ),
    );
  }
}

/// Webdeki eğik puan mührü.
class Stamp extends StatelessWidget {
  const Stamp({
    super.key,
    required this.score,
    required this.color,
    this.size = 92,
  });
  final int score;
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
    tween: Tween(begin: 1.35, end: 1),
    duration: const Duration(milliseconds: 420),
    curve: Curves.easeOutBack,
    builder: (context, s, child) => Transform.scale(scale: s, child: child),
    child: Transform.rotate(
      angle: -0.21,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: color, width: 3),
        ),
        padding: const EdgeInsets.all(4),
        child: Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: color),
          ),
          alignment: Alignment.center,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$score',
                style: TextStyle(
                  fontSize: size * .36,
                  height: 1,
                  fontWeight: FontWeight.w800,
                  color: color,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'PUAN',
                style: TextStyle(
                  fontSize: size * .1,
                  letterSpacing: 1.3,
                  fontWeight: FontWeight.w500,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
