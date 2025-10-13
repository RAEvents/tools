import { render } from "preact";
import "./app.css";

import { Checker } from "./tools/checker.jsx";
import { Menu } from "./menu.jsx";

function App() {
	return <main>
        <Menu />
        <Checker />
    </main>;
}

render(<App />, document.body);
