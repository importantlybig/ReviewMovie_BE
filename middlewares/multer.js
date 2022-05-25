//store media file inside the local or the cloud
const multer = require('multer')
const storage = multer.diskStorage({})

const imageFileFilter = (req, file, cb) => {
	//console.log(file)
	if (!file.mimetype.startsWith('image')) {
		cb('Supported only image files!', false)
	}
	cb(null, true)
}

const videoFileFilter = (req, file, cb) => {
	//console.log(file)
	if (!file.mimetype.startsWith('video')) {
		cb('Supported only Video files!', false)
	}
	cb(null, true)
}

exports.uploadImage = multer({ storage, fileFilter: imageFileFilter })
exports.uploadVideo = multer({ storage, fileFilter: videoFileFilter })
