var express=require('express')
var path=require('path')
var http=require('http')
var Filter=require('bad-words')
var socketio=require('socket.io')
var {generateMessage,generateLocationMessage}=require('./utils/messages')
var {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')

var app=express()
var server=http.createServer(app)
var io=socketio(server)

var publicDirectoryPath=path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))


io.on('connection',(socket)=>{
    console.log("New Websocket Connection")
    
    socket.on('join',(options,callback)=>{

        const {error,user}=addUser({id:socket.id,...options})

        if(error){
           return callback(error)
        }
        socket.join(user.room)
        socket.emit('message',generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin', user.username+' has joined!'))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })
    

    socket.on('sendMessage', (message,callback)=>{
        var user=getUser(socket.id)
        var filter= new Filter()

        if(filter.isProfane(message)){
            return callback('Bad-wwords not allowed')
        }

        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })
    
    socket.on('sendLocation',(coords,callback)=>{
        var user=getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,'https://www.google.com/maps?q=' +coords.latitude+","+ coords.longitude))
        callback()
    })

    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        
        if(user){
            io.to(user.room).emit('message',generateMessage(user.username+' has left.'))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
        
    })
    // socket.emit('countUpdated',count)

    // socket.on('increment',()=>{
    //     count++
    //   //  socket.emit('countUpdated',count)
    //     io.emit('countUpdated',count)
    // })
})

server.listen(3000,function(){
    console.log("Server is on port 3000")
})