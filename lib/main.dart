import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:provider/provider.dart';
import 'models/note_model.dart';
import 'providers/app_providers.dart';
import 'services/ad_service.dart';
import 'theme/app_theme.dart';
import 'views/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // 1. Init Hive DB
  await Hive.initFlutter();
  Hive.registerAdapter(NoteModelAdapter());
  Hive.registerAdapter(FolderModelAdapter());
  await Hive.openBox<NoteModel>('notes');
  await Hive.openBox<FolderModel>('folders');
  
  // 2. Init Ads
  await AdService.init();
  
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  void initState() {
    super.initState();
    // 3. Show Launch Interstitial 2 seconds after app starts
    Future.delayed(const Duration(seconds: 2), () {
      if(mounted) {
        AdService.showLaunchAd(onAdDismissed: () {});
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppProvider(),
      child: MaterialApp(
        title: 'WyNote',
        theme: AppTheme.lightTheme,
        home: HomeScreen(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
