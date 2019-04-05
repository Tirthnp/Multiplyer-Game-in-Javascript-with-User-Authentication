const express = require('express');
const sqlite3 = require('sqlite3');
const hbs = require('express-hbs');
const bodyParser = require('body-parser');
const cookieSession = require("cookie-session");
let jsonParser = bodyParser.json();
const app = express();
const admin = {
        user: "admin",
        password: "admin",
        status:false

        }

const serv= require('http').Server(app);



app.engine('hbs',hbs.express4({
    
    defaultLayout: __dirname+'/views/layout/main.hbs'

}));

const allowedPages=[
    "/",
    "/new",
    "/forgot",
    "/home",
    "/admin",
    "/adminpage",
    "/deleteUser",
    "/editUser",
    "/userpage"
];

//function to check the authentication
function checkAuth(req,res,next){
    if (req.url === "/signout"){ //instead of app.post we used this implementation
        console.log(req.url);
        req.session=null;
        let msg={
            location:"/"
        }
        res.send(JSON.stringify(msg));
    
    }   
    // else   if (req.url ==="/getscore"){
    //     let stuff = req.body;
    //     db.get(`SELECT * FROM highscore WHERE username = ?`,[stuff.user],function (err,row){
    //         if(!err){
    //             res.send(JSON.stringify(row))
    //         }

    //     });

    // }
    else if (req.url==="/getuserhighscore"){
        db.all(`SELECT * FROM highscore`,[],function(err,rows){
            if (!err){
                res.send(JSON.stringify(rows));
            }
        });
    }
    else if (req.url === "/getallusers"){

            db.all(`SELECT * FROM users`,[],function (err,row){
               if(!err){
                console.log(row);
                res.send(JSON.stringify(row));
               }
               else{console.log("error")}
            });
        
    }
    else if (req.url ==="/getUser"){
         // this for game to know the user name
            let name = req.session.user;
            let msg={
                user: name
            }
            res.send(JSON.stringify(msg));
       
    }
    else if (req.url==="/reqeditUser"){
        let msg={
            location:"/userpage"
        }
        res.send(JSON.stringify(msg));
    }
    else if (req.url === "/adminsignout"){
        
            console.log("frm admin:  "+req.session);
            console.log("frm admin:  "+req.url);
            admin.status= false;
            let msg ={
                location: "/"
            }
            req.session =null
            res.send(JSON.stringify(msg));
        
    }
    else if (allowedPages.indexOf(req.url) === -1 ){
        console.log("fjjfjf"+"  "+req.url);
        res.render("notallowed",{
            title:"Page Not Found"
        });
    }
    else if (req.session && req.session.auth){
        console.log("here**");
        next();
    }
    else if (allowedPages.indexOf(req.url) !== -1 ){
        console.log(req.url);
        next();
    }
}



app.set('view engine','hbs');
app.set('views',__dirname+'/views');


//
// data bases
const db = new sqlite3.Database(__dirname+"database.db",function(err){
    if(!err){
        db.serialize(()=>{
            db.run(`PRAGMA foreign_keys = ON`).run(`CREATE TABLE IF NOT EXISTS users(
                username TEXT PRIMARY KEY,
                password TEXT
            )`).run(`CREATE TABLE IF NOT EXISTS highscore(
                username TEXT,
                highscore INTEGER DEFAULT 0,
                    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE
            )`);
            console.log("opened database"); 
        });
        
        
    }
});


//function to create users
function newUser(res,stuff){
    let flag =false;
    db.serialize(()=>{  
    db.get(`INSERT INTO users(username,password) VALUES(?,?)`,[stuff.user,stuff.pass],function(err){
        if(err){
            let msg={
                text:false

            }
            res.send(JSON.stringify(msg));
        }
        else{
            let msg={
                text:true,
                location:"/"
            }
            res.send(JSON.stringify(msg));
        }
    
    }).get(`INSERT INTO highscore(username,highscore) VALUES(?,?)`,[stuff.user,0],function(err){} );
});
        
    
 }

