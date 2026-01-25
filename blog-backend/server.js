const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage as fallback when MongoDB is not available
let posts = [];
let nextId = 1;

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(err => {
  console.log('MongoDB not available, using in-memory storage');
  console.log('To use MongoDB, please install and start MongoDB service');
});

// Post Schema
const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Post = mongoose.model('Post', postSchema);

// Routes
app.get('/api/posts', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      // MongoDB is connected
      const posts = await Post.find().sort({ createdAt: -1 });
      res.json(posts);
    } else {
      // Use in-memory storage
      res.json(posts);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (mongoose.connection.readyState === 1) {
      // MongoDB is connected
      const post = new Post({ title, content });
      const savedPost = await post.save();
      res.status(201).json(savedPost);
    } else {
      // Use in-memory storage
      const post = {
        _id: nextId++,
        title,
        content,
        createdAt: new Date()
      };
      posts.unshift(post);
      res.status(201).json(post);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      // MongoDB is connected
      const post = await Post.findByIdAndDelete(req.params.id);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      res.json({ message: 'Post deleted successfully' });
    } else {
      // Use in-memory storage
      const id = parseInt(req.params.id);
      const index = posts.findIndex(post => post._id === id);
      if (index === -1) {
        return res.status(404).json({ message: 'Post not found' });
      }
      posts.splice(index, 1);
      res.json({ message: 'Post deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Frontend should connect to: http://localhost:${PORT}`);
});
