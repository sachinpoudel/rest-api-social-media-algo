import fs from 'fs/promises'
import { Env } from '../configs/env-config';

export const deleteFile = async(filePath: string)  => {
  try {
    const stat = await fs.stat(filePath);
    
    if (Env.NODE_ENV === 'development') {
      console.log('File exists: ', true);
      console.log(stat);
    }

    await fs.unlink(filePath);
    
    if (Env.NODE_ENV === 'development') {
      console.log('File deleted successfully');
    }
  } catch (err:any) {
  if (err.code === 'ENOENT') {
      if (Env.NODE_ENV === 'development') {
        console.log('File already deleted or does not exist:', filePath);
      }
      return;
    }

    if (Env.NODE_ENV === 'development') {
      console.error('Error deleting file: ', err);
    }
  }
}