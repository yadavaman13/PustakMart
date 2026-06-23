import { generateImageKitAuthParams } from "../services/imagekit.service.js";
import envConfig from "../config/envConfig.js";

// Fetch ImageKit client-side auth signature parameters
export async function getImageKitAuthParamsController(req, res) {
  try {
    const authParams = generateImageKitAuthParams();
    res.status(200).json({
      success: true,
      message: "ImageKit upload parameters generated successfully",
      data: {
        ...authParams,
        publicKey: envConfig.IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: envConfig.IMAGEKIT_URL_ENDPOINT,
      },
    });
  } catch (error) {
    console.error("ImageKit auth controller error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate upload signature parameters",
    });
  }
}
