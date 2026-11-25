import 'package:material_ui/material_ui.dart';

import '../../../shared/state/controller_scope.dart';
import '../../../shared/theme/tokens.dart';
import '../../../shared/ui/lush_button.dart';
import '../../../shared/ui/lush_field.dart';
import '../identity.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _user = TextEditingController();
  final _pin = TextEditingController();
  String? _userError;
  String? _pinError;

  @override
  void dispose() {
    _user.dispose();
    _pin.dispose();
    super.dispose();
  }

  void _enter(Role role) {
    setState(() {
      _userError = _user.text.trim().isEmpty ? 'Ingrese su usuario.' : null;
      _pinError = _pin.text.isEmpty ? 'Ingrese su PIN.' : null;
    });
    if (_userError != null || _pinError != null) return;
    ControllerScope.of<SessionController>(context).signIn(Session(_user.text.trim(), role));
    Navigator.of(context).pushReplacementNamed(homeRouteFor(role));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    color: LushColors.inverse,
                    padding: const EdgeInsets.symmetric(vertical: LushSpace.s7 * 1.5, horizontal: LushSpace.s5),
                    child: Column(
                      children: [
                        Text('LUSH BEAUTY', style: jost(28, 400, letterSpacing: 4.5, color: LushColors.inkInverse)),
                        const SizedBox(height: LushSpace.s5),
                        Text('SALÓN DE BELLEZA', style: LushText.eyebrow.copyWith(color: LushColors.inkInverse)),
                        const SizedBox(height: LushSpace.s5),
                        Text(
                          'El arte del detalle, con las cuentas claras.',
                          style: LushText.caption.copyWith(color: LushColors.inkInverse),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: LushSpace.s5, vertical: LushSpace.s6),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text('LUSH BEAUTY SMART', style: LushText.eyebrow),
                        const SizedBox(height: LushSpace.s2),
                        Semantics(header: true, child: Text('Ingresar', style: LushText.headline)),
                        const SizedBox(height: LushSpace.s5),
                        LushField(label: 'Usuario', controller: _user, hint: 'Su correo o nombre de usuario.', error: _userError),
                        const SizedBox(height: LushSpace.s5),
                        LushField(
                          label: 'PIN',
                          controller: _pin,
                          obscureText: true,
                          keyboardType: TextInputType.number,
                          hint: '6 dígitos.',
                          error: _pinError,
                        ),
                        const SizedBox(height: LushSpace.s5),
                        LushButton(label: 'Ingresar', onPressed: () => _enter(Role.administradora)),
                        const SizedBox(height: LushSpace.s3),
                        Center(
                          child: LushButton(
                            label: 'Ingresar como especialista',
                            variant: LushButtonVariant.link,
                            onPressed: () => _enter(Role.especialista),
                          ),
                        ),
                        const SizedBox(height: LushSpace.s5),
                        Text(
                          'Si ingresa como especialista, solo verá sus propios servicios y su liquidación. Pantalla con datos ilustrativos: aún no hay conexión con el servidor.',
                          style: LushText.caption,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
