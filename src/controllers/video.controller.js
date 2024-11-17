import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  destroyOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  //TODO: get all videos based on query, sort, pagination
  // get query data from request
  // user and req is valid or not
  // check data is correct
  // validation
  // find data from db base on query
  // sort data
  // add pagination
  // create result
  // check  result data is correct
  // return response

  try {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    if (!(query || isValidObjectId(userId))) {
      throw new ApiError(400, "Invalid request or not valid data!");
    }
    // const user = await User.findById(userId);
    // if (!user) {
    //   throw new ApiError(400, "Not valid user or user not exists!");
    // }
    const videos = Video.aggregate([
      {
        $match: {
          $or: [
            {
              title: { $regex: query, $options: "i" },
            },
            {
              description: { $regex: query, $options: "i" },
            },
            {
              owner: new mongoose.Types.ObjectId(userId),
            },
            // {
            //   $expr: {
            //     $cond: {
            //       if: { $ne: [user, null] },
            //       then: {
            //         owner: new mongoose.Types.ObjectId(userId),
            //       },
            //       else: false,
            //     },
            //   },
            // },
          ],
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
            $first: "$owner", // otherwise: $arrayElemAt: ["$owner", 0]
          },
        },
      },
      {
        $sort: { [sortBy]: sortType?.toLowerCase() === "dsc" ? -1 : 1 },
      },
    ]);
    const options = {
      page,
      limit,
    };
    const videoPaginate = await Video.aggregatePaginate(videos, options);
    const response = {
      videos: videoPaginate.docs,
      page: videoPaginate.page,
      totalPage: videoPaginate.totalPages,
    };
    return res
      .status(200)
      .json(new ApiResponse(200, response, "Videos fetched successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, error?.message || "Something went wrong!");
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  // TODO: get video, upload to cloudinary, create video
  // get video data
  // check data is correct
  // if data correct then upload to cloudinary
  // check video uploaded successfully
  // create video
  // store into db
  // check it and create response
  // send responses

  try {
    const { title, description } = req.body;
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    if (!(videoLocalPath || thumbnailLocalPath)) {
      throw new ApiError(400, "Video file and thumbnail are required!");
    }
    if (!(title && description)) {
      throw new ApiError(400, "Title and description are required!");
    }

    const cloudVideo = await uploadOnCloudinary(videoLocalPath);
    const cloudThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!(cloudVideo || cloudThumbnail)) {
      throw new ApiError(400, "Video file and thumbnail are required!!");
    }

    const video = await Video.create({
      videoFile: cloudVideo.url,
      thumbnail: cloudThumbnail.url,
      title,
      description,
      duration: cloudVideo.duration,
      isPublished: true,
      owner: req?.user?._id,
    });

    const publishedVideo = await Video.findById(video._id);

    if (!publishedVideo) {
      throw new ApiError(500, "Something went wrong while publishing a video!");
    }

    return res
      .status(201)
      .json(
        new ApiResponse(200, publishedVideo, "Video published successfully")
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      error.message || "Something went wrong while publishing a video!!"
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  //TODO: get video by id
  try {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video id");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(400, "Video not found!");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video fetched successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong when fetching video by id!"
    );
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  // get data and check
  // check video are exists or not
  // check user is video owner
  // if update thumbnail then upload to cloud
  // delete old video and thumbnail
  // update db
  // return res

  try {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video id");
    }
    if (!(title || description || thumbnailLocalPath)) {
      throw new ApiError(400, "Title, description or thumbnail are required");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(400, "Video not found");
    }
    console.log("video.owner", video.owner);
    if (!video?.owner?.equals(req.user?._id)) {
      throw new ApiError(400, "You are not able to perform this action");
    }

    let newThumbnail;
    if (thumbnailLocalPath) {
      newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
      // delete old thumbnail
      await destroyOnCloudinary(video?.thumbnail);
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      video._id,
      {
        $set: {
          title: title || video?.title,
          description: description || video?.description,
          thumbnail: newThumbnail || video?.thumbnail,
        },
      },
      {
        new: true,
      }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong when update video!"
    );
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  // get data
  // check data
  // check video and owner
  // delete video on db
  // delete video and thumbnail on cloud
  // return res

  try {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video id");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(400, "Video not found");
    }
    console.log("video.owner", video.owner);
    if (!video?.owner?.equals(req.user?._id)) {
      throw new ApiError(400, "You are not able to perform this action");
    }
    const deletedVideo = await Video.deleteOne({ _id: video._id });
    console.log("deletedVideo", deletedVideo);
    if (deletedVideo) {
      // delete thumbnail and video
      await destroyOnCloudinary(video.thumbnail);
      await destroyOnCloudinary(video.videoFile);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong when delete video"
    );
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video id");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(400, "Video not found");
    }
    if (!video?.owner?.equals(req.user?._id)) {
      throw new ApiError(400, "You are not able to perform this action");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      video._id,
      {
        $set: {
          isPublished: !video.isPublished,
        },
      },
      {
        new: true,
      }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedVideo,
          `Video is ${updatedVideo.isPublished ? "now published" : "unpublished"} successfully `
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong when toggle publish!"
    );
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
