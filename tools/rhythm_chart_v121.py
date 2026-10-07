"""v121：歌姬挑戰譜面產生器（取代 rhythm_beatmap.py＋rhythm_lanes.py 的兩段流程）。
三個難度的差距拉大：
  EASY   Lv.3 ：只在強拍上放音符，相鄰至少 2 拍，約 0.8 個／秒；允許較長空檔（超過 8 拍才每 4 拍補一個）。
  NORMAL Lv.7 ：八分音符格，相鄰至少半拍，約 2 個／秒；空檔超過 4 拍就每 2 拍補一個；少量雙押、長按、滑動。
  HARD   Lv.12：十六分音符格，約 4.5～5 個／秒；空檔超過 1 拍就補上八分音符（高難度不留大段空白）；
               雙押、樓梯、交錯、長按、滑動都更多。
軌道：間隔短走樓梯（相鄰軌、碰邊反彈），中等間隔換軌，長按期間不在同一軌放音符。固定亂數種子，結果可重現。
用法：python3 tools/rhythm_chart_v121.py assets/music/rhythm/shinjidai.mp3 shinjidai js/rhythm_charts.js
需要 ffmpeg 與 numpy。"""
import json, random, subprocess, sys
import numpy as np

mp3, song_id, path = sys.argv[1], sys.argv[2], sys.argv[3]
SR, HOP, N = 22050, 256, 2048
x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, dtype=np.float32)
DUR = len(x) / SR
frames = 1 + (len(x) - N) // HOP
idx = np.arange(N)[None, :] + HOP * np.arange(frames)[:, None]
win = np.hanning(N).astype(np.float32)
S = np.log1p(10 * np.abs(np.fft.rfft(x[idx] * win, axis=1)).astype(np.float32))
flux = np.concatenate([[0], np.maximum(0, np.diff(S, axis=0)).sum(axis=1)])
from numpy.lib.stride_tricks import sliding_window_view as sw
fr = SR / HOP; k = int(fr * 1.5)
loc = sw(np.pad(flux, (k // 2, k - k // 2 - 1), mode='edge'), k).mean(axis=1)
on = np.maximum(0, flux - loc); on /= on.max()
rms = np.sqrt((x[idx] ** 2).mean(axis=1)); rms /= rms.max()
freqs = np.fft.rfftfreq(N, 1 / SR); cent = (S * freqs).sum(1) / (S.sum(1) + 1e-9)

# 節拍：自相關找速度（90～200 BPM），再細調週期與相位
seg = on[int(10 * fr):int((DUR - 10) * fr)]; seg = seg - seg.mean()
ac = np.correlate(seg, seg, mode='full')[len(seg) - 1:]
lags = np.arange(len(ac)); bpm = 60 * fr / np.maximum(lags, 1)
m = (bpm >= 90) & (bpm <= 200); L0 = lags[m][np.argmax(ac[m])]
def score(period, ph): g = np.arange(ph, DUR - .5, period); return on[np.minimum((g * fr).astype(int), len(on) - 1)].sum()
best = max(((score(L / fr, ph), L / fr, ph) for L in np.arange(L0 - 2, L0 + 2.01, .02) for ph in np.linspace(0, L / fr, 48, endpoint=False)))
_, BEAT, PH = best
BPM = 60 / BEAT
print(f'BPM {BPM:.2f} beat {BEAT*1000:.1f}ms phase {PH*1000:.0f}ms', file=sys.stderr)

def strength(t, w=.035):
    a, b = max(0, int((t - w) * fr)), min(len(on), int((t + w) * fr) + 1); return on[a:b].max() if b > a else 0
def energy(t, w=.25):
    a, b = int(t * fr), int((t + w) * fr); return rms[a:b].mean() if b > a else 0
def pitch(t): return cent[min(int(t * fr), len(cent) - 1)]

# 歌曲主體範圍：開頭與結尾的靜音不放音符
grid4 = np.arange(PH, DUR, BEAT / 4)
alive = [t for t in grid4 if energy(t) > .06]
T0, T1 = alive[0], min(alive[-1], DUR - 1.2)

CFG = {  # div：每拍格數；pct：起音門檻百分位；gapFill：超過幾拍就補；fillStep：補的間隔（拍）；minGap：最小間隔（拍）
    'easy':   dict(lv=3,  div=1, pct=94, minGap=2,   gapFill=8, fillStep=4,  hold=.08, flick=.03, dbl=0,   holdBeats=(2, 2)),
    'normal': dict(lv=7,  div=2, pct=80, minGap=.5,  gapFill=4, fillStep=2,  hold=.12, flick=.06, dbl=.12, holdBeats=(1, 2)),
    'hard':   dict(lv=12, div=4, pct=63, minGap=.25, gapFill=1, fillStep=.5, hold=.10, flick=.08, dbl=.35, holdBeats=(1, 1.5)),
}

def make(dk, C):
    rnd = random.Random(f'{song_id}:{dk}:v121')
    step = BEAT / C['div']; grid = np.arange(PH, T1, step); grid = grid[grid >= T0 - .01]
    st = np.array([strength(g) for g in grid]); en = np.array([energy(g) for g in grid])
    thr = np.percentile(st[en > .06], C['pct'])
    times = []; last = -9
    for i, (g, s) in enumerate(zip(grid, st)):
        sub = round((g - PH) / step) % C['div']; onbeat = sub == 0
        need = thr * (.7 if onbeat else 1.05 if sub % 2 == 0 else 1.25)
        if en[i] < .06 or s < need or g - last < C['minGap'] * BEAT - .01: continue
        times.append((g, s, onbeat)); last = g
    # 補空檔：用節拍格補，讓長段空白也有節奏可以跟
    filled = []; prev = None
    for item in times + [(T1 + C['gapFill'] * BEAT, 0, True)]:
        g = item[0]
        if prev is not None and g - prev > C['gapFill'] * BEAT + .01:
            t = prev + C['fillStep'] * BEAT
            while t < g - C['fillStep'] * BEAT * .9:
                t2 = PH + round((t - PH) / (BEAT * min(1, C['fillStep']))) * BEAT * min(1, C['fillStep'])
                filled.append((t2, strength(t2), True)); t += C['fillStep'] * BEAT
        if g <= T1: filled.append(item)
        prev = g
    filled.sort(key=lambda z: z[0])
    # 軌道與種類
    out = []; p = rnd.randrange(4); dirn = 1; pt = -9; hl, hend = -1, -1
    for i, (g, s, onbeat) in enumerate(filled):
        gap = (g - pt) * 1000; bad = {hl} if g < hend else set()
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
        if onbeat and nxt - g >= BEAT * C['holdBeats'][0] * .95 and energy(g, BEAT * 2) > .2 and rnd.random() < C['hold']:
            hb = rnd.choice(C['holdBeats']); hb = min(hb, (nxt - g) / BEAT - .25)
            if hb >= .75: kind, dur = 1, int(round(hb * BEAT * 1000))
        elif onbeat and s > .3 and rnd.random() < C['flick']: kind = 2
        t = int(round(g * 1000)); out.append([t, l, kind, dur])
        if kind == 1: hl, hend = l, g + dur / 1000 + .08
        if kind == 0 and C['dbl'] and onbeat and s > .45 and rnd.random() < C['dbl']:
            m2 = [q for q in range(4) if q != l and q not in bad and abs(q - l) >= 2] or [q for q in range(4) if q != l and q not in bad]
            if m2: out.append([t, rnd.choice(m2), 0, 0])
        if rnd.random() < .12: dirn = -dirn
        p, pt = l, g
    return out

src = open(path, encoding='utf-8').read()
head, body = src.split('window.RHYTHM_SONGS = ', 1); data = json.loads(body.rstrip().rstrip(';'))
song = next(s for s in data if s['id'] == song_id)
song['bpm'] = round(BPM, 1); song['dur'] = round(DUR, 1); song['offset'] = int(round(PH * 1000))
for dk, C in CFG.items():
    notes = make(dk, C); song['diffs'][dk] = {'lv': C['lv'], 'notes': notes}
    ts = [n[0] for n in notes]; gaps = sorted(np.diff(sorted(set(ts))), reverse=True)[:3]
    print(dk, 'Lv', C['lv'], len(notes), 'notes', f'{len(notes) / (ts[-1] - ts[0]) * 1000:.2f}/s', 'max gaps', [int(g) for g in gaps],
          'hold', sum(n[2] == 1 for n in notes), 'flick', sum(n[2] == 2 for n in notes), file=sys.stderr)
head = '/* 歌姬挑戰譜面（v121 起由 tools/rhythm_chart_v121.py 以音訊節拍／起音偵測產生；格式 [毫秒, 軌道 0-3, 種類 0 點擊 1 長按 2 滑動, 長按毫秒]） */\n'
open(path, 'w', encoding='utf-8').write(head + 'window.RHYTHM_SONGS = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
