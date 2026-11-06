import { shatterLook, genericCues } from './shatter.js';

export default {
  name: 'generic',
  begin(ctx) {
    this.cues = genericCues(ctx.beats, ctx.song.length);
    ctx.world.room.scheduleWires(this.cues.ignite, this.cues.ignite + 2.4, 7);
  },
  look(L, t, ctx) { return shatterLook(L, t, this.cues, ctx.beats); },
  events() {
    return [{ t: this.cues.brk, sfx: 'crack', gain: 1, haptic: [1, 120] }];
  },
  frame() {},
};
