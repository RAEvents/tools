const sleep = ms => new Promise(resolve => setTimeout(() => resolve(), ms));

function html(literals, ...expr) {
    let string = "";

    for (const [index, literal] of literals.entries()) {
        string += literal;
        if (index in expr) string += expr[index];
    }

    return string;
}

let params = new URL(window.location).searchParams;
if (params.has("data")) {
    const data = JSON.parse(window.atob(params.get("data")));
    document.getElementById("username").value = data.username;
    document.getElementById("submission").value = data.links;
}

function resetDatePicker() {
    let now = new Date();
    document.getElementById("startdate").valueAsDate = new Date(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        1
    );
}
resetDatePicker();

async function getAuthorization() {
    if (!localStorage.getItem("auth")) {
        return await showAuthModal();
    } else {
        const obj = JSON.parse(localStorage.getItem("auth"));
        obj.toString = function() {
            return `z=${this.username}&y=${this.apikey}`;
        }
        return obj;
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
                apikey: modal.querySelector("input[name='apikey']").value,
                toString: function() {
                    return `z=${this.username}&y=${this.apikey}`;
                },
            };
            if (modal.querySelector("input[name='saveinfo']").checked) {
                localStorage.setItem("auth", JSON.stringify(auth));
            }
            document.body.removeChild(modal);
            resolve(auth);
        });
    });
}

document.getElementById("verify").addEventListener("click", async () => {
    const auth = await getAuthorization();
    const username = document.getElementById("username");
    const altUsername = document.getElementById("altUsername");
    const submission = document.getElementById("submission");
    const date = document.getElementById("startdate");

    if (date.value == "") {
        date.style.backgroundColor = "red";
        date.addEventListener("focus", () => date.style.backgroundColor = "revert", { once: true });
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
    date.disabled = true;

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
        const obj = await func(auth, username.value, id, date.valueAsDate);
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

    const sleepTime = 1000;

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
    date.disabled = false;
});

document.getElementById("clear").addEventListener("click", () => {
    document.getElementById("username").value = "";
    document.getElementById("submission").value = "";
    document.getElementById("output").innerHTML = "";
    document.getElementById("username").disabled = false;
    document.getElementById("startdate").disabled = false;
    switchToTab("submission");
});

document.getElementById("optionResetAuth").addEventListener("click", () => {
    localStorage.removeItem("auth");
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

async function checkGame(auth, username, id, date) {
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
    if (awardDate < date) {
        status = "failure";
    }

    const timestamp = result.HighestAwardDate ? awardDate.toLocaleDateString() : "";

    const alt = document.getElementById("altUsername").value;
    if (username != alt && alt.length && status == "failure") {
        const altResult = await checkGame(auth, alt, id, date);
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

async function checkAchievement(auth, username, id, date) {
    const info = await fetch(`https://retroachievements.org/API/API_GetAchievementUnlocks.php?${auth}&a=${id}&c=1`).then(a => a.json());
    const game = await fetch(`https://retroachievements.org/API/API_GetGameInfoAndUserProgress.php?${auth}&u=${username}&g=${info.Game.ID}&a=0`).then(a => a.json());
    const achievement = game.Achievements[info.Achievement.ID];
    const unlockDate = "DateEarnedHardcore" in achievement ? new Date(achievement.DateEarnedHardcore) : null;

    return {
        status: unlockDate > date ? "success" : "failure",
        title: info.Achievement.Title,
        icon: `/Badge/${achievement.BadgeName}.png`,
        timestamp: unlockDate ? unlockDate.toLocaleDateString() : "N/A",
    }
}
