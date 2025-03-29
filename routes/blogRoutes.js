const express = require('express');
const Blog = require('../models/Blog');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Create a Blog Post (User or Trainer)
router.post('/create', authMiddleware, async (req, res) => {
    const { title, content, tags } = req.body;

    try {
        const blog = new Blog({
            title,
            content,
            author: req.user.id,
            authorRole: req.user.role,
            tags
        });

        await blog.save();
        res.status(201).json({ message: 'Blog posted successfully', blog });
    } catch (error) {
        res.status(500).json({ message: 'Error posting blog', error });
    }
});

// Get All Blogs with Filters
router.get('/', async (req, res) => {
    const { authorRole, tags } = req.query;
    let query = {};

    if (authorRole) query.authorRole = authorRole;
    if (tags) query.tags = { $in: tags.split(',') };

    try {
        const blogs = await Blog.find(query).populate('author', 'name profileImage');
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching blogs' });
    }
});

// Get a Single Blog
router.get('/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('author', 'name profileImage');
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        res.json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching blog' });
    }
});

// Update Blog (Only Author)
router.put('/update/:id', authMiddleware, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        if (blog.author.toString() !== req.user.id)
            return res.status(403).json({ message: 'Not authorized' });

        Object.assign(blog, req.body);
        await blog.save();

        res.json({ message: 'Blog updated successfully', blog });
    } catch (error) {
        res.status(500).json({ message: 'Error updating blog' });
    }
});

// Delete Blog (Only Author or Admin)
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        if (blog.author.toString() !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ message: 'Not authorized' });

        await blog.deleteOne();
        res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting blog' });
    }
});

// Like a Blog
router.put('/like/:id', authMiddleware, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        blog.likes += 1;
        await blog.save();

        res.json({ message: 'Blog liked', likes: blog.likes });
    } catch (error) {
        res.status(500).json({ message: 'Error liking blog' });
    }
});

// Comment on a Blog
router.post('/comment/:id', authMiddleware, async (req, res) => {
    const { text } = req.body;

    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        blog.comments.push({ user: req.user.id, text });
        await blog.save();

        res.json({ message: 'Comment added', blog });
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment' });
    }
});

module.exports = router;
