const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = '/tmp/uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

app.use('/uploads', express.static('/tmp/uploads'));

const DATA_FILE = '/tmp/data.json';

const readData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            books: [],
            videos: [],
            featured: [],
            newsletter: []
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
};

const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

const AUTH = {
    username: 'admin',
    password: 'eixofilosofico2026'
};

const authenticate = (req, res, next) => {
    const { username, password } = req.headers;
    if (username === AUTH.username && password === AUTH.password) {
        next();
    } else {
        res.status(401).json({ error: 'Não autorizado' });
    }
};

app.get('/api/books', (req, res) => {
    const data = readData();
    res.json(data.books);
});

app.get('/api/featured', (req, res) => {
    const data = readData();
    res.json(data.featured);
});

app.get('/api/videos', (req, res) => {
    const data = readData();
    res.json(data.videos);
});

app.post('/api/newsletter', (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Email inválido' });
    }
    
    const data = readData();
    if (data.newsletter.includes(email)) {
        return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    data.newsletter.push(email);
    writeData(data);
    res.json({ success: true, message: 'Inscrito com sucesso!' });
});

app.post('/api/admin/books', authenticate, upload.single('cover'), (req, res) => {
    const { title, author, description, amazonLink, featured } = req.body;
    const coverUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    const data = readData();
    const newBook = {
        id: Date.now().toString(),
        title,
        author,
        description,
        amazonLink,
        coverUrl,
        featured: featured === 'true'
    };
    
    data.books.push(newBook);
    
    if (newBook.featured) {
        data.featured.push(newBook);
        if (data.featured.length > 5) data.featured.shift();
    }
    
    writeData(data);
    res.json(newBook);
});

app.put('/api/admin/books/:id', authenticate, upload.sin
