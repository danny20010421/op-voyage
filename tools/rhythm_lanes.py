"""v120：重新分配譜面軌道（原本自動產生的譜面大多集中在第 3、4 軌，玩起來單調）。
規則：間隔很短（<220ms）走樓梯（相鄰軌、到邊緣反彈）；中等間隔換到不同軌；
長按期間不在同一軌放音符；HARD／NORMAL 在前後都有空檔的強拍加入少量雙押。用固定亂數種子，結果可重現。
用法：python3 tools/rhythm_lanes.py js/rhythm_charts.js"""
import json, random, sys, collections
path = sys.argv[1]; src = open(path, encoding='utf-8').read()
head, body = src.split('window.RHYTHM_SONGS = ', 1); data = json.loads(body.rstrip().rstrip(';'))
DBL = {'easy': 0, 'normal': .05, 'hard': .12}
for song in data:
    for dk, D in song['diffs'].items():
        rnd = random.Random(f"{song['id']}:{dk}:v120"); notes = sorted(D['notes'], key=lambda n: n[0]); out = []
        p, pt, dirn, hl, hend = rnd.randrange(4), -9999, 1, -1, -1
        for i, n in enumerate(notes):
            t, _, k, d = n; gap = t - pt
            bad = {hl} if t < hend else set()
            if gap < 220:
                l = p + dirn
                if l < 0 or l > 3 or l in bad: dirn = -dirn; l = p + dirn
            elif gap < 400:
                opts = [x for x in range(4) if x != p and x not in bad]; w = [3 if abs(x - p) <= 2 else 1 for x in opts]; l = rnd.choices(opts, w)[0]
            else:
                opts = [x for x in range(4) if x != p and x not in bad]; l = rnd.choice(opts)
            l = max(0, min(3, l))
            if l in bad: l = next(x for x in range(4) if x not in bad and x != p)
            out.append([t, l, k, d])
            if k == 1: hl, hend = l, t + d + 80
            nxt = notes[i + 1][0] if i + 1 < len(notes) else t + 9999
            if k == 0 and gap >= 300 and nxt - t >= 300 and rnd.random() < DBL[dk]:
                m = 3 - l if 3 - l != l and (3 - l) not in bad else next(x for x in range(4) if x != l and x not in bad)
                out.append([t, m, 0, 0])
            if rnd.random() < .12: dirn = -dirn
            p, pt = l, t
        D['notes'] = out
        print(song['id'], dk, len(out), dict(sorted(collections.Counter(x[1] for x in out).items())))
open(path, 'w', encoding='utf-8').write(head + 'window.RHYTHM_SONGS = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
