import { useState, useEffect, useRef } from "react";

const PASSWORD_HASH = "f4f4eac5473aef846489262ea5affc51293d19e32ddc4148162ca61b85e69ef1";
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 30000;
const GEMINI_MODEL = "gemini-1.5-flash";

const RSS_FEEDS = [
  { name: "FDA", flag: "🇺🇸", url: "https://api.rss2json.com/v1/api.json?rss_url=https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml", color: "#00b4d8" },
  { name: "WHO", flag: "🌍", url: "https://api.rss2json.com/v1/api.json?rss_url=https://www.who.int/rss-feeds/news-english.xml", color: "#06d6a0" },
  { name: "EMA", flag: "🇪🇺", url: "https://api.rss2json.com/v1/api.json?rss_url=https://www.ema.europa.eu/en/news-events/news/rss", color: "#ffd166" },
  { name: "ET Health", flag: "🇮🇳", url: "https://api.rss2json.com/v1/api.json?rss_url=https://health.economictimes.indiatimes.com/rss/topstories", color: "#ff6b6b" },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#050810;--bg2:#0a0f1e;--bg3:#0f1628;--border:#1a2340;--bb:#2a3a60;--text:#c8d4f0;--dim:#5a6a8a;--bright:#e8f0ff;--amber:#f5a623;--cyan:#00b4d8;--green:#06d6a0;--red:#ff6b6b;--mono:'Space Mono',monospace;--sans:'Syne',sans-serif}
body{background:var(--bg);color:var(--text);font-family:var(--sans)}
.root{min-height:100vh;display:flex;flex-direction:column;background:var(--bg);position:relative;overflow-x:hidden}
.root::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,180,216,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,216,.03) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;z-index:0}

