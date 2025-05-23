const notifications = document.querySelector(".notifications");

let globalMute = false;
const alerts = {};

const removeToast = (toast) => {
    toast.classList.add("hide");
    delete alerts[toast.id];
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    setTimeout(() => toast.remove(), 500);
};

const createToast = (id, details, notify) => {
    const sound = new Audio(notify.sound);
    sound.volume = notify.volume;

    const playSound = () => {
        if (!globalMute && !notify.mute) sound.play();
    };

    const { icon, color, title } = notify || {};
    const position = details.position || "top-right";

    notifications.className = `notifications ${position}`;

    const defaultTitle = details.caption || title;
    const toastId = Math.random().toString(36).substr(2, 9);
    const toast = document.createElement("li");

    const animationMap = {
        "top-left": "animate-left",
        "bottom-left": "animate-left",
        "left": "animate-left",
        "top-center": "animate-top",
        "bottom-center": "animate-bottom"
    };
    const animationClass = animationMap[position] || "animate-right";

    toast.className = `toast ${id} ${animationClass}`;
    toast.id = toastId;

    const getKeyByValue = (object, value, type) =>
        Object.keys(object).find(key => object[key].text === value && object[key].type === type);

    const createNotify = () => {
        alerts[toastId] = {
            text: details.text,
            type: id
        };

        toast.innerHTML = `
            <div class="column">
                <i class="fa ${icon} icon" style="background: rgba(255, 255, 255, 0.2)"></i>
                <div class="message">
                    <div class="count-section" style="display: none">
                        <span id="count">0</span>
                    </div>
                    <span class="text text-1">
                        ${defaultTitle ? defaultTitle[0].toUpperCase() + defaultTitle.slice(1) : ''}
                    </span>
                    <span class="text" id="text">${details.text}</span>
                </div>
            </div>
            <div class="progress-circle"></div>
        `;

        toast.style.setProperty('--color', color);
        toast.style.setProperty('--color-gd', `${color}dd`);
        toast.style.setProperty('--animation', `progress ${(details.time / 1000).toFixed(1)}s linear infinite`);

        notifications.appendChild(toast);
        toast.timeoutId = setTimeout(() => removeToast(toast), details.time);
        
        playSound();
    };

    const updateNotify = (id) => {
        const element = document.getElementById(id);
        const $element = $(`#${id}`);

        const count = parseInt($element.find('#count').text(), 10);
        $element.find('.count-section').css('display', 'block');
        $element.find('#count').text(count + 1);

        clearTimeout(element.timeoutId);
        element.timeoutId = setTimeout(() => removeToast(element), details.time);

        element.style.removeProperty('--animation');
        setTimeout(() => {
            element.style.setProperty('--animation', `progress ${(details.time / 1000).toFixed(1)}s linear infinite`);
        }, 100);

        // Play sound for updates too
        playSound();
    };

    const existingId = getKeyByValue(alerts, details.text, id);
    existingId ? updateNotify(existingId) : createNotify();
};

const testNotification = (id, details, notify) => {
    createToast(id, details, notify);
};

window.addEventListener('message', (event) => {
    switch (event.data.action) {
        case 'notify':
            createToast(event.data.type, event.data, event.data.details);
            break;
        case 'setGlobalMute':
            globalMute = event.data.globalMute === true;
            break;
        case 'testNotify':
            testNotification(event.data.type, event.data, event.data.details);
            break;
    }
});

$(() => {
    $.post('https://drm-notify/nui-ready');
});