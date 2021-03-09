<div align="right">
  <a href="README.US.md">
    <img alt="Read in American English" src="https://img.shields.io/static/v1?label=&message=🇺🇸 Read in American English&color=red&style=for-the-badge" />
  </a>
</div>

<table>
  <tr>
    <td><img src="https://i.ibb.co/PGLkNY4/sequelize-permission-resources.png"></td>
    <td>  
      <h1>@desco/sequelize-permission-resources</h1>
      Pacote que permite controlar o acesso de usuários e grupos de usuários aos recursos do sistema via [Sequelize](https://sequelize.org/).
      <br /><br />
      <div align="center">
        <img alt="Licença MIT" src="https://img.shields.io/static/v1?label=Licença&message=MIT&color=green&style=for-the-badge">
        <img alt="Versão 1.2.5" src="https://img.shields.io/static/v1?label=Versão&message=1.2.5&color=blue&style=for-the-badge">
      </div>
      <h4 align="center"> 
        🧪 Em fase Beta 🚀
      </h4>
    </td>
  </tr>
</table>

> <a href="https://github.com/desco-npm" target="_blank">Veja outros projetos NPM aqui.</a>

> <a href="https://github.com/descoifica" target="_blank">Veja outros projetos aqui.</a>

---

## 📋 Tabela de conteúdos

* [✔️ Recursos](#Recursos)
* [🛠️ Tecnologias](#Tecnologias)
* [⚙️ Instalação](#Instalação)
* [📦 Importação](#Importação)
* [📚 Como Usar](#Como-Usar)

---

<a name="Recursos"></a>

## ✔️ Recursos

- [x] Login;
- [x] Login com Google;
- [x] Controle de permissões;

---

## 🛠️ Tecnologias

As seguintes tecnologias são utilizadas:

* [NodeJS](https://nodejs.org/en/);
* [Moment](https://www.npmjs.com/package/moment);
* [Sequelize](https://sequelize.org/);
* [Express](https://expressjs.com/);

---

<a name="Instalação"></a>

## ⚙️ Instalação

```bash
npm install --save @desco/sequelize-permission-resources
```

> Note que será necessário ter o **NPM** instalado para o comando funcionar.

---

<a name="Importação"></a>

## 📦 Importação

```js
const sequelizePermissionResources = require('@desco/sequelize-permission-resources')
```

---

<a name="Como-Usar"></a>

## 📚 Como Usar


### Conceito

Teremos três modelos para armazenar usuários, grupos de usuários e permissões, além de mais um modelo para o relacionamento entre usuários e grupos de usuários.

Os modelos com seus atributos deverão ser criados pelo programador utilizando os nomes que preferir e, uma vez criados, serão informados para o **sequelizePermissionResources** para que possa trabalhar com eles, inclusive criando os relacionamentos.

Uma vez os modelos criados e todos os parâmetros passados ao **sequelizePermissionResources**, tudo será automatizado e serão criadas rotas para login e (no caso do google) callback.

Utilizar o Google por padrão é desabilitado e deve ser habilitado caso deseje utilizar.

Uma vez efetuado o login, um token será retornado para o frontend, o qual deverá ser informado em todas as requisições.

O **sequelizePermissionResources** irá validar o token e, caso valido, irá liberar ou negar o acesso dependendo das permissões dadas ao usuário ou grupo de usuário associado ao token.

Para liberar acesso a um recurso ou URL para todos os usuários, sem necessidade de token, crie um registro no modelo de permissões no qual o acesso será liberado (`true`) e o usuário e grupo de usuário serão `null`.

Falando em liberação ou restrição, três valores são possíveis:

* `true` para liberar;
* `false` para negar;
* `null` para negar a menos que outra permissão esteja liberando;

Como pode ver, é possível ter várias permissões para um recurso ou URL, por exemplo, um usuário pode estar como `null` a uma url e `true` em vários grupos, exceto em um que define como `false`... e agora?

o **sequelizePermissionResources** possui uma hierarquia de importância nas permissões e ela é a seguinte, do menos ao mais importante:

* Permissão Geral (onde usuário e grupo de usuário são `null`);
* Permissão de Grupos;
* Permissão de Usuários;

Dessa forma, se um acesso for negado nas permissões gerais, porém liberado em um dos grupos do usuário, o acesso será liberado pois as permissões de grupos são mais importantes.

Da mesma forma, se o acesso for negado nos grupos, porém liberado diretamente para o usuário, o acesso será liberado pois as permissões de usuário são mais importantes.

Agora, se houver um conflito entre as permissões dos vários grupos, a importância será para a permissão `false`, ou seja, se houver um único grupo com permissão `false` e todos os outros `true`, a permissão será `false`.

Note também que `null` terá comportamento de `false`, mas diferente do `false`, poderá ser sobrescrito pelo `true`.

### Modelos

Comece criando 3 modelos [Sequelize](https://sequelize.org/) com seus atributos, são eles:

> Os nomes dos modelos e atributos não importam pois podem ser personalizados, porém os nomes dos atributos aqui informados servem como padrão.

#### User

Modelo para armazenamento dos usuários, com os seguintes atributos:

* **id** - Id do registro;
* **login** - Nome de login do usuário (String);
* **mail** - Email do usuário (String);
* **password** - Senha do usuário (String);
* **token** - Token do usuário de quando estiver autenticado (Pelo menos 500 caracteres);
* **tokenType** - Tipo do token (Valor ENUM que aceita `default` ou `null`);
* **expireToken** - Data de expiração do token (BIGINT);

#### UserGroup

Modelo para armazenamento dos grupos de usuários, com os seguintes atributos:

* **id** - Id do registro;
* **name** - Nome do grupo (String);

#### User_UserGroup

Modelo que irá relacionar os usuários com os grupos de usuários, com o seguintes atributos:

> O nome deste modelo deve seguir as regras do [Sequelize](https://sequelize.org/) para modelos que relacionam dois outros modelos.

* **id** - Id do registro;

#### Permission

Modelo para armazenamento das permissões de acesso, com os seguintes atributos:

* **id** - Id do registro;
* **resource** - Nome ou URL do recurso (String);
* **allow** - Se o acesso esta liberado (`true`), negado (`false`) ou padrão (`null`);

### Executando

Chame o método passando os devidos parâmetros e a mágica será feita!

```js
sequelizePermissionResources({ ...params, })
```

> Veja todos os parâmetros a seguir.

### Parâmetros

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| Express | App | Sim | - | Aplicação do Express já declarada |
| Op | [Op](https://sequelize.org/master/manual/model-querying-basics.html#operators) | Sim | - | Objeto de operadores do [Sequelize](https://sequelize.org) |
| User | Objeto | Sim | - | Modelo do [Sequelize](https://sequelize.org) para os Usuários|
| Group | Objeto | Sim | - | Modelo do [Sequelize](https://sequelize.org) para os Grupos de Usuários|
| Permission | Objeto | Sim | - | Modelo do [Sequelize](https://sequelize.org) para as Permissões de Acesso|
| userPkProp | String | Não | 'id' | Nome do atributo de id do modelo de usuário|
| loginProp | String | Não | 'mail' | Nome do atributo de login do modelo de usuário|
| pswProp | String | Não | 'password' | Nome do atributo de senha do modelo de usuário|
| tokenProp | String | Não | 'token' | Nome do atributo de token do modelo de usuário|
| tokenTypeProp | String | Não | 'tokenType' | Nome do atributo de tipo de token do modelo de usuário|
| expireTokenProp | String | Não | 'expireToken' | Nome do atributo de data de expiração do token do modelo de usuário|
| groupPkProp | String | Não | 'id' | Nome do atributo de id do modelo de grupo de usuário|
| resourceProp | String | Não | 'resource' | Nome do atributo de recurso a ser acessado do modelo de permissão|
| allowProp | String | Não | 'allow' | Nome do atributo de liberação do recurso do modelo de permissão|
| secret | String | Sim | - | String segredo a ser usada para criar os tokens|
| algorithm | String | Não | HS256 | Técnica de hash a ser usado nos tokens|
| urlLogin | String | Não | /login | URL da rota de login|
| loginCallback | Function | Não | `(p) => p` | Função ao ser executada ao ter sucesso no login |
| expireToken | Function | Não | `() => moment().add(1, 'hours').unix()` | Função que irá gerar a hora unix de expiração do token|
| invalidToken | JSON | Não | { message: 'Invalid Token', } | JSON a ser retornado caso o token informado seja inválido|
| noToken | JSON | Não | { message: 'No Token', } | JSON a ser retornado caso não tenha passado um token|
| expiredToken | JSON | Não | { message: 'Expired Token', } | JSON a ser retornado caso o token tenha expirado|
| invalidPermission | JSON | Não | { message: 'Invalid Permissions', } | JSON a ser retornado caso não tenha permissão para acessar o recurso|
| google | boolean | Não | false | Se irá usar autenticação via aplicação Google|
| googleURL | String | Não | /oauth/google | URL da rota de login do google|
| googleCallbackbURL | String | Não | /oauth/google/callback | URL da rota de callback do login do google|
| googleId | String | Não | - | ID da aplicação Google|
| googleKey | String | Não | - | Chave da aplicação Google|
| googleScope | String | Não | - | Escopos a serem acessados na aplicação Google|

---

## Autor

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