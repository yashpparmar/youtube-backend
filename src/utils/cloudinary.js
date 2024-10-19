import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadOnCloudinary = async (localFilePath) => {
  // Configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    if (!localFilePath) return null;
    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfully
    console.log("file uploaded on cloudinary", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error(error);
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as upload operation failed
    return null;
  }
};

const destroyOnCloudinary = async (publicUrl) => {
  // Configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    if (!publicUrl.trim()) return null;
    const public_id = publicUrl?.split("/").pop().split(".")[0];
    // destroy the file on cloudinary
    const response = await cloudinary.uploader.destroy(public_id, {
      resource_type: "image",
    });
    // file has been destroyed successfully
    console.log("file deleted on cloudinary", response?.result);
    return response;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export { uploadOnCloudinary, destroyOnCloudinary };

// (async function () {
//   // Upload an image
//   const uploadResult = await cloudinary.uploader
//     .upload(
//       "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
//       {
//         public_id: "shoes",
//       }
//     )
//     .catch((error) => {
//       console.log(error);
//     });

//   console.log(uploadResult);

//   // Optimize delivery by resizing and applying auto-format and auto-quality
//   const optimizeUrl = cloudinary.url("shoes", {
//     fetch_format: "auto",
//     quality: "auto",
//   });

//   console.log(optimizeUrl);

//   // Transform the image: auto-crop to square aspect_ratio
//   const autoCropUrl = cloudinary.url("shoes", {
//     crop: "auto",
//     gravity: "auto",
//     width: 500,
//     height: 500,
//   });

//   console.log(autoCropUrl);
// })();
