import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file to approximately 1MB or less
 * @param {File} imageFile - The image file to compress
 * @returns {Promise<File>} - The compressed image file
 */
export const compressImage = async (imageFile) => {
  const options = {
    maxSizeMB: 1, // maximum file size in MB
    maxWidthOrHeight: 1920, // maximum width or height
    useWebWorker: true, // use web worker for better performance
    fileType: imageFile.type, // preserve original file type
  };

  try {
    const compressedFile = await imageCompression(imageFile, options);
    
    //log compression results for debugging
    console.log('Original file size:', (imageFile.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('Compression ratio:', ((1 - compressedFile.size / imageFile.size) * 100).toFixed(2), '%');
    
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
};

export default compressImage;