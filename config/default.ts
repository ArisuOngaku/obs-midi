export default {
    obs: {
        address: '127.0.0.1:4444',
        password: 'secret',
        audio_sources: [
            'Desktop Audio',
            'Mic/Aux',
        ],
    },
    midi: {
        controller: 'Launchkey Mini MIDI 2',
        output: 'Launchkey Mini MIDI 2',
    },
    wms: {
        music_widget: {
            ws: 'wss://watch-my.stream/widgets/music/stream',
            token: 'default',
        },
    },
};