//for checking if the user is in the database 
function checkSignIn(req,res,stuff){
    db.get(`SELECT * FROM users WHERE username = ?`,[stuff.user],function (err,row){
        if (!err){
            if (row){
                console.log(row);
                if (stuff.pass === row.password){
                    console.log("rendering the home page.....");
                    // res.render("homepage",{
                    //     title:"Home"
                    // });
                    req.session.auth = true;
                    req.session.user =stuff.user;
                    
                    let obj = {
                        location:"/home",
                        text: true
                        
                    }
                    res.send(JSON.stringify(obj));
                }
                else{ 
                    req.session.auth=false;
                    let obj = {
                        text: false,
                        msg:"Password did not match"
                    }
                    res.send(JSON.stringify(obj));
                    console.log("User and Pass not match");}
            }
            else{
                req.session.auth=false;
                let obj = {
                    text: false,
                    msg:"no user "+ stuff.user + " in the database"
                }
                res.send(JSON.stringify(obj));
                console.log("NO data in database");
                
            }

        }
        else{console.log("Error loading database");}
    });
    
}

//function to send error page

app.use(cookieSession({
    name:"session",
    secret:"fooo"
}));
app.use(express.static(__dirname+'/Public'));
app.use(checkAuth);

app.get('/',function(req,res){

        console.log("request for homepage");
    if (!admin.status){
        console.log(req.session);
        console.log(req.session.auth); 
        if (!req.session.auth){
            res.render('longin',{
                title:'Welcome:'});

        }
        else{
            res.render("adminlogged",{
                title:"Game"
            });
        }
    }    
    else if(admin.status){
        res.render("adminlogged",{
            title:"Error"
        });
    }
});


app.post('/',jsonParser, function(req,res){
    let stuff = req.body;
    console.log(stuff);
    
    checkSignIn(req,res,stuff);
   // checkUser();//for checking if the username and password matches
    
});

// req from clicking new to the website
app.get('/new',jsonParser,function(req,res,next){
    if (admin.status){
        res.render("adminlogged",{
            title:"ERROR"
        });
    }
    else{
        if (!req.session.auth){
            res.type('.html');
            res.render('register',{
                title:'Registration'
            });}
            else {
                res.render("loggedin",{
                    title:"Error"
                });
            }
        
    }
     
});

//req from clicking forgot from the homepage
app.get("/forgot",function(req,res){
    if(admin.status){ // this means admin is logged in 
        res.render("adminlogged",{
            title: "Error"
        });
    }
    else {
        if (!req.session.auth){
            res.type('.html');
            res.render('forgot',{
                title:'Registration'
            });}
            else {
                res.render("loggedin",{
                    title:"Error"
                });
            }
    }
});
app.get("/home",function(req,res){
    if (admin.status){
        res.render("adminlogged",{
            title:"ERROR"
        });
    }
    else{
        if(req.session.auth){ res.render("game",{
            title:"Game",
            
        });}
        else{
            res.render("longin",{
                title:"Welcome"
            });
        }
    
       

    }
    
});
app.get("/admin",function(req,res){
    
    if(req.session.auth){
        res.render("adminlogged",{
            title:"Unavailable"
        });
    }
    if (admin.status){
        res.render("adminpage",{
            title:"Admin Page"
        });
    }
    res.render("admin",{
        title:"Admin Page"
    });

});
app.post('/new',jsonParser,function(req,res){
    let stuff = req.body;
    console.log(stuff);
    newUser(res,stuff);
});

