import { buildAuthorization } from "@retroachievements/api";
import { compress, decompress } from "./compression.js";
import "./css/style.css";

const sleep = ms => new Promise(resolve => setTimeout(() => resolve(), ms));

function html(literals, ...expr) {
    let string = "";

    for (const [index, literal] of literals.entries()) {
        string += literal;
        if (index in expr) string += expr[index];
    }

    return string;
}

function resetDatePicker() {
    let now = new Date();
    document.getElementById("startdate").valueAsDate = new Date(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        1
    );
    document.getElementById("enddate").valueAsDate = now;
}
resetDatePicker();

let params = new URL(window.location).searchParams;
if (params.has("data")) {
    let data = null;
    if (params.has("c") && params.get("c") == "0") {
        data = JSON.parse(atob(params.get("data")));
    } else {
        data = await decompress(params.get("data"));
    }
    const startDate = document.getElementById("startdate").value;
    const endDate = document.getElementById("enddate").value;

    document.getElementById("username").value = data.username ?? "";
    document.getElementById("altUsername").value = data.alt ?? "";
    document.getElementById("startdate").value = data.startDate ?? startDate;
    document.getElementById("enddate").value = data.endDate ?? endDate;
    document.getElementById("submission").value = data.submission ?? "";
    document.getElementById("optionCheckDate").checked = data.optionCheckDate ?? true;
}

async function getAuthorization() {
    if (!localStorage.getItem("auth")) {
        return await showAuthModal();
    } else {
        const obj = JSON.parse(localStorage.getItem("auth"));
        if ("apikey" in obj) {
            obj.webApiKey = obj.apikey;
            delete obj.apikey;
            localStorage.setItem("auth", JSON.stringify(obj));
        }
        const auth = buildAuthorization(obj);
        auth.toString = function() {
            return `z=${this.username}&y=${this.webApiKey}`;
        }
        return auth;
    }
}

function showAuthModal() {
    let template = document.getElementById("authModalTemplate");
    let modal = template.content.cloneNode(true);
    let button = modal.children[0].querySelector("button");
    document.body.appendChild(modal);

    return new Promise(resolve => {
        button.addEventListener("click", ev => {
            let modal = document.querySelector("div.authModal");
            let auth = {
                username: modal.querySelector("input[name='username']").value,
                webApiKey: modal.querySelector("input[name='apikey']").value,
            };
            if (modal.querySelector("input[name='saveinfo']").checked) {
                localStorage.setItem("auth", JSON.stringify(auth));
            }
            document.body.removeChild(modal);
            resolve(buildAuthorization(auth));
        });
    });
}

document.getElementById("verify").addEventListener("click", async () => {
    const auth = await getAuthorization();
    const username = document.getElementById("username");
    const altUsername = document.getElementById("altUsername");
    const submission = document.getElementById("submission");
    const startDate = document.getElementById("startdate");
    const endDate = document.getElementById("enddate");

    if (startDate.value == "") {
        startDate.style.backgroundColor = "red";
        startDate.addEventListener("focus", () => startDate.style.backgroundColor = "revert", { once: true });
        return;
    }

    const games = Array.from(
        submission.value.matchAll("https://(?:www.)?retroachievements.org/game/([0-9]+)")
    ).map(([_, id]) => id);

    const achievements = Array.from(
        submission.value.matchAll("https://(?:www.)?retroachievements.org/achievement/([0-9]+)")
    ).map(([_, id]) => id);

    switchToTab("output");
    username.disabled = true;
    altUsername.disabled = true;
    startDate.disabled = true;
    endDate.disabled = true;

    output.innerHTML = html`
        <h1>Games</h1><hr />
        ${games.map(id => html`<div class="game">
            <div class="icon"></div>
            <a class="title" href="https://retroachievements.org/game/${id}">${id}</a>
            <span class="timestamp"></span>
            <div class="status">?</div>
        </div>`).join("")}

        <h1>Achievements</h1><hr />
        ${achievements.map(id => html`<div class="achievement">
            <div class="icon"></div>
            <a class="title" href="https://retroachievements.org/achievement/${id}">${id}</a>
            <span class="timestamp"></span>
            <div class="status">?</div>
        </div>`).join("")}
    `;

    const render = async (elem, func) => {
        const id = elem.querySelector(".title").textContent;
        // add one day to end date to account for it being unlocked during that day
        const end = endDate.valueAsDate;
        end.setDate(end.getDate() + 1);
        const obj = await func(auth, username.value, id, startDate.valueAsDate, end);
        const statusElem = elem.querySelector(".status")
        statusElem.classList.add(...obj.status.split(" "));
        statusElem.textContent = obj.status.includes("success") ?
            obj.status.includes("alt") ? "A" : "✓" : "X";

        const img = document.createElement("img");
        img.src = `https://media.retroachievements.org${obj.icon}`;
        elem.querySelector(".icon").appendChild(img);

        elem.querySelector(".title").textContent = obj.title;
        elem.querySelector(".timestamp").textContent = obj.timestamp;
    };

    const sleepTime = 500;

    for (const elem of output.querySelectorAll(".game")) {
        await render(elem, checkGame);
        await sleep(sleepTime);
    }

    for (const elem of output.querySelectorAll(".achievement")) {
        await render(elem, checkAchievement);
        await sleep(sleepTime);
    }

    username.disabled = false;
    altUsername.disabled = false;
    startDate.disabled = false;
    endDate.disabled = false;
});

