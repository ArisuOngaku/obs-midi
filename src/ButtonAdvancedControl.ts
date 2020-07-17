import MidiControl from "./MidiControl";
import Action from "./Action";

export default class ButtonAdvancedControl extends MidiControl {
    private readonly triggerOnUp: boolean;

    public constructor(id: number, action: Action, triggerOnUp: boolean = false) {
        super(id, action);
        this.triggerOnUp = triggerOnUp;
    }

    public async handleEvent(eventType: number, velocity: number): Promise<boolean> {
        if (this.triggerOnUp && velocity === 0 ||
            !this.triggerOnUp && velocity !== 0) {
            await this.performAction(velocity === 0 ? 0 : 1);
            return true;
        }

        return false;
    }

}