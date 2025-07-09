const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const XLSX = require('xlsx');

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // We'll rename after we know the reportId
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Function to compress image
const compressImage = async (inputPath, outputPath) => {
  try {
    await sharp(inputPath)
      .jpeg({ 
        quality: 85, 
        progressive: true,
        mozjpeg: true 
      })
      .png({ 
        quality: 85,
        progressive: true,
        compressionLevel: 9
      })
      .webp({ 
        quality: 85,
        effort: 6
      })
      .resize(1920, 1920, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .toFile(outputPath);
    
    // Remove original file
    fs.unlinkSync(inputPath);
    return true;
  } catch (error) {
    console.error('Image compression error:', error);
    return false;
  }
};

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// GET file sizes for images
app.get('/file-sizes', (req, res) => {
  const { files } = req.query;
  
  if (!files) {
    return res.status(400).json({ error: 'Files parameter is required' });
  }
  
  const fileList = Array.isArray(files) ? files : [files];
  const fileSizes = {};
  
  fileList.forEach(filePath => {
    if (filePath && filePath.startsWith('/uploads/')) {
      const fullPath = path.join(__dirname, filePath);
      try {
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          fileSizes[filePath] = stats.size;
        } else {
          fileSizes[filePath] = null;
        }
      } catch (error) {
        fileSizes[filePath] = null;
      }
    }
  });
  
  res.json(fileSizes);
});

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

// GET all reports with filtering
app.get('/reports', (req, res) => {
  const { dateFrom, dateTo, categories, issues, solutions } = req.query;
  
  let query = `
    SELECT r.id, r.category_id, r.issue_id, r.solution_id, r.datetime, r.notes, r.pic_name1, r.pic_name2, r.pic_name3,
           r.status, r.priority, r.escalate_name,
           c.name as category_name, i.description as issue_description, s.desc as solution_description
    FROM reports r
    JOIN categories c ON r.category_id = c.id
    JOIN issue i ON r.issue_id = i.id
    JOIN solutions s ON r.solution_id = s.id
  `;
  
  const conditions = [];
  const params = [];
  
  // Date range filter
  if (dateFrom) {
    conditions.push('r.datetime >= ?');
    params.push(dateFrom + ' 00:00:00');
  }
  
  if (dateTo) {
    conditions.push('r.datetime <= ?');
    params.push(dateTo + ' 23:59:59');
  }
  
  // Category filter
  if (categories) {
    const categoryId = parseInt(categories);
    if (!isNaN(categoryId)) {
      conditions.push('r.category_id = ?');
      params.push(categoryId);
    }
  }
  
  // Issue filter
  if (issues) {
    const issueId = parseInt(issues);
    if (!isNaN(issueId)) {
      conditions.push('r.issue_id = ?');
      params.push(issueId);
    }
  }
  
  // Solution filter
  if (solutions) {
    const solutionId = parseInt(solutions);
    if (!isNaN(solutionId)) {
      conditions.push('r.solution_id = ?');
      params.push(solutionId);
    }
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY r.datetime DESC';
  
  db.query(query, params, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    res.json(results);
  });
});

