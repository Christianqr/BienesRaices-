
//const express = require('express')// COMMON JS 
import express from 'express'
import csrf from 'csurf'
import cookieParser from 'cookie-parser'
import usuarioRoutes from './routes/usuarioRoutes.js'
import propiedadesRoutes from './routes/propiedadesRoutes.js'
import db from './config/db.js'

//crea la app
const app = express()

//Habilitar lectura de datos de formularios
app.use( express.urlencoded({extended: true}) )

//Habilitar coockie parser
app.use(cookieParser() )

//Habilitar CSRF
app.use(csrf({cookie: true}))


//Conexion a la base de datos
try{
    await db.authenticate();
    db.sync()
    console.log('Conexion Correcta a la Base de Datos')
} catch(error){
    console.log(error)
}


//habilitar pug
app.set('view engine', 'pug')
app.set('views', './views') 

// Carpeta Publica
app.use( express.static('public') )


//routing
app.use('/auth', usuarioRoutes)
app.use('/', propiedadesRoutes)



//definir un puerto y arrancar el proyecto
const port = process.env.port || 3000;
app.listen(port, () => {
    console.log(`el servidor esta funcionando en el puerto ${port}`)
});
