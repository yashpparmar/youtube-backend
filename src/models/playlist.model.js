import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      default: "My Playlist",
    },
    description: {
      type: String,
    },
    videos: {
      type: [{ type: Schema.Types.ObjectId, ref: "Video" }],
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);
