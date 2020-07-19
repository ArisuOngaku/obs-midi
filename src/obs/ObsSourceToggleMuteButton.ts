import ButtonControl from "../ButtonControl";
import Action from "../Action";
import LedStateUpdater from "../LedStateUpdater";
import App from "../App";

export default class ObsSourceToggleMuteButton extends ButtonControl implements Action, LedStateUpdater {
    private readonly sourceName: string;


    public constructor(id: number, sourceName: string, triggerOnUp: boolean = false) {
        super(id, triggerOnUp);
        this.sourceName = sourceName;
        this.action = this;
        this.ledId = id;
        this.ledStateUpdater = this;
    }

    public async init(app: App): Promise<void> {
        app.getObs().on('SourceMuteStateChanged', async data => {
            if (data.sourceName === this.sourceName) {
                try {
                    await this.update(app);
                    await app.tick();
                } catch (e) {
                    console.error(e);
                }
            }
        });
    }

    public async performAction(app: App, velocity: number): Promise<void> {
        await app.getObs().send('ToggleMute', {source: this.sourceName});
    }

    public async updateLedState(app: App, ledId: number): Promise<void> {
        const muted = app.getObsStateTracker().isSourceMuted(this.sourceName);
        app.led(0, ledId, muted ? 0 : 3, muted ? 3 : 0);
    }

}