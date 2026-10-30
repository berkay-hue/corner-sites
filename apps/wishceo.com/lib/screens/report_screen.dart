import 'package:flutter/material.dart';

import '../data/models.dart';
import '../data/repo.dart';
import '../game/scoring.dart';
import '../theme.dart';
import '../widgets.dart';
import 'case_screen.dart';
import 'share_screen.dart';

/// CEO karnesi: tip, ortalama puan, dosya dosya tablo.
class ReportScreen extends StatelessWidget {
  const ReportScreen({super.key, required this.issue});
  final Issue issue;

  @override
  Widget build(BuildContext context) {
    final answers = progress.answersOf(issue);
    final r = issueResult(issue, answers);
    final type = types[r.type]!;
    final t = tier(r.score);

    return Scaffold(
      appBar: AppBar(title: Text('Sayı ${issue.no} · Karne')),
      body: Narrow(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            Panel(
              color: C.ink,
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text(
                        'CEO karnesi',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: C.onInk,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        'Sayı ${issue.no}',
                        style: const TextStyle(fontSize: 13, color: C.onInk2),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Divider(color: C.inkRule, height: 1),
                  const SizedBox(height: 16),
                  const Kicker('CEO tipin', color: C.redL),
                  const SizedBox(height: 6),
                  Text(
                    type.name,
                    style: const TextStyle(
                      fontSize: 34,
                      height: 1.05,
                      fontWeight: FontWeight.w800,
                      color: C.onInk,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    type.desc,
                    style: const TextStyle(
                      fontSize: 15.5,
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
                  const Kicker('Ortalama puan', color: C.muted),
                  const SizedBox(height: 6),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${r.score}',
                        style: TextStyle(
                          fontSize: 56,
                          height: 1,
                          fontWeight: FontWeight.w800,
                          color: tierColor(t),
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.only(bottom: 6, left: 4),
                        child: Text(
                          '/100',
                          style: TextStyle(fontSize: 18, color: C.muted),
                        ),
                      ),
                      const Spacer(),
                      Squares(r.tiers, size: 20),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    r.board,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Vakadaki CEO’ların ortalaması: ${r.real}',
                    style: const TextStyle(fontSize: 14, color: C.muted),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _Table(issue: issue, answers: answers),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => ShareScreen.issue(issue: issue, result: r),
                ),
              ),
              child: const Text('Sonucumu paylaş'),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: () {
                progress.reset(issue);
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute<void>(
                    builder: (_) => CaseScreen(issue: issue),
                  ),
                );
              },
              child: const Text('Baştan oyna'),
            ),
            const SizedBox(height: 4),
            TextButton(
              onPressed: () => Navigator.of(context).popUntil((r) => r.isFirst),
              child: const Text('Ana sayfa'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Table extends StatelessWidget {
  const _Table({required this.issue, required this.answers});
  final Issue issue;
  final List<String?> answers;

  @override
  Widget build(BuildContext context) {
    const head = TextStyle(fontSize: 11.5, letterSpacing: .8, color: C.muted);
    const cell = TextStyle(fontSize: 15, height: 1.3);
    Widget row(List<Widget> cells, {bool top = true}) => Container(
      padding: const EdgeInsets.symmetric(vertical: 11),
      decoration: BoxDecoration(
        border: top ? const Border(top: BorderSide(color: C.rule)) : null,
      ),
      child: Row(
        children: [
          Expanded(flex: 6, child: cells[0]),
          SizedBox(width: 44, child: Center(child: cells[1])),
          SizedBox(width: 56, child: Center(child: cells[2])),
          SizedBox(
            width: 56,
            child: Align(alignment: Alignment.centerRight, child: cells[3]),
          ),
        ],
      ),
    );
    return Container(
      decoration: const BoxDecoration(
        border: Border.symmetric(horizontal: BorderSide(color: C.ink)),
      ),
      child: Column(
        children: [
          row(const [
            Text('DOSYA', style: head),
            Text('SEN', style: head),
            Text('VAKADA', style: head),
            Text('PUAN', style: head),
          ], top: false),
          for (var i = 0; i < issue.cases.length; i++)
            () {
              final c = issue.cases[i];
              final o = c.opt(answers[i]!);
              return row([
                Text(
                  c.company,
                  style: cell.copyWith(fontWeight: FontWeight.w600),
                ),
                Text(o.k, style: cell),
                Text(c.real.k, style: cell),
                Pill(o.s, tier(o.s)),
              ]);
            }(),
        ],
      ),
    );
  }
}
