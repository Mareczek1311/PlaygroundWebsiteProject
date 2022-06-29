
                    //isStarted            playerList
//      games[room] = [false,null,null, [[data.userName,socket.id, 0]]]


const express = require("express");

const { createServer } = require("http");
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const e = require("express");
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    transports: ['websocket', 'polling'],
    credentials: false
},
allowEIO3: true
});





instrument(io, {
  auth: false,
  serverId: `${require("os").hostname()}#${process.pid}`,

});


httpServer.listen(3001);

const words = [
  {name: 'kubek', hint:'You can drink in it'},
  {name: 'marek', hint:'You can eat on it'}
]

var games = {

}


const typeRacerData = [
  "rat",
  "stingy",
  "own",
  "hapless",
  "unknown",
  "regret",
  "weigh",
  "stroke",
  "imperfect",
  "squeak",
  "valuable",
  "choke"
]

var dict = new Set()
var arr = []
isStarted = new Boolean(false)

io.on("connection", (socket) => {
  if(isStarted == false)
  {
    
    var fs = require("fs");

    text = fs.readFileSync("./bazaDanych.txt").toString('utf-8');
    arr = text.split("\n")
    dict = new Set(arr)
    console.log("DATA UPLOADED")
    isStarted = true

  }
  socket.on("join_room", (data) => {
    console.log(socket.id, data.room, data.userName)
    io.to(socket.id).emit("getSocket", socket.id)
  
    if(data.room == null)
    {
      var room = Math.floor(Math.random() * 10000)
      while(room in games){
        var room = Math.floor(Math.random() * 10000)
      }
    }
    else{
      room = data.room
    }
    room = 123
    socket.join(room);
    socket.userName = data.userName 
    if(!(room in games))
    {
      games[room] = [false,null,null, [[data.userName,socket.id, 0]], 0]
    }
    else{
      games[room][3].push([data.userName, socket.id, 0]) 
    }

    io.in(room).emit("get_Player_List", {player_List: games[room][3], room: room})
    console.log(games)

  });

  socket.on("disconnecting", () => {
    let currRoom = null
    console.log(socket.rooms)

    for(let key in games){
      for(let j = 0; j < games[key][3].length; j++)
      { 
        if(socket.rooms.has(games[key][3][j][1]))
        {
          console.log(games[key][3].splice(j))
          currRoom = key  
          console.log("DELETED PLAYER")    
        }
      }
      if(games[key][3].length == 0){
        console.log("SERVER SHUTDOWN")
        delete games[key]
      } 
    }
    if(games[123])   
    {
      io.in(123).emit("get_Player_List", {player_List: games[currRoom][3]})
    }
    console.log(currRoom)
    console.log(games)
  });

  socket.on("typeracer", data => {
  if(data.room in games)
  {
    if(games[data.room][0] == false)
    {
      var ws = []
      for(let i = 0; i < 12; i++)
      {
        ws.push({word:typeRacerData[Math.floor(Math.random()*typeRacerData.length)], state:"grey"})
      }
      io.in(data.room).emit("state_of_server", {wordSet: ws})
      games[data.room][0] = true
      games[data.room][1] = ws
      games[data.room][2] = "typeracer"
     
        var x = setInterval(function(){
          io.in(data.room).emit('counter', true);
          clearInterval(x);
        }, 8000);
      
  } 
}
})

socket.on("done", data => {
  //inx 4
  console.log("done")
  games[data.room][4] += 1
  if(games[data.room][4] == games[data.room][3].length){
    io.to(data.room).emit("getStateWordle", {bool:true, word:games[data.room][1]})
  } 
})

socket.on("guess", data => {
  startGame(data)
})

const startGame = (data) =>  {
  if(data.room in games)
  {
    if(games[data.room][0] == false)
    {
      matrix = []
      for(let i=0;i<=5;i++){
        matrix.push([])
        for(let j=0; j<=4; j++){
          matrix[i].push(' ')
        }
      }

      var item = arr[Math.floor(Math.random() * arr.length)];
      io.in(data.room).emit("state_of_server", {bool:true, word:item, game:"guess", matrix: matrix, word:item})
      games[data.room][0] = true
      games[data.room][1] = item
      games[data.room][2] = "guess"
      games[data.room][4] = 0
    }
  }
}

socket.on("check", data => {
  if(games[data.room][1] != null)
  {
    console.log(data.word)
    console.log(games[data.room][1])
    if(data.word == games[data.room][1]){
      io.in(data.room).emit("reveive_winner", {userName: data.userName, message: data.word})
      
      for(let i=0; i<games[data.room][3].length; i++)
      {
        if(games[data.room][3][i][0] == data.userName)
        {
          games[data.room][3][i][2] += 1
        }
      }
      io.in(data.room).emit("get_Player_List", {player_List: games[data.room][3], room: data.room})

      var x = setInterval(function(){
        if(games[data.room])
        {
          games[data.room][0] = false
          games[data.room][1] = null
          games[data.room][2] = null
          games[data.room][4] = 0
          io.in(data.room).emit("back_to_menu", {userName: data.userName, message: data.word})
        }
        clearInterval(x);
      }, 5000);
    }
    else{
      if(dict.has(data.word))
      {
        io.to(data.sc).emit("getStateWordle", {bool:true, word:games[data.room][1], wordle:data.word, ci:data.ci, matrix:data.matrix})
      }
      else{
        io.to(data.sc).emit("getStateWordle", {bool:false, word:games[data.room][1], wordle:data.word, matrix:data.matrix})


      }
    }
  }
  else{
    socket.to(data.room).emit("receive_message", {message: data.word, userName: data.userName})
  }
})
});
//games[room] = [false,null,null, [[data.userName,socket.id, 0]], 0]