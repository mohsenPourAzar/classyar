import {loadEnvFile} from 'node:process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
try{loadEnvFile(path.join(root,'.env'));}catch(error){if(error.code!=='ENOENT')throw new Error('Unable to read .env configuration.');}
export const config={
  uri:process.env.MONGODB_URI||'mongodb://127.0.0.1:27017',
  database:process.env.MONGODB_DB||'classyar',
  port:Number(process.env.PORT||4173)
};
