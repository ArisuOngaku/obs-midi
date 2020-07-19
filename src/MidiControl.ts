import Action from "./Action";
import App from "./App";
import LedStateUpdater from "./LedStateUpdater";

export default abstract class MidiControl {
    public readonly id: number;
    protected action?: Action;
    protected ledId?: number;
    protected ledStateUpdater?: LedStateUpdater;

    protected constructor(id: number) {
        this.id = id;
    }

    public abstract async init(app: App): Promise<void>;

    public abstract async handleEvent(app: App, eventType: number, velocity: number): Promise<boolean>;

    protected async executeAction(app: App, velocity: number): Promise<void> {
        if (this.action) {
            await this.action.performAction(app, velocity);
        }
    }

    public async update(app: App): Promise<void> {
        if (typeof this.ledId === 'number' && this.ledStateUpdater) {
            await this.ledStateUpdater.updateLedState(app, this.ledId);
        }
    }
}

export enum EventType {
    BUTTON_DOWN = 153,
    BUTTON_UP = 137,
    ADVANCED_CONTROL = 176,
    IN_BUTTON_DOWN = 144,
    IN_BUTTON_UP = 128,
}
