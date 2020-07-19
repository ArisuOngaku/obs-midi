import MidiControl, {EventType} from "./MidiControl";
import App from "./App";

export default abstract class ButtonControl extends MidiControl {
    private readonly triggerOnUp: boolean;

    protected constructor(id: number, triggerOnUp: boolean = false) {
        super(id);
        this.triggerOnUp = triggerOnUp;
    }

    public async handleEvent(app: App, eventType: number, velocity: number): Promise<boolean> {
        if (this.triggerOnUp && [EventType.BUTTON_UP, EventType.IN_BUTTON_UP].indexOf(eventType) >= 0 ||
            !this.triggerOnUp && [EventType.BUTTON_DOWN, EventType.IN_BUTTON_DOWN].indexOf(eventType) >= 0) {
            await this.executeAction(app, velocity);
            return true;
        }

        return false;
    }

}