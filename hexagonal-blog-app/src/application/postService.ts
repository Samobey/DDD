import { PostRepository } from "../ports/postRepository";
import { Post } from "../domain/post";

export class PostService {
  constructor(private postRepository: PostRepository) {}

  async createPost(post: Post): Promise<Post> {
    return await this.postRepository.save(post);
  }

  async getPostById(id: string): Promise<Post | null> {
    return await this.postRepository.findById(id);
  }

  async getAllPosts(): Promise<Post[]> {
    return await this.postRepository.findAll();
  }

  async updatePost(id: string, post: Post): Promise<Post | null> {
    return await this.postRepository.update(id, post);
  }

  async deletePost(id: string): Promise<void> {
    return await this.postRepository.delete(id);
  }
}
