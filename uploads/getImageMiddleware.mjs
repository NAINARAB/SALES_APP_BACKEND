import path from "path";
import fs from 'fs'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
require('dotenv').config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const domain = process.env.domain


const getImage = (folder, image) => {
    const defaultImageUrl = domain + '/imageURL/products/imageNotFound.jpg';
    const imageUrl = domain + '/imageURL/' + folder + image;
    const imagePath = path.join(__dirname, folder, image ? image : '');

    return fs.existsSync(imagePath) ? imageUrl : defaultImageUrl
}

export default getImage;