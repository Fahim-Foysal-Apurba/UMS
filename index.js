const pool = require('./db')
const express= require('express')
const app = express()
const cors = require('cors')
const bcrypt = require('bcrypt')
const session = require('express-session')
const bodyParser= require('body-parser')
const port = 5000



///middleware
app.use(cors())
app.use(express.json())
app.use(bodyParser.json())

app.use(session({
    secret: 'foysal',
    resave: false,
    saveUninitialized: false,
    cookie: {

        secure: false,
        httpOnly: true,
        maxage: 24*60*60*1000

    }

}))


app.post('/register', async (req, res)=> {
    
      try{
        
        const {name, email, password}= req.body;
        const q="Select * form users Where email=$1"
        const r=await pool.query(q, [email])

        if(r.rows.length > 0){
            return res.status(400).json({message: "Email already exist"})
        }
        const hashPass= await bcrypt.hash(password, 10)
        const iq= "Insert into users (name, email, password) Values ($1, $2, $3)  RETURNING *"
        const result= await pool.query(iq, [name, email, hashPass])

        req.session.user ={

            id: result.rows[0].id,
            email: result.rows[0].email,
            name: result.rows[0].name,
            status: result.rows[0].status,
            last_login: result.rows[0].last_login
        };

        res.status(201).json({message: "User Registered Succesfuly", user: req.session.user})

      }catch(err){
        console.error(err.message)
        res.status(500).json({message: "Server Error!!!"})
      }
})


app.listen(port, ()=>{
    console.log("Server Running on: http://localhost:"+ port)
})
