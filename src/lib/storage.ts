import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  type StorageReference,
  type UploadResult
} from 'firebase/storage';
import { storage } from './firebase';

export interface UploadOptions {
  path?: string;
  fileName?: string;
  metadata?: {
    contentType?: string;
    customMetadata?: Record<string, string>;
  };
}

export interface FileInfo {
  name: string;
  url: string;
  size?: number;
  contentType?: string;
  createdAt?: Date;
}

export class StorageService {
  private basePath: string;

  constructor(basePath: string = 'uploads') {
    this.basePath = basePath;
  }

  /**
   * Upload a file to storage
   */
  async uploadFile(
    file: File, 
    options: UploadOptions = {}
  ): Promise<FileInfo> {
    try {
      const { path = '', fileName, metadata } = options;
      
      // Generate unique filename if not provided
      const uniqueFileName = fileName || `${Date.now()}_${file.name}`;
      const fullPath = `${this.basePath}/${path}/${uniqueFileName}`;
      
      const storageRef = ref(storage, fullPath);
      
      // Upload file with metadata
      const uploadResult: UploadResult = await uploadBytes(storageRef, file, {
        contentType: file.type,
        ...metadata
      });
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      return {
        name: uniqueFileName,
        url: downloadURL,
        size: file.size,
        contentType: file.type,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: File[], 
    options: UploadOptions = {}
  ): Promise<FileInfo[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Get download URL for a file
   */
  async getDownloadURL(filePath: string): Promise<string> {
    try {
      const storageRef = ref(storage, filePath);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw new Error('Failed to get download URL');
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * List all files in a directory
   */
  async listFiles(directoryPath: string = ''): Promise<FileInfo[]> {
    try {
      const fullPath = `${this.basePath}/${directoryPath}`;
      const storageRef = ref(storage, fullPath);
      const result = await listAll(storageRef);
      
      const filePromises = result.items.map(async (item) => {
        const url = await getDownloadURL(item.fullPath);
        return {
          name: item.name,
          url,
          createdAt: new Date() // Note: Firebase doesn't provide creation time in listAll
        };
      });
      
      return Promise.all(filePromises);
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to list files');
    }
  }

  /**
   * Upload image with automatic optimization
   */
  async uploadImage(
    file: File, 
    options: UploadOptions & { 
      maxWidth?: number; 
      maxHeight?: number; 
      quality?: number; 
    } = {}
  ): Promise<FileInfo> {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // For now, we'll upload as-is
    // In a real implementation, you might want to compress/resize the image
    return this.uploadFile(file, {
      ...options,
      metadata: {
        contentType: file.type,
        customMetadata: {
          type: 'image',
          originalName: file.name,
          ...options.metadata?.customMetadata
        },
        ...options.metadata
      }
    });
  }

  /**
   * Upload document files
   */
  async uploadDocument(
    file: File, 
    options: UploadOptions = {}
  ): Promise<FileInfo> {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid document type. Only PDF, DOC, DOCX, and TXT files are allowed.');
    }

    return this.uploadFile(file, {
      ...options,
      metadata: {
        contentType: file.type,
        customMetadata: {
          type: 'document',
          originalName: file.name,
          ...options.metadata?.customMetadata
        },
        ...options.metadata
      }
    });
  }
}

// Create service instances for different use cases
export const imageStorage = new StorageService('images');
export const documentStorage = new StorageService('documents');
export const avatarStorage = new StorageService('avatars');
export const eventStorage = new StorageService('events');

// Default storage service
export const storageService = new StorageService(); 