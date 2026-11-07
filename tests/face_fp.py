import json,cv2,numpy as np,os
ROOT='/root/op-voyage/'
pairs=json.load(open('pairs.json'))
def load(p):
  im=cv2.imread(ROOT+p,cv2.IMREAD_UNCHANGED)
  if im is None: return None,None
  if im.ndim==2: im=cv2.cvtColor(im,cv2.COLOR_GRAY2BGRA)
  if im.shape[2]==3: im=np.dstack([im,np.full(im.shape[:2],255,np.uint8)])
  a=im[...,3:4].astype(np.float32)/255; rgb=(im[...,:3].astype(np.float32)*a+40*(1-a)).astype(np.uint8)  # 透明處填暗灰
  return rgb,im[...,3]
out={}
for art,av,cid in pairs:
  if art in out or not av or not os.path.exists(ROOT+art) or not os.path.exists(ROOT+av): continue
  A,al=load(art); F,_=load(av)
  if A is None or F is None: continue
  H,W=A.shape[:2]; S=600/max(H,W); A2=cv2.resize(A,(int(W*S),int(H*S))); h2,w2=A2.shape[:2]
  best=(-1,0,0,0)
  for fs in np.linspace(.08,.6,27):   # 頭像寬占立繪寬的比例
    fw=int(w2*fs); 
    if fw<12 or fw>w2: continue
    fh=int(fw*F.shape[0]/F.shape[1])
    if fh>h2: continue
    T=cv2.resize(F,(fw,fh))
    for crop in (0,.12):   # 頭像四周可能有留白：也試裁掉 12% 邊
      if crop: c=int(fw*crop); T2=T[c:fh-c,c:fw-c]
      else: T2=T
      if T2.shape[0]<8 or T2.shape[1]<8: continue
      r=cv2.matchTemplate(A2,T2,cv2.TM_CCOEFF_NORMED); _,mv,_,ml=cv2.minMaxLoc(r)
      if mv>best[0]: best=(mv,(ml[0]+T2.shape[1]/2)/w2,(ml[1]+T2.shape[0]/2)/h2,T2.shape[1]/w2)
  # 後備：不透明區的上方 18%、水平中心
  ys,xs=np.where(al>40); bb=(xs.min()/W,ys.min()/H,(xs.max()+1)/W,(ys.max()+1)/H) if len(xs) else (0,0,1,1)
  out[art]={'id':cid,'score':round(float(best[0]),3),'x':round(best[1],3),'y':round(best[2],3),'fw':round(best[3],3),'bbox':[round(v,3) for v in bb]}
json.dump(out,open('faces.json','w'),ensure_ascii=False,indent=0)
sc=sorted(v['score'] for v in out.values()); print(len(out),'low(<.5):',sum(s<.5 for s in sc),'median',sc[len(sc)//2])
for k,v in sorted(out.items(),key=lambda kv:kv[1]['score'])[:15]: print(k,v)
