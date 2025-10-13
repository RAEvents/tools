import { render } from "preact";
import "./app.css";

import { Verify } from "./tools/verify.jsx";
import { Menu } from "./menu.jsx";

function App() {
	return <main>
        <Menu />
        <Verify />
    </main>;
}

render(<App />, document.body);
