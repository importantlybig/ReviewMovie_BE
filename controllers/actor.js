const Actor = require('../models/actor')
const {
	sendError,
	uploadImageToCloud,
	formatActor,
} = require('../utils/helper')
const { isValidObjectId } = require('mongoose')
//const cloudinary = require('../cloud')
const cloudinary = require('cloudinary').v2

cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.CLOUD_API_KEY,
	api_secret: process.env.CLOUD_API_SECRET,
	secure: true,
})

exports.createActor = async (req, res) => {
	const { name, about, gender } = req.body
	const { file } = req

	const newActor = new Actor({ name, about, gender })
	if (file) {
		const { url, public_id } = await uploadImageToCloud(file.path)
		newActor.avatar = { url, public_id }
	}
	await newActor.save()
	res.status(201).json({ actor: formatActor(newActor) })
}

// update
// Things to consider while updating.
// No.1 - is image file is / avatar is also updating.
// No.2 - if yes then remove old image before uploading new image / avatar.

exports.updateActor = async (req, res) => {
	const { name, about, gender } = req.body
	const { file } = req
	const { actorId } = req.params

	if (!isValidObjectId(actorId)) return sendError(res, 'Invalid request!')

	const actor = await Actor.findById(actorId)
	if (!actor) return sendError(res, 'Invalid request, record not found!')

	const public_id = actor.avatar?.public_id

	// remove old image if there was one!
	if (public_id && file) {
		const { result } = await cloudinary.uploader.destroy(public_id)
		if (result !== 'ok') {
			return sendError(res, 'Could not remove image from cloud!')
		}
	}

	// upload new avatar if there is one!
	if (file) {
		const { url, public_id } = await uploadImageToCloud(file.path)
		actor.avatar = { url, public_id }
	}

	actor.name = name
	actor.about = about
	actor.gender = gender

	await actor.save()

	res.status(201).json({ actor: formatActor(actor) })
}

exports.removeActor = async (req, res) => {
	const { actorId } = req.params

	if (!isValidObjectId(actorId)) return sendError(res, 'Invalid request!')

	const actor = await Actor.findById(actorId)
	if (!actor) return sendError(res, 'Invalid request, record not found!')

	const public_id = actor.avatar?.public_id

	// remove old image if there was one!
	if (public_id) {
		const { result } = await cloudinary.uploader.destroy(public_id)
		if (result !== 'ok') {
			return sendError(res, 'Could not remove image from cloud!')
		}
	}

	await Actor.findByIdAndDelete(actorId)

	res.json({ message: 'Actor removed successfully.' })
}

exports.searchActor = async (req, res) => {
	const { name } = req.query
	// const result = await Actor.find({ $text: { $search: `"${query.name}"` } });
	if (!name.trim()) return sendError(res, 'Invalid request!')
	const result = await Actor.find({
		name: { $regex: name, $options: 'i' },
	})

	const actors = result.map((actor) => formatActor(actor))
	res.json({ results: actors })
}

exports.getLatestActors = async (req, res) => {
	const result = await Actor.find().sort({ createdAt: '-1' }).limit(12)

	const actors = result.map((actor) => formatActor(actor))

	res.json(actors)
}

exports.getSingleActor = async (req, res) => {
	const { id } = req.params

	if (!isValidObjectId(id)) return sendError(res, 'Invalid request!')

	const actor = await Actor.findById(id)
	if (!actor) return sendError(res, 'Invalid request, Actor not found!', 404)
	res.json({ actor: formatActor(actor) })
}

exports.getActors = async (req, res) => {
	const { pageNo, limit } = req.query

	const actors = await Actor.find({})
		.sort({ createdAt: -1 })
		.skip(parseInt(pageNo) * parseInt(limit))
		.limit(parseInt(limit))

	const profiles = actors.map((actor) => formatActor(actor))
	res.json({
		profiles,
	})
}

// const Actor = require('../models/actor')
// const cloudinary = require('cloudinary').v2

// const { isValidObjectId } = require('mongoose')
// const { sendError } = require('../utils/helper')

// cloudinary.config({
// 	cloud_name: process.env.CLOUD_NAME,
// 	api_key: process.env.CLOUD_API_KEY,
// 	api_secret: process.env.CLOUD_API_SECRET,
// 	secure: true,
// })

// exports.createActor = async (req, res) => {
// 	//console.log(req.body)
// 	const { name, about, gender } = req.body
// 	const { file } = req
// 	//console.log(file)
// 	const newActor = new Actor({ name, about, gender })

// 	if (file) {
// 		const { secure_url, public_id } = await cloudinary.uploader.upload(
// 			file.path,
// 			{ gravity: 'face', height: 500, width: 500, crop: 'thumb' }
// 		)
// 		newActor.avatar = { url: secure_url, public_id }
// 	}

// 	await newActor.save()

// 	res.status(201).json({
// 		actor: {
// 			id: newActor._id,
// 			name,
// 			about,
// 			gender,
// 			avatar: newActor.avatar?.url,
// 		},
// 	})
// }

// exports.updateActor = async (req, res) => {
// 	const { name, about, gender } = req.body
// 	const { file } = req
// 	const { actorId } = req.params

// 	if (!isValidObjectId(actorId)) return sendError(res, 'Invalid request!')
// 	const actor = await Actor.findById(actorId)
// 	if (!actor) return sendError(res, 'Invalid request. Record not found!')

// 	const public_id = actor.avatar?.public_id

// 	//Remove old image if there was one!
// 	if (public_id && file) {
// 		const { result } = await cloudinary.uploader.destroy(public_id)
// 		if (result !== 'ok') {
// 			return sendError(res, 'Could not remove image!')
// 		}
// 	}

// 	//Update new image if there is one!
// 	if (file) {
// 		const { secure_url, public_id } = await cloudinary.uploader.upload(
// 			file.path
// 		)
// 		actor.avatar = { url: secure_url, public_id }
// 	}

// 	actor.name = name
// 	actor.about = about
// 	actor.gender = gender

// 	await actor.save()

// 	res.status(201).json({
// 		id: actor._id,
// 		name,
// 		about,
// 		gender,
// 		avatar: actor.avatar?.url,
// 	})
// }

// exports.removeActor = async (req, res) => {
// 	const { actorId } = req.params

// 	if (!isValidObjectId(actorId)) return sendError(res, 'Invalid request!')
// 	const actor = await Actor.findById(actorId)
// 	if (!actor) return sendError(res, 'Invalid request. Record not found!')

// 	const public_id = actor.avatar?.public_id

// 	//Remove old image if there was one!
// 	if (public_id) {
// 		const { result } = await cloudinary.uploader.destroy(public_id)
// 		if (result !== 'ok') {
// 			return sendError(res, 'Could not remove image!')
// 		}
// 	}

// 	await Actor.findByIdAndDelete(actorId)

// 	res.json({ message: 'Actor has been removed successfully' })
// }

// exports.searchActor = async (req, res) => {
// 	const { query } = req
// 	//query.name
// 	const result = await Actor.find({ $text: { $search: `"${query.name}"` } })

// 	res.json(result)
// }

// exports.getLatestActor = async (req, res) => {
// 	const result = await Actor.find().sort({ createdAt: '-1' }).limit(12)
// 	res.json(result)
// }

// exports.getSingleActor = async (req, res) => {
// 	const { id } = req.params

// 	if (!isValidObjectId(id)) return sendError(res, 'Invalid request!')

// 	const actor = await Actor.findById(id)
// 	if (!actor) return sendError(res, 'Invalid request. Actor not found!', 404)

// 	res.json(actor)
// }
