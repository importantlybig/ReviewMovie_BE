// const mongoose = require('mongoose')

// const actorSchema = mongoose.Schema(
// 	{
// 		name: {
// 			type: String,
// 			trim: true,
// 			required: true,
// 		},
// 		about: {
// 			type: String,
// 			trim: true,
// 			required: true,
// 		},
// 		gender: {
// 			type: String,
// 			trim: true,
// 			required: true,
// 		},
// 		//store profile picture of the actor
// 		//unique id of avatar which will be stored in cloudinary
// 		avatar: {
// 			type: Object,
// 			url: String,
// 			public_id: String,
// 		},
// 	},
// 	{ timestamps: true }
// )

// actorSchema.index({ name: 'text' })

// module.exports = mongoose.model('Actor', actorSchema)
const mongoose = require('mongoose')

const actorSchema = mongoose.Schema(
	{
		name: {
			type: String,
			trim: true,
			required: true,
		},
		about: {
			type: String,
			trim: true,
			required: true,
		},
		gender: {
			type: String,
			trim: true,
			required: true,
		},
		avatar: {
			type: Object,
			url: String,
			public_id: String,
		},
	},
	{ timestamps: true }
)

actorSchema.index({ name: 'text' })

module.exports = mongoose.model('Actor', actorSchema)
