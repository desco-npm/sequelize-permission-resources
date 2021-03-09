<div align="right">
  <a href="README.md">
    <img alt="Ler em Portugês do Brasil" src="https://img.shields.io/static/v1?label=&message=🇧🇷 Ler em Português do Brasil&color=green&style=for-the-badge" />
  </a>
</div>

<table>
  <tr>
    <td><img src="https://i.ibb.co/PGLkNY4/sequelize-permission-resources.png"></td>
    <td>  
      <h1>@desco/sequelize-permission-resources</h1>
      Package that allows controlling the access of users and groups of users to system resources via [Sequelize](https://sequelize.org/).
      <br /><br />
      <div align="center">
        <img alt="MIT License" src="https://img.shields.io/static/v1?label=License&message=MIT&color=green&style=for-the-badge">
        <img alt="Version 1.2.5" src="https://img.shields.io/static/v1?label=Version&message=1.2.5&color=blue&style=for-the-badge">
      </div>
      <h4 align="center"> 
        🧪 In Beta 🚀
      </h4>
    </td>
  </tr>
</table>

> <a href="https://github.com/desco-npm" target="_blank">See other NPM projects here.</a>

> <a href="https://github.com/descoifica" target="_blank">See other projects here.</a>

---

## 📋 Table of Contents

* [✔️ Resources](#Resources)
* [🛠️ Technology](#Technology)
* [⚙️ Installation](#Installation)
* [📦 Import](#Import)
* [📚 How to use](#How-to-use)

---

<a name="Resources"></a>

## ✔️ Resources

- [x] Login;
- [x] Login with Google;
- [x] Control of permissions;

---

## 🛠️ Technology

The following technologies are used:

* [NodeJS](https://nodejs.org/en/);
* [Moment](https://www.npmjs.com/package/moment);
* [Sequelize](https://sequelize.org/);
* [Express](https://expressjs.com/);

---

<a name="Installation"></a>

## ⚙️ Installation

```bash
npm install --save @desco/sequelize-permission-resources
```

> Note that it will be necessary to have **NPM** installed for the command to work.

---

<a name="Import"></a>

## 📦 Import

```js
const sequelizePermissionResources = require('@desco/sequelize-permission-resources')
```

---

<a name="How-To-Use"></a>

## 📚 How to use

### Concept

We will have three models for storing users, user groups and permissions, as well as another model for the relationship between users and user groups.

Models with their attributes must be created by the programmer using the names they prefer and, once created, they will be informed to **sequelizePermissionResources** so that you can work with them, including creating the relationships.

Once the models have been created and all parameters passed to** sequelizePermissionResources**, everything will be automated and routes will be created for login and (in the case of google) callback.

Using Google by default is disabled and must be enabled if you want to use it.

Once logged in, a token will be returned to the frontend, which must be informed in all requests.

**sequelizePermissionResources** will validate the token and, if valid, will release or deny access depending on the permissions given to the user or user group associated with the token.

To free access to a resource or URL for all users, without the need for a token, create a record in the permissions model in which access will be released (`true`) and the user and user group will be` null`.

Speaking of release or constraint, three values ​​are possible:

* `true` to release;
* `false` to deny;
* `null` to deny unless another permission is being released;

As you can see, it is possible to have multiple permissions for a resource or URL, for example, a user can be `null` to a url and` true` in several groups, except one that sets it to `false` ... and now?

**sequelizePermissionResources** has a hierarchy of importance in permissions and it is as follows, from the least to the most important:

* General permission (where user and user group are `null`);
* Groups permission;
* User permission;

This way, if an access is denied in the general permissions, but allowed in one of the user's groups, the access will be released because the group permissions are more important.

Likewise, if access is denied in groups, but released directly to the user, access will be released because user permissions are more important.

Now, if there is a conflict between the permissions of the various groups, the importance will be for the `false` permission, that is, if there is a single group with` false` permission and all the others `true`, the permission will be` false` .

Also note that `null` will behave as` false`, but unlike `false`, it can be overridden by` true`.

### Models

Start by creating 3 models [Sequelize](https://sequelize.org/) with their attributes, they are:

> The names of the models and attributes do not matter as they can be customized, however the names of the attributes informed here serve as standard.

#### User

Template for user storage, with the following attributes:

* **id** - Id of the record;
* **login** - User login name (String);
* **mail** - User email (String);
* **password** - User password (String);
* **token** - Token of the user when authenticated (At least 500 characters);
* **tokenType** - Type of token (ENUM value that accepts `default` or` null`);
* **expireToken** - Expiration date of the token (BIGINT);

#### UserGroup

Template for storing user groups, with the following attributes:

* **id** - Id of the record;
* **name** - Name of the group (String);

#### User_UserGroup

Model that will relate users to user groups, with the following attributes:

> The name of this model must follow the rules of [Sequelize](https://sequelize.org/) for models that relate two other models.

* **id** - Id of the record;

#### Permission

Template for storing access permissions, with the following attributes:

* **id** - Id of the record;
* **resource** - Name or URL of the resource (String);
* **allow** - If access is allowed (`true`), denied (` false`) or default (`null`);

### Running

Call the method passing the appropriate parameters and the magic will be done!

``js
sequelizePermissionResources({... params,})
``

> See all the parameters below.

### Parameters

| Name | Type | Mandatory | Standard | Description |
| --- | --- | --- | --- | --- |
| Express | App | Yes | - | Express application already declared |
| Op | [Op](https://sequelize.org/master/manual/model-querying-basics.html#operators) | Yes | - | Object of [Sequelize operators](https://sequelize.org) |
| User | Object | Yes | - | [Sequelize Template](https://sequelize.org) for Users |
| Group | Object | Yes | - | [Sequelize template](https://sequelize.org) for User Groups |
| Permission | Object | Yes | - | [Sequelize Template](https://sequelize.org) for Access Permissions |
| userPkProp | String | No | 'id' | User model id attribute name |
| loginProp | String | No | 'mail' | User model login attribute name |
| pswProp | String | No | 'password' | User model password attribute name |
| tokenProp | String | No | 'token' | User model token attribute name |
| tokenTypeProp | String | No | 'tokenType' | User model token type attribute name |
| expireTokenProp | String | No | 'expireToken' | User model token expiration date attribute name |
| groupPkProp | String | No | 'id' | User group template id attribute name |
| resourceProp | String | No | 'resource' | Name of the resource attribute to be accessed from the permission model |
| allowProp | String | No | 'allow' | Permission model resource release attribute name |
| secret | String | Yes | - | Secret string to be used to create the tokens |
| algorithm | String | No | HS256 | Hash technique to be used in tokens |
| urlLogin | String | No | / login | Login route URL |
| loginCallback | Function | No | `(p) => p` | Function when executed upon successful login |
| expireToken | Function | No | `() => moment (). add (1, 'hours'). unix ()` | Function that will generate the unix expiration time of the token |
| invalidToken | JSON | No | {message: 'Invalid Token',} | JSON to be returned if the informed token is invalid |
| noToken | JSON | No | {message: 'No Token',} | JSON to be returned if no token was passed |
| expiredToken | JSON | No | {message: 'Expired Token',} | JSON to be returned if the token has expired |
| invalidPermission | JSON | No | {message: 'Invalid Permissions',} | JSON to be returned if you do not have permission to access the resource |
| google | boolean | No | false | Whether to use authentication via the Google application |
| googleURL | String | No | / oauth / google | Google login route URL |
| googleCallbackbURL | String | No | / oauth / google / callback | Google login callback route URL |
| googleId | String | No | - | Google application ID |
| googleKey | String | No | - | Google application key |
| googleScope | String | No | - | Scopes to be accessed in the Google application |

---

## Author

<table>
  <tr>
    <td width="150px">
      <img src="https://scontent.fsdu1-1.fna.fbcdn.net/v/t1.0-9/539886_235546170253505_5977326689811409130_n.jpg?_nc_cat=106&ccb=3&_nc_sid=174925&_nc_eui2=AeGgFWn_fWInwRkTo3mHSP993TbQ0TzG0Y3dNtDRPMbRjS-eZL1tr4I5maqz6O-jva9qWnIxKOsD3UtSm9CTeCys&_nc_ohc=Qw6NaDGrtIgAX9uFF2c&_nc_ht=scontent.fsdu1-1.fna&oh=5ebac9874d7a24e157c8c99fd965c2a4&oe=606539CE" width="100px;" alt=""/>
      <b>Rafael A. R. Dias</b>
    </td>
    <td>  
      <a href="mailto:eu@diasrafael.com.br" target="_blank" >
        <img alt="Email eu@diasrafael.com.br" src="https://img.shields.io/static/v1?label=Email&message=eu@diasrafael.com.br&color=red&logo=gmail&style=for-the-badge">
      </a>
      <a href="https://www.linkedin.com/in/diasrafael/" target="_blank">
        <img alt="Linkedin @diasrafael" src="https://img.shields.io/static/v1?label=Linkedin&message=@diasrafael&color=blue&logo=linkedin&style=for-the-badge">
      </a>
      <a href="https://www.facebook.com/eudiasrafael" target="_blank">
        <img alt="Facebook @eudiasrafael" src="https://img.shields.io/static/v1?label=Facebook&message=@eudiasrafael&color=blue&logo=facebook&style=for-the-badge">
      </a>
      <a href="https://github.com/descodifica" target="_blank">
        <img alt="GitHub Overview @descodifica" src="https://img.shields.io/static/v1?label=GitHub Overview&message=@descodifica&color=black&logo=github&style=for-the-badge">
      </a>
      <a href="https://github.com/desco-npm" target="_blank">
        <img alt="GitHub NPM @desco-npm" src="https://img.shields.io/static/v1?label=GitHub NPM&message=@desco-npm&color=black&logo=github&style=for-the-badge">
      </a>
      <a href="https://www.npmjs.com/org/desco" target="_blank">
        <img alt="NPM @desco" src="https://img.shields.io/static/v1?label=NPM&message=@desco&color=red&logo=npm&style=for-the-badge">
      </a>
    </td>
  </tr>
</table>