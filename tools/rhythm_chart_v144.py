"""v144：歌姬挑戰譜面產生器（取代 rhythm_chart_v121.py）。
修正 v121 的兩個時間誤差（使用者回報「音符和音樂節拍差太多」）：
  1. 起音偵測的時間基準：v121 用分析視窗的「開頭」當時間，偵測到的起音比實際聲音早約 74ms（以合成鼓聲實測），整份譜面都偏早。
     v144 改用 1024 點視窗＋實測校正 CAL（合成鼓聲／撥弦／噪音實測偏差 -36ms，加回去），誤差 < 3ms。
  2. 速度漂移：v121 用單一 BPM 鋪整首歌的格線，BPM 只要差 0.3 就會越到後面越偏（新時代結尾偏約 180ms）；
     遇到歌曲中途的節拍位移（私は最強 2:00～3:00 的半拍位移）整段都錯拍。
     v144 用動態規劃逐拍追蹤（Ellis 2007），每一拍都對到音樂上，八分／十六分音符格線在相鄰兩拍之間等分。
難度設定、最少音符數（EASY ≥300、NORMAL ≥700、HARD ≥1600，使用者指定）、軌道與種類規則沿用 v121。
用法：python3 tools/rhythm_chart_v144.py assets/music/rhythm/shinjidai.mp3 shinjidai js/rhythm_charts.js [最低BPM 最高BPM]
需要 ffmpeg 與 numpy。驗證：python3 tools/rhythm_chart_v144.py --check js/rhythm_charts.js（列出每首歌每個難度音符與起音的時間誤差）。"""
import json, random, subprocess, sys
import numpy as np
from numpy.lib.stride_tricks import sliding_window_view as sw

SR, N, HOP = 22050, 1024, 110
CAL = .036  # 起音偵測偏差校正（秒）

def load(mp3):
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, dtype=np.float32)

