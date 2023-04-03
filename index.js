const { google } = require('googleapis');
const { client_email, private_key } = require('./keys.json');
const { ThirdwebSDK } = require("@thirdweb-dev/sdk/solana");
const { Connection, clusterApiUrl } = require("@solana/web3.js");
const fs = require('fs');
const cron = require('node-cron');

require('dotenv').config();


const nodemailer = require('nodemailer');


const pk = process.env.PRIVATE_KEY
const program_address = process.env.PROGRAM_ADDRESS
const network = process.env.NETWORK



const jwtClient = new google.auth.JWT(
    client_email,
    null,
    private_key, ['https://www.googleapis.com/auth/spreadsheets'],
);

const sheets = google.sheets({ version: 'v4', auth: jwtClient });
const spreadsheetId = process.env.SPREAD_SHEET_ID;



async function sendEmail(to, subject, text) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_PASS;
    const from = process.env.FROM_EMAIL;

    try {
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: user, // replace with your email
                pass: pass, // replace with your password
            },
        });

        let info = await transporter.sendMail({
            from: from, // replace with your email
            to: to, // the email address of the recipient
            subject: subject, // the subject of the email
            text: text, // the text content of the email
        });

        console.log(`Email sent to ${to}: ${info.messageId}`);
    } catch (error) {
        console.error(error);
    }
}


const getSdk = () => {
    return ThirdwebSDK.fromPrivateKey(network, pk);
}

const getSigner = () => {
    const sdk = getSdk();
    const signer = sdk.wallet.getSigner()
    return signer;
}

const creatToken = async () => {
    const sdk = getSdk();
    const address = await sdk.deployer.createToken({
        symbol: "TTT",
        name: 'Teh Tab Token',
        image: 'https://portal.thirdweb.com/img/thirdweb-logo-transparent-white.svg',
        decimals: 9,
        initialSupply: 1000,
    })
    // This will log out the address of our newly minted NFT Drop
    return address;
}

const metadata = async () => {
    const sdk = ThirdwebSDK.fromPrivateKey(network, pk);
    const signer = getSigner()
    sdk.wallet.connect(signer);
    // Get the interface for your token program
    const program = await sdk.getProgram(program_address, "token");
    const meta = await program.getMetadata();
    return meta;
}

const mint = async () => {
    // Specify the address to mint tokens to
    const address = "8wQ3SEfdQbmRTG67xcmkkZGM5ziwjdc5hhcQzWXRDNVC";
    const program = await getSdk().getProgram(program_address, "token");
    // And the amount of tokens to mint
    const amount = 77;
    // And then you can make a mint transaction
    const tx = await program.mintTo(address, amount);
    return tx;
}

const trxConfirmation = async (tx) => {

    const connection = new Connection(clusterApiUrl(network));
    const latestBlockHash = await connection.getLatestBlockhash();
    const result = await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: tx.signature,
    });
    return result;
}

const transfer = async (to_address, amount) => {
    // Specify the address to transfer tokens to
    const program = await getSdk().getProgram(program_address, "token");
    // And then you can make the transfer transaction
    const tx = await program.transfer(to_address, amount);
    const result = await trxConfirmation(tx);
    console.log(result);
    return tx;
}


function readCountFromJsonFile(filePath, callback) {
    let count = 0;
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        const jsonData = JSON.parse(data);
        count = jsonData.count;
        callback(count)
    });

}

function createJsonFileWithCount(filePath, count) {
    const data = { count: count };
    const jsonData = JSON.stringify(data, null, 2); // convert the data to formatted JSON string

    fs.writeFile(filePath, jsonData, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`Created ${filePath} with count: ${data.count}`);
    });
}


async function updateSheet(row_num) {

    const row = row_num + 1;
    const response = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
    })

    const spreadsheetName = response.data.sheets[0].properties.title;

    const escapedSheetName = `'${spreadsheetName.replace(/'/g, "\\'")}'`; // Escape single quotes
    // const range = `${escapedSheetName}!A2:F`; // Replace with the range of cells you want to read
    // const range = `${escapedSheetName}!A2:G`; // Replace with the range of cells you want to read
    // Next, update the value in the "sent" column of that row
    const sentColumn = 'G'; // Assuming "sent" is the 6th column (column F)
    const sentCell = `${sentColumn}${row}`;
    const sentRange = `${escapedSheetName}!${sentCell}:${sentCell}`;



    const service = google.sheets({ version: 'v4', auth: jwtClient });

    try {


        const request = {
            spreadsheetId,
            range: sentRange,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [
                    ['ok']
                ],
            },
        };

        const response = await service.spreadsheets.values.update(request);
        console.log(`${response.data.updatedCells} cells updated in range ${sentRange}`);

    } catch (err) {
        // TODO (developer) - Handle exception
        console.log('err :>> ', err);
        throw err;
    }

}


async function readSpreadSheet() {
    const filePath = "data.json"
    const response = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
    })

    const spreadsheetName = response.data.sheets[0].properties.title;

    const escapedSheetName = `'${spreadsheetName.replace(/'/g, "\\'")}'`; // Escape single quotes
    const range = `${escapedSheetName}!A2:F`; // Replace with the range of cells you want to read

    const response_2 = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range
    })

    const data = response_2.data.values;

    if (data.length) {

        readCountFromJsonFile(filePath, async function (count) {
            // 10, 12
            const data_length = data.length;
            // 2, 14
            if (count < data.length) {
                for (let index = count; index < data_length; index++) {

                    const sheet_row = data[index];

                    const row = {
                        date: sheet_row[0],
                        email: sheet_row[1],
                        status: sheet_row[2],
                        order_amount: sheet_row[3],
                        token_amount: sheet_row[4],
                        solanaAddress: sheet_row[5],
                    };


                    const { token_amount, solanaAddress } = row;

                    console.log(`sending ${token_amount} number of tokens to ${solanaAddress}`)

                    await transfer(solanaAddress, token_amount)

                    updateSheet(index + 1)

                    // await sendEmail('', `${token_amount} TTT tokens are sent to you`, 'You have received .....');

                    console.log(`sent ${token_amount} number of tokens to ${solanaAddress}`)

                }


                createJsonFileWithCount(filePath, data_length)

            } else {
                console.log(count, data_length)
                // other stuff
            }


        })

    }



}

// Schedule the function to run every 2 minutes
cron.schedule('*/2 * * * *', () => {
    // Call your function here
    console.log('Function called at:', new Date());
    // readSpreadSheet().then(e => {
    //     console.log('e :>> ', e);
    // })
});