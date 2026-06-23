import { ImageKit } from "@imagekit/nodejs";
import envConfig from "../config/envConfig.js";

let ImageKitClient = null;

// Initialize SDK only if required configurations are present
if (envConfig.IMAGEKIT_PUBLIC_KEY && envConfig.IMAGEKIT_PRIVATE_KEY && envConfig.IMAGEKIT_URL_ENDPOINT) {
  ImageKitClient = new ImageKit({
    publicKey: envConfig.IMAGEKIT_PUBLIC_KEY,
    privateKey: envConfig.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: envConfig.IMAGEKIT_URL_ENDPOINT,
  });
}

/**
 * Uploads a file (base64, buffer, or stream) to ImageKit.io using newer SDK namespaces.
 * Falls back to local mock server if keys are not set.
 * @param {string|Buffer} file - The file representation.
 * @param {string} folder - Destination folder on ImageKit (defaults to "PustakMart/files").
 * @returns {Promise<object>} Response object from ImageKit containing the file URL.
 */
export async function uploadFile(file, folder = "PustakMart/files") {
  try {
    if (!ImageKitClient) {
      console.log("ImageKit credentials are not configured. Running mock file upload...");
      return {
        url: `https://ik.imagekit.io/cuq3fe9wm/PustakMart/mock-imagekit-upload-${Date.now()}`,
        fileId: `mock-id-${Date.now()}`,
      };
    }

    const result = await ImageKitClient.files.upload({
      file,
      fileName: "file_" + Date.now(),
      folder,
    });

    return result;
  } catch (error) {
    console.error("ImageKit upload error:", error);
    throw new Error("Failed to upload file to ImageKit");
  }
}

/**
 * Generates security parameters (signature, token, expire timestamp)
 * required for direct front-end client-side uploads.
 * @returns {object} The authentication signature parameters.
 */
export function generateImageKitAuthParams() {
  if (!ImageKitClient) {
    console.log("ImageKit SDK is not initialized. Generating mock upload parameters...");
    return {
      token: `mock-token-${Date.now()}`,
      signature: "mock-signature-hash-value",
      expire: Math.floor(Date.now() / 1000) + 3600,
    };
  }
  return ImageKitClient.helper.getAuthenticationParameters();
}
