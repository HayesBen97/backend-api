# MarketMate API

## Usage
### Development

In a development environment, use the following command.

```bash
$ npm run start:dev
```

This will start the API with nodemon, which will restart the API when a file is changed and provide logs within the terminal.

### Production

In production use the following to start the API:

```bash
$ pm2 start ecosystem.config.js
```

And the following to stop, restart, reload, and delete the process:

```bash
$ pm2 stop ecosystem.config.js
$ pm2 restart ecosystem.config.js
$ pm2 reload ecosystem.config.js
$ pm2 delete ecosystem.config.js
```

PM2 will restart the process upon crash, and `ecosystem.config.js` has watch set to `true`, which will cause it to watch for file changes and restart.

To view logs, use:

```bash
$ pm2 logs
```

## Existing Routes
**userApiRoute.js**

| ACTION | METHOD | NEW METHOD |
|--------|--------|------------|
|`POST`|`/api/SignUpPage`| |
|`GET`|`/api/emailverify/:verification_string`| |
|`GET`| `/api/auth/twitter`| |
|`GET`| `/api/auth/twitter/callback`| |
|`GET`| `/api/auth/linkedin`| |
|`GET`| `/api/linkedin_callback`| |
|`POST`| `/api/SignInPage`| |
|`POST`| `/api/forgotpassword`| |
|`POST`| `/api/updateProfile`| |
|`POST`| `/api/DashBoardPage`| |
|`GET`| `/api/getAllAccounts`| |
|`GET`| `/api/DashBoardPage/:accountid`| |
|`GET`| `/api/view_logs`| |
|`GET`| `/api/update_logs`| |
|`GET`| `/api/searchList`| |
|`POST`| `/api/createSearchBot`| |
|`GET`| `/api/search_detail/:id`| |
|`POST`| `/api/search/:id/update`| |
|`GET`| `/api/search/:id/changeStatus`| |
|`GET`| `/api/search/:id/delete`| |
|`POST`| `/api/edit_profile`| |
|`POST`| `/api/user_payment`| |
|`POST`| `/api/updatePayment`| |
|`POST`| `/api/addUserSubscription`| |

**userRoute.js**

| ACTION | METHOD | NEW METHOD | NOTES |
|--------|--------|------------|-------|
|`GET`| `/users/auth/twitter/`| | |
|`GET`| `/users/auth/linkedin/`| | |
|`GET`| `/users/linkedin_callback`| | |
|`GET`| `/users/SignInPage`| `/` | |
|`GET`| `/users/SignUpPage`| | |
|`POST`| `/users/SignUpPage` | | |
|`POST`| `/users/SignInPage`| | |
|`GET`| `/users/LoginWithTwitterPage`| | |
|`POST`| `/users/validateEmail`| | |
|`GET`| `/users/forgot_password`| | |
|`POST`| `/users/forgot_password`| | |
|`POST`| `/users/webhook_for_subscription`| | |
|`POST`| `/users/webhook_for_pausebot`| | |
|`GET`| `/users/LoginWithTwitter`| | |
|`GET`| `/users/User_Form_Page`| `/user/profile` | |
|`POST`| `/users/User_Form_Page`| | |
|`GET`| `/users/edit_profile`| `/user/profile` | |
|`POST`| `/users/edit_profile`| | |
|`GET`| `/users/delete_profile`| | |
|`GET`| `/users/myAccounts`| | |
|`GET`| `/users/getAccountData/:id`| | |
|`GET`| `/users/delete_account/:account_id`| | |
|`GET`| `/users/getSearchBot/:search_id`| | |
|`GET`| `/users/search/:id/edit`| | |
|`POST`| `/users/search/:id/edit`| | |
|`GET`| `/users/logout`| | |
|`GET`| `/users/user_payment`| | |
|`POST`| `/users/goToPayment`| | |
|`GET`| `/users/upgrade_account`| `/user/upgrade` | |
|`POST`| `/users/updatePayment`| | |
|`POST`| `/users/addUserSubscription`| | | 
|`GET`| `/users/createSearchbot/:id/add`| `/main/assistants/:id#search` | |
|`GET`| `/users/createFollowbot/:id/add`| `/main/assistants/:id#follow` | |
|`GET`| `/users/createFavouritebot/:id/add`| `/main/assistants/:id#favourite`| |
|`POST`| `/users/createSearchbot/:id/add`| | |
|`POST`| `/users/createFavouritebot/:id/add`| | |
|`POST`| `/users/createFollowbot/:id/add`| | |
|`GET`| `/users/followbot/:id/edit`| | |
|`POST`| `/users/followbot/:id/edit`| | |
|`GET`| `/users/favouritebot/:id/edit`| | |
|`POST`| `/users/favouritebot/:id/edit`| | |
|`GET`| `/users/search/:id/changeStatus`| | |
|`GET`| `/users/favouritebot/:id/changeStatus`| | |
|`GET`| `/users/followbot/:id/changeStatus`| | |
|`GET`| `/users/search/:id/delete`| | |
|`GET`| `/users/favouritebot/:id/delete`| | |
|`GET`| `/users/followbot/:id/delete`| | |
|`GET`| `/users/DashBoardPage`| `/main/dashboard/:platform` | |
|`GET`| `/users/view_logs`| `/user/logs` | |
|`POST`| `/users/update_logs`| | |
|`GET` | | `/main/curation`| |
|`GET`| | `/main/reviews` | |
|`GET`| | `/main/logs` | |

## Middleware

- checkPayment()
- checkUserPayment()

