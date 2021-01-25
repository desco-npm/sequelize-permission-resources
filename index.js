const moment = require('moment')
const jsonwebtoken = require('jsonwebtoken')

// login/permissão google
module.exports = params => {
  const {
    express,
    User,
    Group,
    Permission,
    secret,
    googleId,
    googleKey,
    googleScope,
    googlePrompt,
    google = false,
    algorithm = 'HS256',
    pswProp = 'password',
    loginProp = 'mail',
    mailProp = 'mail',
    tokenProp = 'token',
    tokenTypeProp = 'tokenType',
    resourceProp = 'resource',
    userPkProp = 'id',
    groupPkProp = 'id',
    expireTokenProp = 'expireToken',
    urlLogin = '/login',
    googleURL = '/oauth/google',
    googleCallbackbURL = '/oauth/google/callback',
    expireToken = () => moment().add(1, 'hours').unix(),
    loginCallback = i => i,
    invalidToken = { message: 'Invalid Token', },
    noToken = { message: 'No Token', },
    invalidPermission = { message: 'Invalid Permissions', },
    expiredToken = { message: 'Expired Token', },
  } = params

  const throughUserGroup = [ User.name, Group.name, ].sort().join('_')

  User.belongsToMany(Group, { through: throughUserGroup, })
  Group.belongsToMany(User, { through: throughUserGroup, })

  User.hasMany(Permission)
  Permission.belongsTo(User)

  Group.hasMany(Permission)
  Permission.belongsTo(Group)

  User.login = async (mail, password) => {
    if (!password) return null

    const operationParams = {
      where: {
        [loginProp]: mail,
        [pswProp]: password,
      },
    }

    return User.findOne(operationParams).then(response => {
      if (!response) return null

      response = response.toJSON()

      delete response[tokenProp]

      const userData = {
        ...response,
        [tokenTypeProp]: 'default',
        [expireTokenProp]: expireToken(),
      }

      userData[tokenProp] = jsonwebtoken.sign(userData, secret, { algorithm, })

      return User.update(userData, { where: { [userPkProp]: userData[userPkProp], },})
        .then(() => {
          return loginCallback(userData)
        })
    })
  }

  User.googleLogin = async req => {
    const GoogleAPI = newGoogleAPI(req, {
      googleCallbackbURL,
      googleId,
      googleKey,
    })

    return GoogleAPI.generateAuthUrl({ scope: googleScope, prompt: googlePrompt, })
  }

  User.googleCallback = async req => {
    const GoogleAPI = newGoogleAPI(req, {
      googleCallbackbURL,
      googleId,
      googleKey,
    })

    try {
      const tokens = await GoogleAPI.setCredentials(req.query.code)

      const token = {
        [tokenProp]: tokens.access_token,
        [tokenTypeProp]: 'google',
        [expireTokenProp]: tokens.expiry_date,
      }

      const info = await GoogleAPI.userInfo()

      let [ userData, created, ] = await User.selectOrCreate({
        where: {
          [mailProp]: info.data.email,
        },
        create: {
          [mailProp]: info.data.email,
          ...token,
        },
      })

      if (!created) {
        userData = await User.change(token, userData.id)
      }

      return { ...token, ...userData, }
    }
    catch (e) {
      return { message: 'Error in login on Google', error: e, }
    }
  }

  Permission.isAllowed = async resource => {
    const nativeAllowed = [
      treatResource(urlLogin),
      treatResource(googleURL),
      treatResource(googleCallbackbURL),
    ]

    if (nativeAllowed.indexOf(resource) !== -1) return true

    const permissions = await Permission.findAndCountAll({
      where: {
        [resourceProp]: resource,
        [User.name + userPkProp]: null,
        [User.name + groupPkProp]: null,
      },
    })

    return permissions.count > 0
  }

  Permission.checkToken = async (req, resource) => {
    const { token, tokentype: tokenType, } = req.headers

    if ([ urlLogin, urlLogin + '/',].indexOf(resource) !== -1) return { userId: null, }
    if (!token) return { tokenError: noToken, }

    if (tokenType === 'google') {
      const { Google, } = require('@desco/social-auth')

      if(!(await Google.checkToken(token))) return { tokenError: invalidToken, }

      const userData = (await User.findOne({ where: { [tokenProp]: token, }, })).toJSON()

      return { userId: userData[userPkProp], }
    }
    else {
      if (!jsonwebtoken.verify(token, secret, { algorithm, })) return { tokenError: invalidToken, }

      const tokenData = jsonwebtoken.decode(token)

      if (moment().unix() > tokenData[expireTokenProp]) return { tokenError: expiredToken, }

      const userData = await User.findOne({ where: { [userPkProp]: tokenData[userPkProp], }, })
        .then(r => r ? r.toJSON() : {})

      if (userData.token !== token) return { tokenError: invalidToken, }

      return { userId: tokenData[userPkProp], }
    }

  }

  Permission.check = async (userId, resource) => {
    if (userId === null) return true

    const permissions = await Permission.list(userId)

    return permissions[resource] === true
  }

  Permission.list = async (userId = null) => {
    const params = {
      where: { [userPkProp]: userId, },
      include: [
        {
          model: Group,
          include: Permission,
        },
        Permission,
      ],
    }

    const userData = await User.findOne(params).then(r => r ? r.toJSON() : {})
    const permissions = { user: {}, group: {}, general: {}, }

    const setPermission = (type, Permission) => {
      const resource = treatResource(Permission[resourceProp])
      const allow = Permission.allow

      const isUndefined = permissions[type][resource] === undefined
      const isNull = permissions[type][resource] === null
      const isBottom = permissions[type][resource] === true && allow === false

      if (isUndefined || isNull || isBottom) {
        permissions[type][resource] = allow
      }
    }

    userData.Permissions = userData.Permissions || []
    userData.UserGroups = userData.UserGroups || []

    userData.Permissions.map(permission => {
      setPermission('user', permission)
    })

    userData.UserGroups.map(groupData => {
      groupData.Permissions = groupData.Permissions = []

      groupData.Permissions.map(permission => {
        setPermission('group', permission)
      })
    })

    permissions.general = clone(permissions.group)

    objectMap(permissions.user, (value, resource) => {
      if (value === null) return

      permissions.general[resource] = value
    })

    permissions.all = (await Permission.findAll({
      where: {
        [User.name + userPkProp]: null,
        [User.name + groupPkProp]: null,
      },
    })) || []

    permissions.all.map(Permission => {
      Permission = Permission.toJSON()

      const resource = treatResource(Permission[resourceProp])
      const isUndefined = permissions.general[resource] === undefined
      const isNull = permissions.general[resource] === null
      const currentIsTrue = Permission.allow === true

      if ((isUndefined || isNull) && currentIsTrue) {
        permissions.general[resource] = true
      }
    })

    return objectMap(permissions.general, v => v === null ? false : v)
  }

  express.use(async  (req, res, next) => {
    const resource = treatResource(req.url)

    if (await Permission.isAllowed(resource)) {
      next()

      return
    }

    const { userId, tokenError, } = await Permission.checkToken(req, resource)

    if (tokenError) res.json(tokenError)
    else if (!(await Permission.check(userId, resource))) res.json(invalidPermission)
    else next()
  })

  express.post(urlLogin, async (req, res) => {
    res.json(await User.login(req.body.mail, req.body.password))
  })

  if (google) {
    express.get(googleURL, async (req, res) => {
      res.json({ url: await User.googleLogin(req), })
    })

    express.get(googleCallbackbURL, async (req, res) => {
      res.json(await User.googleCallback(req))
    })
  }
}

function newGoogleAPI (req, { googleCallbackbURL, googleId, googleKey, }) {
  const { Google, } = require('@desco/social-auth')

  const protocol = `${req.protocol}://`
  const host = req.headers.host.slice(-1) === '/' ? req.headers.host : req.headers.host + '/'
  const url = googleCallbackbURL[0] === '/' ? googleCallbackbURL.slice(1) : googleCallbackbURL

  return new Google({
    id: googleId,
    key: googleKey,
    callbackUrl: `${protocol}${host}${url}`,
  })
}

function treatResource (url) {
  url = url.split('?')[0]
  url = url.slice(-1) === '/' ? url.slice(0, -1) : url
  url = url[0] === '/' ? url.slice(1) : url

  return url.toLowerCase()
}