import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'services/ad_service.dart';
import 'theme/app_theme.dart';
import 'views/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    await MobileAds.instance.initialize();
    AdService.loadRewardedAd(); // Background cache the premium stream
  } catch (e) {
    debugPrint("MobileAds execution skipped on desktop/web contexts.");
  }

  runApp(
    const ProviderScope(
      child: WyNoteApp(),
    ),
  );
}

class WyNoteApp extends StatelessWidget {
  const WyNoteApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'WyNote',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system, // Seamless native matching
      home: const SplashScreen(),
    );
  }
}
