const multer = require('multer');
const path = require('path');
const cuid = require('cuid');

const uploadConfig = (fileType, pathName, target) => (req, res, next) => {
  req.upload = {
    fileType,
    path: pathName,
    target,
  };
  next();
};

const upload = multer({
  fileFilter: (req, file, next) => {
    if (file.mimetype.split('/')[0] === req.upload.fileType) {
      next(null, `${cuid()}.${file.mimetype.split('/')[1]}`);
    } else {
      next({}, false);
    }
  },
  storage: multer.diskStorage({
    destination: (req, res, next) => {
      next(null, path.join(__dirname, `../../public/${req.upload.target}/${req.upload.path}`));
    },
    filename: (req, file, next) => {
      const extension = file.mimetype.split('/')[1];
      next(null, `${cuid()}.${extension}`);
    },
  }),
}).single('file');

const uploadExcel = multer({
  fileFilter: (req, file, next) => {
    next(null, `${cuid()}.xlsx`);
  },
  storage: multer.diskStorage({
    destination: (req, res, next) => {
      next(null, path.join(__dirname, `../../public/${req.upload.target}/${req.upload.path}`));
    },
    filename: (req, file, next) => {
      next(null, `${cuid()}.xlsx`);
    },
  }),
}).single('file');


const uploadBag = multer({
  fileFilter: (req, file, next) => {
    if (file.mimetype.split('/')[0] === req.upload.fileType) {
      next(null, `${cuid()}.${file.mimetype.split('/')[1]}`);
    } else {
      next({}, false);
    }
  },
  storage: multer.diskStorage({
    destination: (req, res, next) => {
      next(null, path.join(__dirname, `../../public/${req.upload.target}/${req.upload.path}`));
    },
    filename: (req, file, next) => {
      const extension = file.mimetype.split('/')[1];
      next(null, `${cuid()}.${extension}`);
    },
  }),
});

module.exports = {
  uploadConfig,
  upload,
  uploadExcel,
  uploadBag,
};
