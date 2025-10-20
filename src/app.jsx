import { render } from "preact";
import { useContext } from "preact/hooks";
import { LocationProvider, ErrorBoundary, Router, Route, useLocation } from "preact-iso";
import "./app.css";

import { Verify } from "./tools/verify.jsx";
import { Menu } from "./components/menu.jsx";
import { Settings, defaultSettings } from "./settings.js";

function NotFound() {
    const location = useLocation();
    return <div>{location.path}</div>;
}

function AppRouter() {
    const settings = useContext(Settings);
    return <Router>
        <Route path={`${settings.basepath}/verify`} component={Verify} />
        <Route default component={NotFound} />
    </Router>;
}

function App() {
	return <LocationProvider>
        <ErrorBoundary>
            <Settings.Provider value={defaultSettings}>
                <Menu />
                <AppRouter />
            </Settings.Provider>
        </ErrorBoundary>
    </LocationProvider>;
}

render(<App />, document.querySelector("main"));
