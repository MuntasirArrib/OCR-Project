const express = require('express');
const app = express();
const fs = require("fs");
const { promisify } = require("util");
const readFileAsync = promisify(fs.readFile);
const multer = require('multer');
const { createWorker } = require('tesseract.js');

// Create the worker asynchronously
let worker;
(async () => {
    worker = await createWorker();
    await worker.load();
    await worker.loadLanguage('ben');
    await worker.initialize('ben');
})();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage }).single("avatar");

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("index");
});

app.post("/upload", async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Upload failed");
        }

        try {
            const data = await readFileAsync(`./uploads/${req.file.originalname}`);
            const result = await worker.recognize(data, 'eng', { tessjs_create_pdf: '1' });
            console.log(result);
            res.send(result.text);
        } catch (err) {
            console.log('This is your error', err);
            res.status(500).send("Error processing the image");
        }
    });
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`Hey I'm running on port ${PORT}`));
