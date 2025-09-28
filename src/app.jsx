import { render } from "preact";
import "./app.css";

import { Checker } from "./tools/checker.jsx";

function App() {
	return <Checker />
}

render(<App />, document.getElementById("app"));
