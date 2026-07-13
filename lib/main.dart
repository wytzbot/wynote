import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:provider/provider.dart';
import 'models/note_model.dart';
import 'providers/app_providers.dart';
import 'services/ad_service.dart';
import 'theme/app_theme.dart';
import 'views/splash_screen.dart'; // NEW

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  Hive.registerAdapter(NoteModelAdapter());
  Hive.registerAdapter(FolderModelAdapter());
  await Hive.openBox<NoteModel>('notes');
  await Hive.openBox<FolderModel>('folders');
  await AdService.init();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppProvider(),
      child: MaterialApp(
        title: 'WyNote',
        theme: AppTheme.lightTheme,
        home: const SplashScreen(), // CHANGED FROM HomeScreen()
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
