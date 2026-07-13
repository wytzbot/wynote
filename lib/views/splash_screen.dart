import 'package:flutter/material.dart';
import 'home_screen.dart';
import '../services/ad_service.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 1));
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
    _controller.forward();

    // After 2.5s, go to home and show ad
    Future.delayed(const Duration(milliseconds: 2500), () {
      AdService.showLaunchAd(onAdDismissed: _goToHome);
    });
  }

  void _goToHome() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => HomeScreen())
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF4CAF50),
      body: Center(
        child: FadeTransition(
          opacity: _animation,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.note_alt_rounded, size: 100, color: Colors.white),
              const SizedBox(height: 20),
              const Text('WyNote', 
                style: TextStyle(
                  fontSize: 32, 
                  fontWeight: FontWeight.bold, 
                  color: Colors.white,
                  letterSpacing: 1.5
                )
              ),
              const SizedBox(height: 10),
              const Text('Simple. Clean. Unlimited', 
                style: TextStyle(color: Colors.white70, fontSize: 14)
              ),
            ],
          ),
        ),
      ),
    );
  }
}
