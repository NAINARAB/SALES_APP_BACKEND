import express from 'express'
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors'
import { createRequire } from 'module';
import SfRouter from './routes/routes.mjs';

const require = createRequire(import.meta.url);
require('dotenv').config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use(SfRouter)


const productsStaticPath = path.join(__dirname, 'uploads', 'products');
app.use('/imageURL/products', express.static(productsStaticPath));

const retailersStaticPath = path.join(__dirname, 'uploads', 'retailers');
app.use('/imageURL/retailers', express.static(retailersStaticPath));

const attendanceStaticPath = path.join(__dirname, 'uploads', 'attendance');
app.use('/imageURL/attendance', express.static(attendanceStaticPath));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
