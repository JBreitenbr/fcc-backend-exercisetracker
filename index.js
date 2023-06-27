const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let bodyParser=require("body-parser")
let urlencodedParser= bodyParser.urlencoded({ extended: false});

let mongoose=require('mongoose');

mongoose.connect(process.env .MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let exerciseSchema = new mongoose.Schema({
    userId: {
      type: String,
      required: true
    },
    description:{
    type: String,
    required: true},
    duration:{type: Number, required:true},
    date: { type: Date, default: Date.now }
});

let Exercise=mongoose.model("Exercise",exerciseSchema);
let userSchema = new mongoose.Schema({
    username:{
    type: String,
    required: true},
});

let User=mongoose.model("User",userSchema);

app.post('/api/users',urlencodedParser,(req,res)=>{
  let username=req.body.username;
  let newUser = new User({username:username});

  newUser.save((err,user)=>{
    if(err){console.log(err);}
    else{
      let resObj={};
      resObj["username"]=user.username;
      resObj["_id"]=user._id;
      res.json(resObj);
    }
  })
})

app.get('/api/users',(req,res)=>{
  User.find({},(err,arrUsers)=>{
    if(err){console.log(err);}
    else{res.json(arrUsers)}
  })
})


app.post('/api/users/:_id/exercises',urlencodedParser,(req,res)=>{
  console.log(req.body);
  let userId = req.params._id;
  let desc = req.body.description;
  let dur = parseInt(req.body.duration);
  let date;
if(req.body.date){
  date = new Date(req.body.date);
}
else{date=new Date();}
  User.findById(userId,(err,user)=>{
    
  if(err){res.send("There must be an error");}
    else {
      if(!user){
        res.send("No user corresponding to the input ID")
      }
      else{
        let newExercise = new Exercise({userId: userId,
      description: desc,
      duration: dur,    
      date: date ? new Date(date) : new Date()                           });
                 newExercise.save((err2,exercise)=>{
    if(err2){console.log(err2);}
    else{
      let resObj={};
resObj["_id"]=user._id;
resObj["username"]=user.username;
resObj["description"]=exercise.description; resObj["duration"]=exercise.duration;
resObj["date"]=new Date(exercise.date).toDateString();
      res.json(resObj);
       }
      })
     }
    }
  })
})


app.get('/api/users/:_id/logs', function (req, res) {
	let userId = req.params._id;
	let filter = { userId: userId };
  let from = req.query.from;
  let to = req.query.to;
let dateObj = {}
  if (from) {
    dateObj["$gte"] = new Date(from)
  }
  if (to){
    dateObj["$lte"] = new Date(to)
  }
  if(from || to){
    filter.date = dateObj;
    }

let limit = (req.query.limit !== undefined ? parseInt(req.query.limit) : 0);

User.findById(userId, function (err,user) {
		if (!err) {
			Exercise.find(filter).sort({ date: 'asc' }).limit(limit).exec(function (err2, exercises) {
				if (!err2) {
					return res.json({
						_id: user['_id'],
						username: user['username'],
						log: exercises.map(function (item) {
							return {
								description: item.description,
								duration: item.duration,
								date: new Date(item.date).toDateString()
							};
						}),
						count: exercises.length
					});
				}
			});
		} else {
			return res.json({ error: 'user not found' });
		}
	});
});		

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
