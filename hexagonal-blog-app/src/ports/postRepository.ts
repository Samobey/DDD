// src/ports/postRepository.ts
import { Post } from "../domain/post";

export interface PostRepository {
  save(post: Post): Promise<Post>;
  findById(id: string): Promise<Post | null>;
  findAll(): Promise<Post[]>;
  update(id: string, post: Post): Promise<Post | null>;
  delete(id: string): Promise<void>;
}