// POST create new report
app.post('/reports', upload.fields([
  { name: 'pic_name1', maxCount: 1 },
  { name: 'pic_name2', maxCount: 1 },
  { name: 'pic_name3', maxCount: 1 }
]), (req, res) => {
  const category_id = req.body.category_id;
  const issue_id = req.body.issue_id;
  const solution_id = req.body.solution_id;
  const notes = req.body.notes;
  const status = req.body.status || 'in_progress';
  const priority = req.body.priority || 'pendant';
  const escalate_name = req.body.escalate_name || null;
  
  if (!category_id || !issue_id || !solution_id) {
    return res.status(400).json({ error: 'Category ID, Issue ID, and Solution ID are required' });
  }
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  db.query(
    'INSERT INTO reports (category_id, issue_id, solution_id, datetime, notes, status, priority, escalate_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [category_id, issue_id, solution_id, now, notes || null, status, priority, escalate_name],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      const reportId = result.insertId;
      // Handle images with compression
      const picFields = ['pic_name1', 'pic_name2', 'pic_name3'];
      const picUrls = {};
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-GB').replace(/\//g, ''); // ddMMyyyy
      
      const processImages = async () => {
        for (const field of picFields) {
          if (req.files && req.files[field] && req.files[field][0]) {
            const file = req.files[field][0];
            const ext = path.extname(file.originalname);
            const newName = `${reportId}_${field}_${dateStr}${ext}`;
            const newPath = path.join(path.join(__dirname, 'uploads'), newName);
            
            // Compress the image
            const compressed = await compressImage(file.path, newPath);
            if (compressed) {
              picUrls[field] = `/uploads/${newName}`;
            } else {
              // Fallback to original if compression fails
              fs.renameSync(file.path, newPath);
              picUrls[field] = `/uploads/${newName}`;
            }
          }
        }
        
        // Update report with image URLs
        db.query(
          'UPDATE reports SET pic_name1 = ?, pic_name2 = ?, pic_name3 = ? WHERE id = ?',
          [picUrls.pic_name1 || null, picUrls.pic_name2 || null, picUrls.pic_name3 || null, reportId],
          (err2) => {
            if (err2) {
              return res.status(500).json({ error: 'Failed to update report with images' });
            }
            // Return the created report
            db.query(
              `SELECT r.id, r.category_id, r.issue_id, r.solution_id, r.datetime, r.notes, r.pic_name1, r.pic_name2, r.pic_name3,
                      r.status, r.priority, r.escalate_name,
                      c.name as category_name, i.description as issue_description, s.desc as solution_description
               FROM reports r
               JOIN categories c ON r.category_id = c.id
               JOIN issue i ON r.issue_id = i.id
               JOIN solutions s ON r.solution_id = s.id
               WHERE r.id = ?`,
              [reportId],
              (err3, results) => {
                if (err3 || results.length === 0) {
                  return res.status(500).json({ error: 'Failed to retrieve created report' });
                }
                res.status(201).json(results[0]);
              }
            );
          }
        );
      };
      
      processImages();
    }
  );
});

// PUT update report
app.put('/reports/:id', upload.fields([
  { name: 'pic_name1', maxCount: 1 },
  { name: 'pic_name2', maxCount: 1 },
  { name: 'pic_name3', maxCount: 1 }
]), (req, res) => {
  const { id } = req.params;
  const category_id = req.body.category_id;
  const issue_id = req.body.issue_id;
  const solution_id = req.body.solution_id;
  const notes = req.body.notes;
  const status = req.body.status;
  const priority = req.body.priority;
  const escalate_name = req.body.escalate_name;
  
  if (!category_id || !issue_id || !solution_id) {
    return res.status(400).json({ error: 'Category ID, Issue ID, and Solution ID are required' });
  }
  // Handle images with compression
  const picFields = ['pic_name1', 'pic_name2', 'pic_name3'];
  const picUrls = {};
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB').replace(/\//g, ''); // ddMMyyyy
  
  const processImages = async () => {
    for (const field of picFields) {
      if (req.files && req.files[field] && req.files[field][0]) {
        const file = req.files[field][0];
        const ext = path.extname(file.originalname);
        const newName = `${id}_${field}_${dateStr}${ext}`;
        const newPath = path.join(path.join(__dirname, 'uploads'), newName);
        
        // Compress the image
        const compressed = await compressImage(file.path, newPath);
        if (compressed) {
          picUrls[field] = `/uploads/${newName}`;
        } else {
          // Fallback to original if compression fails
          fs.renameSync(file.path, newPath);
          picUrls[field] = `/uploads/${newName}`;
        }
      }
    }
    
    // First, get the current report to preserve existing images
    db.query('SELECT pic_name1, pic_name2, pic_name3 FROM reports WHERE id = ?', [id], (err, currentReport) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (currentReport.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      const current = currentReport[0];
      // Only update image fields that have new images uploaded
      const updatedPic1 = picUrls.pic_name1 || current.pic_name1;
      const updatedPic2 = picUrls.pic_name2 || current.pic_name2;
      const updatedPic3 = picUrls.pic_name3 || current.pic_name3;
      
      db.query(
        'UPDATE reports SET category_id = ?, issue_id = ?, solution_id = ?, notes = ?, status = ?, priority = ?, escalate_name = ?, pic_name1 = ?, pic_name2 = ?, pic_name3 = ? WHERE id = ?',
        [category_id, issue_id, solution_id, notes || null, status, priority, escalate_name, updatedPic1, updatedPic2, updatedPic3, id],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Report not found' });
          }
          // Return the updated report
          db.query(
            `SELECT r.id, r.category_id, r.issue_id, r.solution_id, r.datetime, r.notes, r.pic_name1, r.pic_name2, r.pic_name3,
                    r.status, r.priority, r.escalate_name,
                    c.name as category_name, i.description as issue_description, s.desc as solution_description
             FROM reports r
             JOIN categories c ON r.category_id = c.id
             JOIN issue i ON r.issue_id = i.id
             JOIN solutions s ON r.solution_id = s.id
             WHERE r.id = ?`,
            [id],
            (err2, results) => {
              if (err2 || results.length === 0) {
                return res.status(500).json({ error: 'Failed to retrieve updated report' });
              }
              res.json(results[0]);
            }
          );
        }
      );
    });
  };
  
  processImages();
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

