// src/adapters/controllers/postController.ts
import express, { Request, Response, NextFunction } from "express";
import { PostService } from "../../application/postService";
import { PostRepositoryMongo } from "../repositories/postRepositoryMongo";

const router = express.Router();
const postRepository = new PostRepositoryMongo();
const postService = new PostService(postRepository);

router.post(
  "/posts",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await postService.createPost(req.body);
      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/posts/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await postService.getPostById(req.params.id);
      res.json(post);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/posts",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const posts = await postService.getAllPosts();
      res.json(posts);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/posts/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await postService.updatePost(req.params.id, req.body);
      res.json(post);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/posts/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await postService.deletePost(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
