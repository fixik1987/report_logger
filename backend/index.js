const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: '192.168.68.113',
  user: 'valik',
  password: 'Range970766',
  database: 'report_logger',
  connectTimeout: 10000, // 10 seconds timeout
  acquireTimeout: 10000,
  timeout: 10000
});

db.connect(err => {
  if (err) {
    console.error('MySQL connection error:', err);
    console.log('Server will continue running but database operations will fail');
    // Don't exit the process, let it continue running
    return;
  }
  console.log('Connected to MySQL');
});

// Handle database disconnection
db.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Database connection was lost. Attempting to reconnect...');
    // You could implement reconnection logic here
  }
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

// GET all categories
app.get('/categories', (req, res) => {
  db.query('SELECT id, name FROM categories ORDER BY name', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    res.json(results);
  });
});

// POST create new category
app.post('/categories', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  
  db.query(
    'INSERT INTO categories (name) VALUES (?)',
    [name],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Return the created category
      db.query('SELECT id, name FROM categories WHERE id = ?', [result.insertId], (err, results) => {
        if (err || results.length === 0) {
          return res.status(500).json({ error: 'Failed to retrieve created category' });
        }
        res.status(201).json(results[0]);
      });
    }
  );
});

// PUT update category
app.put('/categories/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  
  db.query(
    'UPDATE categories SET name = ? WHERE id = ?',
    [name, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      // Return the updated category
      db.query('SELECT id, name FROM categories WHERE id = ?', [id], (err, results) => {
        if (err || results.length === 0) {
          return res.status(500).json({ error: 'Failed to retrieve updated category' });
        }
        res.json(results[0]);
      });
    }
  );
});

// GET solutions by category
app.get('/solutions/category/:categoryId', (req, res) => {
  const { categoryId } = req.params;
  
  db.query(
    'SELECT `desc` FROM solutions WHERE category_id = ? ORDER BY `desc`',
    [categoryId],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Database error' });
        return;
      }
      res.json(results.map(row => row.desc));
    }
  );
});

// GET all solutions with categories
app.get('/solutions/with-categories', (req, res) => {
  db.query(
    `SELECT s.id, s.\`desc\`, s.category_id, c.name as category_name 
     FROM solutions s 
     JOIN categories c ON s.category_id = c.id 
     ORDER BY c.name, s.\`desc\``,
    (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Database error' });
        return;
      }
      res.json(results);
    }
  );
});

// POST create new solution
app.post('/solutions', (req, res) => {
  const { desc, category_id } = req.body;
  if (!desc || !category_id) {
    return res.status(400).json({ error: 'Solution description and category_id are required' });
  }
  
  db.query(
    'INSERT INTO solutions (`desc`, category_id) VALUES (?, ?)',
    [desc, category_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Return the created solution
      db.query('SELECT id, `desc`, category_id FROM solutions WHERE id = ?', [result.insertId], (err, results) => {
        if (err || results.length === 0) {
          return res.status(500).json({ error: 'Failed to retrieve created solution' });
        }
        res.status(201).json(results[0]);
      });
    }
  );
});

// PUT update solution
app.put('/solutions/:id', (req, res) => {
  const { id } = req.params;
  const { desc, category_id } = req.body;
  
  if (!desc || !category_id) {
    return res.status(400).json({ error: 'Solution description and category_id are required' });
  }
  
  db.query(
    'UPDATE solutions SET `desc` = ?, category_id = ? WHERE id = ?',
    [desc, category_id, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Solution not found' });
      }
      
      // Return the updated solution
      db.query('SELECT id, `desc`, category_id FROM solutions WHERE id = ?', [id], (err, results) => {
        if (err || results.length === 0) {
          return res.status(500).json({ error: 'Failed to retrieve updated solution' });
        }
        res.json(results[0]);
      });
    }
  );
});

// GET issues by category
app.get('/issues/category/:categoryId', (req, res) => {
  const { categoryId } = req.params;
  
  db.query(
    'SELECT description FROM issue WHERE category_id = ? ORDER BY description',
    [categoryId],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Database error' });
        return;
      }
      res.json(results.map(row => row.description));
    }
  );
});

// GET all issues with categories
app.get('/issues/with-categories', (req, res) => {
  db.query(
    `SELECT i.id, i.description, i.category_id, c.name as category_name 
     FROM issue i 
     JOIN categories c ON i.category_id = c.id 
     ORDER BY c.name, i.description`,
    (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Database error' });
        return;
      }
      res.json(results);
    }
  );
});

