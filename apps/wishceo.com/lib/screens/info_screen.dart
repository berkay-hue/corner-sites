import 'package:flutter/material.dart';

import '../data/repo.dart';
import '../theme.dart';
import '../widgets.dart';

/// Gizlilik ve iletişim. Metin mağazadaki "veri toplanmaz" beyanıyla aynı;
/// uygulamaya veri gönderen bir özellik eklenirse burası ve beyan birlikte değişir.
class InfoScreen extends StatelessWidget {
  const InfoScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Gizlilik ve iletişim')),
    body: Narrow(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: const [
          Kicker('Gizlilik'),
          SizedBox(height: 10),
          _P(
            'Uygulama hiçbir kişisel veri toplamaz. Üyelik, reklam, takip ya da '
            'analiz aracı yoktur.',
          ),
          _P(
            'Cevapların ve kariyer rekorun yalnızca bu cihazda saklanır, bize '
            'gelmez. Uygulamayı silersen kayıtlar da silinir.',
          ),
          _P(
            'Yeni sayılar açıldıkça vakalar $kSite adresinden indirilir. Bu '
            'sırada her web sitesinde olduğu gibi cihazının IP adresi sunucuya '
            'ulaşır; bu istek seni tanımlamak için kullanılmaz.',
          ),
          _P(
            'Paylaş dediğinde sonucun, seçtiğin uygulamaya cihazının paylaşım '
            'menüsüyle gider; uygulama bunu kendisi göndermez.',
          ),
          _Link('$kSite/gizlilik#uygulama'),
          SizedBox(height: 24),
          Kicker('İletişim'),
          SizedBox(height: 10),
          _P(
            'SAAS CORNER DANIŞMANLIK VE EĞİTİM HİZMETLERİ SANAYİ TİCARET '
            'LİMİTED ŞİRKETİ',
          ),
          _Link('info@saascorner.co'),
          _Link('$kSite/destek'),
          SizedBox(height: 16),
          _Licenses(),
        ],
      ),
    ),
  );
}

class _P extends StatelessWidget {
  const _P(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Text(
      text,
      style: const TextStyle(fontSize: 15.5, height: 1.45, color: C.ink2),
    ),
  );
}

class _Link extends StatelessWidget {
  const _Link(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: SelectableText(
      text,
      style: const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: C.red,
      ),
    ),
  );
}

class _Licenses extends StatelessWidget {
  const _Licenses();

  @override
  Widget build(BuildContext context) => Align(
    alignment: Alignment.centerLeft,
    child: TextButton(
      onPressed: () =>
          showLicensePage(context: context, applicationName: 'WishCEO'),
      child: const Text('Açık kaynak lisansları'),
    ),
  );
}
