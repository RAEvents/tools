import { buildAuthorization } from "@retroachievements/api";
import { useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { TabArea } from "../components/tabarea.jsx";
import * as css from "./verify.module.css";

function SubmissionPane({ text }) {
    return (
        <textarea
            class={css.submission}
            onChange={ev => text.value = ev.target.value}
            value={text}>
        </textarea>
    )
}

function OutputPane({ data }) {
    return (
        <div class={css.output}>{data.value.foo}</div>
    )
}

export function Verify() {
    const submission = useSignal("");
    const data = useSignal({});
    const tabArea = useRef(null);

    const username = useSignal("");
    const alt = useSignal("");
    const startDate = useSignal(new Date(0));
    const endDate = useSignal(new Date(Date.now()));

    const clear = () => {
        submission.value = "";
        data.value = {};
        tabArea.current.setActiveTab(0);
    };

    const verify = () => {
        // TODO: parse submission
        // TODO: transform into data object
        data.value = { foo: parseInt(submission.value) };
        tabArea.current.setActiveTab(1);
    };

    return <div class={css.main}>
        <div class={css.sidebar}>
            <label>
                Username:
                <input type="text"
                    name="username"
                    value={username}
                    onInput={ev => username.value = ev.currentTarget.value}>
                </input>
            </label>
            <label>
                Alt:
                <input type="text"
                    name="alt"
                    value={alt}
                    onInput={ev => alt.value = ev.currentTarget.value}>
                </input>
            </label>
            <label>
                Start Date:
                <input type="date"
                    name="startdate"
                    value={startDate.value.toISOString().slice(0, 10)}
                    onInput={ev => startDate.value = ev.currentTarget.valueAsDate}>
                </input>
            </label>
            <label>
                End Date:
                <input type="date"
                    name="enddate"
                    value={endDate.value.toISOString().slice(0, 10)}
                    onInput={ev => endDate.value = ev.currentTarget.valueAsDate}>
                </input>
            </label>
        </div>

        <TabArea class={css.tabarea} ref={tabArea}>
            <TabArea.Tab name="Submission">
                <SubmissionPane text={submission} />
            </TabArea.Tab>
            <TabArea.Tab name="Output">
                <OutputPane data={data} />
            </TabArea.Tab>
        </TabArea>

        <div class={css.buttons}>
            <button onClick={clear}>Clear</button>
            <button onClick={verify}>Verify</button>
        </div>

        <div id="options" style="display:none">
            <button id="optionExportURL">Export to URL</button>
            <button id="optionResetAuth">Reset Auth</button>
            <select id="optionDateFormat">
                <option>yyyy-mm-dd</option>
                <option>mm/dd/yyyy</option>
                <option>dd/mm/yyyy</option>
                <option>mm-dd-yyyy</option>
                <option>dd-mm-yyyy</option>
            </select>
            <label>
                <input id="optionCheckDate" type="checkbox" checked></input>
                Check date
            </label>
        </div>
        <template id="authModalTemplate">
            <div class="authModal">
                <div>
                    <label>Username:</label>
                    <input name="username" type="text"></input>
                    <label>API Key:</label>
                    <input name="apikey" type="password"></input>
                    <label>
                        <input name="saveinfo" type="checkbox"></input>
                        Save Info
                    </label>
                    <button>Ok</button>
                </div>
            </div>
        </template>
    </div>;
}


// function resetDatePicker() {
//     let now = new Date();
//     document.getElementById("startdate").valueAsDate = new Date(
//         now.getUTCFullYear(),
//         now.getUTCMonth(),
//         1
//     );
//     document.getElementById("enddate").valueAsDate = now;
// }

// async function getAuthorization() {
//     if (!localStorage.getItem("auth")) {
//         return await showAuthModal();
//     } else {
//         const obj = JSON.parse(localStorage.getItem("auth"));
//         if ("apikey" in obj) {
//             obj.webApiKey = obj.apikey;
//             delete obj.apikey;
//             localStorage.setItem("auth", JSON.stringify(obj));
//         }
//         const auth = buildAuthorization(obj);
//         auth.toString = function() {
//             return `z=${this.username}&y=${this.webApiKey}`;
//         }
//         return auth;
//     }
// }

// function showAuthModal() {
//     let template = document.getElementById("authModalTemplate");
//     let modal = template.content.cloneNode(true);
//     let button = modal.children[0].querySelector("button");
//     document.body.appendChild(modal);
//
//     return new Promise(resolve => {
//         button.addEventListener("click", ev => {
//             let modal = document.querySelector("div.authModal");
//             let auth = {
//                 username: modal.querySelector("input[name='username']").value,
//                 webApiKey: modal.querySelector("input[name='apikey']").value,
//             };
//             if (modal.querySelector("input[name='saveinfo']").checked) {
//                 localStorage.setItem("auth", JSON.stringify(auth));
//             }
//             document.body.removeChild(modal);
//             resolve(buildAuthorization(auth));
//         });
//     });
// }

// let params = new URL(window.location).searchParams;
// if (params.has("data")) {
//     let data = null;
//     if (params.has("c") && params.get("c") == "0") {
//         data = JSON.parse(atob(params.get("data")));
//     } else {
//         data = await decompress(params.get("data"));
//     }
//     const startDate = document.getElementById("startdate").value;
//     const endDate = document.getElementById("enddate").value;
//
//     document.getElementById("username").value = data.username ?? "";
//     document.getElementById("altUsername").value = data.alt ?? "";
//     document.getElementById("startdate").value = data.startDate ?? startDate;
//     document.getElementById("enddate").value = data.endDate ?? endDate;
//     document.getElementById("submission").value = data.submission ?? "";
//     document.getElementById("optionCheckDate").checked = data.optionCheckDate ?? true;
// }
//
// document.getElementById("verify").addEventListener("click", async () => {
//     const auth = await getAuthorization();
//     const username = document.getElementById("username");
//     const altUsername = document.getElementById("altUsername");
//     const submission = document.getElementById("submission");
//     const startDate = document.getElementById("startdate");
//     const endDate = document.getElementById("enddate");
//
//     api.resetBackoff();
//
//     if (startDate.value == "") {
//         startDate.style.backgroundColor = "red";
//         startDate.addEventListener("focus", () => startDate.style.backgroundColor = "revert", { once: true });
//         return;
//     }
//
//     const games = Array.from(
//         submission.value.matchAll("https://(?:www.)?retroachievements.org/game/([0-9]+)")
//     ).map(([_, id]) => id);
//
//     const achievements = Array.from(
//         submission.value.matchAll("https://(?:www.)?retroachievements.org/achievement/([0-9]+)")
//     ).map(([_, id]) => id);
//
//     switchToTab("output");
//     username.disabled = true;
//     altUsername.disabled = true;
//     startDate.disabled = true;
//     endDate.disabled = true;
//
//     output.innerHTML = html`
//         <h1>Games</h1><hr />
//         ${games.map(id => html`<div class="game">
//             <div class="icon"></div>
//             <a class="title" href="https://retroachievements.org/game/${id}">${id}</a>
//             <span class="timestamp"></span>
//             <div class="status">?</div>
//         </div>`).join("")}
//
//         <h1>Achievements</h1><hr />
//         ${achievements.map(id => html`<div class="achievement">
//             <div class="icon"></div>
//             <a class="title" href="https://retroachievements.org/achievement/${id}">${id}</a>
//             <span class="timestamp"></span>
//             <div class="status">?</div>
//         </div>`).join("")}
//     `;
//
//     const render = async (elem, func) => {
//         const id = elem.querySelector(".title").textContent;
//         // add one day to end date to account for it being unlocked during that day
//         const end = endDate.valueAsDate;
//         end.setDate(end.getDate() + 1);
//         const obj = await func(auth, username.value, id, startDate.valueAsDate, end);
//         const statusElem = elem.querySelector(".status")
//         statusElem.classList.add(...obj.status.split(" "));
//         statusElem.textContent = obj.status.includes("success") ?
//             obj.status.includes("alt") ? "A" : "✓" : "X";
//
//         const img = document.createElement("img");
//         img.src = `https://media.retroachievements.org${obj.icon}`;
//         elem.querySelector(".icon").appendChild(img);
//
//         elem.querySelector(".title").textContent = obj.title;
//         elem.querySelector(".timestamp").textContent = obj.timestamp;
//     };
//
//     for (const elem of output.querySelectorAll(".game")) {
//         await render(elem, api.checkGame);
//         await api.wait();
//     }
//
//     for (const elem of output.querySelectorAll(".achievement")) {
//         await render(elem, api.checkAchievement);
//         await api.wait();
//     }
//
//     username.disabled = false;
//     altUsername.disabled = false;
//     startDate.disabled = false;
//     endDate.disabled = false;
// });
//
// document.getElementById("clear").addEventListener("click", () => {
//     document.getElementById("username").value = "";
//     document.getElementById("submission").value = "";
//     document.getElementById("output").innerHTML = "";
//     document.getElementById("username").disabled = false;
//     document.getElementById("startdate").disabled = false;
//     switchToTab("submission");
// });
//
// document.getElementById("optionResetAuth").addEventListener("click", () => {
//     localStorage.removeItem("auth");
// });
//
// document.getElementById("optionExportURL").addEventListener("click", async () => {
//     const username = document.getElementById("username").value;
//     const alt = document.getElementById("altUsername").value;
//     const startDate = document.getElementById("startdate").value;
//     const endDate = document.getElementById("enddate").value;
//     const submission = document.getElementById("submission").value;
//     const optionCheckDate = document.getElementById("optionCheckDate").checked;
//
//     const data = await compress({
//         username, alt, startDate, endDate, submission, optionCheckDate
//     });
//
//     const url = new URL(window.location.href);
//     url.searchParams.set("data", data);
//     window.location.href = url.href;
// });
//
// document.getElementById("optionCheckDate").addEventListener("change", ev => {
//     const datePicker = document.getElementById("startdate");
//     if (ev.target.checked) {
//         datePicker.disabled = false;
//         resetDatePicker();
//     } else {
//         datePicker.disabled = true;
//         datePicker.valueAsDate = new Date(0);
//     }
// });
//
// document.getElementById("optionDateFormat").addEventListener("change", ev => {
//     setOption("dateFormat", ev.target.selectedIndex);
// });
//
// if (!localStorage.getItem("options")) {
//     localStorage.setItem("options", JSON.stringify({
//         dateFormat: 0,
//     }));
// } else {
//     const options = JSON.parse(localStorage.getItem("options"));
//     // document.getElementById("optionDateFormat").selectedIndex = options.dateFormat;
// }
//
// for (const elem of document.querySelectorAll("#tabs > div")) {
//     const target = elem.dataset.target;
//     elem.addEventListener("mousedown", () => {
//         switchToTab(target);
//     });
// }

