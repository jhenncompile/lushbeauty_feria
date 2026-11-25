import 'package:material_ui/material_ui.dart';

import '../connection.dart';
import '../theme/tokens.dart';

class TabSpec {
  const TabSpec(this.label, this.route);
  final String label;
  final String route;
}

/// Pantalla móvil: barra superior, estado de conexión, contenido con scroll, pie y pestañas.
class LushScreen extends StatelessWidget {
  const LushScreen({
    super.key,
    this.title,
    this.backRoute,
    this.header,
    required this.children,
    this.footer,
    this.tabs,
    this.currentRoute,
    this.syncRoute,
  });

  final String? title;
  final String? backRoute;
  final Widget? header;
  final List<Widget> children;
  final List<Widget>? footer;
  final List<TabSpec>? tabs;
  final String? currentRoute;
  final String? syncRoute;

  @override
  Widget build(BuildContext context) {
    final connection = ConnectionScope.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Column(
              children: [
                header ?? (title != null ? _TopBar(title: title!, backRoute: backRoute) : const SizedBox.shrink()),
                _StatusBar(info: connection, syncRoute: syncRoute),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(LushSpace.s5),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        for (var i = 0; i < children.length; i++) ...[
                          if (i > 0) const SizedBox(height: LushSpace.s5),
                          children[i],
                        ],
                      ],
                    ),
                  ),
                ),
                if (footer != null)
                  Container(
                    padding: const EdgeInsets.fromLTRB(LushSpace.s5, LushSpace.s4, LushSpace.s5, LushSpace.s5),
                    decoration: const BoxDecoration(border: Border(top: BorderSide(color: LushColors.hairline))),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        for (var i = 0; i < footer!.length; i++) ...[
                          if (i > 0) const SizedBox(height: LushSpace.s3),
                          footer![i],
                        ],
                      ],
                    ),
                  ),
                if (tabs != null) _Tabs(tabs: tabs!, current: currentRoute),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar({required this.title, this.backRoute});
  final String title;
  final String? backRoute;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 56),
      padding: const EdgeInsets.symmetric(horizontal: LushSpace.s5),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: LushColors.hairline))),
      child: Row(
        children: [
          Expanded(
            child: Align(
              alignment: Alignment.centerLeft,
              child: backRoute == null
                  ? const SizedBox.shrink()
                  : Semantics(
                      button: true,
                      label: 'Volver',
                      excludeSemantics: true,
                      child: InkWell(
                        onTap: () => Navigator.of(context).pushReplacementNamed(backRoute!),
                        child: Container(
                          constraints: const BoxConstraints(minHeight: LushSpace.touchMin),
                          alignment: Alignment.center,
                          child: Text('VOLVER', style: jost(12, 400, height: 16, letterSpacing: 1.9)),
                        ),
                      ),
                    ),
            ),
          ),
          Semantics(header: true, child: Text(title.toUpperCase(), style: LushText.button)),
          const Expanded(child: SizedBox.shrink()),
        ],
      ),
    );
  }
}

class _StatusBar extends StatelessWidget {
  const _StatusBar({required this.info, this.syncRoute});
  final ConnectionInfo info;
  final String? syncRoute;

  @override
  Widget build(BuildContext context) {
    final online = info.online;
    final fg = online ? LushColors.ink : LushColors.inkInverse;
    final text = online ? 'En línea · todo sincronizado' : 'Sin conexión · ${info.pending} pendientes';
    final row = Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: LushSpace.s5, vertical: LushSpace.s3),
      color: online ? LushColors.raised : LushColors.inverse,
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(shape: BoxShape.circle, color: online ? LushColors.ok : LushColors.inkInverse),
          ),
          const SizedBox(width: LushSpace.s2),
          Flexible(child: Text(text, style: LushText.caption.copyWith(color: fg))),
        ],
      ),
    );
    return Semantics(
      liveRegion: true,
      container: true,
      child: syncRoute == null
          ? row
          : InkWell(onTap: () => Navigator.of(context).pushNamed(syncRoute!), child: row),
    );
  }
}

class _Tabs extends StatelessWidget {
  const _Tabs({required this.tabs, this.current});
  final List<TabSpec> tabs;
  final String? current;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(border: Border(top: BorderSide(color: LushColors.hairline))),
      child: Row(
        children: [
          for (final tab in tabs)
            Expanded(
              child: Semantics(
                button: true,
                selected: tab.route == current,
                label: tab.label,
                excludeSemantics: true,
                child: InkWell(
                  onTap: tab.route == current ? null : () => Navigator.of(context).pushReplacementNamed(tab.route),
                  child: Container(
                    height: 56,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          width: 2,
                          color: tab.route == current ? LushColors.ink : Colors.transparent,
                        ),
                      ),
                    ),
                    child: Text(
                      tab.label.toUpperCase(),
                      style: LushText.tab.copyWith(color: tab.route == current ? LushColors.ink : LushColors.muted),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
