const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormBtn = $messageForm.querySelector('button')
const $sendLocationBtn = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(
    location.search,
    {
        ignoreQueryPrefix: true
    }
)

const autoscroll = () => {
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
    
    // How far scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if((containerHeight - newMessageHeight) <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', ({ username, text, createdAt }) => {
    const html = Mustache.render(messageTemplate, {
        username,
        message: text,
        createdAt: moment(createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', ({ username, url, createdAt }) => {
    const html = Mustache.render(locationMessageTemplate, {
        username,
        url,
        createdAt: moment(createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})

$messageForm.addEventListener('submit', (event) => {
    event.preventDefault();

    $messageFormBtn.setAttribute('disabled', 'disabled')

    const message = event.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {
        $messageFormBtn.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) return console.log(error)

        console.log('The message was delivered!')
    })
})

document.querySelector('#send-location').addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    $sendLocationBtn.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const { longitude, latitude } = position.coords
        socket.emit('sendLocation', { longitude, latitude }, (message) => {
            $sendLocationBtn.removeAttribute('disabled')
            console.log(message)
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})