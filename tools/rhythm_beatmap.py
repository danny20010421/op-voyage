import numpy as np, json, sys
sr=22050; x=np.fromfile('song.raw',dtype=np.float32)
hop=256; n=2048
win=np.hanning(n).astype(np.float32)
frames=1+(len(x)-n)//hop
idx=np.arange(n)[None,:]+hop*np.arange(frames)[:,None]
S=np.abs(np.fft.rfft(x[idx]*win,axis=1)).astype(np.float32)
S=np.log1p(10*S)
flux=np.maximum(0,np.diff(S,axis=0)).sum(axis=1); flux=np.concatenate([[0],flux])
# local normalize
k=int(sr/hop*1.5); from numpy.lib.stride_tricks import sliding_window_view as sw
pad=np.pad(flux,(k//2,k-k//2-1),mode='edge'); loc=sw(pad,k).mean(axis=1)
on=np.maximum(0,flux-loc); on/=on.max()
fr=sr/hop
t=np.arange(len(on))/fr
rms=np.sqrt((x[idx]**2).mean(axis=1)); rms/=rms.max()
freqs=np.fft.rfftfreq(n,1/sr); cent=(S*freqs).sum(1)/(S.sum(1)+1e-9)
# tempo via autocorrelation in 70..180 bpm
seg=on[int(20*fr):int(200*fr)]; seg=seg-seg.mean()
ac=np.correlate(seg,seg,mode='full')[len(seg)-1:]
lags=np.arange(len(ac)); bpm=60*fr/np.maximum(lags,1)
m=(bpm>=70)&(bpm<=190); best=lags[m][np.argmax(ac[m])]
# refine
cands=[]
for L in np.arange(best-3,best+3.01,0.02):
    period=L/fr
    sc=0
    for ph in np.linspace(0,period,40,endpoint=False):
        g=np.arange(1.2+ph,224,period); ii=(g*fr).astype(int); sc=max(sc,on[ii].sum())
    cands.append((sc,period))
sc,period=max(cands); BPM=60/period
best_ph=max(np.linspace(0,period,200,endpoint=False),key=lambda ph: on[(np.arange(1.0+ph,224,period)*fr).astype(int)].sum())
print('BPM',round(BPM,2),'phase',round(best_ph,3),file=sys.stderr)
first=best_ph
while first-period>0.5: first-=period
def strength(tt,w=0.035):
    a=int((tt-w)*fr); b=int((tt+w)*fr)+1
    a=max(a,0); b=min(b,len(on)); return on[a:b].max() if b>a else 0
def energy(tt,w=0.2):
    a=int(tt*fr); b=int((tt+w)*fr); return rms[a:b].mean() if b>a else 0
END=223.5
rng=np.random.default_rng(7)
def chart(level,div,pct,holdEvery,flickP,doubleP):
    step=period/div; grid=np.arange(first,END,step)
    st=np.array([strength(g) for g in grid])
    # require minimal energy; skip intro silence
    en=np.array([energy(g) for g in grid])
    thr=np.percentile(st[en>0.08],pct)
    notes=[]; busy=[-1]*4; last=-1; prevT=-9
    beat_idx=np.round((grid-first)/period*div).astype(int)
    for i,(g,s) in enumerate(zip(grid,st)):
        onbeat=beat_idx[i]%div==0
        need=thr*(0.75 if onbeat else 1.0)
        if en[i]<0.08 or s<need: continue
        if g-prevT<step*0.9: continue
        c=cent[min(int(g*fr),len(cent)-1)]
        base=0 if c<1500 else 1 if c<2300 else 2 if c<3100 else 3
        lane=int(np.clip(base+rng.integers(-1,2),0,3))
        if lane==last and rng.random()<0.6: lane=(lane+rng.choice([1,3]))%4
        free=[L for L in range(4) if busy[L]<g-0.05]
        if lane not in free:
            if not free: continue
            lane=int(rng.choice(free))
        typ='t'; dur=0
        # hold: on downbeat of bar, if following beats weak but sustained
        bar=beat_idx[i]%(div*4)==0
        if bar and holdEvery and rng.random()<holdEvery:
            nxt=[strength(g+k*period) for k in (1,2)]
            if energy(g,period*2)>0.2:
                dur=round(period*(2 if level<8 else rng.choice([1,2])),3); typ='h'
        if typ=='t' and s>0.32 and onbeat and rng.random()<flickP: typ='f'
        n={'t':int(round(g*1000)),'l':int(lane),'k':typ}
        if dur: n['d']=int(round(dur*1000)); busy[lane]=g+dur
        else: busy[lane]=g
        notes.append(n); last=lane; prevT=g
        if doubleP and s>0.7 and onbeat and typ=='t' and rng.random()<doubleP:
            free2=[L for L in range(4) if L!=lane and busy[L]<g-0.05]
            if free2:
                L2=int(rng.choice(free2)); notes.append({'t':int(round(g*1000)),'l':int(L2),'k':'t'}); busy[L2]=g
    return notes
out={'bpm':round(float(BPM)*2,1),'offset':int(round(first*1000)),
 'easy':chart(4,1,45,0.35,0.05,0),
 'normal':chart(8,2,55,0.3,0.1,0.05),
 'hard':chart(12,4,46,0.3,0.18,0.2)}
for k in ('easy','normal','hard'): print(k,len(out[k]),sum(1 for n in out[k] if n['k']=='h'),sum(1 for n in out[k] if n['k']=='f'),file=sys.stderr)
json.dump(out,open('chart.json','w'),separators=(',',':'))