app.post("/forgot",jsonParser,function(req,res){
    let stuff = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`,[stuff.user],function (err,row){
        if (!err){
            if (row){
                let msg ={
                    password:"Your Password is " + row.password
                }   
                console.log("got user sending the password");
                res.send(JSON.stringify(msg));
            }
            else{
                let msg ={
                    password: "No user: " + stuff.user + " found!"              } 
                console.log("NO data in database");
                res.send(JSON.stringify(msg));
                
            }

        }
        else{
            let msg ={
                password: "No user: " + stuff.user + " found!"              } 
            console.log("NO data in database");
            res.send(JSON.stringify(msg)); 
    }
    });
    

});
app.post("/admin",jsonParser, function(req,res){
    let stuff = req.body;
    if (stuff.user === admin.user && (stuff.pass === admin.password)){ 
       admin.status= true 
       let msg ={
           text: true,
           location:"/adminpage"
       }
       res.send(JSON.stringify(msg));
    }
    else {
        let msg ={
            text: false,
            location: "You do not have access to this page"
        }
        res.send(JSON.stringify(msg));
    }
});
app.get("/adminpage",jsonParser,function(req,res){
    
    
    if (admin.status){
      
             
                res.render("adminpage",{
                    title:"Admin Page",
                   
                    });
             
                
      
      
                  
    }
    else{
        res.render("notallowed",{
            title:"Error"
        });
    }
});

app.post("/deleteUser",jsonParser,function(req,res){
        let stuff =req.body;
        db.run(`DELETE FROM users WHERE username=?`, [stuff.user],
            function( err) { if (!err) { 
                let msg={
                    location:"/adminpage"
                }
                res.send(JSON.stringify(msg)); } }
        );
    
});
////directing the request to the user page
app.get("/userpage",jsonParser,function(req,res){
    if (req.session.auth){
        res.render("user",{
            title:"User Page",
            user: req.session.user
        });
    }
    else{
        res.render("notallowed",{
            title:"Error"
        });
    }
});
app.post("/editUser",jsonParser,function(req,res){
    let stuff = req.body;
    console.log("upadte pass"+stuff.password);
    db.run(`UPDATE users SET password=? WHERE username=?`,[stuff.password,req.session.user],function(err){
        if(!err){
            let msg = {
                text:"Password Updated"
            }
            res.send(JSON.stringify(msg));
        }
        else{
            console.log("error")
        }
    });

});
getRandomColor=function() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }



///////////////////////////game engine////////////////////////////////////
var socketList={};

var entity = function() {
    var self ={
        posx:250,
        posy:250,
        speedx:0,
        speedy:0,
        id:""
    }
    self.update = function(){
        self.updatePos();
    }
    self.updatePos= function(){
        self.posx += self.speedx;
        self.posy +=self.speedy;
    }
    self.getdist=function(pt){
        return Math.sqrt(Math.pow(self.posx-pt.posx,2)+Math.pow(self.posy-pt.posy,2));
    }
    self.getdistbul=function(pt){
        return Math.sqrt(Math.pow(self.posx-5-pt.posx,2)+Math.pow(self.posy-5-pt.posy,2));
    }
    self.getdistrect=function(pt){
        return Math.sqrt(Math.pow(self.posx-5-pt.posx-(pt.width/2),2)+Math.pow(self.posy-5-pt.posy-(pt.height)/2,2));
    }
    return self;
}
var Player= function(id){
    var self = entity();
    self.id=id;
    
    self.goRight=false;
    self.goLeft=false;
    self.goUp=false;
    self.goDown=false;
    self.maxspeed=10; 
    self.attack=false;
    self.shootingangle=0;
    self.highscore=0;
    self.radius = 11;
    self.posx=Math.floor(Math.random()* (695-self.radius)+self.radius);
    self.posy=Math.floor(Math.random()* (595-self.radius)+self.radius);
    self.color=getRandomColor();
    self.score=0;
    self.dead=false;
    self.respawn=false;
    self.username="";
    var entity_update = self.update;
    
    self.update= function(){
        self.updateSpeed();
        entity_update();
        self.checkpos();
        
        if(self.attack){
            self.shoot(self.shootingangle);
            self.attack=false;
        }
        if(self.radius < 5)
        {
            self.dead=true;
        }
    }
    self.shoot=function(angle){
        if(self.score % 5==0)
        {
            let temp=0;
            for(let i=0; i<10 ;i++)
            {
                const bul = Bullet(self,temp);
                bul.posx=self.posx;
                bul.posy=self.posy;
                temp=temp+360/10;
            }
        }
        else
        {
            const bul = Bullet(self,angle);
            bul.posx=self.posx;
            bul.posy=self.posy;
        }
        
    }
    self.updateSpeed=function(){
        if(self.goDown)
            self.speedy =self.maxspeed;
        else if (self.goUp)
            self.speedy =-1*self.maxspeed;
        else
            self.speedy=0;
        if(self.goLeft)
            self.speedx =-1*self.maxspeed;
        else if(self.goRight)
            self.speedx =self.maxspeed;
        else
            self.speedx=0;
    };
    self.checkpos=function(){
        if(self.posx<self.radius)
            self.posx=0+self.radius;
        if(self.posx>700-self.radius)
            self.posx=700-self.radius;
        if(self.posy<self.radius)
            self.posy=0+self.radius;
        if(self.posy>600-self.radius)
            self.posy=600-self.radius;
    }
    Player.list[id] = self;
    return self;
};
Player.list={};
Player.connect=function(socket){
    var player=Player(socket.id);
    socket.on('username',function(name){
        player.username=name.user;
        db.get(`SELECT highscore FROM highscore WHERE username=?`,[player.username],function(err,row){
            console.log(row);
            player.highscore=row.highscore;
        });
    
       // db.run('INSERT INTO highscore(username,highscore) VALUES(?,?)',[player.username,player.highscore],
         //   function( err) { if (!err) {  } }
    
       // );
        
        
    });
    console.log('player'+player.username);
    socket.on('keyPressed',function(state){
        if(state.input == 'up')
            player.goUp=state.press;
        if(state.input=='right')
            player.goRight=state.press
        if(state.input == 'left')
            player.goLeft=state.press;
        if(state.input=='down')
            player.goDown=state.press;
        if(state.input=='attack')
            player.attack=state.press;
        if(state.input=='mouseAngle')
        {
            let cy =state.y-player.posy-8;
            let cx= state.x-player.posx-8;
            let angle = Math.atan2(cy,cx)/Math.PI *180;
            player.shootingangle=angle;
        }
        
     

    });
}
Player.disconnect=function(socket){
    delete Player.list[socket.id];
}
Player.update= function(){
    var playerPack=[];
    for(var i in Player.list)
    {
        let player= Player.list[i];
        player.update();
        if (player.dead)
        {
            player.respawn=true;
            player.dead=false;
        }
        if(player.respawn)
        {
            player.respawn=false;
            
            if(player.score>player.highscore)
            {   
                player.highscore=player.score;
                db.run('UPDATE highscore SET highscore=? WHERE username=?',[player.highscore,player.username],
            function( err) {});
                //db.get("SELECT highscore FROM highscore WHERE username=?",[player.username],function(error,row){
                 //   d
               // });

            }
            
            player.score=0;
            player.radius=11;
            player.posx=Math.floor(Math.random()* (695-player.radius)+player.radius);
            player.posy=Math.floor(Math.random()* (595-player.radius)+player.radius);
        }
        playerPack.push({
            x:player.posx,
            y:player.posy,
            radius:player.radius,
            color:player.color,
            username:player.username,
            highscore:player.highscore
        });
        // console.log("Player name = "+player.username+" has high score of :"+player.highscore);
    }
    return playerPack;
}

var Bullet = function(parent,tangle){
    var self = entity();
    self.id= Math.random();
    self.speedx= Math.cos(tangle/180*Math.PI)*10;
    self.speedy = Math.sin(tangle/180*Math.PI)*10;
    self.time=0;
    self.parent=parent;
    self.dead =false;
    var entity_update = self.update;
    self.update = function(){
        if(self.time++ > 20)
            self.dead = true;
        entity_update();
        for(var i in Player.list){
            var p = Player.list[i];
            if(self.getdistbul(p)<5+p.radius && self.parent.id !== p.id){
                self.dead=true;
                p.radius=p.radius-5;
                self.parent.score=self.parent.score+2;
            }
        }
        for(let i in Enemy.list)
        {
            var e = Enemy.list[i];
            if(self.getdistrect(e)<5+(e.width+e.height)/2 ){
                self.dead=true;
                e.dead=true;
                self.parent.score=self.parent.score+1;
            }
        }
    }
    Bullet.list[self.id]=self;
    return self;
};
Bullet.list={};

Bullet.update= function(){
    
    var bulletpack=[];
    
    for (var i in Bullet.list){
        var bullet =Bullet.list[i];
        bullet.update();
        if(bullet.dead)
        {
            delete Bullet.list[i];
        }
        bulletpack.push(
            {
                x:bullet.posx,
                y:bullet.posy
            }
        );
        
    }
    return bulletpack;
}
var Enemy = function(){
    let self = entity();
    self.id= Math.random();
    self.width= Math.floor(Math.random() * (20 - 3) + 3);
    self.height = Math.floor(Math.random()* (20-3)+3);
    self.speedx = Math.floor(Math.random()* (5-3)+3);
    self.speedy = Math.floor(Math.random()* (5-3)+3);
    self.posx=Math.floor(Math.random()* (700-self.width-0)+0);
    self.posy=Math.floor(Math.random()* (600-self.height-0)+0);
    self.dead =false;
    
    Enemy.list[self.id]=self;
    var entity_update = self.update;
    self.update = function(){
        entity_update();
        
        if(self.posx+self.width>700)
        {
            self.speedx=-1*self.speedx;
        }
        if(self.posx<0)
        {
            self.speedx=-1*self.speedx;
        }
        if(self.posy+self.height>600)
        {
            self.speedy=-1*self.speedy;
        }
        if(self.posy<0)
        {
            self.speedy=-1*self.speedy;
        }
        for(var i in Player.list){
            var p = Player.list[i];
            if(self.getdist(p)-p.radius-self.width < 0  ){
                self.dead=true;
                p.radius=p.radius-2;
            }
        }
    }
    return self;
}
Enemy.list={};
Enemy.update= function(){
    
    var enemypack=[];
    
    for (var i in Enemy.list){
        var enemy =Enemy.list[i];
        enemy.update();
        if(enemy.dead)
        {
            delete Enemy.list[i];
        }
        enemypack.push(
            {
                x:enemy.posx,
                y:enemy.posy,
                width:enemy.width,
                height:enemy.height

            }
        );
        
        
    }
    return enemypack;
}
let Energy= function(){
    let self = entity();
    self.id= Math.random();
    self.radius = 5;
    self.dead=false;
    self.timer=0;
    self.posx=Math.floor(Math.random()* (695-self.radius)+self.radius);
    self.posy=Math.floor(Math.random()* (595-self.radius)+self.radius);
    var entity_update = self.update;
    Energy.list[self.id]=self;
    self.update = function(){
        entity_update();
        if(self.timer++ > 100)
            self.dead = true;
        for(var i in Player.list){
            var p = Player.list[i];
            if(self.getdist(p)-p.radius-self.radius < 0  ){
                p.radius=p.radius+5;
                self.dead=true;
            }
        }
    }
    //console.log('self',self);
    return self;

}
Energy.list={};
Energy.update= function(){
    
    var energypack=[];

    for (var i in Energy.list){
        var energy =Energy.list[i];
        energy.update();
        if(energy.dead)
        {
            delete Energy.list[i];
        }
        energypack.push(
            {
                x:energy.posx,
                y:energy.posy,
                radius:energy.radius

            }
        );
        
        
    }
    //console.log('pack'+energypack)
    return energypack;
}
var io= require('socket.io')(serv,{});
io.sockets.on('connection',function(socket){
    socket.id = Math.random();
    socketList[socket.id]=socket;
    console.log('socket connection');
    Player.connect(socket);
    socket.on('disconnect',function(){
        delete socketList[socket.id];
        Player.disconnect(socket);
    });

    socket.on('chattoserver',function(chat){
        for(let i in socketList){
            socketList[i].emit('addchat',chat);
        }
    });
    
    
    
});

setInterval(function(){
    if(Math.random()<0.04)
    {
        Enemy();
    }
    if(Math.random()<0.01)
    {
        Energy();
    }
    var info ={
        player : Player.update(),
        bullet : Bullet.update(),
        enemy : Enemy.update(),
        energy : Energy.update()
    }
    


    
    for(var i in socketList){
        var socket=socketList[i];
        socket.emit('newposition',info);
        for(let i in Player.list)
        {
            if(i==socket.id)
            {
                socket.emit('score',{score:Player.list[i].score, highscore:Player.list[i].highscore});
            }
        }
      
        
    }
   
},1000/25);






const port = process.env.PORT || 8000;
// app.listen();
serv.listen(port,()=>console.log("Listening on port ${port}!"));
