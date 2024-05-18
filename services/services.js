// services.js
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3002;
app.use(cors());
app.use(bodyParser.json());

// Conexión a MySQL
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Mauricio_nets4",
    database: "db_services"  // Cambia esto al nombre correcto de tu base de datos de servicios
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database: ' + err.stack);
        return;
    }
    console.log('Connected to database with thread ID: ' + db.threadId);
});

// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                 SERVICES
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// GET - Retrieve all services
app.get("/api/services", (req, res) => {
    const sqlQuery = "SELECT * FROM Services";
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('Error retrieving services:', err);
            res.status(500).json({ error: 'Error retrieving services', details: err.message });
            return;
        }
        res.json(results); // Return all results
    });
});

// GET - Retrieve services by user_id
app.get("/api/services/user/:userId", (req, res) => {
    const userId = req.params.userId;
    const sqlQuery = "SELECT * FROM Services WHERE user_id = ?";
    db.query(sqlQuery, [userId], (err, results) => {
        if (err) {
            console.error('Error retrieving services:', err);
            res.status(500).json({ error: 'Error retrieving services', details: err.message });
            return;
        }
        res.json(results);
    });
});

// PUT - Fully update a service
app.put("/api/services/:id", (req, res) => {
    const { user_id, first_name, last_name, dni, phone, address, description, service_type, modalities, cost, status, rating } = req.body;
    const sqlUpdate = "UPDATE Services SET user_id = ?, first_name = ?, last_name = ?, dni = ?, phone = ?, address = ?, description = ?, service_type = ?, modalities = ?, cost = ?, status = ?, rating = ? WHERE id = ?";
    db.query(sqlUpdate, [user_id, first_name, last_name, dni, phone, address, description, service_type, modalities, cost, status, rating, req.params.id], (err, result) => {
        if (err) {
            console.error('Error updating the service:', err);
            return res.status(500).json({ error: 'Error updating the service', details: err.message });
        }
        res.json({ message: 'Service updated successfully' });
    });
});

