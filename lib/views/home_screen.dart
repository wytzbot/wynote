
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/note_model.dart';
import '../providers/app_providers.dart';
import '../services/ad_service.dart';
import 'note_editor_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  Note? selectedNote;

  @override
  Widget build(BuildContext context) {
    final notes = ref.watch(notesProvider);
    final isPremium = ref.watch(premiumProvider);
    final width = MediaQuery.of(context).size.width;
    final isExpanded = width > 750;

    return Scaffold(
      appBar: AppBar(
        title: const Text('WyNote', style: TextStyle(fontWeight: FontWeight.black)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: ActionChip(
              backgroundColor: isPremium ? Colors.amber.withOpacity(0.15) : null,
              label: Text(isPremium ? '👑 Premium Mode' : '🔓 Unlock Pro Layout'),
              onPressed: () {
                if (!isPremium) _showPremiumActivationDialog(context);
              },
            ),
          )
        ],
      ),
      body: Row(
        children: [
          Expanded(
            flex: isExpanded ? 3 : 1,
            child: ListView.separated(
              itemCount: notes.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final note = notes[index];
                return ListTile(
                  title: Text(note.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(note.content, maxLines: 1, overflow: TextOverflow.ellipsis),
                  selected: selectedNote?.id == note.id,
                  onTap: () {
                    if (isExpanded) {
                      setState(() => selectedNote = note);
                    } else {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => NoteEditorScreen(note: note)),
                      );
                    }
                  },
                );
              },
            ),
          ),
          if (isExpanded) const VerticalDivider(width: 1),
          if (isExpanded)
            Expanded(
              flex: 7,
              child: selectedNote != null
                  ? (isPremium 
                      ? NoteEditorScreen(note: selectedNote!) 
                      : const Center(child: Text('👑 Watch the premium ad to use side-by-side tablet workspace editing!')))
                  : const Center(child: Text('Select a note file from the left shelf.')),
            ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          ref.read(notesProvider.notifier).addNote('Untitled Document', '');
        },
        label: const Text('Draft Note'),
        icon: const Icon(Icons.edit_note),
      ),
    );
  }

  void _showPremiumActivationDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Unlock Premium Capabilities'),
        content: const Text('Watch a short video ad to immediately unlock split-pane tablet editing pipelines for this session.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Dismiss')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              AdService.showRewardedAd(
                onAdComplete: () {
                  ref.read(premiumProvider.notifier).unlockPremium();
                },
              );
            },
            child: const Text('Watch Video Ad'),
          ),
        ],
      ),
    );
  }
}
