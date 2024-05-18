// jobs.js
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3003;
app.use(cors());
app.use(bodyParser.json());

// Conexión a MySQL
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Mauricio_nets4",
    database: "jobsDB"  // Cambia esto al nombre correcto de tu base de datos de trabajos
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database: ' + err.stack);
        return;
    }
    console.log('Connected to database with thread ID: ' + db.threadId);
});

// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                  JOBS
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// GET - Retrieve all jobs
app.get('/api/jobs', (req, res) => {
    const sql = 'SELECT * FROM jobs';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching jobs:', err);
            return res.status(500).json({ error: 'Error fetching jobs' });
        }
        res.json(results);
    });
});

// GET - Retrieve jobs by user
app.get('/api/jobs/user/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = 'SELECT * FROM jobs WHERE user_id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching jobs for user:', err);
            return res.status(500).json({ error: 'Error fetching jobs for user' });
        }
        res.json(results);
    });
});

// GET - Retrieve a specific job by ID
app.get('/api/jobs/:id', (req, res) => {
    const jobId = req.params.id;
    console.log(`Fetching details for job ID: ${jobId}`);
    const sql = 'SELECT * FROM jobs WHERE id = ?';
    db.query(sql, [jobId], (err, results) => {
        if (err) {
            console.error('Error fetching job details:', err);
            return res.status(500).json({ error: 'Error fetching job details' });
        }
        if (results.length === 0) {
            console.log(`Job ID: ${jobId} not found`);
            return res.status(404).json({ error: 'Job not found' });
        }
        console.log(`Job details for ID: ${jobId}`, results[0]);
        res.json(results[0]);
    });
});

// POST - Create a new job
app.post('/api/jobs', (req, res) => {
    const { user_id, job_title, description, company, location, lat, lng, job_type, salary } = req.body;

    if (!user_id || !job_title || !description || !job_type) {
        return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Primero, obtener la imagen del usuario desde la tabla users
    const sqlGetUserImage = 'SELECT foto AS user_img FROM usuario WHERE id = ?';

    db.query(sqlGetUserImage, [user_id], (err, result) => {
        if (err) {
            console.error('Error fetching user image:', err);
            return res.status(500).json({ error: 'Error fetching user image' });
        }

        const user_img = result.length > 0 ? result[0].user_img : 'default.png';

        // Luego, insertar el nuevo trabajo con la imagen del usuario
        const sqlInsertJob = 'INSERT INTO jobs (user_id, job_title, description, company, location, lat, lng, job_type, salary, user_img) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(sqlInsertJob, [user_id, job_title, description, company, location, lat, lng, job_type, salary, user_img], (err, result) => {
            if (err) {
                console.error('Error creating job:', err);
                return res.status(500).json({ error: 'Error creating job' });
            }
            res.json({ message: 'Job created successfully', jobId: result.insertId });
        });
    });
});

// PATCH - Update a job
app.patch('/api/jobs/:id', (req, res) => {
    const jobId = req.params.id;
    const updates = req.body;
    const sql = 'UPDATE jobs SET ? WHERE id = ?';
    db.query(sql, [updates, jobId], (err, result) => {
        if (err) {
            console.error('Error updating job:', err);
            return res.status(500).json({ error: 'Error updating job' });
        }
        console.log('Job updated successfully', { jobId });
        res.json({ message: 'Job updated successfully' });
    });
});

// DELETE - Remove a job
app.delete('/api/jobs/:id', (req, res) => {
    const jobId = req.params.id;
    const sql = 'DELETE FROM jobs WHERE id = ?';
    db.query(sql, [jobId], (err, result) => {
        if (err) {
            console.error('Error deleting job:', err);
            return res.status(500).json({ error: 'Error deleting job' });
        }
        console.log('Job deleted successfully', { jobId });
        res.json({ message: 'Job deleted successfully' });
    });
});


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


  // Obtener calificación del usuario para un trabajo específico
  app.get('/api/ratings/job/:jobId/user/:userId', (req, res) => {
    const { jobId, userId } = req.params;
    const sql = 'SELECT * FROM ratings WHERE job_id = ? AND user_id = ?';
    db.query(sql, [jobId, userId], (err, results) => {
        if (err) {
            console.error('Error fetching user rating:', err);
            return res.status(500).json({ error: 'Error fetching user rating' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'No rating found for this user and job' });
        }
        res.json(results[0]);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
