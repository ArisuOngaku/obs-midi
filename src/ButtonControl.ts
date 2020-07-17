import MidiControl, {EventType} from "./MidiControl";
import Action from "./Action";

export default class ButtonControl extends MidiControl {
    private readonly triggerOnUp: boolean;

    public constructor(id: number, action: Action, triggerOnUp: boolean = false) {
        super(id, action);
        this.triggerOnUp = triggerOnUp;
    }

    public async handleEvent(eventType: number, velocity: number): Promise<boolean> {
        if (this.triggerOnUp && eventType === EventType.BUTTON_UP ||
            !this.triggerOnUp && eventType === EventType.BUTTON_DOWN) {
            await this.performAction(velocity);
            return true;
        }

        return false;
    }

}