import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/note_model.dart';
import '../providers/app_providers.dart';
import '../services/ad_service.dart';
import 'note_editor_screen.dart';

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool isGridView = true;
  String currentFolder = '';

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);
    final notes = currentFolder.isEmpty 
      ? provider.notes 
        : provider.notes.where((n) => n.folderId == currentFolder).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(currentFolder.isEmpty? 'WyNote' : provider.folders.firstWhere((f) => f.id == currentFolder, orElse: () => FolderModel(id: '', name: 'Folder')).name),
        leading: Builder(builder: (context) => IconButton(icon: const Icon(Icons.menu), onPressed: () => Scaffold.of(context).openDrawer())),
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: () => showSearch(context: context, delegate: NoteSearchDelegate())),
          IconButton(icon: Icon(isGridView? Icons.list : Icons.grid_view), onPressed: () => setState(() => isGridView =!isGridView)),
        ],
      ),
      drawer: _buildDrawer(context, provider),
      body: Container(
        decoration: const BoxDecoration(
          image: DecorationImage(
            image: AssetImage('assets/bg.jpg'),
            fit: BoxFit.cover,
          ),
        ),
        child: isGridView? _buildGrid(notes) : _buildList(provider.folders),
      ),
      floatingActionButton: FloatingActionButton(
        child: const Icon(Icons.add),
        onPressed: () => _createNote(context),
      ),
    );
  }

  Widget _buildGrid(List<NoteModel> notes) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2, childAspectRatio: 0.8, crossAxisSpacing: 16, mainAxisSpacing: 16
      ),
      itemCount: notes.length,
      itemBuilder: (context, index) {
        final note = notes[index];
        return GestureDetector(
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => NoteEditorScreen(note: note))),
          onLongPress: () => _showNoteOptions(context, note),
          child: Card(
            elevation: 2,
            color: Color(int.parse(note.color.replaceFirst('#', '0xFF'))),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(note.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 8),
                  Expanded(child: Text(note.content, maxLines: 6, overflow: TextOverflow.ellipsis)),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildList(List<FolderModel> folders) {
    return ListView.builder(
      itemCount: folders.length,
      itemBuilder: (context, index) {
        final folder = folders[index];
        return ListTile(
          leading: const Icon(Icons.folder, color: Color(0xFF4CAF50)),
          title: Text(folder.name),
          onTap: () => setState(() => currentFolder = folder.id),
          onLongPress: () => _showFolderOptions(context, folder),
        );
      },
    );
  }

  void _createNote(BuildContext context) async {
    final provider = Provider.of<AppProvider>(context, listen: false);
    if (!await AdService.isPro() && provider.notes.length >= 20) {
      _showAdDialog(context, '20 notes limit reached');
      return;
    }
    final note = NoteModel(id: DateTime.now().millisecondsSinceEpoch.toString(), title: 'New Note', content: '', date: DateTime.now());
    provider.addNote(note);
    Navigator.push(context, MaterialPageRoute(builder: (_) => NoteEditorScreen(note: note)));
  }

  void _showAdDialog(BuildContext context, String msg) {
    showDialog(context: context, builder: (_) => AlertDialog(
      title: const Text('Get Pro'),
      content: Text('$msg. Watch 1 ad to unlock unlimited for 24 hours'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        TextButton(onPressed: () async {
          Navigator.pop(context);
          await AdService.showRewardedAd();
        }, child: const Text('Watch Ad')),
      ],
    ));
  }

  void _showNoteOptions(BuildContext context, NoteModel note) {
    showModalBottomSheet(context: context, builder: (_) => Wrap(
      children: [
        ListTile(leading: const Icon(Icons.delete), title: const Text('Delete'), onTap: () {
          Provider.of<AppProvider>(context, listen: false).deleteNote(note.id);
          Navigator.pop(context);
        }),
      ],
    ));
  }

  void _showFolderOptions(BuildContext context, FolderModel folder) {
    showModalBottomSheet(context: context, builder: (_) => Wrap(
      children: [
        ListTile(leading: const Icon(Icons.edit), title: const Text('Rename'), onTap: () {
          Navigator.pop(context);
          _renameFolderDialog(context, folder);
        }),
        ListTile(leading: const Icon(Icons.delete), title: const Text('Delete'), onTap: () {
          Provider.of<AppProvider>(context, listen: false).deleteFolder(folder.id);
          Navigator.pop(context);
        }),
      ],
    ));
  }

  void _renameFolderDialog(BuildContext context, FolderModel folder) {
    final controller = TextEditingController(text: folder.name);
    showDialog(context: context, builder: (_) => AlertDialog(
      title: const Text('Rename Folder'),
      content: TextField(controller: controller),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        TextButton(onPressed: () {
          Provider.of<AppProvider>(context, listen: false).renameFolder(folder.id, controller.text);
          Navigator.pop(context);
        }, child: const Text('Save')),
      ],
    ));
  }

  Widget _buildDrawer(BuildContext context, AppProvider provider) {
    return Drawer(
      child: ListView(
        children: [
          const DrawerHeader(child: Text('WyNote', style: TextStyle(fontSize: 24, color: Color(0xFF4CAF50), fontWeight: FontWeight.bold))),
          ListTile(leading: const Icon(Icons.home), title: const Text('Home'), onTap: () {setState(() => currentFolder = ''); Navigator.pop(context);}),
          ListTile(leading: const Icon(Icons.folder), title: const Text('Folders'), onTap: () {setState(() => isGridView = false); Navigator.pop(context);}),
          ListTile(leading: const Icon(Icons.delete), title: const Text('Trash'), onTap: () {}),
          const Divider(),
          ListTile(title: const Text('About')),
          ListTile(title: const Text('Privacy Policy')),
          ListTile(title: const Text('Terms')),
          ListTile(title: const Text('Contact')),
          ListTile(leading: const Icon(Icons.star), title: const Text('Get Pro - Watch Ad'), onTap: () => AdService.showRewardedAd()),
        ],
      ),
    );
  }
}

class NoteSearchDelegate extends SearchDelegate {
  @override
  Widget buildResults(BuildContext context) {
    final results = Provider.of<AppProvider>(context).searchNotes(query);
    return ListView.builder(
      itemCount: results.length,
      itemBuilder: (context, index) => ListTile(
        title: Text(results[index].title),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => NoteEditorScreen(note: results[index]))),
      ),
    );
  }
  @override List<Widget> buildActions(BuildContext context) => [IconButton(icon: Icon(Icons.clear), onPressed: () => query = '')];
  @override Widget buildLeading(BuildContext context) => BackButton();
  @override Widget buildSuggestions(BuildContext context) => buildResults(context);
}
