const nodemailer = require('nodemailer')
const SibApiV3Sdk = require('sib-api-v3-sdk')

exports.generateOTP = (otp_length = 6) => {
	let OTP = ''
	for (let i = 1; i <= otp_length; i++) {
		const randomVal = Math.round(Math.random() * 9)
		OTP += randomVal
	}

	return OTP
}

exports.generateMailTransporter = () =>
	nodemailer.createTransport({
		host: 'smtp.mailtrap.io',
		port: 2525,
		auth: {
			user: process.env.MAIL_TRAP_USER,
			pass: process.env.MAIL_TRAP_PASS,
		},
	})

exports.sendEmail = async (name, email, subject, htmlContent) => {
	const defaultClient = SibApiV3Sdk.ApiClient.instance

	const apiKey = defaultClient.authentications['api-key']
	apiKey.apiKey = process.env.SIB_API_KEY

	const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()

	const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()

	sendSmtpEmail.subject = subject
	sendSmtpEmail.htmlContent = htmlContent

	sendSmtpEmail.sender = {
		name: 'Review Movie App',
		email: 'trongdaitest@gmail.com',
	}
	sendSmtpEmail.to = [{ email, name }]

	return await apiInstance.sendTransacEmail(sendSmtpEmail)
}