/* LOCK */
.lock{position:fixed;inset:0;z-index:1000;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center}
.lock::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,180,216,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,216,.03) 1px,transparent 1px);background-size:40px 40px;pointer-events:none}
.lock-glow{position:absolute;width:500px;height:500px;background:radial-gradient(circle,rgba(245,166,35,.05) 0%,transparent 70%);pointer-events:none}
.lock-logo{font-family:var(--sans);font-size:38px;font-weight:800;letter-spacing:10px;color:var(--bright);text-transform:uppercase;position:relative;margin-bottom:6px}
.lock-logo span{color:var(--amber)}
.lock-sub{font-family:var(--mono);font-size:10px;color:var(--dim);letter-spacing:4px;text-transform:uppercase;margin-bottom:52px;position:relative}
.lock-box{position:relative;background:var(--bg2);border:1px solid var(--border);padding:36px;width:380px;display:flex;flex-direction:column;gap:14px}
.lock-box::before{content:'RESTRICTED ACCESS';position:absolute;top:-10px;left:20px;background:var(--bg2);padding:0 8px;font-family:var(--mono);font-size:9px;letter-spacing:3px;color:var(--amber)}
.lock-icon{text-align:center;font-size:28px}
.lock-input{background:var(--bg3);border:1px solid var(--border);padding:13px 16px;font-family:var(--mono);font-size:13px;color:var(--text);outline:none;border-radius:2px;transition:border-color .15s;letter-spacing:3px;width:100%}
.lock-input:focus{border-color:var(--amber)}
.lock-input.err{border-color:var(--red);animation:shake .3s ease}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
.lock-btn{padding:13px;background:var(--amber);color:#000;font-family:var(--mono);font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;border:none;cursor:pointer;transition:all .15s;border-radius:2px}
.lock-btn:hover{background:#ffb83d}
.lock-btn:disabled{background:var(--border);color:var(--dim);cursor:not-allowed}
.lock-err{font-family:var(--mono);font-size:10px;color:var(--red);letter-spacing:1px;text-align:center}
.lock-cd{font-family:var(--mono);font-size:13px;color:var(--amber);text-align:center;letter-spacing:2px}

/* HEADER */
.header{position:relative;z-index:10;padding:18px 32px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:rgba(5,8,16,.9);backdrop-filter:blur(12px)}
.logo-title{font-family:var(--sans);font-size:22px;font-weight:800;letter-spacing:6px;color:var(--bright);text-transform:uppercase}
.logo-title span{color:var(--amber)}
.logo-sub{font-family:var(--mono);font-size:9px;color:var(--dim);letter-spacing:3px;text-transform:uppercase;margin-top:2px}
.hright{display:flex;align-items:center;gap:20px}
.sdot{display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:10px;color:var(--dim)}
.dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.ts{font-family:var(--mono);font-size:10px;color:var(--dim);letter-spacing:1px}

/* API BAR */
.apibar{position:relative;z-index:10;padding:10px 32px;background:rgba(10,15,30,.95);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.api-label{font-family:var(--mono);font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);white-space:nowrap}
.api-input{flex:1;background:var(--bg3);border:1px solid var(--border);padding:8px 14px;font-family:var(--mono);font-size:11px;color:var(--text);outline:none;border-radius:2px;transition:border-color .15s;max-width:480px}
.api-input:focus{border-color:var(--amber)}
.api-hint{font-family:var(--mono);font-size:9px;color:var(--dim);letter-spacing:1px}

/* TABS */
.tabs{position:relative;z-index:10;display:flex;border-bottom:1px solid var(--border);background:rgba(5,8,16,.8);padding:0 32px;overflow-x:auto}
.tab{padding:14px 22px;font-family:var(--mono);font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;transition:all .2s;white-space:nowrap;display:flex;align-items:center;gap:8px}
.tab:hover{color:var(--text)}
.tab.active{color:var(--amber);border-bottom-color:var(--amber)}

/* MAIN */
.main{position:relative;z-index:5;flex:1;padding:28px 32px;max-width:1400px;width:100%;margin:0 auto}

/* SECTION */
.sh{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
.st{font-family:var(--sans);font-size:13px;font-weight:600;letter-spacing:4px;text-transform:uppercase;color:var(--dim)}
.st span{color:var(--bright)}

/* FILTER ROW */
.frow{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.fbtn{padding:5px 12px;font-family:var(--mono);font-size:10px;letter-spacing:1px;border:1px solid var(--border);background:transparent;color:var(--dim);cursor:pointer;border-radius:2px;transition:all .15s;text-transform:uppercase}
.fbtn:hover{border-color:var(--bb);color:var(--text)}
.fbtn.on{border-color:var(--amber);color:var(--amber);background:rgba(245,166,35,.08)}
.sinput{background:var(--bg3);border:1px solid var(--border);padding:5px 14px;font-family:var(--mono);font-size:11px;color:var(--text);outline:none;border-radius:2px;transition:border-color .15s;width:220px}
.sinput:focus{border-color:var(--amber)}

/* NEWS */
.ngrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
.ncard{background:var(--bg2);border:1px solid var(--border);padding:20px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;border-radius:2px}
.ncard::before{content:'';position:absolute;top:0;left:0;width:3px;height:100%;background:var(--ca,var(--cyan));opacity:.6}
.ncard:hover{border-color:var(--bb);background:var(--bg3);transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.4)}
.ncard:hover::before{opacity:1}
.csource{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.sbadge{font-family:var(--mono);font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--ca,var(--cyan));border:1px solid currentColor;padding:2px 7px;opacity:.8}
.cdate{font-family:var(--mono);font-size:9px;color:var(--dim);letter-spacing:1px}
.ctitle{font-family:var(--sans);font-size:14px;font-weight:600;color:var(--bright);line-height:1.5;margin-bottom:10px}
.cdesc{font-family:var(--mono);font-size:11px;color:var(--dim);line-height:1.6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.cactions{display:flex;align-items:center;gap:12px;margin-top:14px}
.clink{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:10px;color:var(--ca,var(--cyan));text-decoration:none;letter-spacing:1px;opacity:.7;transition:opacity .15s;background:none;border:none;cursor:pointer;padding:0}
.clink:hover{opacity:1}
.bkbtn{display:inline-flex;align-items:center;gap:5px;font-family:var(--mono);font-size:10px;color:var(--dim);background:none;border:none;cursor:pointer;letter-spacing:1px;padding:0;transition:color .15s}
.bkbtn:hover,.bkbtn.on{color:var(--amber)}

/* MODAL */
.overlay{position:fixed;inset:0;z-index:100;background:rgba(5,8,16,.92);backdrop-filter:blur(8px);display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto}
.modal{background:var(--bg2);border:1px solid var(--bb);width:100%;max-width:820px;border-radius:2px;overflow:hidden;animation:up .2s ease}
@keyframes up{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
.mhead{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.mtitle{font-family:var(--sans);font-size:20px;font-weight:700;color:var(--bright);line-height:1.4;margin-top:10px}
.mclose{background:none;border:1px solid var(--border);color:var(--dim);font-size:16px;width:32px;height:32px;cursor:pointer;border-radius:2px;flex-shrink:0;transition:all .15s;display:flex;align-items:center;justify-content:center}
.mclose:hover{border-color:var(--red);color:var(--red)}
.mbody{padding:24px}
.mdesc{font-family:var(--sans);font-size:15px;color:var(--text);line-height:1.8;margin-bottom:20px}
.mactions{display:flex;gap:12px;margin-bottom:32px;flex-wrap:wrap}
.btnp{padding:10px 20px;background:var(--amber);color:#000;font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border:none;cursor:pointer;border-radius:2px;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
.btns{padding:10px 20px;background:transparent;color:var(--text);font-family:var(--mono);font-size:10px;letter-spacing:2px;text-transform:uppercase;border:1px solid var(--border);cursor:pointer;border-radius:2px;transition:all .15s}
.btns:hover{border-color:var(--bb)}
.relsec{border-top:1px solid var(--border);padding-top:24px}
.reltitle{font-family:var(--mono);font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--amber);margin-bottom:16px}
.relgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.relcard{background:var(--bg3);border:1px solid var(--border);padding:14px;cursor:pointer;border-radius:2px;transition:all .15s}
.relcard:hover{border-color:var(--bb)}
.relctitle{font-family:var(--sans);font-size:12px;font-weight:600;color:var(--bright);line-height:1.4;margin-bottom:6px}
.relcsrc{font-family:var(--mono);font-size:9px;color:var(--dim);letter-spacing:1px}

/* UTIL */
.spinner{width:40px;height:40px;border:2px solid var(--border);border-top-color:var(--amber);border-radius:50%;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.lstate{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:16px}
.ltext{font-family:var(--mono);font-size:11px;color:var(--dim);letter-spacing:3px;text-transform:uppercase;text-align:center}
.estate{background:rgba(255,107,107,.05);border:1px solid rgba(255,107,107,.2);padding:20px 24px;border-radius:2px;font-family:var(--mono);font-size:12px;color:var(--red);letter-spacing:1px}
.panel{background:var(--bg2);border:1px solid var(--border);border-radius:2px;overflow:hidden}
.phead{padding:14px 20px;border-bottom:1px solid var(--border);font-family:var(--mono);font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--dim);display:flex;align-items:center;gap:10px}
.pbody{padding:20px}
.ssec{margin-bottom:20px}
.slabel{font-family:var(--mono);font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--amber);margin-bottom:8px}
.sval{font-family:var(--sans);font-size:14px;color:var(--bright);line-height:1.6}
.sval.m{font-family:var(--mono);font-size:12px;color:var(--text)}
.taglist{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.tag{padding:4px 10px;border:1px solid var(--bb);font-family:var(--mono);font-size:10px;color:var(--cyan);letter-spacing:1px;border-radius:2px}
.warn{margin-top:12px;padding:10px 14px;background:rgba(245,166,35,.06);border:1px solid rgba(245,166,35,.2);border-radius:2px;font-family:var(--mono);font-size:10px;color:var(--amber);letter-spacing:1px}

/* UPLOAD */
.upzone{border:1px dashed var(--bb);background:var(--bg2);padding:48px 24px;text-align:center;cursor:pointer;transition:all .2s;border-radius:2px;position:relative}
.upzone:hover,.upzone.drag{border-color:var(--amber);background:rgba(245,166,35,.04)}
input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer}
.upicon{font-size:36px;margin-bottom:14px}
.uptitle{font-family:var(--sans);font-size:16px;font-weight:700;color:var(--bright);margin-bottom:8px}
.upsub{font-family:var(--mono);font-size:10px;color:var(--dim);letter-spacing:2px;text-transform:uppercase}
.fprev{display:flex;align-items:center;gap:12px;padding:14px;background:var(--bg3);border:1px solid var(--border);border-radius:2px;margin-top:12px}
.fname{font-family:var(--mono);font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fsize{font-family:var(--mono);font-size:10px;color:var(--dim)}
.abtn{width:100%;margin-top:16px;padding:14px;background:var(--amber);color:#000;font-family:var(--mono);font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;border:none;cursor:pointer;transition:all .15s;border-radius:2px}
.abtn:hover{background:#ffb83d}
.abtn:disabled{background:var(--border);color:var(--dim);cursor:not-allowed}
.ebtn{width:100%;margin-top:8px;padding:11px;background:transparent;border:1px solid var(--green);color:var(--green);font-family:var(--mono);font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .15s;border-radius:2px}
.ebtn:hover{background:rgba(6,214,160,.08)}

/* LAYOUT GRIDS */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}
.g2l{display:grid;grid-template-columns:400px 1fr;gap:24px;align-items:start}
.g2r{display:grid;grid-template-columns:360px 1fr;gap:24px;align-items:start}
@media(max-width:900px){.g2,.g2l,.g2r{grid-template-columns:1fr}}

/* TIMELINE */
.tl-panel{background:var(--bg2);border:1px solid var(--border);border-radius:2px;overflow:hidden;min-height:400px}
.tl-textarea,.fc-textarea{width:100%;min-height:180px;background:transparent;border:none;border-bottom:1px solid var(--border);padding:16px;font-family:var(--mono);font-size:12px;color:var(--text);line-height:1.6;resize:vertical;outline:none}
.tl-textarea::placeholder,.fc-textarea::placeholder{color:var(--dim)}
.tlbtn,.genbtn{width:100%;padding:14px;background:transparent;border:none;font-family:var(--mono);font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;transition:all .15s;border-top:1px solid var(--border)}
.tlbtn{color:var(--cyan)}.tlbtn:hover{background:rgba(0,180,216,.08)}
.genbtn{color:var(--green)}.genbtn:hover{background:rgba(6,214,160,.08)}
.tlbtn:disabled,.genbtn:disabled{color:var(--dim);cursor:not-allowed}
.tl-drug{font-family:var(--sans);font-size:18px;font-weight:800;color:var(--bright);padding:20px 24px 0;letter-spacing:2px}
.tl-dsub{font-family:var(--mono);font-size:10px;color:var(--dim);padding:4px 24px 16px;letter-spacing:2px;border-bottom:1px solid var(--border)}
.tl-events{padding:20px;display:flex;flex-direction:column}
.tl-ev{display:flex;align-items:flex-start;gap:16px;position:relative;padding-bottom:24px}
.tl-ev:last-child{padding-bottom:0}
.tl-line{display:flex;flex-direction:column;align-items:center;flex-shrink:0}
.tl-dot{width:12px;height:12px;border-radius:50%;border:2px solid var(--bg2);flex-shrink:0;margin-top:3px}
.tl-vl{width:2px;flex:1;background:var(--border);margin-top:4px;min-height:24px}
.tl-year{font-family:var(--mono);font-size:12px;font-weight:700;letter-spacing:1px;width:48px;text-align:right;flex-shrink:0;margin-top:2px}
.tl-etitle{font-family:var(--sans);font-size:14px;font-weight:600;color:var(--bright);margin-bottom:4px}
.tl-edesc{font-family:var(--mono);font-size:11px;color:var(--dim);line-height:1.5}
.tl-legend{padding:16px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:6px}
.tl-leg-item{display:flex;align-items:center;gap:8px}
.tl-leg-dot{width:8px;height:8px;border-radius:50%}
.tl-leg-label{font-family:var(--mono);font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:capitalize}

/* FLASHCARDS */
.fcdeck{display:flex;flex-direction:column;gap:12px}
.fccard{background:var(--bg2);border:1px solid var(--border);border-radius:2px;overflow:hidden;transition:all .2s}
.fccard:hover{border-color:var(--bb)}
.fcnum{font-family:var(--mono);font-size:10px;color:var(--dim);padding:12px 20px 0;letter-spacing:2px}
.fcq{padding:10px 20px 16px;font-family:var(--sans);font-size:14px;font-weight:600;color:var(--bright);cursor:pointer;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.fcqt{flex:1;line-height:1.5}
.fctog{font-family:var(--mono);font-size:14px;color:var(--amber);flex-shrink:0;margin-top:2px}
.fca{padding:14px 20px 16px;font-family:var(--mono);font-size:12px;color:var(--green);line-height:1.7;border-top:1px solid var(--border)}
.fcctr{display:flex;align-items:center;gap:10px;padding:12px 20px;border-top:1px solid var(--border);font-family:var(--mono);font-size:10px;color:var(--dim);letter-spacing:2px;text-transform:uppercase;background:var(--bg3)}

/* BOOKMARKS */
.bkgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
.bkcard{background:var(--bg2);border:1px solid var(--border);padding:20px;border-radius:2px;position:relative;cursor:pointer;transition:all .2s}
.bkcard:hover{border-color:var(--bb);transform:translateY(-2px)}
.bkcard::before{content:'';position:absolute;top:0;left:0;width:3px;height:100%;background:var(--amber)}
.bkrm{position:absolute;top:12px;right:12px;background:none;border:none;color:var(--dim);cursor:pointer;font-size:14px;transition:color .15s}
.bkrm:hover{color:var(--red)}

::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--bb);border-radius:3px}
`;

// ── HELPERS ──────────────────────────────────────────────────────────────────
async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
const fmt = d => { try { return new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); } catch { return d||"—"; } };
const strip = h => h.replace(/<[^>]*>/g,"").replace(/&[a-z]+;/gi," ").trim();
const toB64 = f => new Promise((res,rej) => { const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=()=>rej(new Error("fail")); r.readAsDataURL(f); });
const CMAP = {FDA:"#00b4d8",WHO:"#06d6a0",EMA:"#ffd166","ET Health":"#ff6b6b"};
const TCMAP = {discovery:"#00b4d8",approval:"#06d6a0",clinical:"#ffd166",commercial:"#f5a623",milestone:"#ff6b6b"};
const STOP = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","is","are","was","were","be","been","have","has","had","this","that","these","those","it","its","will","would","could","should","may","might"]);

function keywords(text="") {
  return text.toLowerCase().replace(/[^a-z\s]/g," ").split(/\s+/).filter(w=>w.length>4&&!STOP.has(w));
}
function findRelated(cur, all, n=4) {
  const kw = keywords((cur.title||"")+" "+strip(cur.description||""));
  return all.filter(a=>a!==cur).map(a=>{
    const t=((a.title||"")+" "+strip(a.description||"")).toLowerCase();
    return {...a,_sc:kw.filter(k=>t.includes(k)).length};
  }).filter(a=>a._sc>0).sort((a,b)=>b._sc-a._sc).slice(0,n);
}

async function claude(key, messages, system="") {
  const contents=messages.map(m=>({role:m.role==="assistant"?"model":"user",parts:[{text:m.content}]}));
  if(system) contents.unshift({role:"user",parts:[{text:system}]});
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents})});
  if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e?.error?.message||`API ${r.status}`);}
  const d=await r.json();return d.candidates?.[0]?.content?.parts?.[0]?.text||"";
}
const parseJSON = s => JSON.parse(s.replace(/```json|```/g,"").trim());

// ── LOCK ──────────────────────────────────────────────────────────────────────
function LockScreen({onUnlock}) {
  const [pw,setPw]=useState(""); const [err,setErr]=useState(""); const [att,setAtt]=useState(0);
  const [locked,setLocked]=useState(false); const [cd,setCd]=useState(0); const [loading,setLoading]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{ref.current?.focus();},[]);
  useEffect(()=>{
    if(!locked) return;
    let r=LOCKOUT_MS/1000; setCd(r);
    const id=setInterval(()=>{r-=1;setCd(r);if(r<=0){clearInterval(id);setLocked(false);setAtt(0);setErr("");}},1000);
    return()=>clearInterval(id);
  },[locked]);

  async function attempt() {
    if(!pw||loading||locked) return;
    setLoading(true);
    await new Promise(r=>setTimeout(r,600));
    const h=await sha256(pw);
    if(h===PASSWORD_HASH){onUnlock();return;}
    const na=att+1; setAtt(na); setPw("");
    if(na>=MAX_ATTEMPTS){setLocked(true);}
    else{setErr(`Invalid credentials. ${MAX_ATTEMPTS-na} attempt${MAX_ATTEMPTS-na===1?"":"s"} remaining.`);}
    setLoading(false);
  }

  return(
    <div className="lock">
      <div className="lock-glow"/>
      <div className="lock-logo">PHAR<span>MOS</span></div>
      <div className="lock-sub">Pharma Intelligence Operating System</div>
      <div className="lock-box">
        <div className="lock-icon">🔐</div>
        {locked?(
          <>
            <div className="lock-err">System locked after {MAX_ATTEMPTS} failed attempts.</div>
            <div className="lock-cd">Retry in {cd}s</div>
          </>
        ):(
          <>
            <input ref={ref} className={`lock-input${err?" err":""}`} type="password" placeholder="Enter access key" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} disabled={loading}/>
            {err&&<div className="lock-err">{err}</div>}
            <button className="lock-btn" onClick={attempt} disabled={!pw||loading}>{loading?"VERIFYING...":"AUTHENTICATE"}</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── NEWS FEED ─────────────────────────────────────────────────────────────────
function NewsFeed({bookmarks,onBookmark}) {
  const [arts,setArts]=useState([]); const [loading,setLoading]=useState(true);
  const [err,setErr]=useState(null); const [filter,setFilter]=useState("ALL");
  const [q,setQ]=useState(""); const [sel,setSel]=useState(null); const [ts,setTs]=useState("");

  useEffect(()=>{setTs(new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}));fetchAll();},[]);

  async function fetchAll() {
    setLoading(true);setErr(null);const r=[];
    for(const f of RSS_FEEDS){try{const res=await fetch(f.url);const d=await res.json();if(d.items)d.items.slice(0,10).forEach(i=>r.push({...i,_src:f}));}catch{}}
    r.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));setArts(r);setLoading(false);
    if(!r.length)setErr("Could not fetch feeds. Check your connection.");
  }

  const filtered=arts.filter(a=>{
    const ms=filter==="ALL"||a._src.name===filter;
    const mq=!q||(a.title||"").toLowerCase().includes(q.toLowerCase())||strip(a.description||"").toLowerCase().includes(q.toLowerCase());
    return ms&&mq;
  });
  const isBk=item=>bookmarks.some(b=>b.link===item.link);

  return(
    <div>
      {sel&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setSel(null)}>
          <div className="modal">
            <div className="mhead">
              <div style={{flex:1}}>
                <div className="csource"><span className="sbadge" style={{color:CMAP[sel._src.name],borderColor:CMAP[sel._src.name]}}>{sel._src.flag} {sel._src.name}</span><span className="cdate">{fmt(sel.pubDate)}</span></div>
                <div className="mtitle">{sel.title}</div>
              </div>
              <button className="mclose" onClick={()=>setSel(null)}>✕</button>
            </div>
            <div className="mbody">
              <div className="mdesc">{strip(sel.description)||"No description available."}</div>
              <div className="mactions">
                <a className="btnp" href={sel.link} target="_blank" rel="noreferrer">OPEN FULL ARTICLE ↗</a>
                <button className="btns" onClick={()=>onBookmark(sel)}>{isBk(sel)?"✓ BOOKMARKED":"🔖 BOOKMARK"}</button>
              </div>
              {(()=>{const rel=findRelated(sel,arts);return rel.length>0&&(
                <div className="relsec">
                  <div className="reltitle">◈ Related Articles — {rel.length} found</div>
                  <div className="relgrid">
                    {rel.map((r,i)=>(
                      <div key={i} className="relcard" onClick={()=>setSel(r)}>
                        <div className="relctitle">{r.title}</div>
                        <div className="relcsrc">{r._src.flag} {r._src.name} · {fmt(r.pubDate)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );})()}
            </div>
          </div>
        </div>
      )}

      <div className="sh">
        <div>
          <div className="st"><span>Regulatory Intelligence</span> Feed</div>
          {ts&&<div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--dim)",marginTop:4,letterSpacing:2}}>FETCHED {ts} · {filtered.length} ARTICLES</div>}
        </div>
        <div className="frow">
          <input className="sinput" type="text" placeholder="Search articles..." value={q} onChange={e=>setQ(e.target.value)}/>
          {["ALL",...RSS_FEEDS.map(f=>f.name)].map(f=>(
            <button key={f} className={`fbtn${filter===f?" on":""}`} onClick={()=>setFilter(f)}>{f}</button>
          ))}
          <button className="fbtn" onClick={fetchAll} style={{borderColor:"var(--bb)"}}>↻ REFRESH</button>
        </div>
      </div>

      {loading&&<div className="lstate"><div className="spinner"/><div className="ltext">Fetching Intelligence Feeds...</div></div>}
      {err&&!loading&&<div className="estate">⚠ {err}</div>}
      {!loading&&!err&&(
        <div className="ngrid">
          {filtered.map((item,i)=>(
            <div key={i} className="ncard" style={{"--ca":CMAP[item._src.name]||"var(--cyan)"}}>
              <div className="csource"><span className="sbadge">{item._src.flag} {item._src.name}</span><span className="cdate">{fmt(item.pubDate)}</span></div>
              <div className="ctitle">{item.title}</div>
              {item.description&&<div className="cdesc">{strip(item.description)}</div>}
              <div className="cactions">
                <button className="clink" onClick={()=>setSel(item)}>READ MORE →</button>
                <button className={`bkbtn${isBk(item)?" on":""}`} onClick={()=>onBookmark(item)}>{isBk(item)?"✓ SAVED":"🔖 SAVE"}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading&&!err&&filtered.length===0&&<div className="lstate"><div style={{fontSize:32,opacity:.3}}>📡</div><div className="ltext">No matching articles</div></div>}
    </div>
  );
}

// ── BOOKMARKS ─────────────────────────────────────────────────────────────────
function Bookmarks({bookmarks,onRemove}) {
  return(
    <div>
      <div className="sh">
        <div className="st"><span>Saved</span> Articles</div>
        <span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--dim)",letterSpacing:2}}>{bookmarks.length} ARTICLE{bookmarks.length!==1?"S":""} SAVED</span>
      </div>
      {bookmarks.length===0&&<div className="lstate"><div style={{fontSize:32,opacity:.3}}>🔖</div><div className="ltext">No saved articles yet.<br/>Bookmark from the Intel Feed.</div></div>}
      <div className="bkgrid">
        {bookmarks.map((item,i)=>(
          <div key={i} className="bkcard" onClick={()=>window.open(item.link,"_blank")}>
            <button className="bkrm" onClick={e=>{e.stopPropagation();onRemove(item);}}>✕</button>
            <div className="csource" style={{marginBottom:10}}><span className="sbadge" style={{color:CMAP[item._src?.name],borderColor:CMAP[item._src?.name]}}>{item._src?.flag} {item._src?.name}</span><span className="cdate">{fmt(item.pubDate)}</span></div>
            <div className="ctitle">{item.title}</div>
            {item.description&&<div className="cdesc" style={{marginTop:8}}>{strip(item.description)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── DOC ANALYZER ─────────────────────────────────────────────────────────────
function DocAnalyzer({apiKey}) {
  const [file,setFile]=useState(null); const [loading,setLoading]=useState(false);
  const [sum,setSum]=useState(null); const [err,setErr]=useState(null); const [drag,setDrag]=useState(false);

  async function analyze() {
    if(!file||!apiKey) return;
    setLoading(true);setSum(null);setErr(null);
    try {
      const b64=await toB64(file);
      const res=await claude(apiKey,[{role:"user",content:[
        {type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},
        {type:"text",text:`You are a Regulatory Affairs expert. Analyze this document and return ONLY a JSON object (no markdown) with these exact keys: {"title":"","document_type":"","drug_name":null,"indication":null,"key_findings":"","regulatory_pathway":null,"approval_status":null,"key_dates":null,"tags":[],"study_note":""}`}
      ]}],"Return only valid JSON.");
      setSum(parseJSON(res));
    } catch(e){setErr(e.message);}
    finally{setLoading(false);}
  }

  function exportPDF() {
    if(!sum) return;
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>PHARMOS Report</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;color:#1a1a2e;line-height:1.7}h1{font-size:28px;letter-spacing:2px;border-bottom:3px solid #f5a623;padding-bottom:10px;margin-bottom:6px}.sub{color:#666;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-bottom:32px}.label{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#f5a623;font-weight:bold;margin-bottom:4px;margin-top:20px}.value{font-size:15px;color:#1a1a2e}.tag{display:inline-block;border:1px solid #ccc;padding:3px 10px;font-size:11px;margin:3px;border-radius:2px;color:#555}.note{background:#fff8ee;border-left:4px solid #f5a623;padding:14px 18px;margin-top:24px;font-style:italic}.footer{margin-top:48px;font-size:10px;color:#999;letter-spacing:2px;border-top:1px solid #eee;padding-top:14px}</style></head><body>
      <h1>PHARMOS Intelligence Report</h1><div class="sub">Generated ${new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}</div>
      ${sum.title?`<div class="label">Document</div><div class="value">${sum.title}</div>`:""}
      ${sum.document_type?`<div class="label">Type</div><div class="value">${sum.document_type}</div>`:""}
      ${sum.drug_name?`<div class="label">Drug / Compound</div><div class="value">${sum.drug_name}</div>`:""}
      ${sum.indication?`<div class="label">Indication</div><div class="value">${sum.indication}</div>`:""}
      ${sum.key_findings?`<div class="label">Key Findings</div><div class="value">${sum.key_findings}</div>`:""}
      ${sum.regulatory_pathway?`<div class="label">Regulatory Pathway</div><div class="value">${sum.regulatory_pathway}</div>`:""}
      ${sum.approval_status?`<div class="label">Status</div><div class="value">${sum.approval_status}</div>`:""}
      ${sum.key_dates?`<div class="label">Key Dates</div><div class="value">${sum.key_dates}</div>`:""}
      ${sum.tags?.length?`<div class="label">Tags</div><div>${sum.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>`:""}
      ${sum.study_note?`<div class="note">📚 <strong>RA Student Takeaway:</strong> ${sum.study_note}</div>`:""}
      <div class="footer">PHARMOS · Pharma Intelligence Operating System · Confidential</div>
    </body></html>`;
    const w=window.open("","_blank");w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),500);
  }

  return(
    <div>
      <div className="sh"><div className="st"><span>Regulatory Document</span> Analyzer</div></div>
      <div className="g2">
        <div>
          <div className={`upzone${drag?" drag":""}`} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f?.type==="application/pdf")setFile(f);}}>
            <input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files[0])}/>
            <div className="upicon">📄</div>
            <div className="uptitle">Drop PDF Here</div>
            <div className="upsub">FDA approvals · Clinical trials · CDSCO notices · Guidelines</div>
          </div>
          {file&&<div className="fprev"><span>📋</span><div className="fname">{file.name}</div><div className="fsize">{(file.size/1024).toFixed(0)} KB</div></div>}
          {!apiKey&&<div className="warn">⚠ Enter Anthropic API key above to enable AI analysis</div>}
          <button className="abtn" onClick={analyze} disabled={!file||!apiKey||loading}>{loading?"ANALYZING...":"ANALYZE DOCUMENT"}</button>
          {sum&&<button className="ebtn" onClick={exportPDF}>⬇ EXPORT AS PDF REPORT</button>}
          {err&&<div className="estate" style={{marginTop:12}}>⚠ {err}</div>}
        </div>
        <div className="panel">
          <div className="phead"><span style={{color:"var(--amber)"}}>◈</span> Intelligence Summary</div>
          <div className="pbody">
            {loading&&<div className="lstate"><div className="spinner"/><div className="ltext">Claude is reading the document...</div></div>}
            {!loading&&!sum&&<div className="lstate"><div style={{fontSize:32,opacity:.3}}>🔬</div><div className="ltext">Upload a PDF to generate<br/>AI-powered intelligence brief</div></div>}
            {sum&&(
              <div>
                {sum.title&&<div className="ssec"><div className="slabel">Document</div><div className="sval">{sum.title}</div>{sum.document_type&&<div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--dim)",marginTop:4,letterSpacing:2}}>{sum.document_type.toUpperCase()}</div>}</div>}
                {sum.drug_name&&<div className="ssec"><div className="slabel">Drug / Compound</div><div className="sval">{sum.drug_name}</div></div>}
                {sum.indication&&<div className="ssec"><div className="slabel">Indication</div><div className="sval">{sum.indication}</div></div>}
                {sum.key_findings&&<div className="ssec"><div className="slabel">Key Findings</div><div className="sval">{sum.key_findings}</div></div>}
                {sum.regulatory_pathway&&<div className="ssec"><div className="slabel">Regulatory Pathway</div><div className="sval m">{sum.regulatory_pathway}</div></div>}
                {sum.approval_status&&<div className="ssec"><div className="slabel">Status</div><div className="sval m" style={{color:"var(--green)"}}>{sum.approval_status}</div></div>}
                {sum.key_dates&&<div className="ssec"><div className="slabel">Key Dates</div><div className="sval m">{sum.key_dates}</div></div>}
                {sum.tags?.length>0&&<div className="ssec"><div className="slabel">Tags</div><div className="taglist">{sum.tags.map((t,i)=><span key={i} className="tag">{t}</span>)}</div></div>}
                {sum.study_note&&<div className="ssec" style={{background:"rgba(245,166,35,.05)",border:"1px solid rgba(245,166,35,.15)",padding:14,borderRadius:2}}><div className="slabel">📚 RA Student Takeaway</div><div className="sval" style={{fontSize:13}}>{sum.study_note}</div></div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TIMELINE ─────────────────────────────────────────────────────────────────
function Timeline({apiKey}) {
  const [input,setInput]=useState(""); const [events,setEvents]=useState(null);
  const [drug,setDrug]=useState(""); const [loading,setLoading]=useState(false); const [err,setErr]=useState(null);

  async function generate() {
    if(!input.trim()||!apiKey) return;
    setLoading(true);setEvents(null);setErr(null);
    try {
      const res=await claude(apiKey,[{role:"user",content:`Extract a drug development and regulatory timeline. Return ONLY JSON (no markdown): {"drug_name":"","category":"","events":[{"year":1999,"title":"","description":"","type":"discovery|approval|clinical|commercial|milestone"}]}. Sort chronologically.\n\nText: ${input}`}],"Return only valid JSON.");
      const p=parseJSON(res);setEvents(p.events||[]);setDrug(p.drug_name||"Drug");
    } catch(e){setErr(e.message);}
    finally{setLoading(false);}
  }

  return(
    <div>
      <div className="sh"><div className="st"><span>Drug Approval</span> Timeline Visualizer</div></div>
      <div className="g2l">
        <div className="panel">
          <div className="phead"><span style={{color:"var(--cyan)"}}>◈</span> Paste Timeline Data</div>
          <textarea className="tl-textarea" placeholder={`Example:\nAspirin — 1897 synthesized by Bayer, 1899 marketed in Germany, 1950 listed in Guinness records, 1988 confirmed for heart attack prevention, 2003 approved for stroke prevention`} value={input} onChange={e=>setInput(e.target.value)}/>
          {!apiKey&&<div style={{padding:"8px 16px",fontFamily:"var(--mono)",fontSize:10,color:"var(--amber)",letterSpacing:1}}>⚠ API key required</div>}
          <button className="tlbtn" onClick={generate} disabled={!input.trim()||!apiKey||loading}>{loading?"⟳ BUILDING...":"⚡ BUILD TIMELINE"}</button>
          {err&&<div className="estate" style={{margin:12}}>⚠ {err}</div>}
          <div className="tl-legend">
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--dim)",letterSpacing:2,marginBottom:6,textTransform:"uppercase"}}>Event Types</div>
            {Object.entries(TCMAP).map(([t,c])=>(
              <div key={t} className="tl-leg-item"><div className="tl-leg-dot" style={{background:c,boxShadow:`0 0 6px ${c}60`}}/><span className="tl-leg-label">{t}</span></div>
            ))}
          </div>
        </div>
        <div className="tl-panel">
          {loading&&<div className="lstate"><div className="spinner"/><div className="ltext">Building Timeline...</div></div>}
          {!loading&&!events&&<div className="lstate"><div style={{fontSize:32,opacity:.3}}>📊</div><div className="ltext">Paste drug data to visualize<br/>its regulatory journey</div></div>}
          {events&&events.length>0&&(
            <>
              <div className="tl-drug">{drug}</div>
              <div className="tl-dsub">REGULATORY & DEVELOPMENT TIMELINE · {events[0]?.year}–{events[events.length-1]?.year}</div>
              <div className="tl-events">
                {events.map((ev,i)=>(
                  <div key={i} className="tl-ev">
                    <div className="tl-year" style={{color:TCMAP[ev.type]||"var(--amber)"}}>{ev.year}</div>
                    <div className="tl-line">
                      <div className="tl-dot" style={{background:TCMAP[ev.type]||"var(--amber)",boxShadow:`0 0 10px ${TCMAP[ev.type]||"var(--amber)"}60`}}/>
                      {i<events.length-1&&<div className="tl-vl"/>}
                    </div>
                    <div>
                      <div className="tl-etitle">{ev.title}</div>
                      <div className="tl-edesc">{ev.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── FLASHCARDS ────────────────────────────────────────────────────────────────
function Flashcards({apiKey}) {
  const [input,setInput]=useState(""); const [cards,setCards]=useState([]);
  const [loading,setLoading]=useState(false); const [err,setErr]=useState(null); const [rev,setRev]=useState({});

  async function generate() {
    if(!input.trim()||!apiKey) return;
    setLoading(true);setCards([]);setRev({});setErr(null);
    try {
      const res=await claude(apiKey,[{role:"user",content:`Generate 6-8 spaced repetition flashcards from this pharmaceutical/regulatory content. Return ONLY a JSON array (no markdown): [{"q":"question","a":"answer"}]. Test conceptual understanding. Answers: 2-4 sentences max.\n\n${input}`}],"Return only valid JSON arrays.");
      setCards(parseJSON(res));
    } catch(e){setErr(e.message);}
    finally{setLoading(false);}
  }

  return(
    <div>
      <div className="sh">
        <div className="st"><span>AI Flashcard</span> Generator</div>
        {cards.length>0&&<div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--green)",letterSpacing:2}}>{Object.values(rev).filter(Boolean).length}/{cards.length} REVEALED</div>}
      </div>
      <div className="g2r">
        <div className="panel">
          <div className="phead"><span style={{color:"var(--green)"}}>◈</span> Paste Content</div>
          <textarea className="fc-textarea" placeholder="Paste any pharma/regulatory text — lecture notes, article excerpts, drug monographs, guidelines..." value={input} onChange={e=>setInput(e.target.value)}/>
          {!apiKey&&<div style={{padding:"8px 16px",fontFamily:"var(--mono)",fontSize:10,color:"var(--amber)",letterSpacing:1}}>⚠ API key required</div>}
          <button className="genbtn" onClick={generate} disabled={!input.trim()||!apiKey||loading}>{loading?"⟳ GENERATING...":"⚡ GENERATE FLASHCARDS"}</button>
          {err&&<div className="estate" style={{margin:12}}>⚠ {err}</div>}
        </div>
        <div>
          {loading&&<div className="lstate"><div className="spinner"/><div className="ltext">Claude is generating flashcards...</div></div>}
          {!loading&&cards.length===0&&<div className="lstate"><div style={{fontSize:32,opacity:.3}}>🧠</div><div className="ltext">Your flashcards will appear here</div></div>}
          {cards.length>0&&(
            <div className="fcdeck">
              {cards.map((c,i)=>(
                <div key={i} className="fccard">
                  <div className="fcnum">Q{String(i+1).padStart(2,"0")}</div>
                  <div className="fcq" onClick={()=>setRev(p=>({...p,[i]:!p[i]}))}>
                    <span className="fcqt">{c.q}</span>
                    <span className="fctog">{rev[i]?"▲":"▼"}</span>
                  </div>
                  {rev[i]&&<div className="fca">{c.a}</div>}
                </div>
              ))}
              <div className="fcctr">
                <span>🎯</span>
                <span>{Object.values(rev).filter(Boolean).length} of {cards.length} revealed</span>
                <span style={{marginLeft:"auto",cursor:"pointer",color:"var(--amber)"}} onClick={()=>setRev({})}>RESET</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function PHARMOS() {
  const [unlocked,setUnlocked]=useState(false);
  const [tab,setTab]=useState("news");
  const [apiKey,setApiKey]=useState("");
  const [time,setTime]=useState("");
  const [bookmarks,setBookmarks]=useState(()=>{try{return JSON.parse(localStorage.getItem("pharmos_bk")||"[]");}catch{return [];}});

  useEffect(()=>{
    const t=()=>setTime(new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
    t();const id=setInterval(t,1000);return()=>clearInterval(id);
  },[]);

  function toggleBookmark(item) {
    setBookmarks(prev=>{
      const exists=prev.some(b=>b.link===item.link);
      const next=exists?prev.filter(b=>b.link!==item.link):[...prev,item];
      localStorage.setItem("pharmos_bk",JSON.stringify(next));
      return next;
    });
  }

  const TABS=[
    {id:"news",icon:"📡",label:"Intel Feed"},
    {id:"bookmarks",icon:"🔖",label:`Saved${bookmarks.length?` (${bookmarks.length})`:""}`},
    {id:"doc",icon:"📄",label:"Doc Analyzer"},
    {id:"timeline",icon:"📊",label:"Timeline"},
    {id:"flash",icon:"🧠",label:"Flashcards"},
  ];

  if(!unlocked) return(<><style>{CSS}</style><LockScreen onUnlock={()=>setUnlocked(true)}/></>);

  return(
    <>
      <style>{CSS}</style>
      <div className="root">
        <header className="header">
          <div>
            <div className="logo-title">PHAR<span>MOS</span></div>
            <div className="logo-sub">Pharma Intelligence Operating System</div>
          </div>
          <div className="hright">
            <div className="sdot"><div className="dot"/>LIVE</div>
            <div className="ts">{time}</div>
          </div>
        </header>
        <div className="apibar">
          <span className="api-label">Anthropic API Key</span>
          <input className="api-input" type="password" placeholder="AIza..." value={apiKey} onChange={e=>setApiKey(e.target.value)}/>
          <span className="api-hint">Required for Doc Analyzer, Timeline & Flashcards · Not stored</span>
        </div>
        <nav className="tabs">
          {TABS.map(t=>(
            <button key={t.id} className={`tab${tab===t.id?" active":""}`} onClick={()=>setTab(t.id)}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
        <main className="main">
          {tab==="news"&&<NewsFeed bookmarks={bookmarks} onBookmark={toggleBookmark}/>}
          {tab==="bookmarks"&&<Bookmarks bookmarks={bookmarks} onRemove={toggleBookmark}/>}
          {tab==="doc"&&<DocAnalyzer apiKey={apiKey}/>}
          {tab==="timeline"&&<Timeline apiKey={apiKey}/>}
          {tab==="flash"&&<Flashcards apiKey={apiKey}/>}
        </main>
      </div>
    </>
  );
}
