import express from 'express'
import { formularioLogin, autenticar, formularioRegistro, registrar, confirmar , formularioOlvidePassword, resetPassword, comprobarToken, nuevoPassword} from '../controllers/usuarioController.js'


const router = express.Router();

router.get('/login', formularioLogin);
router.post('/login', autenticar);

router.get('/registro', formularioRegistro)
router.post('/registro', registrar)

router.get('/confirmar/:token', confirmar)

router.get('/olvidePassword', formularioOlvidePassword)
router.post('/olvidePassword', resetPassword)

//Almacena el nuevo password

router.get('/olvidePassword/:token', comprobarToken);
router.post('/olvidePassword/:token', nuevoPassword);

export default router

