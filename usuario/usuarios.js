// usuarios.js
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const upload = require('./uploadConfig');  // Importa la configuración de multer
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(bodyParser.json());

// Conexión a MySQL
const db = mysql.createConnection({
    host: "75.101.252.245:3306",
    user: "root",
    password: "facilito",
    database: "db_usuario"
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database: ' + err.stack);
        return;
    }
    console.log('Connected to database with thread ID: ' + db.threadId);
});

// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                  IMAGE    

// Endpoint de carga de imagen
app.post('/api/upload', upload.single('profilePic'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    
    const userId = req.body.userId;
    const sqlUpdateUser = 'UPDATE usuario SET foto = ? WHERE id = ?';
    const sqlUpdateService = 'UPDATE services SET user_img = ? WHERE user_id = ?';

    db.query(sqlUpdateUser, [imageUrl, userId], (err) => {
        if (err) {
            console.error('Error updating user image:', err);
            return res.status(500).json({ error: 'Error updating user image', details: err.message });
        }

        db.query(sqlUpdateService, [imageUrl, userId], (err) => {
            if (err) {
                console.error('Error updating service image:', err);
                return res.status(500).json({ error: 'Error updating service image', details: err.message });
            }

            res.json({ message: 'Imagen de perfil y servicio actualizada con éxito', imageUrl: imageUrl });
        });
    });
});

// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                      USER

// Ejemplo de cómo manejar la ruta GET para obtener datos del usuario
app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    const sqlQuery = 'SELECT * FROM usuario WHERE id = ?';

    db.query(sqlQuery, [userId], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Error en el servidor al obtener el usuario', details: err.message });
            return;
        }
        if (result.length === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        const user = result[0];
        if (user.foto) {
            user.foto = user.foto.replace(/\\/g, '/');  // Reemplaza todas las barras invertidas con barras normales
        }
        res.json(user);
    });
});

// Verificar si el usuario ya se encuentra en la base de datos
app.get("/api/check-user", (req, res) => {
    const email = req.query.email;
    const sqlQuery = "SELECT * FROM usuario WHERE correo = ?";
    db.query(sqlQuery, [email], (err, result) => {
        if (err) {
            res.status(500).json({ error: 'Error al verificar el usuario', details: err.message });
        } else {
            res.json({ exists: result.length > 0, user: result[0] || null });
        }
    });
});

app.post("/api/user", (req, res) => {
    const { id, correo, nombre, apellido, edad, direccion } = req.body;
    const sqlInsert = "INSERT INTO usuario (id, correo, nombre, apellido, edad, direccion) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sqlInsert, [id, correo, nombre, apellido, edad, direccion], (err, result) => {
        if (err) {
            console.error('Error al crear el usuario:', err);
            res.status(500).json({ error: 'Error al crear el usuario', details: err.message });
            return;
        }
        res.status(201).json({ message: "Usuario creado con éxito" });
    });
});

// Actualizar un usuario completamente
app.put('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    const updates = req.body;
    const sqlUpdate = 'UPDATE usuario SET ? WHERE id = ?';
    db.query(sqlUpdate, [updates, userId], (err, result) => {
        if (err) {
            res.status(500).json({ error: 'Error al actualizar el usuario', details: err.message });
        } else {
            res.json({ message: 'Usuario actualizado con éxito' });
        }
    });
});

// Actualizar parcialmente un usuario
app.patch('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    const updates = req.body;
    const updateKeys = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const updateValues = Object.values(updates);

    const sqlUpdate = `UPDATE usuario SET ${updateKeys} WHERE id = ?`;

    db.query(sqlUpdate, [...updateValues, userId], (err, result) => {
        if (err) {
            console.error('Error al actualizar el usuario:', err);
            return res.status(500).json({ error: 'Error al actualizar el usuario', details: err.message });
        }
        if (result.affectedRows === 0) {
            // No se encontró el usuario con ese ID, o no se cambió nada
            return res.status(404).json({ error: 'Usuario no encontrado o no se modificó ningún dato' });
        }
        res.json({ message: 'Usuario actualizado con éxito', result: result });
    });
});

// Eliminar un usuario
app.delete('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    const sqlDelete = 'DELETE FROM usuario WHERE id = ?';
    db.query(sqlDelete, [userId], (err, result) => {
        if (err) {
            console.error('Error al eliminar el usuario:', err);
            res.status(500).json({ error: 'Error al eliminar el usuario', details: err.message });
        } else {
            res.json({ message: 'Usuario eliminado con éxito' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
