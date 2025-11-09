// TBD: pload logic for Mutler

import multer from 'multer';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// multer for user upload profile image:
const storage = multer.diskStorage({
    // populate here, see knowledge kitchen example code
})
const upload = multer({ storage })

export default upload;