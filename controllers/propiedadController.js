
const admin = (req,res) => {
    res.render('propiedades/admin', {
        pagina: 'Mis propiedades',
        barra: true
   })
}

//formulario para crear propiedades

const crear = (req, res) => {
    res.render('propiedades/crear', {
        pagina: 'Crear propiedades',
        barra: true
   })
}

export {
    admin,
    crear
}