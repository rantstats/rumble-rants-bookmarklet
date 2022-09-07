// noinspection CssUnusedSymbol
const EC_CACHE_PREFIX_KEY = "c-"
const EC_SETTINGS_KEY = `${EC_CACHE_PREFIX_KEY}settings`

let ecSkipRender = false
let ecCacheLoaded = false
let ecVideoId = ""
let ecRantLevels: Array<RRantLevel> = []
const ecUsers: Map<string, RUser> = new Map<string, RUser>()
const ecDefaultRantLevels = [1, 2, 5, 10, 20, 50, 100, 200, 300, 400, 500,]

// region Rumble Types

type RChat = {
    id: string,
}

type RBlockData = {
    text: string,
}

type RBlock = {
    type: string,
    data: RBlockData,
}

type RRant = {
    duration: number,
    expires_on: string,
    price_cents: number,
}

type RMessage = {
    id: string,
    time: string,
    user_id: string,
    text: string,
    blocks: Array<RBlock>,
    rant?: RRant,
}

type RUser = {
    id: string,
    username: string,
    "image.1"?: string
}

type RColors = {
    fg: string,
    main: string,
    bg2: string,
}

type RRantLevel = {
    price_dollars: number,
    duration: number,
    colors: RColors
}

type RRantLevels = {
    levels: Array<RRantLevel>,
}

type RConfig = {
    rants: RRantLevels,
}

type RDataBase = {
    messages: Array<RMessage>
    users: Array<RUser>,
}

type RInitData = RDataBase & {
    chat: RChat
    config: RConfig,
}

type RMessagesData = RDataBase & {}

type REventBase = {
    type: string,
}

type REventInit = REventBase & {
    data: RInitData,
}

type REventMessages = REventBase & {
    data: RMessagesData,
    request_id: string,
}

// endregion Rumble Types

type ECCachedRant = {
    id: string,
    time: string,
    user_id: string,
    text: string,
    username?: string,
    rant?: {
        price_cents: number,
    },
    read?: boolean,
}

type ECCacheData = {
    title: string,
    rants: Map<string, ECCachedRant>,
}

type ECSettings = {
    sort: "0" | "1" | string
    cache: boolean
    width: number
}

type ECLocalStorage = {
    settings?: ECSettings
    cache: ECCacheData,
}

const ecStorage: ECLocalStorage = {
    settings: {
        sort: "0",
        cache: true,
        width: 500,
    },
    cache: {
        title: document.title,
        rants: new Map<string, ECCachedRant>(),
    },
}

const ecSaveData = () => {
    localStorage.setItem(EC_SETTINGS_KEY, JSON.stringify(ecStorage.settings))
    if (ecStorage.settings.cache) {
        localStorage.setItem(
                `${EC_CACHE_PREFIX_KEY}${ecVideoId}`,
                JSON.stringify({
                    title: ecStorage.cache.title,
                    rants: Array.from(ecStorage.cache.rants.values()),
                })
        )
    }
}

