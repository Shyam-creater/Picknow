import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { Edit, Delete, Add, Search } from '@mui/icons-material';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { createBlog, getAllBlogs, updateBlog, deleteBlog } from '../api/blogApi';

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    canonicalUrl: '',
    metaKeywords: '',
    metaTitle: '',
    metaDescription: '',
    image: null,
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const data = await getAllBlogs();
      setBlogs(data.blogs || data || []);
    } catch (error) {
      toast.error(error.message || 'Error fetching blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.name === 'image') {
      const file = e.target.files[0];
      if (file) {
        setFormData({ ...formData, image: file });
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
      }
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleOpen = (blog = null) => {
    if (blog) {
      setFormData({
        title: blog.title,
        description: blog.description,
        canonicalUrl: blog.canonicalUrl,
        metaKeywords: blog.metaKeywords || '',
        metaTitle: blog.metaTitle || '',
        metaDescription: blog.metaDescription || '',
        image: null,
      });
      setPreviewUrl(blog.image);
      setSelectedBlog(blog);
    } else {
      setFormData({
        title: '',
        description: '',
        canonicalUrl: '',
        metaKeywords: '',
        metaTitle: '',
        metaDescription: '',
        image: null,
      });
      setPreviewUrl('');
      setSelectedBlog(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      title: '',
      description: '',
      canonicalUrl: '',
      metaKeywords: '',
      metaTitle: '',
      metaDescription: '',
      image: null,
    });
    setPreviewUrl('');
    setSelectedBlog(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.canonicalUrl) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedBlog && !formData.image) {
      toast.error('Please upload an image');
      return;
    }

    try {
      setIsUploading(true);
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('canonicalUrl', formData.canonicalUrl);
      formDataToSend.append('metaKeywords', formData.metaKeywords);
      formDataToSend.append('metaTitle', formData.metaTitle);
      formDataToSend.append('metaDescription', formData.metaDescription);

      if (formData.image && formData.image instanceof File) {
        formDataToSend.append('image', formData.image);
      }

      if (selectedBlog) {
        const response = await updateBlog(selectedBlog._id, formDataToSend);
        toast.success(response.message || 'Blog updated successfully');
      } else {
        const response = await createBlog(formDataToSend);
        toast.success(response.message || 'Blog created successfully');
      }

      handleClose();
      await fetchBlogs();
    } catch (error) {
      toast.error(error.message || 'Error saving blog');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteClick = (blog) => {
    setSelectedBlog(blog);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteBlog(selectedBlog._id);
      toast.success(response.message || 'Blog deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedBlog(null);
      fetchBlogs();
    } catch (error) {
      toast.error(error.message || 'Error deleting blog');
    }
  };

  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Blog Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Add Blog
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Search blogs..."
        variant="outlined"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Canonical URL</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredBlogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No blogs found
                </TableCell>
              </TableRow>
            ) : (
              filteredBlogs.map((blog) => (
                <TableRow key={blog._id}>
                  <TableCell>
                    {blog.image && (
                      <img
                        src={blog.image}
                        alt={blog.title}
                        style={{ width: 80, height: 80, borderRadius: 4, objectFit: 'cover' }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{blog.title}</TableCell>
                  <TableCell sx={{ maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div dangerouslySetInnerHTML={{ __html: blog.description }} />
                  </TableCell>
                  <TableCell>{blog.canonicalUrl}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpen(blog)} color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteClick(blog)} color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Modal */}
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            maxHeight: '90vh',
            overflow: 'auto',
          }}
        >
          <Typography variant="h6" mb={2}>
            {selectedBlog ? 'Edit Blog' : 'Create Blog'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Title" name="title" value={formData.title} onChange={handleInputChange} margin="normal" required />

            <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2, mb: 1 }}>
              Description
            </Typography>
            <ReactQuill
              theme="snow"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Write your blog content here..."
            />

            <TextField
              fullWidth
              label="Canonical URL"
              name="canonicalUrl"
              value={formData.canonicalUrl}
              onChange={handleInputChange}
              margin="normal"
              required
              placeholder="https://example.com/blog/title"
            />
            <TextField fullWidth label="Meta Keywords" name="metaKeywords" value={formData.metaKeywords} onChange={handleInputChange} margin="normal" />
            <TextField fullWidth label="Meta Title" name="metaTitle" value={formData.metaTitle} onChange={handleInputChange} margin="normal" />
            <TextField fullWidth label="Meta Description" name="metaDescription" value={formData.metaDescription} onChange={handleInputChange} margin="normal" />

            <Box mt={2}>
              <Input type="file" name="image" onChange={handleInputChange} style={{ display: 'none' }} id="image-upload" accept="image/*" />
              <label htmlFor="image-upload">
                <Button variant="outlined" fullWidth component="span">
                  {formData.image || previewUrl ? 'Change Image' : 'Upload Image'}
                </Button>
              </label>
              {(previewUrl || formData.image) && (
                <Box mt={2} display="flex" justifyContent="center">
                  <img
                    src={previewUrl || (formData.image ? URL.createObjectURL(formData.image) : '')}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: 250, objectFit: 'contain' }}
                  />
                </Box>
              )}
            </Box>

            <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isUploading}>
                {isUploading ? 'Uploading...' : selectedBlog ? 'Update' : 'Create'}
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>Are you sure you want to delete "{selectedBlog?.title}"?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Blog;
