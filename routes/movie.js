const express = require('express')
const {
	uploadTrailer,
	createMovie,
	removeMovie,
	getMovies,
	getMovieForUpdate,
	updateMovie,
	searchMovies,
	//user
	getLatestUploads,
	getSingleMovie,
	getRelatedMovies,
	getTopRatedMovies,
	searchPublicMovies,
} = require('../controllers/movie')
const { isAuth, isAdmin } = require('../middlewares/auth')
const { parseData } = require('../middlewares/helper')
const { uploadVideo, uploadImage } = require('../middlewares/multer')
const {
	validateMovie,
	validateTrailer,
	validate,
} = require('../middlewares/validator')

const router = express.Router()

router.post(
	'/upload-trailer',
	isAuth,
	isAdmin,
	uploadVideo.single('video'),
	uploadTrailer
)

router.post(
	'/create',
	isAuth,
	isAdmin,
	uploadImage.single('poster'),
	parseData,
	validateMovie,
	validateTrailer,
	validate,
	createMovie
)

//update sthing
// router.patch(
// 	'/update-movie-without-poster/:movieId',
// 	isAuth,
// 	isAdmin,
// 	parseData,
// 	validateMovie,
// 	validate,
// 	updateMovieWithoutPoster
// )

router.patch(
	'/update/:movieId',
	isAuth,
	isAdmin,
	uploadImage.single('poster'),
	parseData,
	validateMovie,
	validate,
	updateMovie
)

router.delete('/delete/:movieId', isAuth, isAdmin, removeMovie)
router.get('/movies', isAuth, isAdmin, getMovies)
router.get('/for-update/:movieId', isAuth, isAdmin, getMovieForUpdate)
router.get('/search', isAuth, isAdmin, searchMovies)

// for normal users
router.get('/latest-uploads', getLatestUploads)
router.get('/single/:movieId', getSingleMovie)
router.get('/related/:movieId', getRelatedMovies)
router.get('/top-rated', getTopRatedMovies)
router.get('/search-public', searchPublicMovies)

module.exports = router
