import Action from "./Action";

export default abstract class MidiControl {
    public readonly id: number;
    private readonly action: Action;

    protected constructor(id: number, action: Action) {
        this.id = id;
        this.action = action;
    }

    public abstract async handleEvent(eventType: number, velocity: number): Promise<boolean>;

    protected async performAction(velocity: number): Promise<void> {
        await this.action.execute(velocity);
    }
}

export enum EventType {
    BUTTON_DOWN = 153,
    BUTTON_UP = 137,
    ADVANCED_CONTROL = 176,
}
