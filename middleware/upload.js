// Multer middleware for resume file uploads (PDF/Word, max 5 MB, up to 10 files)
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    // Prefix filename with timestamp to avoid collisions
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Reject files that are not PDF or Word documents
const fileFilter = (req, file, cb) => {
    const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and Word documents are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

module.exports = upload.array('resumes', 10);
