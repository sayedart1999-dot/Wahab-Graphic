export const uploadToCloudinary = async (file: File | string): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'db3l0belh';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'wahab-graphic';

  if (!cloudName || !uploadPreset) {
    console.error('Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in settings.');
    // Fallback to local URL if in development and config is missing to prevent total failure
    if (typeof file === 'string' && file.startsWith('blob:')) return file;
    throw new Error('Cloudinary configuration missing');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  const data = await response.json();
  return data.secure_url;
};

export const uploadMultipleToCloudinary = async (files: (File | string)[]): Promise<string[]> => {
  return Promise.all(files.map(file => uploadToCloudinary(file)));
};
