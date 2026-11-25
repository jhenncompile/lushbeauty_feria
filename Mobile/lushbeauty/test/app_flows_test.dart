import 'package:material_ui/material_ui.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lushbeauty/app/app.dart';
import 'package:lushbeauty/modules/identity/identity.dart';
import 'package:lushbeauty/modules/offline/offline.dart';
import 'package:lushbeauty/shared/routes.dart';

const _admin = Session('marisol', Role.administradora);
const _paty = Session('paty', Role.especialista);

/// Los botones y etiquetas se muestran en mayúsculas.
Finder up(String text) => find.text(text.toUpperCase());

Future<void> pumpApp(
  WidgetTester tester, {
  Session? session = _admin,
  String route = Routes.home,
  bool online = true,
  List<QueueItem> queue = const [],
}) async {
  tester.view.physicalSize = const Size(390 * 3, 900 * 3);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(LushApp(online: online, initialQueue: queue, initialSession: session, initialRoute: route));
  await tester.pumpAndSettle();
}

Future<void> tapText(WidgetTester tester, Finder finder) async {
  await tester.ensureVisible(finder);
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

void main() {
  group('Ingreso', () {
    testWidgets('sin usuario ni PIN muestra errores y no entra', (tester) async {
      await pumpApp(tester, session: null, route: Routes.login);
      await tapText(tester, up('Ingresar'));
      expect(find.text('Error: Ingrese su usuario.'), findsOneWidget);
      expect(find.text('Error: Ingrese su PIN.'), findsOneWidget);
      expect(find.text('Registrar servicio'), findsNothing);
    });

    testWidgets('la especialista entra a Registrar con 2 pestañas', (tester) async {
      await pumpApp(tester, session: null, route: Routes.login);
      await tester.enterText(find.byType(EditableText).at(0), 'paty');
      await tester.enterText(find.byType(EditableText).at(1), '123456');
      await tapText(tester, up('Ingresar como especialista'));
      expect(up('Registrar servicio'), findsOneWidget);
      expect(up('Mi liquidación'), findsOneWidget);
      expect(up('Caja'), findsNothing);
    });

    testWidgets('una especialista que pide la caja vuelve a su inicio', (tester) async {
      await pumpApp(tester, session: _paty, route: Routes.cashClose);
      expect(find.text('Cierre de caja'), findsNothing);
      expect(up('Registrar servicio'), findsOneWidget);
    });
  });

  group('Registrar servicio', () {
    testWidgets('no deja guardar sin método de pago y explica por qué', (tester) async {
      await pumpApp(tester, route: Routes.register);
      expect(find.text('Elija un método de pago para guardar.'), findsOneWidget);
    });

    testWidgets('CP-01: descuento de Bs 8 cobra Bs 112 y comisión Bs 42,00', (tester) async {
      await pumpApp(tester, route: Routes.register);
      await tapText(tester, find.text('Efectivo'));
      await tapText(tester, up('Aplicar descuento'));
      await tester.enterText(find.byType(EditableText).first, '8');
      await tapText(tester, find.text('Clienta frecuente'));
      expect(find.textContaining('Descuento de 6,7 %. Está dentro del límite de 10 %'), findsOneWidget);
      await tapText(tester, up('Aplicar descuento'));
      await tapText(tester, up('Guardar servicio'));
      expect(find.text('Bs 112'), findsOneWidget);
      expect(find.text('Bs 120,00'), findsOneWidget);
      expect(find.text('− Bs 8,00'), findsOneWidget);
      expect(find.text('Bs 42,00'), findsOneWidget);
    });

    testWidgets('un descuento sobre el límite pide aprobación y bloquea el guardado', (tester) async {
      await pumpApp(tester, route: Routes.register);
      await tapText(tester, find.text('Efectivo'));
      await tapText(tester, up('Aplicar descuento'));
      await tester.enterText(find.byType(EditableText).first, '15');
      await tapText(tester, find.text('Otro'));
      expect(find.textContaining('Supera el límite de 10 %'), findsOneWidget);
      await tapText(tester, up('Solicitar aprobación'));
      expect(find.textContaining('necesita la aprobación de la administradora'), findsOneWidget);
    });

    testWidgets('valida el importe y exige motivo', (tester) async {
      await pumpApp(tester, route: Routes.discount);
      await tester.enterText(find.byType(EditableText).first, 'abc');
      await tapText(tester, up('Aplicar descuento'));
      expect(find.textContaining('Escriba un importe válido'), findsOneWidget);
      expect(find.text('Error: Elija un motivo.'), findsOneWidget);
    });
  });

  group('Sin conexión', () {
    testWidgets('guardar sin conexión deja el registro pendiente y lo avisa', (tester) async {
      await pumpApp(tester, route: Routes.register, online: false);
      await tapText(tester, find.text('Efectivo'));
      await tapText(tester, up('Guardar servicio'));
      expect(find.textContaining('Guardado en este teléfono'), findsOneWidget);
      await tapText(tester, find.textContaining('Sin conexión · 1 pendientes'));
      expect(find.text('Manicura gel · Marisol'), findsOneWidget);
      expect(find.text('Bs 120,00'), findsOneWidget);
      expect(up('Pendiente'), findsOneWidget);
    });

    testWidgets('la cola de ejemplo muestra 3 pendientes, una confirmada y una en revisión', (tester) async {
      await pumpApp(tester, route: Routes.sync, online: false, queue: sampleQueue);
      expect(find.text('Sin conexión · 3 pendientes'), findsOneWidget);
      expect(up('Pendiente'), findsNWidgets(3));
      expect(up('Confirmada'), findsOneWidget);
      expect(up('Requiere revisión'), findsOneWidget);
      expect(find.textContaining('el catálogo cambió el precio'), findsOneWidget);
    });

    testWidgets('reintentar sin conexión no pierde nada', (tester) async {
      await pumpApp(tester, route: Routes.sync, online: false, queue: sampleQueue);
      await tapText(tester, up('Reintentar envío'));
      expect(find.text('Sigue sin conexión. Sus registros están a salvo en este teléfono.'), findsOneWidget);
      expect(up('Pendiente'), findsNWidgets(3));
    });

    testWidgets('confirmar el importe de un registro en revisión lo encola', (tester) async {
      await pumpApp(tester, route: Routes.sync, online: false, queue: sampleQueue);
      await tapText(tester, up('Confirmar importe de Bs 40,00'));
      expect(up('Requiere revisión'), findsNothing);
      expect(up('Pendiente'), findsNWidgets(4));
    });

    testWidgets('con la cola vacía lo dice y el reintento está deshabilitado', (tester) async {
      await pumpApp(tester, route: Routes.sync);
      expect(find.text('No hay registros en la cola. Todo está sincronizado.'), findsOneWidget);
    });
  });

  group('Mi liquidación', () {
    testWidgets('Paty ve solo la suya: neto 146, sin datos de otras', (tester) async {
      await pumpApp(tester, session: _paty, route: Routes.myPayroll);
      expect(find.text('Bs 146,00'), findsOneWidget);
      expect(find.text('+ Bs 15,00'), findsOneWidget);
      expect(find.text('Adelanto'), findsOneWidget);
      expect(find.textContaining('Katherine'), findsNothing);
      expect(find.text('Bs 112,00'), findsNothing);
    });

    testWidgets('un usuario sin liquidación recibe un mensaje claro', (tester) async {
      await pumpApp(tester, session: const Session('lucia', Role.especialista), route: Routes.myPayroll);
      expect(find.text('No hay una liquidación para su usuario en esta semana.'), findsOneWidget);
    });
  });

  group('Cierre de caja', () {
    testWidgets('sin contar no calcula diferencia ni deja cerrar', (tester) async {
      await pumpApp(tester, route: Routes.cashClose);
      expect(find.text('Cuente el efectivo para ver lo esperado y la diferencia.'), findsOneWidget);
      await tapText(tester, up('Cerrar caja'));
      expect(find.textContaining('Error: Escriba el efectivo contado'), findsOneWidget);
      expect(find.text('Caja cerrada'.toUpperCase()), findsNothing);
    });

    testWidgets('402 contra 412: falta Bs 10,00; exige justificación y cierra', (tester) async {
      await pumpApp(tester, route: Routes.cashClose);
      await tester.enterText(find.byType(EditableText).at(0), '402');
      await tester.pumpAndSettle();
      expect(find.text('Falta Bs 10,00 en efectivo'), findsOneWidget);
      expect(find.text('Bs 682,00'), findsOneWidget);
      await tapText(tester, up('Cerrar caja'));
      expect(find.text('Error: Explique la diferencia para cerrar la caja.'), findsOneWidget);
      await tester.enterText(find.byType(EditableText).at(1), 'Vuelto mal dado');
      await tapText(tester, up('Cerrar caja'));
      expect(up('Caja cerrada'), findsOneWidget);
    });

    testWidgets('sin conexión no deja cerrar y lo explica', (tester) async {
      await pumpApp(tester, route: Routes.cashClose, online: false);
      expect(find.text('El cierre de caja requiere conexión.'), findsOneWidget);
    });
  });

  testWidgets('Hoy suma lo cobrado y muestra la cola al día', (tester) async {
    await pumpApp(tester);
    expect(find.text('Bs 692'), findsOneWidget);
    expect(find.text('Bs 412'), findsOneWidget);
    expect(up('Al día'), findsOneWidget);
  });
}
