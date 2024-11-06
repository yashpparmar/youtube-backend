import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  try {
    if (!(query && isValidObjectId(userId))) {
      throw new ApiError(400, "Invalid request or not valid data!");
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(400, "Not valid user or user not exists!");
    }

    const videos = await Video.aggregate([
      {
        $match: {
          $or: [
            {
              title: { $regex: query, $options: "i" },
            },
            {
              description: { $regex: query, $options: "i" },
            },
            // {
            //   owner: { $in: [ObjectId(userId)] },
            // },
            {
              $expr: {
                $cond: {
                  if: { $ne: [userId, null] },
                  then: {
                    $in: [mongoose.Types.ObjectId(userId), "$owner"],
                  },
                  else: true,
                },
              },
            },
          ],
        },
      },
      {
        $sort: { [sortBy]: sortType?.toLowerCase() === "DEC" ? -1 : 1 },
      },
    ]);
    console.log("videos", videos);
    const options = {
      page,
      limit,
    };
    const videoPaginate = await Video.aggregatePaginate(videos, options);
    console.log("videoPage", videoPaginate);
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
    throw new ApiError(500, "Something went wrong while publishing a video!!");
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
    console.log(error);
    throw new ApiError(500, "Something went wrong when get video by id!");
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
