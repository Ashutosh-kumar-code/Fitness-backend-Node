const express = require('express');
const Blog = require('../models/Blog');

const router = express.Router();

// ✅ **Create a Blog Post**
router.post('/create', async (req, res) => {
    try {
        const { title, content, tags, userId, role } = req.body;
        if (!userId || !role) return res.status(400).json({ message: 'User ID and role required' });

        const blog = new Blog({ title, content, author: userId, authorRole: role, tags });

        await blog.save();
        res.status(201).json({ message: 'Blog posted successfully', blog });
    } catch (error) {
        res.status(500).json({ message: 'Error posting blog', error });
    }
});

// ✅ **Get All Blogs with Filters**
router.get('/', async (req, res) => {
    try {
        const { authorRole, tags, author } = req.query;
        let query = {};

        if (authorRole) query.authorRole = authorRole;
        if (tags) query.tags = { $in: tags.split(',') };
        if (author) query.author = author;

        const blogs = await Blog.find(query)
            .populate('author', 'name profileImage role')
            .sort({ createdAt: -1 });

        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching blogs', error });
    }
});

// ✅ **Get a Single Blog**
router.get('/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('author', 'name profileImage role');
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        res.json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching blog', error });
    }
});

// ✅ **Update Blog (Only Author)**
router.put('/update/:id', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: 'User ID required' });

        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        if (blog.author.toString() !== userId)
            return res.status(403).json({ message: 'Not authorized to update this blog' });

        Object.assign(blog, req.body);
        await blog.save();

        res.json({ message: 'Blog updated successfully', blog });
    } catch (error) {
        res.status(500).json({ message: 'Error updating blog', error });
    }
});

// ✅ **Delete Blog (Only Author or Admin)**
router.delete('/delete/:id', async (req, res) => {
    try {
        const { userId, role } = req.body;
        if (!userId || !role) return res.status(400).json({ message: 'User ID and role required' });

        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        if (blog.author.toString() !== userId && role !== 'admin')
            return res.status(403).json({ message: 'Not authorized to delete this blog' });

        await blog.deleteOne();
        res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting blog', error });
    }
});

// ✅ **Like a Blog**
router.put('/like/:id', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: 'User ID required' });

        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        if (blog.likedBy.includes(userId)) {
            return res.status(400).json({ message: 'You already liked this blog' });
        }

        blog.likes += 1;
        blog.likedBy.push(userId);
        await blog.save();

        res.json({ message: 'Blog liked', likes: blog.likes });
    } catch (error) {
        res.status(500).json({ message: 'Error liking blog', error });
    }
});

// ✅ **Unlike a Blog**
router.put('/unlike/:id', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: 'User ID required' });

        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        if (!blog.likedBy.includes(userId)) {
            return res.status(400).json({ message: 'You have not liked this blog yet' });
        }

        blog.likes -= 1;
        blog.likedBy = blog.likedBy.filter(id => id.toString() !== userId);
        await blog.save();

        res.json({ message: 'Blog unliked', likes: blog.likes });
    } catch (error) {
        res.status(500).json({ message: 'Error unliking blog', error });
    }
});

// ✅ **Comment on a Blog**
router.post('/comment/:id', async (req, res) => {
    try {
        const { text, userId } = req.body;
        if (!userId || !text) return res.status(400).json({ message: 'User ID and comment text required' });

        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        blog.comments.push({ user: userId, text });
        await blog.save();

        res.json({ message: 'Comment added', blog });
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment', error });
    }
});

// ✅ **Get Comments for a Blog**
router.get('/comments/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('comments.user', 'name profileImage');
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        res.json(blog.comments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments', error });
    }
});

module.exports = router;
