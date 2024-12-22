const postRepository = require('../repositories/postRepository');

const getAllPosts = async () => {
  return await postRepository.getAllPosts();
};

const getPostById = async (id) => {
  return await postRepository.getPostById(id);
};

const createPost = async (post) => {
  return await postRepository.createPost(post);
};

const updatePost = async (id, post) => {
  return await postRepository.updatePost(id, post);
};

const deletePost = async (id) => {
  return await postRepository.deletePost(id);
};

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
};
