const moment = require('moment')
const objectMap = require('object.map')
const jsonwebtoken = require('jsonwebtoken')

// login/permissão google
module.exports = params => {
  const {
    express,
    op,
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

  User.login = async (login, password) => {
    if (!password) return null

    const operationParams = {
      where: {
        [loginProp]: login,
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

    if (nativeAllowed.indexOf(treatResource(resource)) !== -1) return true

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

  Permission.check = async (userId, resource, req) => {
    if (userId === null) return true

    resource = treatResource(resource).split('|')[1]

    const urlPattern = require('url-pattern')

    const permissions = await Permission.list(userId)
    const route = Object.keys(permissions)
      .filter(i => {
        let [ method, url, ] = i.split('|')

        url = new urlPattern(url)

        return url.match(resource) !== null && [ 'ALL', req.method, ].indexOf(method) !== -1
      })[0]

    return permissions[route]
  }

  Permission.list = async (userId = null) => {
    const permissions = { allow: {}, user: {}, group: {}, }
    const user = (await User.findOne({
      where: {
        [userPkProp]: userId,
      },
      include: [ Group, ],
    }))
      .toJSON()
    const groupIds = Object.values(user).reverse()[0].map(i => i[groupPkProp])

    const permissionsAllowList = (await Permission.findAll({
      where: {
        [User.name + userPkProp]: null,
        [Group.name + userPkProp]: null,
      },
    }))

    const permissionsGroupList = (await Permission.findAll({
      where: {
        [Group.name + groupPkProp]: { [op.in]: groupIds, },
      },
    }))

    const permissionsUserList = (await Permission.findAll({
      where: {
        [User.name + userPkProp]: userId,
      },
    }))

    permissionsAllowList.map(i => {
      if (permissions.allow[i[resourceProp]] === false) return
      if (i.allow === null && permissions.allow[i[resourceProp]] !== null) return

      i = i.toJSON()

      permissions.allow[i[resourceProp]] = i.allow
    })

    permissionsGroupList.map(i => {
      if (permissions.group[i[resourceProp]] === false) return
      if (i.allow === null && permissions.group[i[resourceProp]] !== null) return

      i = i.toJSON()

      permissions.group[i[resourceProp]] = i.allow
    })

    permissionsUserList.map(i => {
      if (permissions.user[i[resourceProp]] === false) return
      if (i.allow === null && permissions.user[i[resourceProp]] !== null) return

      i = i.toJSON()

      permissions.user[i[resourceProp]] = i.allow
    })

    const permissionsObj = {}

    objectMap({ ...permissions.allow, ...permissions.group, ...permissions.user,}, (v, k) => {
      if (v.allow === null && typeof permissionsObj[k] === 'boolean') return

      permissionsObj[treatResource(k)] = v
    })

    return permissionsObj
  }

  express.use(async  (req, res, next) => {
    const resource = treatResource(req.url)

    if (await Permission.isAllowed(resource)) {
      next()

      return
    }

    const { userId, tokenError, } = await Permission.checkToken(req, resource)

    if (tokenError) res.json(tokenError)
    else if (!(await Permission.check(userId, resource, req))) res.json(invalidPermission)
    else next()
  })

  express.post(urlLogin, async (req, res) => {
    res.json(await User.login(req.body.mail, req.body.password))
  })

  if (google) {
    express.get(googleURL, async (req, res) => {
      res.json({ url: await User.googleLogin(req), })
    })

    express.use(googleCallbackbURL, async (req, res, next) => {
      res.locals = await User.googleCallback(req)

      next()
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

function treatResource (resource) {
  resource = resource.split('?')[0]
  resource = resource.slice(-1) === '/' ? resource.slice(0, -1) : resource
  resource = resource[0] === '/' ? resource.slice(1) : resource
  resource = resource.split('|')

  const method = resource.length === 1 ? 'ALL' : resource[0]
  const url = (resource.length === 1 ? resource[0] : resource[1]).toLowerCase()

  return `${method}|${url}`
}