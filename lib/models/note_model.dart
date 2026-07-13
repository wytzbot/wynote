import 'package:hive/hive.dart';
part 'note_model.g.dart';

@HiveType(typeId: 0)
class NoteModel {
  @HiveField(0) String id;
  @HiveField(1) String title;
  @HiveField(2) String content; // Quill Delta JSON
  @HiveField(3) String folderId;
  @HiveField(4) String color;
  @HiveField(5) DateTime date;
  @HiveField(6) bool isDeleted;

  NoteModel({
    required this.id,
    required this.title,
    required this.content,
    this.folderId = '',
    this.color = '#FFF9C4',
    required this.date,
    this.isDeleted = false,
  });
}

@HiveType(typeId: 1)
class FolderModel {
  @HiveField(0) String id;
  @HiveField(1) String name;

  FolderModel({required this.id, required this.name});
}