const ecGetData = () => {
    const cache = {
        title: "",
        rants: new Map<string, ECCachedRant>(),
    }
    const cutOffDays = 14
    const cutOffTime = new Date().getTime() - (cutOffDays * 24 * 60 * 60 * 1000) // cutOffDays days ago
    const removeKeys: Array<string> = []
    for (let key in localStorage) {
        if (!key.startsWith(EC_CACHE_PREFIX_KEY)) {
            continue
        }
        const rawData = localStorage.getItem(key)
        let data
        try {
            data = JSON.parse(rawData)
        } catch (e) {
            console.log(`removing key ${key} due to invalid data, could not parse as JSON`)
            removeKeys.push(key)
            continue
        }
        if (key === EC_SETTINGS_KEY) {
            ecStorage.settings = data as ECSettings
        } else {
            const value: string = key.substring(key.indexOf('-') + 1)
            const valueInt = parseInt(value)
            if (!isNaN(valueInt)) {
                const cacheData = data as ECCacheData
                let rants = (cacheData.rants || []) as Array<ECCachedRant>

                // for backwards compatibility
                if (Array.isArray(cacheData)) {
                    rants = cacheData
                }

                if (rants && rants.length > 0) {
                    const firstRant = rants[0]
                    // check if date older than cutOffDays, if so, don't keep
                    if (new Date(firstRant.time).getTime() < cutOffTime) {
                        const cachedTitle = cacheData.title || value.toString()
                        // const keep = window.confirm(`Cached Stream ${JSON.stringify(
                        //         cachedTitle)} is older than ${cutOffDays} days, keep cache?`)
                        // if (!keep) {
                        console.log(
                                `removing stream ${JSON.stringify(
                                        cachedTitle)} from local history since it is older than ${cutOffDays} days`
                        )
                        removeKeys.push(key)
                        // }
                    } else if (value === ecVideoId) {
                        // only load cache for this video
                        console.log("saving cached rants for", value, data)
                        cache.title = cacheData.title || document.title
                        rants.forEach((cd) => {
                            cache.rants.set(cd.id, cd)
                        })
                    }
                } else {
                    console.log(`removing key ${key} due to invalid data`)
                    removeKeys.push(key)
                }
            } else {
                console.log("Unknown ec storage key", key)
            }
        }
    }
    removeKeys.forEach((key) => {
        localStorage.removeItem(key)
    })
    ecStorage.cache = cache
}

const ecSortOrderChanged = (event: Event) => {
    const select = event.target as HTMLSelectElement
    ecStorage.settings.sort = select.value
    ecSaveData()

    ecSkipRender = true
    const chatList = document.getElementById('external-chat-list') as HTMLDivElement
    // remove all items and re-add
    chatList.textContent = ""
    ecStorage.cache.rants.forEach((message) => {
        ecRenderCacheMessage(message)
    })

    ecSkipRender = false
}

const ecCacheChanged = (event: Event) => {
    const checkbox = event.target as HTMLInputElement
    ecStorage.settings.cache = checkbox.checked
    ecSaveData()
}

const downloadCSV = (event: Event) => {
    const rows = [
        ["stream title", JSON.stringify(ecStorage.cache.title)],
        ["id", "time", "user", "username", "text", "rant amount", "read"],
    ]
    ecStorage.cache.rants.forEach((data) => {
        let rantAmount = ""
        if (data.rant) {
            rantAmount = (data.rant.price_cents / 100).toString()
        }
        rows.push([
            JSON.stringify(data.id),
            JSON.stringify(data.time),
            JSON.stringify(data.user_id),
            JSON.stringify(data.username),
            JSON.stringify(data.text),
            JSON.stringify(rantAmount),
            JSON.stringify(data.read)
        ])
    })

    const csvData = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.map(row => row.join(",")).join("\n"))
    window.open(csvData)
    event.preventDefault()
}

const ecInsertStyle = () => {
    const thisScript = document.currentScript as HTMLScriptElement
    const src = thisScript.src
    const href = src.substring(0, src.lastIndexOf("/"))
    const style = document.createElement("link") as HTMLLinkElement
    style.rel = "stylesheet"
    style.type = "text/css"
    style.href = `${href}/styles.css`
    document.head.appendChild(style)
}

const updateThemeStyle = (ecThemePreference: string) => {
    const chatDiv = document.getElementById("external-chats")
    const newTheme = `ec-theme-${ecThemePreference}`
    chatDiv.classList.remove("ec-theme-dark", "ec-theme-light")
    chatDiv.classList.add(newTheme)
}

const updateTheme = () => {
    let ecThemePreference = localStorage.getItem("themePreference") || "dark"
    if (ecThemePreference == "system") {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            ecThemePreference = "dark"
        } else {
            ecThemePreference = "light"
        }
    }
    updateThemeStyle(ecThemePreference)
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    const newColorScheme = event.matches ? "dark" : "light"
    updateThemeStyle(newColorScheme)
})

