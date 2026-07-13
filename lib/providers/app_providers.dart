import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import '../models/note_model.dart';

class AppProvider extends ChangeNotifier {
  Box<NoteModel> noteBox = Hive.box<NoteModel>('notes');
  Box<FolderModel> folderBox = Hive.box<FolderModel>('folders');
  
  List<NoteModel> get notes => noteBox.values.where((n) =>!n.isDeleted).toList();
  List<FolderModel> get folders => folderBox.values.toList();
  List<NoteModel> get trash => noteBox.values.where((n) => n.isDeleted).toList();

  void addNote(NoteModel note) {
    noteBox.put(note.id, note);
    notifyListeners();
  }

  void updateNote(NoteModel note) {
    noteBox.put(note.id, note);
    notifyListeners();
  }

  void deleteNote(String id) {
    final note = noteBox.get(id);
    if (note!= null) {
      note.isDeleted = true;
      noteBox.put(id, note);
      notifyListeners();
    }
  }

  void restoreNote(String id) {
    final note = noteBox.get(id);
    if (note!= null) {
      note.isDeleted = false;
      noteBox.put(id, note);
      notifyListeners();
    }
  }

  void addFolder(FolderModel folder) {
    folderBox.put(folder.id, folder);
    notifyListeners();
  }

  void deleteFolder(String id) {
    folderBox.delete(id);
    notifyListeners();
  }

  void renameFolder(String id, String newName) {
    final folder = folderBox.get(id);
    if(folder!= null){
      folderBox.put(id, FolderModel(id: id, name: newName));
      notifyListeners();
    }
  }

  List<NoteModel> searchNotes(String query) {
    return notes.where((n) => 
      n.title.toLowerCase().contains(query.toLowerCase()) ||
      n.content.toLowerCase().contains(query.toLowerCase())
    ).toList();
  }
}
