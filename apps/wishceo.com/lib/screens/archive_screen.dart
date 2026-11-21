import 'package:flutter/material.dart';

import '../data/models.dart';
import '../data/repo.dart';
import '../game/scoring.dart';
import '../theme.dart';
import '../widgets.dart';
import 'case_screen.dart';
import 'report_screen.dart';

/// Geçmiş sayılar. Sıradaki sayı yalnız tarihiyle görünür; içeriği uygulamada yoktur.
class ArchiveScreen extends StatelessWidget {
  const ArchiveScreen({super.key, required this.data});
  final AppData data;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: progress,
    builder: (context, _) {
      final open = data.released.reversed.toList();
      return Scaffold(
        appBar: AppBar(title: const Text('Arşiv')),
        body: Narrow(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            children: [
              const Kicker('Açık sayılar'),
              const SizedBox(height: 10),
              for (final (i, issue) in open.indexed) ...[
                _IssueRow(issue: issue, newest: i == 0),
                const SizedBox(height: 10),
              ],
              const SizedBox(height: 18),
              const Kicker('Yakında', color: C.muted),
              const SizedBox(height: 6),
              const Text(
                'Her Pazartesi yeni bir sayı açılır.',
                style: TextStyle(fontSize: 14, color: C.muted),
              ),
              const SizedBox(height: 10),
              Container(
                constraints: const BoxConstraints(minHeight: 48),
                alignment: Alignment.centerLeft,
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: C.rule)),
                ),
                child: Text(
                  'Sayı ${data.next.no} · ${trDate(data.next.date)} tarihinde açılır',
                  style: const TextStyle(fontSize: 15, color: C.ink2),
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}

class _IssueRow extends StatelessWidget {
  const _IssueRow({required this.issue, required this.newest});
  final Issue issue;
  final bool newest;

  @override
  Widget build(BuildContext context) {
    final answers = progress.answersOf(issue);
    final done = answers.every((a) => a != null);
    final started = answers.any((a) => a != null);
    final n = issue.cases.length;
    final status = done
        ? 'Karnen ${issueResult(issue, answers).score}/100'
        : (started ? 'Yarım kaldı' : null);
    final head = [
      'Sayı ${issue.no}',
      if (newest) 'En yeni',
      '$n dosya',
      ?status,
    ].join(' · ');

    return Material(
      color: C.card,
      shape: const Border.fromBorderSide(BorderSide(color: C.ink)),
      child: InkWell(
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) =>
                done ? ReportScreen(issue: issue) : CaseScreen(issue: issue),
          ),
        ),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 72),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 12, 14),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        head,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: C.muted,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        issue.cases.map((c) => c.company).join(', '),
                        style: const TextStyle(
                          fontSize: 16.5,
                          height: 1.3,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.chevron_right, color: C.ink2),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
