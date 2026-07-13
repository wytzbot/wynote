import 'package:flutter/material.dart';
import 'package:flutter_quill/flutter_quill.dart';
import 'package:flutter_quill_extensions/flutter_quill_extensions.dart';
import 'package:provider/provider.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:convert';
import 'dart:io';
import '../models/note_model.dart';
import '../providers/app_providers.dart';
import '../services/ad_service.dart';

class NoteEditorScreen extends StatefulWidget {
  final NoteModel note;
  NoteEditorScreen({required this.note});

  @override
  _NoteEditorScreenState createState() => _NoteEditorScreenState();
}

class _NoteEditorScreenState extends State<NoteEditorScreen> {
  late QuillController _controller;
  late TextEditingController _titleController;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.note.title);
    if (widget.note.content.isNotEmpty) {
      _controller = QuillController(
        document: Document.fromJson(jsonDecode(widget.note.content)),
        selection: const TextSelection.collapsed(offset: 0),
      );
    } else {
      _controller = QuillController.basic();
    }
    _titleController.addListener(_autoSave);
    _controller.addListener(_autoSave);
  }

  void _autoSave() {
    widget.note.title = _titleController.text;
    widget.note.content = jsonEncode(_controller.document.toDelta().toJson());
    widget.note.date = DateTime.now();
    Provider.of<AppProvider>(context, listen: false).updateNote(widget.note);
  }

  Future<void> _exportNote() async {
    bool hasAccess = await AdService.checkAndShowAdIfNeeded(context);
    if(!hasAccess) return;

    showModalBottomSheet(context: context, builder: (_) => Wrap(
      children: [
        ListTile(leading: const Icon(Icons.picture_as_pdf), title: const Text('Export as PDF'), onTap: _exportPDF),
        ListTile(leading: const Icon(Icons.text_snippet), title: const Text('Export as TXT'), onTap: _exportTXT),
      ],
    ));
  }

  Future<void> _exportPDF() async {
    Navigator.pop(context);
    final pdf = pw.Document();
    pdf.addPage(pw.Page(build: (pw.Context context) => pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(_titleController.text, style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold)),
        pw.SizedBox(height: 20),
        pw.Text(_controller.document.toPlainText()),
      ],
    )));
    final dir = await getApplicationDocumentsDirectory();
    final file = File('${dir.path}/${_titleController.text}.pdf');
    await file.writeAsBytes(await pdf.save());
    await Share.shareXFiles([XFile(file.path)]);
  }

  Future<void> _exportTXT() async {
    Navigator.pop(context);
    final dir = await getApplicationDocumentsDirectory();
    final file = File('${dir.path}/${_titleController.text}.txt');
    await file.writeAsString(_controller.document.toPlainText());
    await Share.shareXFiles([XFile(file.path)]);
  }

  @override
  void dispose() {
    _controller.dispose();
    _titleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
        actions: [
          IconButton(icon: const Icon(Icons.undo), onPressed: () => _controller.undo()),
          IconButton(icon: const Icon(Icons.redo), onPressed: () => _controller.redo()),
          IconButton(icon: const Icon(Icons.download), onPressed: _exportNote),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(controller: _titleController, decoration: const InputDecoration(hintText: 'Title', border: InputBorder.none), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          ),
          QuillSimpleToolbar(controller: _controller, config: QuillSimpleToolbarConfig(
            showFontFamily: false, showFontSize: false, showListNumbers: true, showListBullets: true,
            showCodeBlock: false, showQuote: false, showIndent: false, showLink: true,
            showBackgroundColorButton: true, showImageButton: true,
          )),
          Expanded(child: QuillEditor.basic(controller: _controller, config: QuillEditorConfig(
            placeholder: 'Start typing... Unlimited characters',
            padding: const EdgeInsets.all(16),
            embedBuilders: FlutterQuillEmbeds.editorBuilders(),
          ))),
        ],
      ),
    );
  }
}
