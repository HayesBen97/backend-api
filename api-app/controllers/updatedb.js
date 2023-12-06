let mysql = require('mysql');
let db = mysql.createConnection({
host     : process.env.RDS_HOSTNAME,
user     : process.env.RDS_USERNAME,
password : process.env.RDS_PASSWORD,
port     : process.env.RDS_PORT
});
db.connect(function(err) {
if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
}
console.log('Connected to database.');
});

db.end();

export async function selectDB(req, res) {
    try {
    }catch(err) {
    console.log(err)
    }
    return res
}
