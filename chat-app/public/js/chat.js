var socket=io() 

var $messageForm=document.querySelector('#message-form')
var $messageFormInput= $messageForm.querySelector('input')
var $messageFormButton= $messageForm.querySelector('button')
var $location=document.querySelector('#send-location')
var $messages=document.querySelector('#messages')


var messageTemplate=document.querySelector('#message-template').innerHTML
var locationTemplate=document.querySelector('#location-template').innerHTML
var sidebarTemplate=document.querySelector('#sidebar-template').innerHTML

var {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

var autoscroll = ()=>{
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message',(message)=>{
    console.log(message)
    var html=Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm A')  
    })
    $messages.insertAdjacentHTML('beforeend',html )
    autoscroll()

})

socket.on('locationMessage',(message)=>{
   // console.log(url)
     var html=Mustache.render(locationTemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend',html )
    autoscroll()
})

socket.on('roomData',({room, users})=>{
    var html=Mustache.render(sidebarTemplate,{
        room,
        users 
    })
    document.querySelector('#sidebar').innerHTML=html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled','disabled')

    var message= e.target.elements.message.value
    
    socket.emit('sendMessage', message,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=''
        $messageFormInput.focus()   
        if(error){
            return console.log(error)
        }
        console.log('Message delivered!')
    })

})

$location.addEventListener('click',()=>{
    if(!navigator.geolocation){
       return alert('Geolocation is not supported by ur browser')
    }

    $location.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },()=>{
            $location.removeAttribute('disabled')
            return console.log('Location Shared')
            
        })
    })

})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})
// socket.on('countUpdated',(count)=>{
//     console.log('The count has been updated!',count)
// })

// document.querySelector('#increment').addEventListener('click',()=>{
//     console.log("Clicked")

//     socket.emit('increment')
// })