import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  // get data and check
  // check video exist or not
  // fetch comment from db
  // send response

  try {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if (!videoId) {
      throw new ApiError(400, "Video id is required");
    }
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid VideoId");
    }

    const comments = Comment.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                username: 1,
                fullName: 1,
                email: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: {
            $first: "$owner",
          },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);
    const options = {
      page,
      limit,
    };
    const commentPaginate = await Comment.aggregatePaginate(comments, options);
    const response = {
      comments: commentPaginate.docs,
      page: commentPaginate.page,
      totalPage: commentPaginate.totalPages,
    };
    return res
      .status(200)
      .json(new ApiResponse(200, response, "Comments fetched successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, error?.message || "Something went wrong!");
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  // get comment data
  // verify data
  // insert data into db
  // return response
  try {
    const { videoId } = req.params;
    const { content } = req.body;
    if (!(content && videoId)) {
      throw new ApiError(400, "Content and video id are required");
    }
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid VideoId");
    }

    const comment = await Comment.create({
      content,
      videoId,
      owner: req.user._id,
    });
    const addedComment = await Comment.findById(comment._id);
    if (!addedComment) {
      throw new ApiError(500, "Something went wrong when create comment!");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, addedComment, "Comment added successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, error?.message || "Something went wrong!");
  }
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!(content && commentId)) {
      throw new ApiError(400, "Content and comment id are required");
    }
    if (!isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid comment id");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        content,
      },
      { new: true }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, error?.message || "Something went wrong!");
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  try {
    const { commentId } = req.params;
    if (!commentId) {
      throw new ApiError(400, "Comment id is required");
    }
    if (!isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid comment id");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    return res
      .status(200)
      .json(
        new ApiResponse(200, deletedComment, "Comment deleted successfully")
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, error?.message || "Something went wrong!");
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };
