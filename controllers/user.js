const jwt = require('jsonwebtoken')
const User = require('../models/user')
const EmailVerificationToken = require('../models/emailVerificationToken')
const PasswordResetToken = require('../models/passwordResetToken')
const { isValidObjectId } = require('mongoose')
const {
	generateOTP,
	generateMailTransporter,
	sendEmail,
} = require('../utils/mail')
const { sendError, generateRandomByte } = require('../utils/helper')

exports.create = async (req, res) => {
	const { name, email, password } = req.body

	const oldUser = await User.findOne({ email })

	if (oldUser) return sendError(res, 'This email is already in use!')

	const newUser = new User({ name, email, password })
	await newUser.save()

	// generate 6 digit otp
	let OTP = generateOTP()

	// store otp inside our db
	const newEmailVerificationToken = new EmailVerificationToken({
		owner: newUser._id,
		token: OTP,
	})

	await newEmailVerificationToken.save()

	// send that otp to our user

	// var transport = generateMailTransporter()

	// transport.sendMail({
	// 	from: 'admin@movie-review-app.com',
	// 	to: newUser.email,
	// 	subject: 'Email Verification',
	// 	html: `
	// 		<p>Your verification OTP</p>
	// 		<h1>${OTP}</h1>
	// 	`,
	// })

	const htmlContent = `
			<p>Your verification OTP</p>
			<h1>${OTP}</h1>
    	`

	await sendEmail(
		newUser.name,
		newUser.email,
		'Email Verification',
		htmlContent
	)

	res.status(201).json({
		// message:
		// 	'Please verify your email. OTP has been sent to your email account!',
		user: {
			id: newUser._id,
			name: newUser.name,
			email: newUser.email,
		},
	})
}

exports.verifyEmail = async (req, res) => {
	const { userId, OTP } = req.body

	if (!isValidObjectId(userId))
		return res.json({ error: 'Invalid user. Try again!' })

	const user = await User.findById(userId)
	if (!user) return sendError(res, 'User not found!', 404)

	if (user.isVerified) return sendError(res, 'User is already verified!')

	const token = await EmailVerificationToken.findOne({ owner: userId })
	if (!token) return sendError(res, 'Invalid token!')

	const isMatched = await token.compareToken(OTP)
	if (!isMatched) return sendError(res, 'Invalid OTP. Try again!')

	user.isVerified = true
	await user.save()

	await EmailVerificationToken.findByIdAndDelete(token._id)

	// var transport = generateMailTransporter()

	// transport.sendMail({
	// 	from: 'admin@movie-review-app.com',
	// 	to: user.email,
	// 	subject: 'Welcome Email',
	// 	html: '<h1>Welcome to our app and thanks for choosing us.</h1>',
	// })

	const htmlContent = `
			<h1>Welcome to our app and thanks for choosing us.</h1>
    	`

	await sendEmail(user.name, user.email, 'Welcome Message', htmlContent)

	const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET)

	res.json({
		user: {
			id: user._id,
			name: user.name,
			email: user.email,
			token: jwtToken,
			isVerified: user.isVerified,
			role: user.role,
		},
		message: 'Your email is verify',
	})
}

exports.resendEmailVerificationToken = async (req, res) => {
	const { userId } = req.body

	const user = await User.findById(userId)
	if (!user) return sendError(res, 'Invalid user. Try again!')

	if (user.isVerified)
		return sendError(res, 'This email id is already verified!')

	const alreadyHasToken = await EmailVerificationToken.findOne({
		owner: userId,
	})
	if (alreadyHasToken)
		return sendError(
			res,
			'Only after one hour you can request for another token!'
		)

	// generate 6 digit otp
	let OTP = generateOTP()

	// store otp inside our db
	const newEmailVerificationToken = new EmailVerificationToken({
		owner: user._id,
		token: OTP,
	})

	await newEmailVerificationToken.save()

	// send that otp to our user

	// var transport = generateMailTransporter()

	// transport.sendMail({
	// 	from: 'admin@movie-review-app.com',
	// 	to: user.email,
	// 	subject: 'Email Verification',
	// 	html: `
	//   <p>Your verification OTP</p>
	//   <h1>${OTP}</h1>

	// `,
	// })

	const htmlContent = `
			 <p>Your verification OTP</p>
    		  <h1>${OTP}</h1>
    	`

	await sendEmail(user.name, user.email, 'Email Verification', htmlContent)

	res.json({
		message:
			'New OTP has been sent to your registered email account. Please check it now!',
	})
}

exports.forgotPassword = async (req, res) => {
	const { email } = req.body

	if (!email) return sendError(res, 'Email is missing!')

	const user = await User.findOne({ email })
	if (!user) return sendError(res, 'User not found!', 404)

	const alreadyHasToken = await PasswordResetToken.findOne({ owner: user._id })
	if (alreadyHasToken)
		return sendError(
			res,
			'Only after one hour you can request for another token!'
		)

	const token = await generateRandomByte()
	const newPasswordResetToken = await PasswordResetToken({
		owner: user._id,
		token,
	})
	await newPasswordResetToken.save()

	const resetPasswordUrl = `http://localhost:3000/auth/reset-password?token=${token}&id=${user._id}`

	// const transport = generateMailTransporter()

	// transport.sendMail({
	// 	from: 'admin@movie-review-app.com',
	// 	to: user.email,
	// 	subject: 'Reset Password Link',
	// 	html: `
	// 		<p>Click here to reset your password</p>
	// 		<a href='${resetPasswordUrl}'>Change Password</a>
	// 	`,
	// })

	const htmlContent = `
			 	<p>Click here to reset your password</p>
			<a href='${resetPasswordUrl}'>Change Password</a>
    	`

	await sendEmail(user.name, user.email, 'Reset Password Link', htmlContent)

	res.json({
		message:
			'Password reset link has been sent to your email. Please check it now!',
	})
}

exports.sendResetPasswordTokenStatus = (req, res) => {
	res.json({ valid: true })
}

exports.resetPassword = async (req, res) => {
	const { newPassword, userId } = req.body

	const user = await User.findById(userId)
	const matched = await user.comparePassword(newPassword)
	if (matched)
		return sendError(
			res,
			'The new password must be different from the old one!'
		)

	user.password = newPassword
	await user.save()

	await PasswordResetToken.findByIdAndDelete(req.resetToken._id)

	// const transport = generateMailTransporter()

	// transport.sendMail({
	// 	from: 'admin@movie-review-app.com',
	// 	to: user.email,
	// 	subject: 'Password Reset Successfully',
	// 	html: `
	// 		<h1>Password Reset Successfully</h1>
	// 		<p>Now you can use new password.</p>

	// 	`,
	// })

	const htmlContent = `
			 <h1>Password Reset Successfully</h1>
			<p>Now you can use new password.</p>
    	`

	await sendEmail(
		user.name,
		user.email,
		'Password Reset Successfully',
		htmlContent
	)

	res.json({
		message: 'Password reset successfully, now you can use new password.',
	})
}

exports.signIn = async (req, res, next) => {
	const { email, password } = req.body

	const user = await User.findOne({ email })
	if (!user) return sendError(res, 'Email or Password is incorrect. Try again!')

	const matched = await user.comparePassword(password)
	if (!matched)
		return sendError(res, 'Email or Password is incorrect. Try again!')

	const { _id, name, isVerified, role } = user

	const jwtToken = jwt.sign({ userId: _id }, process.env.JWT_SECRET)

	res.json({
		user: { id: _id, name, email, token: jwtToken, isVerified, role },
	})
}
