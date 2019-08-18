const multer = require('multer');
const path = require('path');
const cuid = require('cuid');

const upload = multer({
  fileFilter: (req, file, next) => {
    if (file.mimetype.split('/')[0] === 'image') {
      next(null, `${cuid()}.${file.mimetype.split('/')[1]}`);
    } else {
      next({}, false);
    }
  },
  storage: multer.diskStorage({
    destination: (req, res, next) => {
      next(null, path.join(__dirname, `../public/img/${req.route.path.split('/')[1]}`));
    },
    filename: (req, file, next) => {
      const extension = file.mimetype.split('/')[1];
      next(null, `${cuid()}.${extension}`);
    },
  }),
}).single('image');

module.exports = upload;
