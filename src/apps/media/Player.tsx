import { Icon, IconButton } from '../../ui'
import { Art } from './art'
import { fmtTime, type Asset } from './data'

export type PlayerProps = {
  asset: Asset; playing: boolean; t: number; vol: number; shuffle: boolean; repeat: boolean
  onToggle: () => void; onPrev: () => void; onNext: () => void; onSeek: (t: number) => void; onVol: (v: number) => void
  onShuffle: () => void; onRepeat: () => void; onClose: () => void; onOpen: () => void
}

export function Player(p: PlayerProps) {
  const { asset: a, t } = p, pct = Math.min(100, (t / a.dur) * 100)
  return (
    <div className="md-player" role="region" aria-label="Player">
      <div className="md-mini-bar" aria-hidden="true"><span style={{ width: pct + '%' }} /></div>
      <button type="button" className="md-now" onClick={p.onOpen} aria-label={`Open ${a.title}`}>
        <span className="md-now-art"><Art motif={a.motif} pal={a.pal} seed={a.seed} ratio={a.ratio} /></span>
        <span className="md-now-text"><span className="truncate md-now-title">{a.title}</span><span className="truncate muted md-now-by">{a.by}</span></span>
      </button>
      <div className="md-center">
        <div className="md-transport">
          <IconButton icon="shuffle" label="Shuffle" size="sm" className="md-opt" on={p.shuffle} aria-pressed={p.shuffle} onClick={p.onShuffle} />
          <IconButton icon="skip-back" label="Previous" onClick={p.onPrev} />
          <IconButton icon={p.playing ? 'pause' : 'play'} label={p.playing ? 'Pause' : 'Play'} filled onClick={p.onToggle} />
          <IconButton icon="skip-forward" label="Next" onClick={p.onNext} />
          <IconButton icon="repeat" label="Repeat track" size="sm" className="md-opt" on={p.repeat} aria-pressed={p.repeat} onClick={p.onRepeat} />
        </div>
        <div className="md-seek">
          <span className="num faint">{fmtTime(t)}</span>
          <input type="range" className="md-range" aria-label="Seek" min={0} max={a.dur} step={1} value={Math.floor(t)} style={{ ['--p' as string]: pct + '%' }}
            aria-valuetext={`${fmtTime(t)} of ${fmtTime(a.dur)}`} onChange={e => p.onSeek(Number(e.target.value))} />
          <span className="num faint">{fmtTime(a.dur)}</span>
        </div>
      </div>
      <div className="md-right">
        <button type="button" className="icon-btn sm" aria-label={p.vol === 0 ? 'Unmute' : 'Mute'} onClick={() => p.onVol(p.vol === 0 ? 70 : 0)}><Icon name="volume" size={16} style={{ opacity: p.vol === 0 ? 0.4 : 1 }} /></button>
        <input type="range" className="md-range md-vol" aria-label="Volume" min={0} max={100} value={p.vol} style={{ ['--p' as string]: p.vol + '%' }} onChange={e => p.onVol(Number(e.target.value))} />
        <IconButton icon="x" label="Close player" size="sm" onClick={p.onClose} />
      </div>
      <div className="md-mini-ctl">
        <IconButton icon={p.playing ? 'pause' : 'play'} label={p.playing ? 'Pause' : 'Play'} onClick={p.onToggle} />
        <IconButton icon="skip-forward" label="Next" onClick={p.onNext} />
      </div>
    </div>
  )
}
