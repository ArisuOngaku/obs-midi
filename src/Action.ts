import App from "./App";

export default interface Action {
    performAction(app: App, velocity: number): Promise<void>;
}
