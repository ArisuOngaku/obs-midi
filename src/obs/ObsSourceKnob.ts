import KnobAdvancedControl, {toVolume} from "../KnobAdvancedControl";
import Action from "../Action";
import App from "../App";

export default class ObsSourceKnob extends KnobAdvancedControl implements Action {
    private readonly sourceName: string;

    constructor(id: number, sourceName: string) {
        super(id);
        this.sourceName = sourceName;
        this.action = this;
    }

    public async init(app: App): Promise<void> {
    }

    public async performAction(app: App, velocity: number): Promise<void> {
        await app.getObs().send('SetVolume', {source: this.sourceName, volume: toVolume(velocity)});
    }

}