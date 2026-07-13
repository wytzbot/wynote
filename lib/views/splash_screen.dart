import 'package:flutter/material.dart';
import '../services/ad_service.dart';
import 'home_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _handleLaunchSequence();
  }

  void _handleLaunchSequence() async {
    // Synchronously wait for the AdMob system network hook up
    await AdService.loadLaunchAd();
    
    AdService.showLaunchAd(
      onAdDismissed: () {
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const HomeScreen()),
          );
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'WyNote',
              style: TextStyle(fontSize: 40, fontWeight: FontWeight.extrabold, letterSpacing: 1.2),
            ),
            SizedBox(height: 24),
            CircularProgressIndicator.adaptive(),
          ],
        ),
      ),
    );
  }
}
