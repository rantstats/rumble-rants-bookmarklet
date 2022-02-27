let loadRants;
(loadRants = function () {
    const chatList = document.createElement('div');
    chatList.classList.add('external-chat-list');
    let rantLevels = [];
    const users = new Map();
    const insertStyle = () => {
        const thisScript = document.currentScript;
        const src = thisScript.src;
        const href = src.substring(0, src.lastIndexOf("/"));
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.type = "text/css";
        style.href = `${href}/styles.css`;
        document.head.appendChild(style);
    };
    const ecGenerateRantStyles = () => {
        let styleLines = [];
        rantLevels.forEach((rantLevel) => {
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
    const insertHtml = () => {
        const body = document.body;
        const chatDiv = document.createElement('div');
        chatDiv.classList.add('external-chats');
        body.insertBefore(chatDiv, body.children[0]);
        const resizeDiv = document.createElement('div');
        resizeDiv.id = "resize";
        chatDiv.appendChild(resizeDiv);
        const heading = document.createElement('h1');
        heading.textContent = "Rumble Rants";
        chatDiv.appendChild(heading);
        chatDiv.appendChild(chatList);
        return chatDiv;
    };
    const getVideoID = () => {
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
    const showHideRant = (event) => {
        const checkbox = event.target;
        const checked = checkbox.checked;
        const checkClass = "reviewed";
        checkbox.parentElement.parentElement.classList.remove(checkClass);
        if (checked) {
            checkbox.parentElement.parentElement.classList.add(checkClass);
        }
    };
    const renderMessage = (message) => {
        const rant = message.rant;
        const user = users.get(message.user_id);
        const username = user.username || message.user_id;
        let matchingRantLevel = undefined;
        let rantHTML = "";
        if (rant) {
            const price_dollars = rant.price_cents / 100;
            rantLevels.forEach((rantLevel) => {
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
                    <input type="checkbox" class="show-hide-checkbox" id="checkbox-${message.id}"/>
                </div>
            `;
        }
        let rantClass = "";
        if (matchingRantLevel) {
            rantClass = `rant-${matchingRantLevel.price_dollars}`;
        }
        let userImageHTML = "";
        if (user["image.1"]) {
            userImageHTML = `<img src="${user["image.1"]}" alt="Profile piture for ${username}" loading="lazy"/>`;
        }
        const chatDate = new Date(message.time);
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
        `;
        chatList.insertAdjacentHTML("beforeend", html);
        const checkbox = document.getElementById(`checkbox-${message.id}`);
        checkbox.addEventListener('change', showHideRant);
    };
    const handleMessage = (message) => {
        if (message.rant) {
            renderMessage(message);
        }
    };
    const handleInitEvent = (eventData) => {
        const messages = eventData.data.messages;
        rantLevels = eventData.data.config.rants.levels;
        ecGenerateRantStyles();
        const usersList = eventData.data.users;
        usersList.forEach((user) => {
            users.set(user.id, user);
        });
        messages.forEach((message) => {
            handleMessage(message);
        });
    };
    const handleMessagesEvent = (eventData) => {
        const messages = eventData.data.messages;
        const usersList = eventData.data.users;
        usersList.forEach((user) => {
            users.set(user.id, user);
        });
        messages.forEach((message) => {
            handleMessage(message);
        });
    };
    const handleReceiveMessage = (event) => {
        const eventData = JSON.parse(event.data);
        switch (eventData.type) {
            case "init":
                handleInitEvent(eventData);
                break;
            case "messages":
                handleMessagesEvent(eventData);
                break;
            default:
                console.log("Unknown event type", eventData);
        }
    };
    const chatDiv = document.getElementById("external-chats");
    if (chatDiv) {
        alert("Rants already shown");
        return;
    }
    const videoId = getVideoID();
    if (videoId === "") {
        alert("Could not find video id");
        return;
    }
    insertStyle();
    insertHtml();
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
    const eventSource = new EventSource(`https://web7.rumble.com/chat/api/chat/${videoId}/stream`, {
        withCredentials: true,
    });
    eventSource.addEventListener("message", handleReceiveMessage);
})();
