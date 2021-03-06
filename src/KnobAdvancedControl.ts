import MidiControl, {EventType} from "./MidiControl";
import App from "./App";

export default abstract class KnobAdvancedControl extends MidiControl {
    protected constructor(id: number) {
        super(id);
    }

    public async handleEvent(app: App, eventType: number, velocity: number): Promise<boolean> {
        if (eventType === EventType.ADVANCED_CONTROL) {
            await this.executeAction(app, velocity);
            return true;
        }

        return false;
    }
}

export function toRawVolume(velocity: number) {
    return velocity / 127;
}

export function toVolume(velocity: number) {
    return dbToLinear(linearToDef(toRawVolume(velocity)));
}

function dbToLinear(x: number) {
    return Math.pow(10, x / 20);
}

/**
 * @author Arkhist (thanks!)
 */
function linearToDef(y: number) {
    if (y >= 1) return 0;

    if (y >= 0.75)
        return reverseDef(y, 9, 9, 0.25, 0.75);
    else if (y >= 0.5)
        return reverseDef(y, 20, 11, 0.25, 0.5);
    else if (y >= 0.3)
        return reverseDef(y, 30, 10, 0.2, 0.3);
    else if (y >= 0.15)
        return reverseDef(y, 40, 10, 0.15, 0.15);
    else if (y >= 0.075)
        return reverseDef(y, 50, 10, 0.075, 0.075);
    else if (y >= 0.025)
        return reverseDef(y, 60, 10, 0.05, 0.025);
    else if (y > 0)
        return reverseDef(y, 150, 90, 0.025, 0);
    else
        return -15000;
}

function reverseDef(y: number, a1: number, d: number, m: number, a2: number) {
    return ((y - a2) / m) * d - a1;
}