const sleep = ms => new Promise(resolve => setTimeout(() => resolve(), 500));

let params = new URL(window.location).searchParams;
if (params.has("data")) {
    const data = JSON.parse(window.atob(params.get("data")));
    document.querySelector("input#username").value = data.username;
    document.querySelector("main > textarea").value = data.links;
}

let date = new Date();
document.querySelector("input#startdate").valueAsDate = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    1
);

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
            let modal = document.body.querySelector("div.authModal");
            let auth = {
                username: modal.querySelector(`input[name="username"]`).value,
                apikey: modal.querySelector(`input[name="apikey"]`).value,
                toString: function() {
                    return `z=${this.username}&y=${this.apikey}`;
                },
            };
            if (modal.querySelector("#saveinfo").checked) {
                localStorage.setItem("auth", JSON.stringify(auth));
            }
            document.body.removeChild(modal);
            resolve(auth);
        });
    });
}

document.getElementById("verify").addEventListener("click", async () => {
    const auth = await getAuthorization();
    const username = document.querySelector("input#username");
    const submission = document.querySelector("main > textarea");
    const date = document.querySelector("input#startdate");

    if (date.value == "") {
        date.style.backgroundColor = "red";
        date.addEventListener("focus", () => date.style.backgroundColor = "revert", { once: true });
        return;
    }

    const games = Array.from(
        submission.value.matchAll("https://retroachievements.org/game/([0-9]+)")
    ).map(([_, id]) => id);

    const achievements = Array.from(
        submission.value.matchAll("https://retroachievements.org/achievement/([0-9]+)")
    ).map(([_, id]) => id);

    const output = document.getElementById("output");
    output.style.display = "block";
    submission.style.display = "none";
    username.disabled = true;
    date.disabled = true;

    output.innerHTML = `
        <h1>Games</h1><hr />
        ${games.map(id => `<div class="game">
            <div class="icon"></div>
            <a class="title" href="https://retroachievements.org/game/${id}">${id}</a>
            <span class="timestamp"></span>
            <div class="status">?</div>
        </div>`).join("")}

        <h1>Achievements</h1><hr />
        ${achievements.map(id => `<div class="achievement">
            <div class="icon"></div>
            <a class="title" href="https://retroachievements.org/achievement/${id}">${id}</a>
            <span class="timestamp"></span>
            <div class="status">?</div>
        </div>`).join("")}
    `;

    for (const elem of output.querySelectorAll(".game")) {
        const id = elem.querySelector(".title").textContent;
        const {status, title, icon, timestamp} = await checkGame(auth, username.value, id, date.valueAsDate);

        const statusElem = elem.querySelector(".status")
        statusElem.classList.add(...status.split(" "));
        statusElem.textContent = status.includes("success") ? "✓" : "X";

        const img = document.createElement("img");
        img.src = `https://media.retroachievements.org${icon}`;
        elem.querySelector(".icon").appendChild(img);

        elem.querySelector(".title").textContent = title;
        elem.querySelector(".timestamp").textContent = timestamp;

        await sleep(500);
    }

    for (const elem of output.querySelectorAll(".achievement")) {
        const id = elem.querySelector(".title").textContent;
        const {status, title, icon, timestamp} = await checkAchievement(auth, username.value, id, date.valueAsDate);

        const statusElem = elem.querySelector(".status")
        statusElem.classList.add(status);
        statusElem.textContent = status == "success" ? "✓" : "X";

        const img = document.createElement("img");
        img.src = `https://media.retroachievements.org${icon}`;
        elem.querySelector(".icon").appendChild(img);

        elem.querySelector(".title").textContent = title;
        elem.querySelector(".timestamp").textContent = timestamp;

        await sleep(500);
    }
});

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

    return {
        status,
        title: result.Title,
        icon: result.ImageIcon,
        timestamp,
    }
}

async function getAchievementInfo(auth, id) {
    const info = await fetch(`https://retroachievements.org/API/API_GetAchievementUnlocks.php?${auth}&a=${id}&c=0`).then(a => a.json());
    const gameInfo = await fetch(`https://retroachievements.org/API/API_GetGameExtended.php?${auth}&i=${info.Game.ID}`).then(a => a.json());

    return {
        title: info.Achievement.Title,
        icon: `/Badge/${gameInfo.Achievements[id].BadgeName}.png`,
    }
}

async function checkAchievement(auth, username, id, date) {
    const achievementInfo = await getAchievementInfo(auth, id);
    const count = 100;
    const url = `https://retroachievements.org/API/API_GetAchievementUnlocks.php?${auth}&a=${id}&c=${count}`;

    let result = null;
    loop: for (let o = 0;; o += count) {
        const unlocks = await fetch(`${url}&o=${o}`).then(a => a.json());
        for (let unlock of unlocks.Unlocks) {
            if (unlock.User == username && unlock.HardcoreMode) {
                result = unlock;
                break loop;
            }
        }
        if (o + count > unlocks.UnlocksCount) break;
        await sleep(100);
    }

    if (result) {
        const unlockDate = new Date(result.DateAwarded);
        return {
            status: unlockDate < date ? "failure" : "success",
            title: achievementInfo.title,
            icon: achievementInfo.icon,
            timestamp: unlockDate.toLocaleDateString(),
        }
    } else {
        return {
            status: "failure",
            title: achievementInfo.title,
            icon: achievementInfo.icon,
            timestamp: "",
        }
    }
}