document.getElementById("clear").addEventListener("click", () => {
    document.getElementById("username").value = "";
    document.getElementById("submission").value = "";
    document.getElementById("output").innerHTML = "";
    document.getElementById("username").disabled = false;
    document.getElementById("startdate").disabled = false;
    switchToTab("submission");
});

function setOption(key, value) {
    const options = JSON.parse(localStorage.getItem("options"));
    options[key] = value;
    localStorage.setItem("options", JSON.stringify(options));
}

function getOption(key) {
    return JSON.parse(localStorage.getItem("options"))[key];
}

document.getElementById("optionResetAuth").addEventListener("click", () => {
    localStorage.removeItem("auth");
});

document.getElementById("optionExportURL").addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const alt = document.getElementById("altUsername").value;
    const startDate = document.getElementById("startdate").value;
    const endDate = document.getElementById("enddate").value;
    const submission = document.getElementById("submission").value;
    const optionCheckDate = document.getElementById("optionCheckDate").checked;

    const data = await compress({
        username, alt, startDate, endDate, submission, optionCheckDate
    });

    const url = new URL(window.location.href);
    url.searchParams.set("data", data);
    window.location.href = url.href;
});

document.getElementById("optionCheckDate").addEventListener("change", ev => {
    const datePicker = document.getElementById("startdate");
    if (ev.target.checked) {
        datePicker.disabled = false;
        resetDatePicker();
    } else {
        datePicker.disabled = true;
        datePicker.valueAsDate = new Date(0);
    }
});

document.getElementById("optionDateFormat").addEventListener("change", ev => {
    setOption("dateFormat", ev.target.selectedIndex);
});

if (!localStorage.getItem("options")) {
    localStorage.setItem("options", JSON.stringify({
        dateFormat: 0,
    }));
} else {
    const options = JSON.parse(localStorage.getItem("options"));
    document.getElementById("optionDateFormat").selectedIndex = options.dateFormat;
}

function formatDate(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    switch (getOption("dateFormat")) {
        case 0:
            return `${year}-${month}-${day}`;
        case 1:
            return `${month}/${day}/${year}`;
        case 2:
            return `${day}/${month}/${year}`;
        case 3:
            return `${month}-${day}-${year}`;
        case 4:
            return `${day}-${month}-${year}`;
    }
}

for (const elem of document.querySelectorAll("#tabs > div")) {
    const target = elem.dataset.target;
    elem.addEventListener("mousedown", () => {
        switchToTab(target);
    });
}

function switchToTab(name) {
    document.getElementById(name).style.display = "block";
    for (const elem of document.querySelectorAll(`#content > :not(#${name})`)) {
        elem.style.display = "none";
    }
    for (const elem of document.querySelectorAll("#tabs > div")) {
        elem.classList.remove("selected");
        if (elem.dataset.target == name) {
            elem.classList.add("selected");
        }
    }
}

async function checkGame(auth, username, id, startDate, endDate) {
    const url = `https://retroachievements.org/API/API_GetGameInfoAndUserProgress.php?${auth}&u=${username}&g=${id}&a=1`;
    const result = await fetch(url).then(a => a.json());

    let status = "failure";
    switch (result.HighestAwardKind) {
        case "mastered":
            status = "success mastered";
            break;
        case "beaten-hardcore":
            status = "success";
            break;
        default:
            break;
    }

    const awardDate = new Date(result.HighestAwardDate);
    if (awardDate < startDate || awardDate > endDate) {
        status = "failure";
    }

    const timestamp = result.HighestAwardDate ? formatDate(awardDate) : "N/A";

    const alt = document.getElementById("altUsername").value;
    if (username != alt && alt.length && status == "failure") {
        const altResult = await checkGame(auth, alt, id, startDate);
        if (altResult.status.includes("success")) {
            altResult.status += " alt";
            return altResult;
        }
    }

    return {
        status,
        title: result.Title,
        icon: result.ImageIcon,
        timestamp,
    }
}

async function checkAchievement(auth, username, id, startDate, endDate) {
    const info = await fetch(`https://retroachievements.org/API/API_GetAchievementUnlocks.php?${auth}&a=${id}&c=1`).then(a => a.json());
    const game = await fetch(`https://retroachievements.org/API/API_GetGameInfoAndUserProgress.php?${auth}&u=${username}&g=${info.Game.ID}&a=0`).then(a => a.json());
    const achievement = game.Achievements[info.Achievement.ID];
    const unlocked = "DateEarnedHardcore" in achievement;
    const unlockedDate = unlocked ? new Date(achievement.DateEarnedHardcore) : new Date(0);

    const result = {
        status: unlocked && (unlockedDate >= startDate && unlockedDate <= endDate) ? "success" : "failure",
        timestamp: unlocked ? formatDate(unlockedDate) : "N/A",
        title: info.Achievement.Title,
        icon: `/Badge/${achievement.BadgeName}.png`,
    }

    if (result.status == "failure") {
        const alt = document.getElementById("altUsername").value;
        if (alt.length && alt != username) {
            const altResult = await checkAchievement(auth, alt, id, startDate, endDate);
            if (altResult.status == "success") {
                altResult.status += " alt";
                return altResult;
            }
        }
    }

    return result;
}
