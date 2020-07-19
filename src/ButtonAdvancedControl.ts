import MidiControl from "./MidiControl";
import App from "./App";

export default abstract class ButtonAdvancedControl extends MidiControl {
    private readonly triggerOnUp: boolean;

    protected constructor(id: number, triggerOnUp: boolean = false) {
        super(id);
        this.triggerOnUp = triggerOnUp;
    }

    public async handleEvent(app: App, eventType: number, velocity: number): Promise<boolean> {
        if (this.triggerOnUp && velocity === 0 ||
            !this.triggerOnUp && velocity !== 0) {
            await this.executeAction(app, velocity === 0 ? 0 : 1);
            return true;
        }

        return false;
    }

}