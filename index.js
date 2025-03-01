const pool = require('./db')
const express= require('express')
const app = express()
const cors = require('cors')
const bcrypt = require('bcryptjs')
const session = require('express-session')
const bodyParser= require('body-parser')
const port = 5000



///middleware
app.use(cors({ origin: "https://ums-ffa.netlify.app", credentials: true }))
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
        const q="SELECT * FROM users WHERE email=$1"
        const r=await pool.query(q, [email])

        if(r.rows.length > 0){
            return res.status(400).json({message: "Email already exist"})
        }
        const hashPass= await bcrypt.hash(password, 10)
        const iq= "Insert INTO users (name, email, password) Values ($1, $2, $3)  RETURNING *"
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

app.post('/login', async(req, res)=>{
    try{

        const {email, password}= req.body;
        const q= "Select * from users Where email=$1"
        const result= await pool.query(q, [email])

        if(result.rows.length===0){
            return res.status(404).json({message: "Email is not registered"})
        }

        const isPassCorrect = await bcrypt.compare(password, result.rows[0].password)

        if(!isPassCorrect){
            return res.status(403).json({message: "Password is incorrect"})
        }
        if(result.rows[0].status==="blocked"){
            return res.status(402).json({message: "Your Account is Blocked"})
        }

        const upQ= "Update users SET last_login = NOW() Where email = $1 RETURNING *"
        const rslt = await pool.query(upQ, [email])

        req.session.user ={
            id: rslt.rows[0].id,
            email: rslt.rows[0].email,
            name: rslt.rows[0].name,
            status: rslt.rows[0].status,
            last_login: rslt.rows[0].last_login

        };

        return res.status(201).json({message: "Logged In Successfully", user: req.session.user})



    }catch(err){
       console.error(err.message)
       res.status(500).json({message: "Server Error!!!"})
    }
})

app.post('/logout', async (req, res)=>{
        req.session.destroy((err)=>{
        if(err){
            return res.status(500).json({message: "logout failed"})
        }
       res.clearCookie('connect.sid')
        return res.status(200).json({message: "logout successfully"})
    })

})

app.get('/getData', async (req, res) => {
    try {
        const q = "SELECT * FROM users";
        const rslt = await pool.query(q); 
        return res.json(rslt.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" }); 
    }
});

app.post('/deleteUser', async (req, res)=>{

    try{

        const {selectedItems}=req.body;

        const q=`DELETE FROM users WHERE id = ANY($1::int[])`

        const result= await pool.query(q, [selectedItems])

        if (result.rowCount > 0) {
            return res.status(200).json({ message: `${result.rowCount} users deleted successfully` });
          } else {
            return res.status(404).json({ message: "No users found with the provided IDs" });
          }

    }catch(err){
        console.error(err.message)
    }

})

app.post('/blockUser', async (req, res)=>{

    try{
        const {selectedItems}=req.body
        const q=`Update users SET status='blocked' where id = ANY($1::int[])`
        const result= await pool.query(q,[selectedItems])

        if (result.rowCount > 0) {
            return res.status(200).json({ message: `${result.rowCount} users deleted successfully` });
          } else {
            return res.status(404).json({ message: "No users found with the provided IDs" });
          }




    }catch(err){
        console.error(err.message)
    }

})

app.post('/unBlockUser', async (req, res)=>{

    try{

        const {selectedItems}= req.body
        const q=`Update users SET status= 'active' Where id= ANY($1::int[])`
        const result= await pool.query(q, [selectedItems])
        
        if (result.rowCount > 0) {
            return res.status(200).json({ message: `${result.rowCount} users deleted successfully` });
          } else {
            return res.status(404).json({ message: "No users found with the provided IDs" });
          }



    }catch(err){
         
        console.error(err.message)
    }

})


app.listen(port, ()=>{
    console.log("Server Running on: http://localhost:"+ port)
})