// DELETE individual picture from report
app.delete('/reports/:id/picture', (req, res) => {
  const { id } = req.params;
  const { field, path: picturePath } = req.body;
  
  if (!field || !picturePath) {
    return res.status(400).json({ error: 'Field and path are required' });
  }
  
  // First, get the current report to check if the picture exists
  db.query('SELECT pic_name1, pic_name2, pic_name3 FROM reports WHERE id = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const report = results[0];
    const currentPath = report[field];
    
    if (currentPath !== picturePath) {
      return res.status(400).json({ error: 'Picture path mismatch' });
    }
    
    // Delete the file from the filesystem
    const fullPath = path.join(__dirname, picturePath);
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue with database update even if file deletion fails
    }
    
    // Update the database to set the picture field to null
    const updateQuery = `UPDATE reports SET ${field} = NULL WHERE id = ?`;
    db.query(updateQuery, [id], (err2, result) => {
      if (err2) {
        return res.status(500).json({ error: 'Failed to update report' });
      }
      
      res.json({ success: true, message: 'Picture deleted successfully' });
    });
  });
});

// POST upload image
app.post('/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }
  
  const imageUrl = `http://192.168.68.113:3001/uploads/${req.file.filename}`;
  res.json({ 
    success: true, 
    imageUrl: imageUrl,
    filename: req.file.filename 
  });
});

// DELETE image
app.delete('/delete-image/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'Image deleted successfully' });
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// Export reports to Excel
app.post('/export-reports-excel', (req, res) => {
  const { reportIds } = req.body;
  
  if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
    return res.status(400).json({ error: 'Report IDs array is required' });
  }
  
  const query = `
    SELECT r.id, r.datetime, r.notes, r.status, r.priority, r.escalate_name,
           c.name as category_name, i.description as issue_description, s.desc as solution_description,
           r.pic_name1, r.pic_name2, r.pic_name3
    FROM reports r
    JOIN categories c ON r.category_id = c.id
    JOIN issue i ON r.issue_id = i.id
    JOIN solutions s ON r.solution_id = s.id
    WHERE r.id IN (${reportIds.map(() => '?').join(',')})
    ORDER BY r.datetime DESC
  `;
  
  db.query(query, reportIds, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'No reports found' });
    }
    
    // Prepare data for Excel
    const excelData = results.map(report => ({
      'Report ID': report.id,
      'Date/Time': new Date(report.datetime).toLocaleString(),
      'Category': report.category_name,
      'Issue': report.issue_description,
      'Solution': report.solution_description,
      'Status': report.status,
      'Priority': report.priority,
      'Escalate To': report.escalate_name || '',
      'Notes': report.notes || '',
      'Picture 1': report.pic_name1 ? 'Yes' : 'No',
      'Picture 2': report.pic_name2 ? 'Yes' : 'No',
      'Picture 3': report.pic_name3 ? 'Yes' : 'No'
    }));
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const columnWidths = [
      { wch: 10 }, // Report ID
      { wch: 20 }, // Date/Time
      { wch: 20 }, // Category
      { wch: 30 }, // Issue
      { wch: 30 }, // Solution
      { wch: 12 }, // Status
      { wch: 12 }, // Priority
      { wch: 15 }, // Escalate To
      { wch: 40 }, // Notes
      { wch: 10 }, // Picture 1
      { wch: 10 }, // Picture 2
      { wch: 10 }  // Picture 3
    ];
    worksheet['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `reports_export_${timestamp}.xlsx`;
    
    // Write to buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    // Send the file
    res.send(buffer);
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
