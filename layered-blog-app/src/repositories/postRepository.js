const Post = require('../models/postModel');

const getAllPosts = async () => {
  return await Post.find({});
};

const getPostById = async (id) => {
  return await Post.findById(id);
};

const createPost = async (post) => {
  return await Post.create(post);
};

const updatePost = async (id, post) => {
  return await Post.findByIdAndUpdate(id, post, { new: true });
};

const deletePost = async (id) => {
  return await Post.findByIdAndDelete(id);
};

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
};