def analyse(x):
    frames = 1 + (len(x) - N) // HOP; win = np.hanning(N).astype(np.float32)
    freqs = np.fft.rfftfreq(N, 1 / SR); edges = np.geomspace(40, 10000, 49)
    masks = [(freqs >= edges[i]) & (freqs < edges[i + 1]) for i in range(48)]
    Bs, R, C = [], [], []
    for a in range(0, frames, 4000):
        b = min(frames, a + 4000); idx = np.arange(N)[None, :] + HOP * np.arange(a, b)[:, None]; seg = x[idx]
        M = np.abs(np.fft.rfft(seg * win, axis=1)).astype(np.float32)
        Bs.append(np.stack([M[:, m].sum(1) for m in masks], 1)); R.append(np.sqrt((seg ** 2).mean(1))); C.append((M * freqs).sum(1) / (M.sum(1) + 1e-9))
    B = np.concatenate(Bs); L = np.log1p(100 * B / (B.max() + 1e-9))
    flux = np.concatenate([[0], np.maximum(0, L[1:] - L[:-1]).sum(1)])
    fr = SR / HOP; k = int(fr * .4)
    loc = sw(np.pad(flux, (k // 2, k - k // 2 - 1), mode='edge'), k).mean(1)
    on = np.maximum(0, flux - loc); on /= on.max()
    rms = np.concatenate(R); rms /= rms.max()
    return on, rms, np.concatenate(C), fr

def tempo(on, fr, lo, hi):
    seg = on - on.mean(); n = len(seg); F = np.fft.rfft(seg, 2 * n); ac = np.fft.irfft(np.abs(F) ** 2)[:n]
    lags = np.arange(int(fr * 60 / hi), int(fr * 60 / lo) + 1); L = lags[np.argmax(ac[lags])]
    # 拋物線內插，得到小數 lag
    a, b, c = ac[L - 1], ac[L], ac[L + 1]; return L + .5 * (a - c) / (a - 2 * b + c)

def track(on, period, tight=100.):
    n = len(on); Cs = on.astype(float).copy(); P = -np.ones(n, int)
    d = np.arange(int(round(period / 2)), int(round(2 * period)) + 1); pen = -tight * np.log(d / period) ** 2
    for t in range(d[-1], n):
        cand = Cs[t - d] + pen; k = np.argmax(cand); Cs[t] = on[t] + cand[k]; P[t] = t - d[k]
    t = n - 1 - int(period) + np.argmax(Cs[n - 1 - int(period):]); b = [t]
    while P[b[-1]] >= 0: b.append(P[b[-1]])
    return np.array(b[::-1])

def refine(on, fr, beats):
    """每拍在 ±20ms 內對到最近的起音峰（拍點已由 DP 決定，這裡只修掉 1～2 格的量化誤差）"""
    w = int(.02 * fr); out = []
    for b in beats:
        a, c = max(0, b - w), min(len(on), b + w + 1); seg = on[a:c]
        out.append(a + int(np.argmax(seg)) if seg.max() > .15 else b)
    return np.array(out)

CFG = {
    'easy':   dict(lv=4,  min=300,  div=1, minGap=1,   gapFill=4, fillStep=2,  hold=.08, flick=.03, dbl=0,   holdBeats=(2, 2)),
    'normal': dict(lv=8,  min=700,  div=2, minGap=.5,  gapFill=2, fillStep=1,  hold=.10, flick=.06, dbl=.12, holdBeats=(1, 2)),
    'hard':   dict(lv=12, min=1600, div=4, minGap=.25, gapFill=1, fillStep=.5, hold=.08, flick=.08, dbl=.35, holdBeats=(1, 1.5)),
}

def build(mp3, song_id, lo=90, hi=200):
    x = load(mp3); DUR = len(x) / SR; on, rms, cent, fr = analyse(x)
    tf = lambda t: np.arange(len(on)) / fr + CAL
    P = tempo(on[int(10 * fr):int((DUR - 10) * fr)], fr, lo, hi)
    bi = refine(on, fr, track(on, P)); BT = bi / fr + CAL  # 拍點（秒，已校正）
    ibi = np.diff(BT); BEAT = float(np.median(ibi)); BPM = 60 / BEAT
    # 開頭／結尾補齊拍點（DP 追不到的靜音段）
    pre = np.arange(BT[0] - BEAT, 0, -BEAT)[::-1]; post = np.arange(BT[-1] + BEAT, DUR, BEAT)
    BT = np.concatenate([pre, BT, post])
    print(f'{song_id}: BPM {BPM:.2f}（每拍 {BEAT*1000:.1f}ms，拍長範圍 {np.percentile(ibi,5)*1000:.0f}～{np.percentile(ibi,95)*1000:.0f}ms），{len(BT)} 拍', file=sys.stderr)
    T = np.arange(len(on)) / fr + CAL
    def fi(t): return int(np.clip(round((t - CAL) * fr), 0, len(on) - 1))
    def strength(t, w=.03): a, b = fi(t - w), fi(t + w) + 1; return on[a:b].max() if b > a else 0
    def energy(t, w=.25): a, b = fi(t), fi(t + w); return rms[a:b].mean() if b > a else 0
    def beat_at(t): i = int(np.clip(np.searchsorted(BT, t) - 1, 0, len(BT) - 2)); return BT[i + 1] - BT[i]
    def grid(div):  # 每拍等分 div 格，回傳 (時間, 拍內位置)
        g = []
        for i in range(len(BT) - 1):
            for s in range(div): g.append((BT[i] + (BT[i + 1] - BT[i]) * s / div, s))
        g.append((BT[-1], 0)); return g
    def snap(t, step_beats):  # 補空檔用：對齊到最近的拍／半拍
        div = max(1, int(round(1 / min(1, step_beats)))); G = grid(div); ts = np.array([z[0] for z in G]); return ts[np.argmin(abs(ts - t))]
    G4 = grid(4); alive = [t for t, _ in G4 if energy(t) > .06]; T0, T1 = alive[0], min(alive[-1], DUR - 1.2)

    def make(dk, C, pct):
        rnd = random.Random(f'{song_id}:{dk}:v121')
        Gd = [(t, s) for t, s in grid(C['div']) if T0 - .01 <= t < T1]
        st = np.array([strength(t) for t, _ in Gd]); en = np.array([energy(t) for t, _ in Gd])
        thr = np.percentile(st[en > .06], pct)
        times = []; last = -9
        for i, ((g, sub), s) in enumerate(zip(Gd, st)):
            onbeat = sub == 0; need = thr * (.7 if onbeat else 1.05 if sub % 2 == 0 else 1.25)
            if en[i] < .06 or s < need or g - last < C['minGap'] * beat_at(g) - .01: continue
            times.append((g, s, onbeat)); last = g
        filled = []; prev = None
        for item in times + [(T1 + C['gapFill'] * BEAT, 0, True)]:
            g = item[0]
            if prev is not None and g - prev > C['gapFill'] * beat_at(prev) + .01:
                t = prev + C['fillStep'] * beat_at(prev)
                while t < g - C['fillStep'] * beat_at(t) * .9:
                    t2 = snap(t, C['fillStep']); filled.append((t2, strength(t2), True)); t += C['fillStep'] * beat_at(t)
            if g <= T1: filled.append(item)
            prev = g
        filled.sort(key=lambda z: z[0])
        ded = []; 
        for z in filled:
            if not ded or z[0] - ded[-1][0] > .02: ded.append(z)
        filled = ded
        out = []; p = rnd.randrange(4); dirn = 1; pt = -9; hl, hend = -1, -1
        for i, (g, s, onbeat) in enumerate(filled):
            gap = (g - pt) * 1000; bad = {hl} if g < hend else set(); B = beat_at(g)
            if gap < 240:
                l = p + dirn
                if l < 0 or l > 3 or l in bad: dirn = -dirn; l = p + dirn
            else:
                opts = [q for q in range(4) if q != p and q not in bad]
                l = rnd.choices(opts, [3 if abs(q - p) <= 2 else 1 for q in opts])[0] if gap < 420 else rnd.choice(opts)
            l = max(0, min(3, l))
            if l in bad: l = next(q for q in range(4) if q not in bad and q != p)
            nxt = filled[i + 1][0] if i + 1 < len(filled) else g + 9
            kind, dur = 0, 0
            free = C['div'] == 1 and nxt - g < B * C['holdBeats'][0] * .95
            if onbeat and not free and (hl < 0 or g >= hend):
                if energy(g, B * 2) > .2 and rnd.random() < C['hold']:
                    hb = rnd.choice(C['holdBeats']); hb = min(hb, (nxt - g) / B - .25) if C['div'] == 1 else hb
                    if hb >= .75: kind, dur = 1, int(round(hb * B * 1000))
            if kind == 0 and onbeat and s > .3 and rnd.random() < C['flick']: kind = 2
            t = int(round(g * 1000)); out.append([t, l, kind, dur])
            if kind == 1: hl, hend = l, g + dur / 1000 + .08
            if kind == 0 and C['dbl'] and onbeat and s > .45 and rnd.random() < C['dbl']:
                m2 = [q for q in range(4) if q != l and q not in bad and abs(q - l) >= 2] or [q for q in range(4) if q != l and q not in bad]
                if m2: out.append([t, rnd.choice(m2), 0, 0])
            if rnd.random() < .12: dirn = -dirn
            p, pt = l, g
        return out

    diffs = {}
    for dk, C in CFG.items():
        for pct in range(99, -1, -1):
            notes = make(dk, C, pct)
            if len(notes) >= C['min']: break
        diffs[dk] = {'lv': C['lv'], 'notes': notes}
        ts = [n[0] for n in notes]
        print(f'  {dk} Lv{C["lv"]} pct {pct}: {len(notes)} 音符 {len(notes)/(ts[-1]-ts[0])*1000:.2f}/秒 長按 {sum(n[2]==1 for n in notes)} 滑動 {sum(n[2]==2 for n in notes)}', file=sys.stderr)
    beats_ms = [int(round(b * 1000)) for b in BT if 0 <= b <= DUR]
    return dict(bpm=round(BPM, 1), dur=round(DUR, 1), offset=beats_ms[0], beats=beats_ms), diffs

def check(path):
    from scipy.signal import find_peaks
    data = json.loads(open(path, encoding='utf-8').read().split('window.RHYTHM_SONGS = ', 1)[1].rstrip().rstrip(';'))
    for s in data:
        x = load(s['src'].split('?')[0]); on, rms, cent, fr = analyse(x); pk, _ = find_peaks(on, height=.08, distance=int(fr * .06)); pt = pk / fr + CAL
        bt = np.array(s.get('beats') or []) / 1000
        if len(bt):
            j = np.clip(np.searchsorted(pt, bt), 1, len(pt) - 1); e = np.where(abs(pt[j] - bt) < abs(pt[j - 1] - bt), pt[j] - bt, pt[j - 1] - bt) * 1000
            m = abs(e) < 60; print(f"{s['id']} 拍點：與起音誤差中位 {np.median(e[m]):+.0f}ms、|誤差|中位 {np.median(abs(e[m])):.0f}ms（{m.mean()*100:.0f}% 拍點 60ms 內有起音）")
        for dk, d in s['diffs'].items():
            ts = np.array(sorted(set(n[0] for n in d['notes']))) / 1000
            j = np.clip(np.searchsorted(pt, ts), 1, len(pt) - 1); dd = np.minimum(abs(pt[j] - ts), abs(pt[j - 1] - ts)) * 1000
            sg = np.where(abs(pt[j] - ts) < abs(pt[j - 1] - ts), pt[j] - ts, pt[j - 1] - ts) * 1000
            print(f"  {dk}: {len(ts)} 個時間點，|誤差|中位 {np.median(dd):.0f}ms、>50ms {np.mean(dd>50)*100:.0f}%，偏差中位 {np.median(sg[dd<60]):+.0f}ms")

if __name__ == '__main__':
    if sys.argv[1] == '--check': check(sys.argv[2]); sys.exit()
    mp3, song_id, path = sys.argv[1:4]; lo, hi = (float(sys.argv[4]), float(sys.argv[5])) if len(sys.argv) > 5 else (90, 200)
    meta, diffs = build(mp3, song_id, lo, hi)
    head, body = open(path, encoding='utf-8').read().split('window.RHYTHM_SONGS = ', 1); data = json.loads(body.rstrip().rstrip(';'))
    song = next(s for s in data if s['id'] == song_id); song.update(meta); song['diffs'] = diffs
    head = '/* 歌姬挑戰譜面（v144 起由 tools/rhythm_chart_v144.py 逐拍追蹤＋起音校正產生；格式 [毫秒, 軌道 0-3, 種類 0 點擊 1 長按 2 滑動, 長按毫秒]；beats＝每一拍的毫秒） */\n'
    open(path, 'w', encoding='utf-8').write(head + 'window.RHYTHM_SONGS = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
