export default class LedState {
    public readonly channel: number;
    public readonly note: number;
    public readonly green: number;
    public readonly red: number;
    public readonly duration: number;

    constructor(
        channel: number,
        note: number,
        green: number,
        red: number,
        duration: number = 0
    ) {
        this.channel = channel;
        this.note = note;
        this.green = green;
        this.red = red;
        this.duration = duration;
    }
}