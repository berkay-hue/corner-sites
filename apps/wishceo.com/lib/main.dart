import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'data/repo.dart';
import 'screens/home_screen.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  LicenseRegistry.addLicense(() async* {
    yield LicenseEntryWithLineBreaks([
      'Roboto',
    ], await rootBundle.loadString('assets/fonts/Roboto_LICENSE.txt'));
  });
  runApp(const WishCeoApp());
}

class WishCeoApp extends StatefulWidget {
  const WishCeoApp({super.key, this.data, this.loader});

  /// Testlerde hazır veri verilebilir.
  final AppData? data;

  /// Testlerde yükleyici değiştirilebilir; yoksa önbellek + paket + site.
  final Future<AppData> Function()? loader;

  @override
  State<WishCeoApp> createState() => _WishCeoAppState();
}

class _WishCeoAppState extends State<WishCeoApp> {
  late Future<AppData> _data;
  late final AppLifecycleListener _life;
  String? _day;
  bool _latestMissing = false;

  @override
  void initState() {
    super.initState();
    _data = _load();
    // Uygulama Pazartesi'ye kadar açık kalırsa yeni sayı ön plana gelince açılır;
    // site henüz güncellenmediyse her öne gelişte yeniden denenir.
    _life = AppLifecycleListener(
      onResume: () {
        if (widget.data == null &&
            _day != null &&
            (_day != todayTr() || _latestMissing)) {
          _reload();
        }
      },
    );
  }

  @override
  void dispose() {
    _life.dispose();
    super.dispose();
  }

  // setState'e Future döndüren closure verilemez; atama blokta yapılır.
  void _reload() {
    setState(() {
      _data = _load();
    });
  }

  Future<AppData> _load() async {
    if (widget.data != null) return widget.data!;
    final d = await (widget.loader ?? _defaultLoad)();
    _day = d.today;
    _latestMissing = d.latestMissing;
    return d;
  }

  static Future<AppData> _defaultLoad() async {
    SharedPreferences? prefs;
    try {
      prefs = await SharedPreferences.getInstance();
    } catch (_) {
      prefs = null; // kayıt olmadan da oynanır
    }
    return AppData.load(prefs: prefs);
  }

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'WishCEO',
    debugShowCheckedModeBanner: false,
    theme: buildTheme(),
    locale: const Locale('tr'),
    supportedLocales: const [Locale('tr')],
    localizationsDelegates: GlobalMaterialLocalizations.delegates,
    home: FutureBuilder<AppData>(
      future: _data,
      builder: (context, snap) {
        // Tekrar denerken eski hata snapshot'ta kalır; önce bekleme gösterilir.
        if (snap.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          );
        }
        if (snap.hasError) {
          return _LoadError(onRetry: _reload);
        }
        return HomeScreen(key: ValueKey(snap.data!.today), data: snap.data!);
      },
    ),
  );
}

class _LoadError extends StatelessWidget {
  const _LoadError({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Vakalar açılamadı.',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              const Text(
                'İnternet bağlantını kontrol edip tekrar dene.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: onRetry,
                child: const Text('Tekrar dene'),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