const ecInsertHtml = () => {
    let width = ecStorage.settings.width || 500
    if (width < 100) {
        width = 200
        ecStorage.settings.width = width
        ecSaveData()
    }
    // language=html
    const html = `
        <div class="external-chats" id="external-chats" style="width: ${width}px;">
            <div class="resize" id="resize"></div>
            <header class="ec-header">
                <h1 class="ec-header-h">Rumble Rants</h1>
                <div class="ec-options">
                    <label for="ec-sort-order">
                        Sort Order
                        <select id="ec-sort-order">
                            <option value="0" ${ecStorage.settings.sort === "0" ? "selected" : ""}>
                                Oldest to Newest
                            </option>
                            <option value="1" ${ecStorage.settings.sort === "1" ? "selected" : ""}>
                                Newest to Oldest
                            </option>
                        </select>
                    </label>
                    <label for="ec-cache"
                           title="Caches Rants for this stream in the browser (supports refreshing)">
                        Cache Rants:
                        <input type="checkbox" id="ec-cache" ${ecStorage.settings.cache ? "checked" : ""}/>
                    </label>
                </div>
                <div class="ec-error hidden" id="ec-error">
                    <p>Could not load chats, is the live stream over? Any cached Rants shown below.</p>
                </div>
            </header>
            <div class="external-chat-list" id="external-chat-list" data-sort-order="0"></div>
            <footer>
                <p><a href="https://twitter.com/stevencrader" target="_blank">By Steven Crader</a></p>
                <p><a href="https://github.com/stevencrader/rumble-rants-bookmarklet" target="_blank">On GitHub</a></p>

                <p><a href="#" id="download-csv">Export to CSV</a></p>
            </footer>
        </div>
    `
    const body = document.body
    body.insertAdjacentHTML("beforebegin", html)

    const csvDownloader = document.getElementById("download-csv")
    csvDownloader.addEventListener("click", downloadCSV)

    const select = document.getElementById(`ec-sort-order`)
    select.addEventListener('change', ecSortOrderChanged)
    const checkbox = document.getElementById(`ec-cache`)
    checkbox.addEventListener('change', ecCacheChanged)
}

