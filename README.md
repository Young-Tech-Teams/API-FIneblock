# Create Service Account

1. ### [Google Console](https://console.cloud.google.com/apis/credentials?authuser=2)
   or you can send me your email, I will make it owner
2. CREATE CREDENTIALS ( CLICK )
3. SERVICE ACCOUNT ( CLICK AND FOLLOW THE STEPS), sometimes you need to do the OAuth consent screen
4. once completed a json file will be downloaded automatical
5. paste that in keys.json
6. set PRIVATE_KEY IN .env file
7. set the SPREAD_SHEET_ID in .env file
8. now go the the google spread sheet and open it on browser and make the client_email on the json file editor
9. update the env for the smtp things i.e GMAIL_USER, GMAIL_PASS, and FROM_EMAIL
10. update .env and update the NETWORK TO mainnet-beta when using for production else to devnet.
11. uncomment the `await sendEmail ` line in the `readSpreadSheet` function after update the GMAIL details in .env
12. before launching it to product update the `data.json` count to `0`
# API-FIneblock
