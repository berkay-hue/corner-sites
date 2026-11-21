import 'package:flutter/material.dart';

import '../data/repo.dart';
import '../game/scoring.dart';
import '../theme.dart';
import '../widgets.dart';
import 'archive_screen.dart';
import 'career_screen.dart';
import 'case_screen.dart';
import 'info_screen.dart';
import 'report_screen.dart';

const _words = ['', 'Bir', 'İki', 'Üç', 'Dört', 'Beş', 'Altı'];
const _wordsLo = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı'];

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.data});
  final AppData data;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  void _go(Widget page) =>
      Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => page));

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: progress,
    builder: (context, _) => _build(context),
  );

  Widget _build(BuildContext context) {
    final d = widget.data;
    final issue = d.current;
    final n = issue.cases.length;
    final answers = progress.answersOf(issue);
    final done = answers.every((a) => a != null);
    final started = answers.any((a) => a != null);
    final intro = n < _words.length
        ? '${_words[n]} şirket, ${_wordsLo[n]} kriz. Hangisinde vakadaki CEO’dan daha iyi iş çıkarırsın?'
        : '$n şirket, $n kriz. Hangisinde vakadaki CEO’dan daha iyi iş çıkarırsın?';

    return Scaffold(
      body: SafeArea(
        child: Narrow(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Wordmark(),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      trDate(d.today),
                      textAlign: TextAlign.right,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, color: C.muted),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Divider(color: C.ink, thickness: 1, height: 1),
              const SizedBox(height: 22),
              const Text(
                'Sen olsan ne yapardın?',
                style: TextStyle(
                  fontSize: 28,
                  height: 1.15,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -.4,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Kısa krizler, zor kararlar. Kurulu memnun tut, koltuğunu koru.',
                style: TextStyle(fontSize: 16, height: 1.4, color: C.ink2),
              ),
              const SizedBox(height: 22),
              _ModeCard(
                kicker: 'Kariyer modu',
                title: '${d.career.company} şirketinin yeni CEO’susun',
                body:
                    'Her kart bir çeyrek. Sağa ya da sola kaydır; Nakit, Marka, Ekip ve Pazar payını dengede tut.',
                meta: progress.bestCareer > 0
                    ? 'En iyi kariyerin: ${progress.bestCareer} çeyrek'
                    : 'Bir gösterge 0’a ya da 100’e değerse kurul seni görevden alır.',
                button: 'Kariyere başla',
                onTap: () => _go(CareerScreen(data: d.career)),
                dark: true,
              ),
              const SizedBox(height: 16),
              _ModeCard(
                kicker: 'Bugünün vakası · Sayı ${issue.no}',
                title: issue.cases.map((c) => c.company).join(', '),
                body: intro,
                meta: '$n dosya · $n karar · 1 CEO karnesi · Üyelik yok',
                button: done
                    ? 'Karnemi göster'
                    : (started ? 'Kaldığın yerden devam et' : 'Dosyaları aç'),
                onTap: () => _go(
                  done ? ReportScreen(issue: issue) : CaseScreen(issue: issue),
                ),
                trailing: done
                    ? _ScoreLine(issueResult(issue, answers).score)
                    : null,
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: () => _go(ArchiveScreen(data: d)),
                child: const Text('Arşiv · geçmiş sayılar'),
              ),
              const SizedBox(height: 28),
              Center(
                child: TextButton(
                  onPressed: () => _go(const InfoScreen()),
                  child: const Text(
                    'Gizlilik ve iletişim',
                    style: TextStyle(fontSize: 13, color: C.muted),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ScoreLine extends StatelessWidget {
  const _ScoreLine(this.score);
  final int score;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      const Text('Karnen ', style: TextStyle(fontSize: 14, color: C.ink2)),
      Pill(score, tier(score)),
    ],
  );
}

class _ModeCard extends StatelessWidget {
  const _ModeCard({
    required this.kicker,
    required this.title,
    required this.body,
    required this.meta,
    required this.button,
    required this.onTap,
    this.dark = false,
    this.trailing,
  });
  final String kicker, title, body, meta, button;
  final VoidCallback onTap;
  final bool dark;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final fg = dark ? C.onInk : C.ink;
    final fg2 = dark ? C.onInk2 : C.ink2;
    return Panel(
      color: dark ? C.ink : C.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Kicker(kicker, color: dark ? C.redL : C.red),
          const SizedBox(height: 10),
          Text(
            title,
            style: TextStyle(
              fontSize: 21,
              height: 1.2,
              fontWeight: FontWeight.w700,
              color: fg,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            style: TextStyle(fontSize: 15.5, height: 1.45, color: fg2),
          ),
          const SizedBox(height: 10),
          Text(
            meta,
            style: TextStyle(
              fontSize: 13,
              height: 1.35,
              color: dark ? C.onInk2 : C.muted,
            ),
          ),
          if (trailing != null) ...[const SizedBox(height: 12), trailing!],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onTap,
              style: dark
                  ? FilledButton.styleFrom(
                      backgroundColor: C.onInk,
                      foregroundColor: C.ink,
                    )
                  : null,
              child: Arrowed(button),
            ),
          ),
        ],
      ),
    );
  }
}
