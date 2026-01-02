import multer from "multer";
import { Request } from "express";
import { request } from "http";
import { Env } from "../../configs/env-config";
import getImageExtension from "../../utils/get-img-extension";

interface DestinationCb {
  (error: Error | null, destination: string): void;
}
interface FileNameCb {
  (error: Error | null, filename: string): void;
}

export const fileStorage = multer.diskStorage({
  // destination
  // filename

  destination: (
    request: Request,
    file: Express.Multer.File,
    cb: DestinationCb
  ): void => {
    const fileName = request.originalUrl.split('/').includes("users") ? 'users' : request.originalUrl.split('/').includes("posts") ? 'posts' : 'others';
    cb(null, `${Env.PWD}/public/uploads/${fileName}`);
  },
  filename: (
    request:Request, file: Express.Multer.File, cb: FileNameCb
  ) => {
    if(Env.NODE_ENV === 'development') {
        console.log('File being uploaded: ', file);
    }

    const imageExt = getImageExtension(file.mimetype);

    if(!imageExt) {
        return cb(new Error("Invalid image file type"), null as any);
    }
    cb(null, `${Date.now()}-${file.originalname}`);


  }
});


export const uploadImg = multer({
    storage: fileStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    }
});

export const customMulterConfig = multer({
  storage: multer.diskStorage({}),
  limits: {
    fileSize: 1024 * 1024 * 10 // accept files up 10 mgb
  },
  fileFilter: (request: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
    if (!getImageExtension(file.mimetype)) {
      // @ts-ignore
        callback(new Error("Only image files are allowed!"));
      return;
    }
    callback(null, true);
  }
});
export default {uploadImg};