const ecGetVideoID = (): string => {
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

const ecShowHideRant = (event: Event): void => {
    const checkbox = event.target as HTMLInputElement

    const messageId = checkbox.id.substring(checkbox.id.indexOf('-') + 1)
    const cachedMessage = ecStorage.cache.rants.get(messageId)
    if (cachedMessage) {
        cachedMessage.read = checkbox.checked
        ecSaveData()
    }
    const rantDiv = document.querySelector(`[data-chat-id="ec-${messageId}"]`)
    rantDiv.classList.toggle("read")
}

const ecCacheMessage = (cacheData: ECCachedRant) => {
    if (ecStorage.settings.cache) {
        ecStorage.cache.rants.set(cacheData.id, cacheData)
        ecSaveData()
    }
}

const ecRenderMessage = (id, time, user_id, text, rant, username = undefined, cached = false,
        read = false) => {
    if (username === undefined) {
        username = user_id
    }
    let userImage = null
    const user = ecUsers.get(user_id)
    if (user) {
        username = user.username
        userImage = user["image.1"]
    }

    if (!cached) {
        // don't show if already cached
        if (ecStorage.cache.rants.has(id)) {
            return
        }

        ecCacheMessage({
            id: id,
            time: time,
            user_id: user_id,
            text: text,
            username: username,
            rant: {
                price_cents: rant.price_cents,
            },
            read: false
        })

        // don't render during sort change
        if (ecSkipRender) {
            console.log("skipping render of", text)
            return
        }
    }


    let matchingRantLevel: number = 0
    let rantHTML = ""
    if (rant) {
        const price_dollars = rant.price_cents / 100

        let rantLevels = ecDefaultRantLevels
        if (ecRantLevels.length > 0) {
            rantLevels = ecRantLevels.map((rantLevel) => {
                return rantLevel.price_dollars
            })
        }

        rantLevels.forEach((rantLevel) => {
            if (price_dollars >= rantLevel) {
                if (matchingRantLevel > 0) {
                    if (matchingRantLevel < rantLevel) {
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
                <label for="ec-${id}" class="ec-show-hide-checkbox">
                    Read:
                    <input type="checkbox" id="ec-${id}" ${read ? "checked" : ""}/>
                </label>
            </div>
        `
    }

    let rantClass = ""
    rantClass = `rant-${matchingRantLevel}`

    let userImageHTML = ""
    if (userImage) {
        // language=html
        userImageHTML = `<img src="${userImage}" alt="Profile picture for ${username}" loading="lazy"/>`
    }

    const chatDate = new Date(time)
    const isoDate = chatDate.toISOString()
    // language=html
    const html = `
        <div class="external-chat ${read ? "read" : ""} ${rantClass}" data-chat-id="ec-${id}" data-ecdate="${isoDate}">
            ${rantHTML}
            <div class="user-info">
                <div class="user-image">${userImageHTML}</div>
                <p class="username">${username}</p>
                <time class="timestamp" datatype="${isoDate}">${chatDate.toLocaleDateString()}
                    ${chatDate.toLocaleTimeString()}
                </time>
            </div>
            <p class="chat-text">${text}</p>
        </div>
    `

    const chatList = document.getElementById('external-chat-list') as HTMLDivElement
    if (ecStorage.settings.sort === "1") {
        chatList.insertAdjacentHTML("afterbegin", html)
    } else {
        chatList.insertAdjacentHTML("beforeend", html)
    }

    const checkbox = document.getElementById(`ec-${id}`)
    checkbox.addEventListener('change', ecShowHideRant)
}

const ecRenderRumbleMessage = (message: RMessage) => {
    const {id, time, user_id, text, rant} = message
    ecRenderMessage(id, time, user_id, text, rant)
}

const ecRenderCacheMessage = (message: ECCachedRant) => {
    const {id, time, user_id, text, username, rant, read} = message
    ecRenderMessage(id, time, user_id, text, rant, username, true, read)
}

const ecHandleMessage = (message: RMessage) => {
    // only render rants, skip messages if already shown
    if (message.rant) {
        ecRenderRumbleMessage(message)
    }
}

const ecGenerateRantStyles = (fallback = false) => {
    if (document.getElementById("ec-rant-styles")) {
        return
    }

    let styleLines = []

    if (fallback || ecRantLevels.length == 0) {
        styleLines.push(...[
            ".external-chat.rant-1 { color: white; background: #4a90e2; }",
            ".external-chat.rant-1 .rant-amount { background: #4382cb; }",
            ".external-chat.rant-2 { color: black; background: #b8e986; }",
            ".external-chat.rant-2 .rant-amount { background: #a6d279; }",
            ".external-chat.rant-5 { color: black; background: #f8e71c; }",
            ".external-chat.rant-5 .rant-amount { background: #dfd019; }",
            ".external-chat.rant-10 { color: black; background: #f5a623; }",
            ".external-chat.rant-10 .rant-amount { background: #dd9520; }",
            ".external-chat.rant-20 { color: white; background: #bd10e0; }",
            ".external-chat.rant-20 .rant-amount { background: #aa0eca; }",
            ".external-chat.rant-50 { color: white; background: #9013fe; }",
            ".external-chat.rant-50 .rant-amount { background: #8211e5; }",
            ".external-chat.rant-100 { color: white; background: #d0021b; }",
            ".external-chat.rant-100 .rant-amount { background: #bb0218; }",
            ".external-chat.rant-200 { color: white; background: #d0021b; }",
            ".external-chat.rant-200 .rant-amount { background: #bb0218; }",
            ".external-chat.rant-300 { color: white; background: #d0021b; }",
            ".external-chat.rant-300 .rant-amount { background: #bb0218; }",
            ".external-chat.rant-400 { color: white; background: #d0021b; }",
            ".external-chat.rant-400 .rant-amount { background: #bb0218; }",
            ".external-chat.rant-500 { color: white; background: #d0021b; }",
            ".external-chat.rant-500 .rant-amount { background: #bb0218; }",
        ])
    } else {
        ecRantLevels.forEach((rantLevel) => {
            styleLines.push(...[
                `.external-chat.rant-${rantLevel.price_dollars} {`,
                `color: ${rantLevel.colors.fg};`,
                `background: ${rantLevel.colors.main};`,
                `}`,
                `.external-chat.rant-${rantLevel.price_dollars} .rant-amount {`,
                `background: ${rantLevel.colors.bg2};`,
                `}`,
            ])
        })
    }
    const style = document.createElement("style") as HTMLStyleElement
    style.id = "ec-rant-styles"
    style.appendChild(document.createTextNode(styleLines.join(" ")))
    document.head.appendChild(style)
}

const displayCachedRants = () => {
    if (ecStorage.settings.cache && !ecCacheLoaded) {
        ecCacheLoaded = true
        ecStorage.cache.rants.forEach((message) => ecRenderCacheMessage(message))
    }
}

const ecHandleInitEvent = (eventData: REventInit) => {
    const messages = eventData.data.messages
    ecRantLevels = eventData.data.config.rants.levels
    ecGenerateRantStyles()

    const usersList = eventData.data.users
    usersList.forEach((user) => {
        ecUsers.set(user.id, user)
    })

    displayCachedRants()

    messages.forEach((message) => {
        ecHandleMessage(message)
    })
}

const ecHandleMessagesEvent = (eventData: REventMessages) => {
    const messages = eventData.data.messages

    const usersList = eventData.data.users
    usersList.forEach((user) => {
        ecUsers.set(user.id, user)
    })

    messages.forEach((message) => {
        ecHandleMessage(message)
    })
}

const ecHandleReceiveMessage = (event) => {
    const eventData = JSON.parse(event.data)

    switch (eventData.type) {
        case "init":
            ecHandleInitEvent(eventData)
            break
        case "messages":
            ecHandleMessagesEvent(eventData)
            break
        default:
            console.log("Unknown event type", eventData)
    }
}

const setSidebarWidth = (width: number) => {
    const resize_el = document.getElementById("resize") as HTMLDivElement
    const parent = resize_el.parentNode as HTMLDivElement

    ecStorage.settings.width = width
    parent.style.width = (width) + "px"
    ecSaveData()
}

const ecRegisterResize = () => {
    const resize_el = document.getElementById("resize") as HTMLDivElement
    let m_pos

    function resize(e) {
        m_pos = e.x
        setSidebarWidth(parseInt(m_pos))
    }

    resize_el.addEventListener("mousedown", function (e) {
        m_pos = e.x
        e.preventDefault()
        document.addEventListener("mousemove", resize, false)
    }, false)
    document.addEventListener("mouseup", function () {
        document.removeEventListener("mousemove", resize, false)
    }, false)
}

const ecRegisterStyleChangeHandler = () => {
    const themeButtons = document.getElementsByClassName("js-theme-option")
    Array.from(themeButtons).forEach((element) => {
        element.addEventListener("click", updateTheme)
    })
}

let loadRants = () => {
    const chatDiv = document.getElementById("external-chats")
    if (chatDiv) {
        alert("Rants already shown")
        return
    }

    ecVideoId = ecGetVideoID()
    if (ecVideoId === "") {
        alert("Could not find video id")
        return
    }

    ecGetData()
    ecInsertStyle()
    ecInsertHtml()
    ecRegisterResize()
    ecRegisterStyleChangeHandler()

    ecStorage.cache.title = document.title
    ecSaveData()

    const eventSource = new EventSource(
            `https://web7.rumble.com/chat/api/chat/${ecVideoId}/stream`,
            {
                withCredentials: true,
            }
    )
    eventSource.onopen = (event) => {
        updateTheme()
        console.log("opened", event)
    }
    eventSource.onerror = (event) => {
        console.error("Could not load chat stream")
        const errorMessage = document.getElementById("ec-error")
        console.log("message, showing error")
        errorMessage.classList.remove("hidden")
        ecGenerateRantStyles(true)
        displayCachedRants()
    }
    eventSource.onmessage = (event) => {
        const errorMessage = document.getElementById("ec-error")
        if (!errorMessage.classList.contains("hidden")) {
            console.log("message, hiding error")
            errorMessage.classList.add("hidden")
        }
        ecHandleReceiveMessage(event)
    }
}
loadRants()
