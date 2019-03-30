var express = require('express');
var app= express();
var serv= require('http').Server(app);

app.get('/',function(req,res){
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client',express.static(__dirname + '/client'));

serv.listen(2000);
console.log('Server started');


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
    return self;
}
var Player= function(id){
    var self = entity();
    self.id=id;
    self.number=""+Math.floor(10*Math.random());
    self.goRight=false;
    self.goLeft=false;
    self.goUp=false;
    self.goDown=false;
    self.maxspeed=10; 
    self.attack=false;
    self.shootingangle=0;
    var entity_update = self.update;
    
    self.update= function(){
        self.updateSpeed();
        entity_update();
        if(self.attack){
            self.shoot(self.shootingangle);
            self.attack=false;
        }
    }
    self.shoot=function(angle){
        const bul = Bullet(self,angle);
        bul.posx=self.posx;
        bul.posy=self.posy;
        //console.log(bul.posx);
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
    Player.list[id] = self;
    return self;
};
Player.list={};
Player.connect=function(socket){
    var player=Player(socket.id);
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
            player.shootingangle=state.press;

    });
}
Player.disconnect=function(socket){
    delete Player.list[socket.id];
}
Player.update= function(){
    var playerPack=[];
    for(var i in Player.list)
    {
        var player= Player.list[i];
        player.update();
        playerPack.push({
            x:player.posx,
            y:player.posy,
            number:player.number
        });
        
    }
    return playerPack;
}

var Bullet = function(parent,tangle){
    var self = entity();
    self.id= Math.random();
    self.speedx= Math.cos(tangle/180*Math.PI)*10;
    self.speedy = Math.sin(tangle/180*Math.PI)*10;
    console.log('tangle',tangle);
    console.log('parent',parent);
    self.time=0;
    self.parent=parent;
    self.dead =false;
    var entity_update = self.update;
    self.update = function(){
        if(self.time++ > 100)
            self.dead = true;
        entity_update();
        for(var i in Player.list){
            var p = Player.list[i];
            if(self.getdist(p)< 32 && self.parent.id !== p.id){
                self.dead=true;
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
    
    
});

setInterval(function(){
    var info ={
        player : Player.update(),
        bullet : Bullet.update()
    }
    
    for(var i in socketList){
        var socket=socketList[i];
        socket.emit('newposition',info);
        
    }
   
},1000/25);