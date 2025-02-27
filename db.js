const {Pool} =require("pg")
require('dotenv').config()

///.config() is a method provided by the dotenv package that reads the .env file and loads its contents into process.env.

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: {rejectUnauthorized: false}
})

pool.on('error', (err)=>{
    console.error('unexpected client error', err)
    process.exit(-1)
})

module.export = pool;