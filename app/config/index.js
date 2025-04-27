module.exports = {
	app: {
		port: process.env.PORT || 1703,
		appName: process.env.APP_NAME || 'Super Admin',
		env: process.env.NODE_ENV || 'development',
		isProd: (process.env.NODE_ENV === 'prod'),
		getAdminFolderName: process.env.ADMIN_FOLDER_NAME || 'admin',
		getApiFolderName: process.env.API_FOLDER_NAME || 'api',
		project_name: 'Super Admin',
		project_description: 'Super Admin Setup'
	},
	db: {
		port: process.env.DB_PORT ,
		database: process.env.DB_NAME ,
		password: process.env.DB_PASS,
		username: process.env.DB_USER ,
		host: process.env.DB_HOST,
		dialect: 'mongodb'
	},
	winiston: {
		logpath: '/iLrnLogs/logs/',
	},
	auth: {
		jwtSecret: process.env.JWT_SECRET || 'MyS3cr3tK3Y',
		jwt_expiresin: process.env.JWT_EXPIRES_IN || '2d',
		saltRounds: process.env.SALT_ROUND || 12,
		refresh_token_secret: process.env.REFRESH_TOKEN_SECRET || 'VmVyeVBvd2VyZnVsbFNlY3JldA==',
		refresh_token_expiresin: process.env.REFRESH_TOKEN_EXPIRES_IN || '2d', // 2 days
	},
	other: {
		pageLimit: 10
	},
	theme: {
		// Light Mode Starts
		bgColorLight: '#f8f8f8',
		cardColorLight: '#ffffff',
		cardMutedTextColorLight: '#b9b9c3',
		menuBgColorLight: '#ffffff',
		menuBrandTextColorLight: '#7367f0',
		menuIconColorLight: '#6e6b7b',
		menuHeaderTextColorLight: '#a6a4b0',
		contentHeaderTextColorLight: '#636363',
		formLabelTextColorLight: '#5e5873',
		anchorTextColorLight: '#7367f0',
		headerTagTextColorLight: '#5e5873',
		bodyTextColorLight: '#6e6b7b',
		// Light Mode Ends

		// Dark Mode Starts
		bgColorDark: '#161d31',
		cardColorDark: '#283046',
		cardMutedTextColorDark: '#676d7d',
		menuBgColorDark: '#283046',
		menuBrandTextColorDark: '#7367f0',
		menuIconColorDark: '#d0d2d6',
		menuHeaderTextColorDark: '#676d7d',
		contentHeaderTextColorDark: '#d0d2d6',
		formLabelTextColorDark: '#d0d2d6',
		anchorTextColorDark: '#7367f0',
		headerTagTextColorDark: '#d0d2d6',
		bodyTextColorDark: '#b4b7bd',
		// Dark Mode Ends
	}
};