// POST - Create a new service
app.post('/api/services', (req, res) => {
    const { user_id, dni, phone, address, description, service_type, modalities, cost, status, rating, lat, lng, user_img } = req.body;

    // Validate required fields
    if (!user_id || !service_type) {
        return res.status(400).json({ error: "Missing required fields: user_id and service_type must be provided." });
    }

    // Get user details
    const sqlGetUser = 'SELECT nombre, apellido FROM usuario WHERE id = ?';
    db.query(sqlGetUser, [user_id], (err, userResult) => {
        if (err) {
            console.error('Error fetching user details:', err);
            return res.status(500).json({ error: 'Error fetching user details', details: err.message });
        }
        
        if (userResult.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { nombre, apellido } = userResult[0];

        const sqlInsertService = `
            INSERT INTO Services (user_id, first_name, last_name, dni, phone, address, description, service_type, modalities, cost, status, rating, lat, lng, user_img) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [user_id, nombre, apellido, dni, phone, address, description, service_type, modalities, cost, status, rating, lat, lng, user_img];

        db.query(sqlInsertService, values, (err, result) => {
            if (err) {
                console.error('Error creating service:', err);
                return res.status(500).json({ error: 'Database error', details: err.message });
            }
            res.json({ message: "Service created successfully", serviceId: result.insertId });
        });
    });
});

// PATCH - Partially update a service
app.patch('/api/services/:serviceId', (req, res) => {
    const serviceId = req.params.serviceId;
    const updates = req.body;
    const validColumns = ['dni', 'phone', 'address', 'description', 'service_type', 'modalities', 'cost', 'status', 'lat', 'lng', 'user_img'];
    const columnsToUpdate = Object.keys(updates).filter(key => validColumns.includes(key));

    if (columnsToUpdate.length === 0) {
        console.error('No valid columns to update');
        return res.status(400).json({ error: 'No valid columns to update' });
    }

    const sqlUpdateService = `
        UPDATE Services SET ${columnsToUpdate.map(col => `${col} = ?`).join(', ')}
        WHERE id = ?`;

    const values = [...columnsToUpdate.map(col => updates[col]), serviceId];

    db.query(sqlUpdateService, values, (err, result) => {
        if (err) {
            console.error('Error executing SQL query:', err);
            return res.status(500).json({ error: 'Error updating service', details: err.message });
        }

        res.json({ message: 'Service updated successfully', result });
    });
});

// GET - Retrieve a specific service by ID
app.get("/api/services/:id", (req, res) => {
    const sqlQuery = "SELECT * FROM Services WHERE id = ?";
    db.query(sqlQuery, [parseInt(req.params.id, 10)], (err, results) => {
        if (err) {
            console.error('Error retrieving service:', err);
            res.status(500).json({ error: 'Error retrieving service', details: err.message });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'Service not found' });
            return;
        }
        res.json(results[0]); // Return the first result
    });
});

// DELETE - Remove a service
app.delete("/api/services/:id", (req, res) => {
    const sqlDelete = "DELETE FROM Services WHERE id = ?";
    db.query(sqlDelete, [req.params.id], (err, result) => {
        if (err) {
            console.error('Error al eliminar el servicio:', err);
            res.status(500).json({ error: 'Error al eliminar el servicio', details: err.message });
            return;
        }
        res.json({ message: 'Servicio eliminado con éxito' });
    });
});

// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                RATINGS
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// Endpoint para enviar una calificación
app.post('/api/ratings', (req, res) => {
    const { serviceId, jobId, userId, rating } = req.body;
  
    if (!userId || (!serviceId && !jobId)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    const sqlCheckRating = 'SELECT * FROM ratings WHERE (service_id = ? OR job_id = ?) AND user_id = ?';
    const sqlInsertRating = 'INSERT INTO ratings (service_id, job_id, user_id, rating) VALUES (?, ?, ?, ?)';
    const sqlUpdateRating = 'UPDATE ratings SET rating = ? WHERE (service_id = ? OR job_id = ?) AND user_id = ?';
  
    const sqlUpdateServiceRating = `
      UPDATE Services
      SET rating = (
        SELECT AVG(r.rating)
        FROM ratings r
        WHERE r.service_id = ?
      )
      WHERE id = ?`;
  
    const sqlUpdateJobRating = `
      UPDATE jobs
      SET rating = (
        SELECT AVG(r.rating)
        FROM ratings r
        WHERE r.job_id = ?
      )
      WHERE id = ?`;
  
    db.query(sqlCheckRating, [serviceId, jobId, userId], (err, result) => {
      if (err) {
        console.error('Error checking rating:', err);
        return res.status(500).json({ error: 'Error checking rating', details: err.message });
      }
  
      if (result.length > 0) {
        db.query(sqlUpdateRating, [rating, serviceId, jobId, userId], (err, result) => {
          if (err) {
            console.error('Error updating rating:', err);
            return res.status(500).json({ error: 'Error updating rating', details: err.message });
          }
  
          if (serviceId) {
            db.query(sqlUpdateServiceRating, [serviceId, serviceId], (err, result) => {
              if (err) {
                console.error('Error updating service rating:', err);
                return res.status(500).json({ error: 'Error updating service rating', details: err.message });
              }
              res.json({ message: 'Rating updated and service rating updated successfully' });
            });
          } else if (jobId) {
            db.query(sqlUpdateJobRating, [jobId, jobId], (err, result) => {
              if (err) {
                console.error('Error updating job rating:', err);
                return res.status(500).json({ error: 'Error updating job rating', details: err.message });
              }
              res.json({ message: 'Rating updated and job rating updated successfully' });
            });
          }
        });
      } else {
        db.query(sqlInsertRating, [serviceId, jobId, userId, rating], (err, result) => {
          if (err) {
            console.error('Error inserting rating:', err);
            return res.status(500).json({ error: 'Error inserting rating', details: err.message });
          }
  
          if (serviceId) {
            db.query(sqlUpdateServiceRating, [serviceId, serviceId], (err, result) => {
              if (err) {
                console.error('Error updating service rating:', err);
                return res.status(500).json({ error: 'Error updating service rating', details: err.message });
              }
              res.json({ message: 'Rating submitted and service rating updated successfully' });
            });
          } else if (jobId) {
            db.query(sqlUpdateJobRating, [jobId, jobId], (err, result) => {
              if (err) {
                console.error('Error updating job rating:', err);
                return res.status(500).json({ error: 'Error updating job rating', details: err.message });
              }
              res.json({ message: 'Rating submitted and job rating updated successfully' });
            });
          }
        });
      }
    });
  });

// GET - Retrieve a specific rating by user and service
app.get('/api/ratings/:serviceId/user/:userId', (req, res) => {
    const { serviceId, userId } = req.params;
    const sqlGetUserRating = 'SELECT rating FROM ratings WHERE service_id = ? AND user_id = ?';

    db.query(sqlGetUserRating, [serviceId, userId], (err, result) => {
        if (err) {
            console.error('Error getting user rating:', err);
            return res.status(500).json({ error: 'Error getting user rating', details: err.message });
        }

        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Rating not found' });
        }
    });
});

// GET - Retrieve a specific rating by user and service
app.get('/api/ratings/:serviceId/user/:userId', (req, res) => {
    const { serviceId, userId } = req.params;
    const sqlGetUserRating = 'SELECT rating FROM ratings WHERE service_id = ? AND user_id = ?';

    db.query(sqlGetUserRating, [serviceId, userId], (err, result) => {
        if (err) {
            console.error('Error getting user rating:', err);
            return res.status(500).json({ error: 'Error getting user rating', details: err.message });
        }

        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Rating not found' });
        }
    });
});


// Obtener calificación del usuario para un servicio específico
app.get('/api/ratings/service/:serviceId/user/:userId', (req, res) => {
    const { serviceId, userId } = req.params;
    const sql = 'SELECT * FROM ratings WHERE service_id = ? AND user_id = ?';
    db.query(sql, [serviceId, userId], (err, results) => {
        if (err) {
            console.error('Error fetching user rating:', err);
            return res.status(500).json({ error: 'Error fetching user rating' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'No rating found for this user and service' });
        }
        res.json(results[0]);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
