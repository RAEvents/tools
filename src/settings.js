import { createContext } from "preact";

export const defaultSettings = {
    basepath: location.hostname.endsWith("github.io") ? "/tools" : "",
}

export const Settings = createContext(null);
