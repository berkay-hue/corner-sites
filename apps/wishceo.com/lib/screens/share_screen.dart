import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';

import '../data/models.dart';
import '../game/scoring.dart';
import '../theme.dart';
import '../widgets.dart';

/// Paylaşım kartı. Metin cihazın paylaşım menüsüyle (olmazsa panoyla) paylaşılır;
/// uygulama hiçbir sunucuya veri göndermez.
class ShareScreen extends StatefulWidget {
  ShareScreen.issue({
    super.key,
    required Issue issue,
    required IssueResult result,
  }) : heading = 'Sayı ${issue.no}',
       tiers = result.tiers,
       big = '${result.score}',
       unit = '/100',
       bigColor = tierColor(tier(result.score)),
       typeTag = result.type,
       text = issueShareText(issue, result);

  ShareScreen.career({
    super.key,
    required String company,
    required int quarters,
    required String tag,
  }) : heading = 'Kariyer modu · $company',
       tiers = const [],
       big = '$quarters',
       unit = ' çeyrek',
       bigColor = C.onInk,
       typeTag = tag,
       text = careerShareText(company, quarters, tag);

  final String heading;
  final List<String> tiers;
  final String big;
  final String unit;
  final Color bigColor;
  final String typeTag;

  /// Paylaşılan metin (kareler burada emoji olarak yer alır, sonda site linki).
  final String text;

  @override
  State<ShareScreen> createState() => _ShareScreenState();
}

class _ShareScreenState extends State<ShareScreen> {
  final _button = GlobalKey();
  bool _busy = false;

  Future<void> _share() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      // iPad'de paylaşım menüsü butona bağlanır.
      final box = _button.currentContext?.findRenderObject() as RenderBox?;
      final origin = box != null && box.hasSize
          ? box.localToGlobal(Offset.zero) & box.size
          : null;
      ShareResult? r;
      try {
        r = await SharePlus.instance.share(
          ShareParams(text: widget.text, sharePositionOrigin: origin),
        );
      } catch (_) {
        r = null;
      }
      if (!mounted) return;
      if (r == null || r.status == ShareResultStatus.unavailable) {
        await _copy();
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _copy() async {
    final text = widget.text;
    try {
      await Clipboard.setData(ClipboardData(text: text));
      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(
            content: Text(
              'Sonucun panoya kopyalandı. İstediğin yere yapıştır.',
            ),
          ),
        );
    } catch (_) {
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Kopyalanamadı. Metni elle seç:'),
          content: SelectableText(text),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Kapat'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final w = widget;
    final type = types[w.typeTag]!;
    return Scaffold(
      appBar: AppBar(title: const Text('Paylaş')),
      body: Narrow(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            Panel(
              color: C.ink,
              padding: const EdgeInsets.fromLTRB(22, 22, 22, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Wordmark(size: 26, dark: true),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          w.heading,
                          textAlign: TextAlign.right,
                          style: const TextStyle(fontSize: 13, color: C.onInk2),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Divider(color: C.inkRule, height: 1),
                  const SizedBox(height: 20),
                  if (w.tiers.isNotEmpty) ...[
                    Squares(w.tiers, size: 30),
                    const SizedBox(height: 16),
                  ],
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        w.big,
                        style: TextStyle(
                          fontSize: 64,
                          height: 1,
                          fontWeight: FontWeight.w800,
                          color: w.bigColor,
                        ),
                      ),
                      Flexible(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 8, left: 4),
                          child: Text(
                            w.unit,
                            style: const TextStyle(
                              fontSize: 20,
                              color: C.onInk2,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Text(
                    'CEO tipim: ${type.name}',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: C.onInk,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Sen olsan ne yapardın?',
                    style: TextStyle(fontSize: 16, color: C.redL),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'Sonucunu istediğin uygulamada paylaş. Uygulama hiçbir veri toplamaz.',
              style: TextStyle(fontSize: 13.5, color: C.muted),
            ),
            const SizedBox(height: 16),
            FilledButton(
              key: _button,
              onPressed: _busy ? null : _share,
              child: const Text('Sonucu paylaş'),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: _busy ? null : _copy,
              child: const Text('Metni kopyala'),
            ),
          ],
        ),
      ),
    );
  }
}
