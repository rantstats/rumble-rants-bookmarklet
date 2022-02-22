// noinspection CssUnusedSymbol

let loadRants
(loadRants = function () {

    const insertStyle = () => {
        const style = document.createElement("style") as HTMLStyleElement
        // language=css
        style.appendChild(document.createTextNode(`
            .external-chats {
                z-index: 99999;
                position: fixed;
                top: 0;
                left: 0;
                height: 100vh;
                width: 500px;
                background: #eee;
                overflow: scroll;
                padding: 10px 4px 10px 10px;
            }

            #resize {
                background-color: #ccc;
                position: absolute;
                right: 0;
                width: 4px;
                height: 100%;
                cursor: w-resize;
            }

            .external-chats h1 {
                text-align: center;
                font-weight: bold;
                font-size: 25px;
            }

            .external-chat-list {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .external-chat {
                border: 1px solid black;
                margin: 3px;
                overflow-wrap: break-word;

                display: flex;
                flex-direction: column;
            }

            .external-chat.reviewed {
                opacity: 0.5;
            }

            .rant-amount {
                display: flex;
                flex-direction: row;
                align-items: center;

                font-weight: bold;
                padding: 5px;
            }

            .rant-amount input[type=checkbox] {
                margin-left: auto;
                justify-self: flex-end;
            }


            .external-chat p {
                margin: 0;
            }

            .external-chat.rant-1 {
                color: black;
                background: #4a90e2;
            }

            .external-chat.rant-1 .rant-amount {
                background: #4382cb;
            }

            .external-chat.rant-2 {
                color: black;
                background: #b8e986;
            }

            .external-chat.rant-2 .rant-amount {
                background: #a6d279;
            }

            .external-chat.rant-5 {
                color: black;
                background: #f8e71c;
            }

            .external-chat.rant-5 .rant-amount {
                background: #dfd019;
            }

            .external-chat.rant-10 {
                color: black;
                background: #f5a623;
            }

            .external-chat.rant-10 .rant-amount {
                background: #dd9520;
            }

            .external-chat.rant-20 {
                color: white;
                background: #bd10e0;
            }

            .external-chat.rant-20 .rant-amount {
                background: #aa0eca;
            }

            .external-chat.rant-50 {
                color: white;
                background: #9013fe;
            }

            .external-chat.rant-50 .rant-amount {
                background: #8211e5;
            }

            .external-chat.rant-100 {
                color: white;
                background: #d0021b;
            }

            .external-chat.rant-100 .rant-amount {
                background: #bb0218;
            }

            .external-chat.rant-200 {
                color: white;
                background: #d0021b;
            }

            .external-chat.rant-200 .rant-amount {
                background: #bb0218;
            }

            .external-chat.rant-300 {
                color: white;
                background: #d0021b;
            }

            .external-chat.rant-300 .rant-amount {
                background: #bb0218;
            }

            .external-chat.rant-400 {
                color: white;
                background: #d0021b;
            }

            .external-chat.rant-400 .rant-amount {
                background: #bb0218;
            }

            .external-chat.rant-500 {
                color: white;
                background: #d0021b;
            }

            .external-chat.rant-500 .rant-amount {
                background: #bb0218;
            }


            .user-info {
                display: flex;
                flex-direction: row;
                gap: 5px;
                align-items: center;
                padding: 5px;
            }

            .user-info p {
                font-weight: bold;
            }

            .user-info .user-image {
                height: 30px;
            }

            .user-image img {
                height: 100%;
                width: 100%;
            }

            .user-info .timestamp {
                justify-self: flex-end;
                margin-left: auto;
            }

            .chat-text {
                padding: 5px;
            }


            .chat-history--row {
                border-bottom: 1px inset black;
            }
        `))
        document.head.appendChild(style)
    }

    const chatList = document.createElement('div') as HTMLDivElement
    chatList.classList.add('external-chat-list')

    type Chat = {
        id: string,
    }

    type BlockData = {
        text: string,
    }

    type Block = {
        type: string,
        data: BlockData,
    }

    type Rant = {
        duration: number,
        expires_on: string,
        price_cents: number,
    }

    type Message = {
        id: string,
        time: string,
        user_id: string,
        text: string,
        blocks: Array<Block>,
        rant?: Rant,
    }

    type User = {
        id: string,
        username: string,
        "image.1"?: string
    }

    type Colors = {
        fg: string,
        main: string,
        bg2: string,
    }

    type RantLevel = {
        price_dollars: number,
        duration: number,
        colors: Colors
    }

    type RantLevels = {
        levels: Array<RantLevel>,
    }

    type Config = {
        rants: RantLevels,
    }

    type DataBase = {
        messages: Array<Message>
        users: Array<User>,
    }

    type InitData = DataBase & {
        chat: Chat
        config: Config,
    }

    type MessagesData = DataBase & {}

    type EventBase = {
        type: string,
    }

    type EventInit = EventBase & {
        data: InitData,
    }

    type EventMessages = EventBase & {
        data: MessagesData,
        request_id: string,
    }

    let rantLevels: Array<RantLevel> = []
    const users: Map<string, User> = new Map<string, User>()

    const insertHtml = (): HTMLDivElement => {
        const body = document.body

        const chatDiv = document.createElement('div') as HTMLDivElement
        chatDiv.classList.add('external-chats')
        body.insertBefore(chatDiv, body.children[0])

        const resizeDiv = document.createElement('div') as HTMLDivElement
        resizeDiv.id = "resize"
        chatDiv.appendChild(resizeDiv)

        const heading = document.createElement('h1') as HTMLHeadingElement
        heading.textContent = "Rumble Rants"
        chatDiv.appendChild(heading)

        chatDiv.appendChild(chatList)

        return chatDiv
    }

    const getVideoID = (): string => {
        const foundIds = []
        const idElements = document.querySelectorAll('[data-id]')
        idElements.forEach((element) => {
            if (
                element.classList.contains("rumbles-vote") &&
                element.getAttribute('data-type') === '1'
            ) {
                foundIds.push(element.getAttribute('data-id'))
            }
        })
        console.log("found ids:", foundIds)
        if (foundIds.length > 0) {
            return foundIds[0]
        } else {
            return ""
        }
    }

    const showHideRant = (event: Event): void => {
        const checkbox = event.target as HTMLInputElement
        const checked = checkbox.checked
        const checkClass = "reviewed"
        checkbox.parentElement.parentElement.classList.remove(checkClass)
        if (checked) {
            checkbox.parentElement.parentElement.classList.add(checkClass)
        }
    }

    const renderMessage = (message: Message) => {
        const rant = message.rant

        const user = users.get(message.user_id)
        const username = user.username || message.user_id

        let matchingRantLevel: RantLevel = undefined
        let rantHTML = ""
        if (rant) {
            const price_dollars = rant.price_cents / 100

            rantLevels.forEach((rantLevel) => {
                if (price_dollars >= rantLevel.price_dollars) {
                    if (matchingRantLevel) {
                        if (matchingRantLevel.price_dollars < rantLevel.price_dollars) {
                            matchingRantLevel = rantLevel
                        }
                    } else {
                        matchingRantLevel = rantLevel
                    }
                }
            })


            // language=html
            rantHTML = `
                <div class="rant-amount">
                    <p>$${price_dollars.toFixed(2)}</p>
                    <input type="checkbox" class="show-hide-checkbox" id="checkbox-${message.id}"/>
                </div>
            `
        }

        let rantClass = ""
        if (matchingRantLevel) {
            rantClass = `rant-${matchingRantLevel.price_dollars}`
        }

        let userImageHTML = ""
        if (user["image.1"]) {
            // language=html
            userImageHTML = `<img src="${user["image.1"]}" alt="Profile piture for ${username}" loading="lazy"/>`
        }

        const chatDate = new Date(message.time)
        // language=html
        const html = `
            <div class="external-chat ${rantClass}">
                ${rantHTML}
                <div class="user-info">
                    <div class="user-image">${userImageHTML}</div>
                    <p class="username">${username}</p>
                    <time class="timestamp" datatype="${chatDate.toISOString()}">${chatDate.toLocaleDateString()}
                        ${chatDate.toLocaleTimeString()}
                    </time>
                </div>
                <p class="chat-text">${message.text}</p>
            </div>
        `
        chatList.insertAdjacentHTML("beforeend", html)

        const checkbox = document.getElementById(`checkbox-${message.id}`)
        checkbox.addEventListener('change', showHideRant)
    }

    const handleMessage = (message: Message) => {
        // create fake rant
        // const rantAmounts = [
        //     50, 100,
        //     150, 200,
        //     250, 500,
        //     700, 1000,
        //     1300, 2000,
        //     3000, 5000,
        //     7656, 10000,
        //     15600, 20000,
        //     24696, 30000,
        //     38754, 40000,
        //     49856, 50000,
        //     58945
        // ]
        // const min = 0
        // const max = rantAmounts.length-1
        // const priceCents = rantAmounts[Math.floor(Math.random() * (max - min + 1) + min)]
        // const rant: Rant = {
        //     price_cents: priceCents,
        //     duration: 1,
        //     expires_on: "2022-02-21T21:38:03+00:00",
        // }
        // message.rant = rant

        // only render rants
        if (message.rant) {
            renderMessage(message)
        }
    }

    const handleInitEvent = (eventData: EventInit) => {
        const messages = eventData.data.messages
        rantLevels = eventData.data.config.rants.levels

        const usersList = eventData.data.users
        usersList.forEach((user) => {
            users.set(user.id, user)
        })

        messages.forEach((message) => {
            handleMessage(message)
        })
    }

    const handleMessagesEvent = (eventData: EventMessages) => {
        const messages = eventData.data.messages

        const usersList = eventData.data.users
        usersList.forEach((user) => {
            users.set(user.id, user)
        })

        messages.forEach((message) => {
            handleMessage(message)
        })
    }

    const handleReceiveMessage = (event) => {
        const eventData = JSON.parse(event.data)

        switch (eventData.type) {
            case "init":
                handleInitEvent(eventData)
                break
            case "messages":
                handleMessagesEvent(eventData)
                break
            default:
                console.log("Unknown event type", eventData)
        }
    }

    const chatDiv = document.getElementById("external-chats")
    if (chatDiv) {
        alert("Rants already shown")
        return
    }

    const videoId = getVideoID()
    if (videoId === "") {
        alert("Could not find video id")
        return
    }

    insertStyle()
    insertHtml()

    const resize_el = document.getElementById("resize") as HTMLDivElement
    let m_pos

    function resize(e) {
        const parent = resize_el.parentNode as HTMLDivElement
        m_pos = e.x
        parent.style.width = (parseInt(m_pos)) + "px"
    }

    resize_el.addEventListener("mousedown", function (e) {
        m_pos = e.x
        e.preventDefault()
        document.addEventListener("mousemove", resize, false)
    }, false)
    document.addEventListener("mouseup", function () {
        document.removeEventListener("mousemove", resize, false)
    }, false)

    const eventSource = new EventSource(
        `https://web7.rumble.com/chat/api/chat/${videoId}/stream`,
        {
            withCredentials: true,
        }
    )
    eventSource.addEventListener("message", handleReceiveMessage)
})()
