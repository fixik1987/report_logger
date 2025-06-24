const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: '192.168.1.110',
  user: 'valik',
  password: 'Range970766',
  database: 'report_logger'
});

db.connect(err => {
  if (err) {
    console.error('MySQL connection error:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL');
});

// Endpoint to read users table
app.get('/users', (req, res) => {
  db.query('SELECT id, name FROM users', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    res.json(results);
  });
});

// LOGIN endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  db.query(
    'SELECT id, name FROM users WHERE name = ? AND pass = ?',
    [username, password],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      // Success: return user info (do not return password)
      const user = results[0];
      res.json({ id: user.id, username: user.name });
    }
  );
});

// GET all messages
app.get('/messages', (req, res) => {
  db.query('SELECT id, title, content, created_at, updated_at FROM messages ORDER BY created_at DESC', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    res.json(results);
  });
});

// POST create new message
app.post('/messages', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  db.query(
    'INSERT INTO messages (title, content, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [title, content, now, now],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Return the created message
      db.query('SELECT id, title, content, created_at, updated_at FROM messages WHERE id = ?', [result.insertId], (err, results) => {
        if (err || results.length === 0) {
          return res.status(500).json({ error: 'Failed to retrieve created message' });
        }
        res.status(201).json(results[0]);
      });
    }
  );
});

// PUT update message
app.put('/messages/:id', (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  db.query(
    'UPDATE messages SET title = ?, content = ?, updated_at = ? WHERE id = ?',
    [title, content, now, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      // Return the updated message
      db.query('SELECT id, title, content, created_at, updated_at FROM messages WHERE id = ?', [id], (err, results) => {
        if (err || results.length === 0) {
          return res.status(500).json({ error: 'Failed to retrieve updated message' });
        }
        res.json(results[0]);
      });
    }
  );
});

// DELETE message
app.delete('/messages/:id', (req, res) => {
  const { id } = req.params;
  
  db.query('DELETE FROM messages WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.status(204).send();
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
