import mongoose from "mongoose";
import { Post } from "../../domain/post";
import { PostRepository } from "../../ports/postRepository";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const PostModel = mongoose.model("Post", postSchema);

export class PostRepositoryMongo implements PostRepository {
  async save(post: Post): Promise<Post> {
    const postModel = new PostModel(post);
    const savedPost = await postModel.save();
    return new Post(
      savedPost._id.toString(),
      savedPost.title,
      savedPost.content,
      savedPost.author
    );
  }

  async findById(id: string): Promise<Post | null> {
    const post = await PostModel.findById(id);
    return post
      ? new Post(
          post._id.toString(),
          post.title!,
          post.content!,
          post.author!
        )
      : null;
  }

  async findAll(): Promise<Post[]> {
    const posts = await PostModel.find({});
    return posts.map(
      (post) =>
        new Post(
          post._id.toString(),
          post.title!,
          post.content!,
          post.author!
        )
    );
  }

  async update(id: string, post: Post): Promise<Post | null> {
    const updatedPost = await PostModel.findByIdAndUpdate(id, post, {
      new: true,
    });
    return updatedPost
      ? new Post(
          updatedPost._id.toString(),
          updatedPost.title!,
          updatedPost.content!,
          updatedPost.author!
        )
      : null;
  }

  async delete(id: string): Promise<void> {
    await PostModel.findByIdAndDelete(id);
  }
}
