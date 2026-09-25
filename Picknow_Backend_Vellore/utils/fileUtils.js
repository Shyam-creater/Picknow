import fs from 'fs';
import path from 'path';

export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

export const deleteFiles = (filePaths) => {
  if (!Array.isArray(filePaths)) return false;
  
  let success = true;
  filePaths.forEach(filePath => {
    if (!deleteFile(filePath)) {
      success = false;
    }
  });
  return success;
};

export const getFullPath = (relativePath) => {
  const __dirname = path.resolve();
  return path.join(__dirname, relativePath);
}; 