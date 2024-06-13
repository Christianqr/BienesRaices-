import { check, validationResult } from 'express-validator'
import bcrypt from 'bcrypt'
import Usuario from '../models/Usuario.js'
import { generarJWT, generarId } from '../helpers/tokens.js'
import { emailRegistro } from '../helpers/email.js'
import { emailOlvidePassword } from '../helpers/email.js'

const formularioLogin = (req,res) => {
    res.render('auth/login', {
        autenticado: false,
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken()
    })
}

const autenticar = async (req,res) => {

    //Validacion de Email y Password

    await check('email').isEmail().withMessage('El Email es obligatorio').run(req)
    await check('password').notEmpty().withMessage('El password es Obligatorio').run(req)

    let resultado = validationResult(req)

    // console.log(resultado);// console.log(req.body);
     //Verificar que el resultado este vacio
     if(!resultado.isEmpty()){
         // Errores 
         return res.render('auth/login', {
             pagina: 'Iniciar Sesión',
             csrfToken: req.csrfToken(),
             errores: resultado.array(),
         })
     }

     const{email, password} = req.body
     //Comprobar si el usuario existe
     const usuario = await Usuario.findOne( { where: { email} })
     if(!usuario) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El Usuario no Existe'}]
        })
     }

    //Comprobar si el usuario esta confirmado
    if(!usuario.confirmado) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Tu cuenta no esta confirmada'}]
        })
     }

     //Revisar Password
     if(!usuario.verificarPassword(password)){
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'EL password es incorrecto'}]
        })
     }
     //autenticar usuario
     const token = generarJWT({id: usuario.id, nombre: usuario.nombre })

     console.log(token)

     //Almacenar en un cookie

     return res.cookie('_token',  token, {
        httpOnly: true//,
        // secure: true,
        // sameSite: true
     }).redirect('/mis-propiedades')
}

const formularioRegistro = (req,res) => {
  //  console.log(req.csrfToken());
    res.render('auth/registro', {
        pagina: 'Crear Cuenta',
       csrfToken: req.csrfToken()
    })
}

//SECCION DE REGISTRAR USUARIO ******************************************************************************************************************************************************

const registrar = async (req,res) =>{
    //validación 
    await check('nombre').notEmpty().withMessage('El Nombre no puede ir vacio').run(req)
    await check('email').isEmail().withMessage('No parece un Email').run(req)
    await check('password').isLength({ min: 6 }).withMessage('El password debe ser minimo de 6 caracteres').run(req)
    await check('repetir_password').custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Las contraseñas no coinciden. Por favor, ingréselas nuevamente.');
        }
        // Indica que la validación fue exitosa si no se lanzó ningún error
        return true;
      }).run(req);
   // await check('repetir_password').equals('password').withMessage('Las contraseñas no coinciden. Por favor, ingréselas nuevamente.').run(req)

    let resultado = validationResult(req)

   // console.log(resultado);// console.log(req.body);
    //Verificar que el resultado este vacio
    if(!resultado.isEmpty()){
        // Errores 
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })

    }
    //res.json(resultado.array());
  
    //extraer los datos 
    const { nombre, email, password } = req.body

    //Verificar que el usuario no este duplicado 

    const existeUsuario = await Usuario.findOne( { where: { email} })
    if(existeUsuario) {
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El Usuario ya esta registrado'}],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }

    //console.log(existeUsuario); //return;
    
//    const usuario = await Usuario.create(req.body)
//    res.json(usuario)

    // Almacenar un usuario
    const usuario =  await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    })

    // Enviar email de Registro
    emailRegistro({
        nombre: usuario.nombre,
        email:  usuario.email,
        token:  usuario.token
    })
 

     //Mostrar mensaje de confirmacion
    res.render('templates/mensaje',{
        pagina: 'Cuenta Creada Correctamente',
        mensaje: 'Hemos enviado un Email de confirmación, presiona en el enlace'
     })

}

//Funcion que comprueba una cuenta
const confirmar = async (req,res) =>{

    const { token } = req.params 

    // Verificar si el token es valido 
    const usuario = await Usuario.findOne({where: {token}})

    if(!usuario){
        return res.render('auth/confirmar-cuenta', {
            pagina:  'Error al confirmar tu cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
            error: true
        })
    }

    //Confirmar la cuenta
    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Cuenta Confirmada Correctamente',
        mensaje: 'La Cuenta se confirmo Correctamente'
    })


}

//SECCION DE OLVIDE PASSWORD ******************************************************************************************************************************************************

const formularioOlvidePassword = (req,res) => {
    res.render('auth/olvidePassword', {
        pagina: 'Recupera tu acceso a Bienes Raices',
        csrfToken: req.csrfToken()
    })
}

const resetPassword = async (req,res) => {
    //validación 
    await check('email').isEmail().withMessage('No parece un Email').run(req)

   // await check('repetir_password').equals('password').withMessage('Las contraseñas no coinciden. Por favor, ingréselas nuevamente.').run(req)

    let resultado = validationResult(req)

   // console.log(resultado);// console.log(req.body);
    //Verificar que el resultado este vacio
    if(!resultado.isEmpty()){
        // Errores 
        return res.render('auth/olvidePassword', {
            pagina: 'Recupera tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    //Buscar el usuario

    const {email} = req.body

    const usuario = await Usuario.findOne({ where: {email}})
    if(!usuario){
        return res.render('auth/olvidePassword', {
            pagina: 'Recupera tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El Email no Pertenece a ningún usuario'}]
        })
    }

    //Generar un Token y enviar el Email
    usuario.token = generarId();
    await usuario.save();

    //Enviar Email
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    })

    //renderizar un mensaje
    res.render('templates/mensaje',{
        pagina: 'Reestablece tu Password',
        mensaje: 'Hemos enviado un Email con las instrucciones'
     })


}

const comprobarToken = async (req,res) => {
    
    const{token} = req.params;

    const usuario = await Usuario.findOne({where: {token}})
    if(!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina:  'Reestablece tu Password',
            mensaje: 'Hubo un error al validar tu información, intenta de nuevo',
            error: true
        });
    }

    //Mostrar formulario para modificar el password
    res.render('auth/reset-password',{
        pagina: 'Reestablece tu Password',
        csrfToken: req.csrfToken()
    });
}


const nuevoPassword = async (req,res) => {

    //Validar el password
    //console.log('guardando password...');
    await check('password').isLength({ min: 6 }).withMessage('El password debe ser minimo de 6 caracteres').run(req)

    let resultado = validationResult(req)
    //console.log(resultado);

    if(!resultado.isEmpty()) {
        // Errores  
       //  console.log(req.csrfToken())
         return res.render('auth/reset-password', {
          pagina: 'Reestablece tu Password',
          csrfToken: req.csrfToken(),
          errores: resultado.array()
        })

    }

    const {token} = req.params
    const { password } = req.body

    //Identificar quien hace el cambio
    const usuario = await Usuario.findOne({where: {token}})

    
    //Hashear el nuevo password
    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash( password, salt);
    usuario.token = null;

    await usuario.save();
    res.render('auth/confirmar-cuenta', {
        pagina: 'Password Reestablecido',
        mensaje: 'Password Guardado Correctamente'
    })
}

export {
    formularioLogin,
    autenticar,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword
}