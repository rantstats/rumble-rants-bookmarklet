const EC_CACHE_PREFIX_KEY = "c-";
const EC_SETTINGS_KEY = `${EC_CACHE_PREFIX_KEY}settings`;
let ecSkipRender = false;
let ecCacheLoaded = false;
let ecVideoId = "";
let ecRantLevels = [];
const ecUsers = new Map();
const ecStorage = {
    settings: {
        sort: "0",
        cache: true,
    },
    cache: new Map(),
};
const ecSaveData = () => {
    localStorage.setItem(EC_SETTINGS_KEY, JSON.stringify(ecStorage.settings));
    if (ecStorage.settings.cache) {
        const cacheData = Array.from(ecStorage.cache.values());
        localStorage.setItem(`${EC_CACHE_PREFIX_KEY}${ecVideoId}`, JSON.stringify(cacheData));
    }
};
const ecGetData = () => {
    const cache = new Map();
    const cutOffDays = 2;
    const cutOffTime = new Date().getTime() - (cutOffDays * 24 * 60 * 60 * 1000);
    const removeKeys = [];
    for (let key in localStorage) {
        if (!key.startsWith(EC_CACHE_PREFIX_KEY)) {
            continue;
        }
        const rawData = localStorage.getItem(key);
        let data;
        try {
            data = JSON.parse(rawData);
        }
        catch (e) {
            continue;
        }
        if (key === EC_SETTINGS_KEY) {
            ecStorage.settings = data;
        }
        else {
            const value = key.substring(key.indexOf('-') + 1);
            const valueInt = parseInt(value);
            if (!isNaN(valueInt)) {
                const cacheData = data;
                if (cacheData && cacheData.length > 0) {
                    const firstRant = cacheData[0];
                    if (new Date(firstRant.time).getTime() < cutOffTime) {
                        console.log("removing stream", value, "from local history since it is older than", cutOffDays);
                        removeKeys.push(key);
                    }
                    else if (value === ecVideoId) {
                        console.log("saving cached rants for", value, data);
                        cacheData.forEach((cd) => {
                            cache.set(cd.id, cd);
                        });
                    }
                }
                else {
                    console.log("removing key", key, "due to invalid data");
                    removeKeys.push(key);
                }
            }
            else {
                console.log("Unknown ec storage key", key);
            }
        }
    }
    removeKeys.forEach((key) => {
        localStorage.removeItem(key);
    });
    ecStorage.cache = cache;
};
const ecSortOrderChanged = (event) => {
    const select = event.target;
    ecStorage.settings.sort = select.value;
    ecSaveData();
    ecSkipRender = true;
    const chatList = document.getElementById('external-chat-list');
    chatList.textContent = "";
    ecStorage.cache.forEach((message) => {
        ecRenderCacheMessage(message);
    });
    ecSkipRender = false;
};
const ecCacheChanged = (event) => {
    const checkbox = event.target;
    ecStorage.settings.cache = checkbox.checked;
    ecSaveData();
};
const ecInsertStyle = () => {
    const thisScript = document.currentScript;
    const src = thisScript.src;
    const href = src.substring(0, src.lastIndexOf("/"));
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.type = "text/css";
    style.href = `${href}/styles.css`;
    document.head.appendChild(style);
};
const ecInsertHtml = () => {
    const html = `
        <div class="external-chats" id="external-chats">
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
            </header>
            <div class="external-chat-list" id="external-chat-list" data-sort-order="0"></div>
            <footer>
                <p><a href="https://twitter.com/stevencrader" target="_blank">By Steven Crader</a></p>
                <p><a href="https://github.com/stevencrader/rumble-rants-bookmarklet" target="_blank">On GitHub</a></p>
            </footer>
        </div>
    `;
    const body = document.body;
    body.insertAdjacentHTML("beforebegin", html);
    const select = document.getElementById(`ec-sort-order`);
    select.addEventListener('change', ecSortOrderChanged);
    const checkbox = document.getElementById(`ec-cache`);
    checkbox.addEventListener('change', ecCacheChanged);
};
const ecGetVideoID = () => {
    const foundIds = [];
    const idElements = document.querySelectorAll('[data-id]');
    idElements.forEach((element) => {
        if (element.classList.contains("rumbles-vote") &&
            element.getAttribute('data-type') === '1') {
            foundIds.push(element.getAttribute('data-id'));
        }
    });
    console.log("found ids:", foundIds);
    if (foundIds.length > 0) {
        return foundIds[0];
    }
    else {
        return "";
    }
};
const ecShowHideRant = (event) => {
    const checkbox = event.target;
    const messageId = checkbox.id.substring(checkbox.id.indexOf('-') + 1);
    const cachedMessage = ecStorage.cache.get(messageId);
    if (cachedMessage) {
        cachedMessage.read = checkbox.checked;
        ecSaveData();
    }
    const rantDiv = document.querySelector(`[data-chat-id="ec-${messageId}"]`);
    rantDiv.classList.toggle("read");
};
const ecCacheMessage = (cacheData) => {
    if (ecStorage.settings.cache) {
        ecStorage.cache.set(cacheData.id, cacheData);
        ecSaveData();
    }
};
const ecRenderMessage = (id, time, user_id, text, rant, cached = false, read = false) => {
    let username = user_id;
    let userImage = null;
    const user = ecUsers.get(user_id);
    if (user) {
        username = user.username;
        userImage = user["image.1"];
    }
    if (!cached) {
        ecCacheMessage({
            id: id,
            time: time,
            user_id: user_id,
            text: text,
            rant: {
                price_cents: rant.price_cents,
            }
        });
        if (ecSkipRender) {
            console.log("skipping render of", text);
            return;
        }
    }
    let matchingRantLevel = undefined;
    let rantHTML = "";
    if (rant) {
        const price_dollars = rant.price_cents / 100;
        ecRantLevels.forEach((rantLevel) => {
            if (price_dollars >= rantLevel.price_dollars) {
                if (matchingRantLevel) {
                    if (matchingRantLevel.price_dollars < rantLevel.price_dollars) {
                        matchingRantLevel = rantLevel;
                    }
                }
                else {
                    matchingRantLevel = rantLevel;
                }
            }
        });
        rantHTML = `
            <div class="rant-amount">
                <p>$${price_dollars.toFixed(2)}</p>
                <label for="ec-${id}" class="ec-show-hide-checkbox">
                    Read:
                    <input type="checkbox" id="ec-${id}" ${read ? "checked" : ""}/>
                </label>
            </div>
        `;
    }
    let rantClass = "";
    if (matchingRantLevel) {
        rantClass = `rant-${matchingRantLevel.price_dollars}`;
    }
    let userImageHTML = "";
    if (userImage) {
        userImageHTML = `<img src="${userImage}" alt="Profile picture for ${username}" loading="lazy"/>`;
    }
    const chatDate = new Date(time);
    const isoDate = chatDate.toISOString();
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
    `;
    const chatList = document.getElementById('external-chat-list');
    if (ecStorage.settings.sort === "1") {
        chatList.insertAdjacentHTML("afterbegin", html);
    }
    else {
        chatList.insertAdjacentHTML("beforeend", html);
    }
    const checkbox = document.getElementById(`ec-${id}`);
    checkbox.addEventListener('change', ecShowHideRant);
};
const ecRenderRumbleMessage = (message) => {
    const { id, time, user_id, text, rant } = message;
    ecRenderMessage(id, time, user_id, text, rant);
};
const ecRenderCacheMessage = (message) => {
    const { id, time, user_id, text, rant, read } = message;
    ecRenderMessage(id, time, user_id, text, rant, true, read);
};
const ecHandleMessage = (message) => {
    if (message.rant && !(message.id in ecStorage.cache)) {
        ecRenderRumbleMessage(message);
    }
};
const ecGenerateRantStyles = () => {
    let styleLines = [];
    ecRantLevels.forEach((rantLevel) => {
        styleLines.push(...[
            `.external-chat.rant-${rantLevel.price_dollars} {`,
            `color: ${rantLevel.colors.fg};`,
            `background: ${rantLevel.colors.main};`,
            `}`,
            `.external-chat.rant-${rantLevel.price_dollars} .rant-amount {`,
            `background: ${rantLevel.colors.bg2};`,
            `}`,
        ]);
    });
    const style = document.createElement("style");
    style.appendChild(document.createTextNode(styleLines.join(" ")));
    document.head.appendChild(style);
};
const ecHandleInitEvent = (eventData) => {
    const messages = eventData.data.messages;
    ecRantLevels = eventData.data.config.rants.levels;
    ecGenerateRantStyles();
    const usersList = eventData.data.users;
    usersList.forEach((user) => {
        ecUsers.set(user.id, user);
    });
    if (ecStorage.settings.cache && !ecCacheLoaded) {
        ecCacheLoaded = true;
        ecStorage.cache.forEach((message) => ecRenderCacheMessage(message));
    }
    messages.forEach((message) => {
        ecHandleMessage(message);
    });
};
const ecHandleMessagesEvent = (eventData) => {
    const messages = eventData.data.messages;
    const usersList = eventData.data.users;
    usersList.forEach((user) => {
        ecUsers.set(user.id, user);
    });
    messages.forEach((message) => {
        ecHandleMessage(message);
    });
};
const ecHandleReceiveMessage = (event) => {
    const eventData = JSON.parse(event.data);
    switch (eventData.type) {
        case "init":
            ecHandleInitEvent(eventData);
            break;
        case "messages":
            ecHandleMessagesEvent(eventData);
            break;
        default:
            console.log("Unknown event type", eventData);
    }
};
const ecRegisterResize = () => {
    const resize_el = document.getElementById("resize");
    let m_pos;
    function resize(e) {
        const parent = resize_el.parentNode;
        m_pos = e.x;
        parent.style.width = (parseInt(m_pos)) + "px";
    }
    resize_el.addEventListener("mousedown", function (e) {
        m_pos = e.x;
        e.preventDefault();
        document.addEventListener("mousemove", resize, false);
    }, false);
    document.addEventListener("mouseup", function () {
        document.removeEventListener("mousemove", resize, false);
    }, false);
};
let loadRants = () => {
    const chatDiv = document.getElementById("external-chats");
    if (chatDiv) {
        alert("Rants already shown");
        return;
    }
    ecVideoId = ecGetVideoID();
    if (ecVideoId === "") {
        alert("Could not find video id");
        return;
    }
    ecGetData();
    ecInsertStyle();
    ecInsertHtml();
    ecRegisterResize();
    const eventSource = new EventSource(`https://web7.rumble.com/chat/api/chat/${ecVideoId}/stream`, {
        withCredentials: true,
    });
    eventSource.addEventListener("message", ecHandleReceiveMessage);
};
loadRants();
