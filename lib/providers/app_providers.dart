import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/note_model.dart';

class PremiumNotifier extends StateNotifier<bool> {
  PremiumNotifier() : super(false);

  void unlockPremium() => state = true;
  void revokePremium() => state = false;
}

final premiumProvider = StateNotifierProvider<PremiumNotifier, bool>((ref) {
  return PremiumNotifier();
});

class NotesNotifier extends StateNotifier<List<Note>> {
  NotesNotifier()
      : super([
          Note(
            id: '1',
            title: '🚀 WyNote Product Strategy',
            content: 'Leverage app open interstitials alongside value exchange rewarded modules.',
            updatedAt: DateTime.now(),
          ),
          Note(
            id: '2',
            title: 'Shopping Checklist',
            content: 'Fresh mint, cold brew espresso, organic honey.',
            updatedAt: DateTime.now().subtract(const Duration(days: 1)),
          ),
        ]);

  void addNote(String title, String content) {
    final newNote = Note(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: title,
      content: content,
      updatedAt: DateTime.now(),
    );
    state = [newNote, ...state];
  }

  void updateNote(String id, String title, String content) {
    state = [
      for (final note in state)
        if (note.id == id)
          note.copyWith(title: title, content: content, updatedAt: DateTime.now())
        else
          note,
    ];
  }
}

final notesProvider = StateNotifierProvider<NotesNotifier, List<Note>>((ref) {
  return NotesNotifier();
});