// POST create new issue
app.post('/issues', (req, res) => {
  const { description, category_id } = req.body;
  if (!description || !category_id) {
    return res.status(400).json({ error: 'Issue description and category_id are required' });
  }
  
  db.query(
    'INSERT INTO issue (description, category_id) VALUES (?, ?)',
    [description, category_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Return the created issue
      db.query('SELECT id, description, category_id FROM issue WHERE id = ?', [result.insertId], (err, results) => {
        if (err || results.length === 0) {
          return res.status(500).json({ error: 'Failed to retrieve created issue' });
        }
        res.status(201).json(results[0]);
      });
    }
  );
});

// PUT update issue
app.put('/issues/:id', (req, res) => {
  const { id } = req.params;
  const { description, category_id } = req.body;
  
  if (!description || !category_id) {
    return res.status(400).json({ error: 'Issue description and category_id are required' });
  }
  
  db.query(
    'UPDATE issue SET description = ?, category_id = ? WHERE id = ?',
    [description, category_id, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Issue not found' });
      }
      
      // Return the updated issue
      db.query('SELECT id, description, category_id FROM issue WHERE id = ?', [id], (err, results) => {
        if (err || results.length === 0) {
          return res.status(500).json({ error: 'Failed to retrieve updated issue' });
        }
        res.json(results[0]);
      });
    }
  );
});

// DELETE issue
app.delete('/issues/:id', (req, res) => {
  const { id } = req.params;
  
  db.query('DELETE FROM issue WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    res.status(204).send();
  });
});

// GET all reports
app.get('/reports', (req, res) => {
  db.query(
    `SELECT r.id, r.category_id, r.issue_id, r.solution_id, r.datetime, r.notes,
            c.name as category_name, i.description as issue_description, s.desc as solution_description
     FROM reports r
     JOIN categories c ON r.category_id = c.id
     JOIN issue i ON r.issue_id = i.id
     JOIN solutions s ON r.solution_id = s.id
     ORDER BY r.datetime DESC`,
    (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Database error' });
        return;
      }
      res.json(results);
    }
  );
});

// POST create new report
app.post('/reports', (req, res) => {
  const { category_id, issue_id, solution_id, notes } = req.body;
  if (!category_id || !issue_id || !solution_id) {
    return res.status(400).json({ error: 'Category ID, Issue ID, and Solution ID are required' });
  }
  
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  db.query(
    'INSERT INTO reports (category_id, issue_id, solution_id, datetime, notes) VALUES (?, ?, ?, ?, ?)',
    [category_id, issue_id, solution_id, now, notes || null],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Return the created report
      db.query(
        `SELECT r.id, r.category_id, r.issue_id, r.solution_id, r.datetime, r.notes,
                c.name as category_name, i.description as issue_description, s.desc as solution_description
         FROM reports r
         JOIN categories c ON r.category_id = c.id
         JOIN issue i ON r.issue_id = i.id
         JOIN solutions s ON r.solution_id = s.id
         WHERE r.id = ?`,
        [result.insertId],
        (err, results) => {
          if (err || results.length === 0) {
            return res.status(500).json({ error: 'Failed to retrieve created report' });
          }
          res.status(201).json(results[0]);
        }
      );
    }
  );
});

// PUT update report
app.put('/reports/:id', (req, res) => {
  const { id } = req.params;
  const { category_id, issue_id, solution_id, notes } = req.body;
  
  if (!category_id || !issue_id || !solution_id) {
    return res.status(400).json({ error: 'Category ID, Issue ID, and Solution ID are required' });
  }
  
  db.query(
    'UPDATE reports SET category_id = ?, issue_id = ?, solution_id = ?, notes = ? WHERE id = ?',
    [category_id, issue_id, solution_id, notes || null, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // Return the updated report
      db.query(
        `SELECT r.id, r.category_id, r.issue_id, r.solution_id, r.datetime, r.notes,
                c.name as category_name, i.description as issue_description, s.desc as solution_description
         FROM reports r
         JOIN categories c ON r.category_id = c.id
         JOIN issue i ON r.issue_id = i.id
         JOIN solutions s ON r.solution_id = s.id
         WHERE r.id = ?`,
        [id],
        (err, results) => {
          if (err || results.length === 0) {
            return res.status(500).json({ error: 'Failed to retrieve updated report' });
          }
          res.json(results[0]);
        }
      );
    }
  );
});

// DELETE report
app.delete('/reports/:id', (req, res) => {
  const { id } = req.params;
  
  db.query('DELETE FROM reports WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.status(204).send();
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
