import App from "./App";

export default interface LedStateUpdater {
    updateLedState(app: App, ledId: number): Promise<void>;
}