import express from 'express'
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors'
import { createRequire } from 'module';
import SfRouter from './routes/routes.mjs';
import morgan from 'morgan';
import fs from 'fs';

const require = createRequire(import.meta.url);
require('dotenv').config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const productsStaticPath = path.join(__dirname, 'uploads', 'products');
app.use('/imageURL/products', express.static(productsStaticPath));

const retailersStaticPath = path.join(__dirname, 'uploads', 'retailers');
app.use('/imageURL/retailers', express.static(retailersStaticPath));

const attendanceStaticPath = path.join(__dirname, 'uploads', 'attendance');
app.use('/imageURL/attendance', express.static(attendanceStaticPath));

const visitLogsStaticPath = path.join(__dirname, 'uploads', 'visitLogs');
app.use('/imageURL/visitedPlace', express.static(visitLogsStaticPath));

const logStream = fs.createWriteStream(path.join(__dirname, 'logs', 'access.log'), { flags: 'a' });
app.use(morgan('dev', { stream: logStream }));

app.use(SfRouter);

const reactBuildPath = path.join(__dirname, 'frontend');
app.use(express.static(reactBuildPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(reactBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 9001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
