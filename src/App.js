import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────
//  CONSUMER URL  →  yourapp.vercel.app          (no admin button)
//  YOUR URL      →  yourapp.vercel.app?admin    (shows admin login)
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  shopName:        "RedMeat Express",
  owner:           "Md Sabiq",
  whatsapp:        "919553334735",
  upi:             "9553334735@upi",
  upiName:         "Md Sabiq",
  bannerTitle:     "Farm Fresh Beef,\nAt Your Doorstep",
  bannerSub:       "☪️ 100% Halal | Fresh Daily Cuts",
  announcements: [
    "☪️ 100% Halal certified — slaughtered as per Islamic law",
    "🚚 Delivery available — 1 km = ₹15 delivery charge",
    "💬 After placing order our team will WhatsApp you the total amount",
    "🥩 Fresh cuts available daily — order before 8 PM",
    "📞 Bulk orders? WhatsApp us directly!",
  ],
  importantNotices: [
    "☪️ 100% Halal certified — slaughtered as per Islamic law",
    "🚚 Delivery charge: 1 km = ₹15 (our team will calculate & confirm via WhatsApp)",
    "💬 After you place order, we will WhatsApp you the final total amount",
    "💰 Payment details will be shared by Md Sabiq on WhatsApp",
  ],
  adminPin: "1234",
};

const DEFAULT_CATALOGUE = [
  { id:1, name:"Premium Beef Mince",   weight:"500g", price:180, category:"Mince",     emoji:"🥩", tag:"Best Seller",   freshness:"Today's Cut",    inStock:true, image:null },
  { id:2, name:"Beef Ribs",            weight:"1 kg", price:420, category:"Ribs",      emoji:"🍖", tag:"Fresh",         freshness:"Today's Cut",    inStock:true, image:null },
  { id:3, name:"Boneless Steak Cut",   weight:"500g", price:320, category:"Steak",     emoji:"🥩", tag:"Premium",       freshness:"Morning Batch",  inStock:true, image:null },
  { id:4, name:"Whole Leg Piece",      weight:"2 kg", price:760, category:"Whole Cut", emoji:"🍗", tag:"Family Pack",   freshness:"Today's Cut",    inStock:true, image:null },
  { id:5, name:"Marinated Beef Cubes", weight:"500g", price:240, category:"Marinated", emoji:"🥘", tag:"Ready to Cook", freshness:"Prepared Fresh", inStock:true, image:null },
  { id:6, name:"Beef Liver",           weight:"500g", price:130, category:"Offal",     emoji:"🫀", tag:"Healthy",       freshness:"Morning Batch",  inStock:true, image:null },
  { id:7, name:"Beef Brisket",         weight:"1 kg", price:380, category:"Whole Cut", emoji:"🥩", tag:"Slow Cook",     freshness:"Today's Cut",    inStock:true, image:null },
  { id:8, name:"Spicy Beef Kebab Mix", weight:"500g", price:210, category:"Marinated", emoji:"🍢", tag:"Spicy 🌶️",     freshness:"Prepared Fresh", inStock:true, image:null },
];

const TIME_SLOTS    = ["10:00 AM – 12:00 PM","12:00 PM – 2:00 PM","4:00 PM – 6:00 PM","6:00 PM – 8:00 PM"];
const STATUS_FLOW   = ["Order Placed","Being Packed","Out for Delivery","Delivered"];
const CAT_OPTIONS   = ["Mince","Ribs","Steak","Whole Cut","Marinated","Offal","Other"];
const STATUS_COLORS = ["#e8913a","#3a7bd5","#e05050","#4caf50"];

// ─────────────────────────────────────────────────────────────────────
//  STORAGE
// ─────────────────────────────────────────────────────────────────────
const K = { orders:"bs-orders", products:"bs-products", shopOpen:"bs-open", config:"bs-config" };
const sg = async (k,sh=true) => { try { const r=await window.storage.get(k,sh); return r?JSON.parse(r.value):null; } catch { return null; }};
const ss = async (k,v,sh=true) => { try { await window.storage.set(k,JSON.stringify(v),sh); } catch {} };

// ─────────────────────────────────────────────────────────────────────
//  SECRET ADMIN URL CHECK
// ─────────────────────────────────────────────────────────────────────
const isAdminMode = () => {
  try { return new URLSearchParams(window.location.search).has("admin"); }
  catch { return false; }
};

// ─────────────────────────────────────────────────────────────────────
//  WHATSAPP — sends order, NO price calculation, team will confirm
// ─────────────────────────────────────────────────────────────────────
const sendWA = (order, cfg) => {
  const items = order.items.map(i =>
    `  • ${i.emoji} ${i.name} (${i.weight}) × ${i.qty}`
  ).join("\n");

  const msg =
`☪️ *100% HALAL | ${cfg.shopName}*
━━━━━━━━━━━━━━━━━━━━
📋 *Order ID:* ${order.id}
🕐 *Time:* ${order.placedAt}

👤 *Customer Details*
Name    : ${order.customer.name}
Phone   : ${order.customer.phone}
Address : ${order.customer.address}

⏰ *Delivery Slot:* ${order.slot}

🛒 *Items Ordered*
${items}

━━━━━━━━━━━━━━━━━━━━
📍 *Delivery Note:*
Our team will calculate the delivery charge (₹15/km) based on the customer's address and send the *final total amount* via WhatsApp before delivery.

💬 Please reply to this customer on WhatsApp to confirm their order and share the total bill.`;

  window.open(`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
};

// ─────────────────────────────────────────────────────────────────────
//  COLOURS
// ─────────────────────────────────────────────────────────────────────
const C = {
  bg:"#0b0805", sur:"#160d07", bor:"#2a1505", bor2:"#3d2010",
  red:"#c0392b", rdark:"#8b1a00", amb:"#e8913a", mut:"#a07050",
  fnt:"#6b4530", txt:"#f2e4d4", grn:"#4caf50", wht:"#ffffff",
  gold:"#f0c040", halal:"#1a7a1a",
};

// ─────────────────────────────────────────────────────────────────────
//  GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────
const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Lato:wght@400;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    html,body{background:${C.bg};-webkit-tap-highlight-color:transparent;}
    ::-webkit-scrollbar{width:4px;}
    ::-webkit-scrollbar-track{background:${C.bg};}
    ::-webkit-scrollbar-thumb{background:${C.bor2};border-radius:4px;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.3;}}
    @keyframes marquee{0%{transform:translateX(100%);}100%{transform:translateX(-150%);}}
    @keyframes halalGlow{0%,100%{box-shadow:0 0 0 0 rgba(26,122,26,.5);}50%{box-shadow:0 0 0 10px rgba(26,122,26,0);}}
    @keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
    .fu{animation:fadeUp .3s ease both;}
    .ch:hover{border-color:${C.red}!important;transform:translateY(-2px);transition:all .2s;}
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────
//  SVG LOGOS
// ─────────────────────────────────────────────────────────────────────
const HalalBadge = ({ size=48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="48" fill="#1a7a1a"/>
    <circle cx="50" cy="50" r="44" fill="none" stroke="#fff" strokeWidth="2"/>
    <circle cx="50" cy="50" r="32" fill="#fff"/>
    <circle cx="50" cy="50" r="28" fill="#1a7a1a"/>
    <circle cx="50" cy="50" r="16" fill="#fff"/>
    <circle cx="57" cy="47" r="14" fill="#1a7a1a"/>
    <text x="50" y="80" textAnchor="middle" fontFamily="Arial" fontSize="10" fontWeight="bold" fill="#fff">HALAL</text>
    <text x="50" y="91" textAnchor="middle" fontFamily="Arial" fontSize="8" fontWeight="bold" fill="#fff">100%</text>
  </svg>
);

const MeatLogo = ({ size=64 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <defs>
      <radialGradient id="lg" cx="30%" cy="30%">
        <stop offset="0%" stopColor="#d44"/>
        <stop offset="100%" stopColor="#8b1a00"/>
      </radialGradient>
    </defs>
    <rect width="100" height="100" rx="22" fill="url(#lg)"/>
    <text x="50" y="58" textAnchor="middle" fontSize="44">🥩</text>
    <rect x="8" y="70" width="84" height="20" rx="6" fill="rgba(0,0,0,.45)"/>
    <text x="50" y="84" textAnchor="middle" fontFamily="Georgia,serif" fontSize="9" fontWeight="bold" fill="#e8913a">RedMeat Express</text>
  </svg>
);

const HalalStrip = () => (
  <div style={{ display:"flex",alignItems:"center",gap:4,marginTop:3 }}>
    <div style={{ width:8,height:8,borderRadius:"50%",background:C.halal,flexShrink:0 }}/>
    <span style={{ fontFamily:"Lato,sans-serif",fontSize:9,color:C.halal,fontWeight:700,letterSpacing:.5 }}>100% HALAL</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
//  INSTALL PROMPT
// ─────────────────────────────────────────────────────────────────────
const InstallPrompt = ({ onDismiss, cfg }) => {
  const isIOS     = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1000,
      display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
      <div style={{ background:`linear-gradient(160deg,#1a0e08,#0e0804)`,borderRadius:"24px 24px 0 0",
        padding:"28px 24px 36px",width:"100%",maxWidth:430,border:`1px solid ${C.bor2}`,
        borderBottom:"none",animation:"slideUp .4s ease" }}>

        <div style={{ display:"flex",justifyContent:"center",alignItems:"center",gap:16,marginBottom:20 }}>
          <MeatLogo size={72}/><HalalBadge size={52}/>
        </div>
        <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,color:C.amb,
          fontWeight:800,textAlign:"center",marginBottom:6 }}>Add to Home Screen!</div>
        <div style={{ fontFamily:"Lato,sans-serif",fontSize:13,color:C.mut,
          textAlign:"center",lineHeight:1.7,marginBottom:20 }}>
          Get quick access to <strong style={{ color:C.txt }}>{cfg.shopName}</strong> from your
          phone home screen — like a real app!
        </div>

        <div style={{ background:"#0d1e0d",border:`1px solid ${C.halal}44`,borderRadius:14,
          padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:12 }}>
          <HalalBadge size={36}/>
          <div>
            <div style={{ fontFamily:"Lato,sans-serif",fontSize:13,color:C.halal,fontWeight:700 }}>☪️ 100% Halal Certified</div>
            <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,color:"#4a8a4a",marginTop:2 }}>All meat slaughtered as per Islamic law</div>
          </div>
        </div>

        {isIOS && (
          <div style={{ background:C.sur,border:`1px solid ${C.bor2}`,borderRadius:14,padding:16,marginBottom:16 }}>
            <div style={{ fontFamily:"Lato,sans-serif",fontSize:13,color:C.amb,fontWeight:700,marginBottom:10 }}>📱 iPhone — How to add:</div>
            {["1️⃣  Tap the Share button (□↑) at bottom of Safari",
              "2️⃣  Scroll down and tap \"Add to Home Screen\"",
              "3️⃣  Tap \"Add\" — done! ✅"].map((s,i)=>(
              <div key={i} style={{ fontFamily:"Lato,sans-serif",fontSize:12,color:C.mut,marginBottom:6,lineHeight:1.5 }}>{s}</div>
            ))}
          </div>
        )}
        {isAndroid && (
          <div style={{ background:C.sur,border:`1px solid ${C.bor2}`,borderRadius:14,padding:16,marginBottom:16 }}>
            <div style={{ fontFamily:"Lato,sans-serif",fontSize:13,color:C.amb,fontWeight:700,marginBottom:10 }}>📱 Android — How to add:</div>
            {["1️⃣  Tap the 3-dot menu (⋮) in Chrome",
              "2️⃣  Tap \"Add to Home screen\"",
              "3️⃣  Tap \"Add\" — app icon appears! ✅"].map((s,i)=>(
              <div key={i} style={{ fontFamily:"Lato,sans-serif",fontSize:12,color:C.mut,marginBottom:6,lineHeight:1.5 }}>{s}</div>
            ))}
          </div>
        )}
        {!isIOS && !isAndroid && (
          <div style={{ background:C.sur,border:`1px solid ${C.bor2}`,borderRadius:14,padding:14,marginBottom:16 }}>
            <div style={{ fontFamily:"Lato,sans-serif",fontSize:12,color:C.mut,lineHeight:1.6 }}>
              📱 Open on your phone → tap the menu → select <strong style={{ color:C.txt }}>"Add to Home Screen"</strong>
            </div>
          </div>
        )}

        <button onClick={onDismiss} style={{ width:"100%",
          background:`linear-gradient(135deg,${C.rdark},${C.red})`,color:"#fff",border:"none",
          borderRadius:16,padding:16,fontFamily:"Lato,sans-serif",fontWeight:700,fontSize:16,
          cursor:"pointer",boxShadow:`0 4px 20px ${C.red}55`,marginBottom:10 }}>
          🥩 Open Shop Now
        </button>
        <button onClick={onDismiss} style={{ width:"100%",background:"transparent",color:C.mut,
          border:"none",padding:10,fontFamily:"Lato,sans-serif",fontSize:13,cursor:"pointer" }}>
          Maybe later
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
//  SHARED UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────
const Tog = ({ on, onChange, size="md" }) => {
  const w=size==="sm"?36:46, h=size==="sm"?20:26, d=size==="sm"?14:20;
  return (
    <div onClick={()=>onChange(!on)} style={{ width:w,height:h,borderRadius:h,cursor:"pointer",flexShrink:0,
      background:on?"#1e4a1e":C.bor2, border:`2px solid ${on?C.grn:C.fnt}`,
      position:"relative", transition:"all .25s", boxShadow:on?`0 0 10px ${C.grn}55`:"none" }}>
      <div style={{ position:"absolute",top:"50%",
        transform:`translateY(-50%) translateX(${on?w-d-4:2}px)`,
        width:d,height:d,borderRadius:"50%",background:on?C.grn:C.fnt,transition:"all .25s" }}/>
    </div>
  );
};

const Bdg = ({ children, color=C.amb, bg="#2d1000" }) => (
  <span style={{ fontSize:9,background:bg,color,padding:"2px 7px",borderRadius:20,
    border:`1px solid ${color}33`,textTransform:"uppercase",letterSpacing:1,
    fontFamily:"Lato,sans-serif",fontWeight:700,whiteSpace:"nowrap" }}>{children}</span>
);

const Btn = ({ children, onClick, sx={}, dis=false, v="pri" }) => {
  const base = { fontFamily:"Lato,sans-serif",fontWeight:700,border:"none",
    cursor:dis?"not-allowed":"pointer",opacity:dis?.5:1,borderRadius:12,
    transition:"all .2s",letterSpacing:.5,
    display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6 };
  const vs = {
    pri:    { background:`linear-gradient(135deg,${C.rdark},${C.red})`,color:C.wht,padding:"12px 18px",fontSize:14,boxShadow:`0 4px 16px ${C.red}44` },
    ghost:  { background:"transparent",color:C.amb,border:`1px solid ${C.bor2}`,padding:"9px 16px",fontSize:13 },
    danger: { background:"#3a0a0a",color:"#e05050",border:"1px solid #5a1010",padding:"7px 12px",fontSize:12 },
    suc:    { background:"#0d2e0d",color:C.grn,border:`1px solid #1e4a1e`,padding:"7px 12px",fontSize:12 },
    out:    { background:"transparent",color:C.mut,border:`1px solid ${C.bor2}`,padding:"7px 12px",fontSize:12 },
    wa:     { background:"linear-gradient(135deg,#075e54,#25d366)",color:"#fff",padding:"12px 18px",fontSize:14,boxShadow:"0 4px 16px #25d36644" },
    blue:   { background:"linear-gradient(135deg,#1a3060,#2a60c0)",color:"#fff",padding:"12px 18px",fontSize:14 },
    purple: { background:"linear-gradient(135deg,#3a1060,#6a30c0)",color:"#fff",padding:"12px 18px",fontSize:14 },
  };
  return <button onClick={onClick} disabled={dis} style={{...base,...vs[v],...sx}}>{children}</button>;
};

const Fld = ({ label, val, set, ph, type="text", multi, rows=3 }) => (
  <div style={{ marginBottom:11 }}>
    {label && <label style={{ display:"block",fontSize:11,color:C.mut,textTransform:"uppercase",
      letterSpacing:1.2,marginBottom:5,fontFamily:"Lato,sans-serif",fontWeight:700 }}>{label}</label>}
    {multi
      ? <textarea value={val} onChange={e=>set(e.target.value)} placeholder={ph} rows={rows}
          style={{ width:"100%",background:C.sur,border:`1px solid ${C.bor2}`,borderRadius:10,
            color:C.txt,padding:"10px 13px",fontSize:13,fontFamily:"Lato,sans-serif",outline:"none",resize:"vertical" }}/>
      : <input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={ph}
          style={{ width:"100%",background:C.sur,border:`1px solid ${C.bor2}`,borderRadius:10,
            color:C.txt,padding:"10px 13px",fontSize:13,fontFamily:"Lato,sans-serif",outline:"none" }}/>
    }
  </div>
);

const Card = ({ children, sx={} }) => (
  <div style={{ background:C.sur,border:`1px solid ${C.bor}`,borderRadius:16,padding:16,marginBottom:14,...sx }}>
    {children}
  </div>
);

const SecTitle = ({ icon, title, sub }) => (
  <div style={{ marginBottom:14 }}>
    <div style={{ fontFamily:"'Playfair Display',serif",fontSize:17,color:C.amb,fontWeight:800 }}>{icon} {title}</div>
    {sub && <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,color:C.mut,marginTop:3 }}>{sub}</div>}
  </div>
);

const ProdImg = ({ p, sz=70 }) => (
  p.image
    ? <img src={p.image} alt={p.name} style={{ width:sz,height:sz,objectFit:"cover",borderRadius:11,border:`1px solid ${C.bor2}`,flexShrink:0 }}/>
    : <div style={{ width:sz,height:sz,borderRadius:11,background:C.bor,flexShrink:0,
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:sz*.44 }}>{p.emoji}</div>
);

const Marquee = ({ items }) => (
  <div style={{ background:"#1a0e00",borderTop:`1px solid ${C.gold}44`,borderBottom:`1px solid ${C.gold}44`,overflow:"hidden",padding:"7px 0" }}>
    <div style={{ display:"flex",gap:60,animation:"marquee 24s linear infinite",whiteSpace:"nowrap" }}>
      {[...items,...items].map((n,i)=>(
        <span key={i} style={{ fontFamily:"Lato,sans-serif",fontSize:12,color:C.gold,fontWeight:700 }}>⚡ {n}</span>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
//  HEADER — admin button ONLY on ?admin URL
// ─────────────────────────────────────────────────────────────────────
const Hdr = ({ cartN, onCart, onAdmin, scr, onBack, isAdminIn, shopOpen, cfg, canAdmin }) => (
  <div style={{ background:`linear-gradient(160deg,#120800,#1e0d00)`,
    borderBottom:`1px solid ${C.bor}`,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 20px rgba(0,0,0,.6)" }}>
    <div style={{ padding:"13px 18px 11px",display:"flex",alignItems:"center",gap:10 }}>
      {scr!=="home" && scr!=="admin" &&
        <button onClick={onBack} style={{ background:"none",border:"none",color:C.amb,fontSize:20,cursor:"pointer",paddingRight:6 }}>←</button>}

      <div style={{ marginRight:6,flexShrink:0 }}><MeatLogo size={36}/></div>

      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontFamily:"'Playfair Display',serif",fontSize:18,color:C.amb,fontWeight:800,lineHeight:1 }}>{cfg.shopName}</div>
        <div style={{ fontFamily:"Lato,sans-serif",fontSize:10,color:C.fnt,letterSpacing:1.5,textTransform:"uppercase",marginTop:1 }}>by {cfg.owner}</div>
      </div>

      {/* Halal badge always visible */}
      <div style={{ flexShrink:0,animation:"halalGlow 3s infinite",borderRadius:"50%" }}><HalalBadge size={32}/></div>

      {/* Consumer view buttons */}
      {!isAdminIn && scr==="home" && (
        <div style={{ display:"flex",alignItems:"center",gap:6,flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:4 }}>
            <div style={{ width:7,height:7,borderRadius:"50%",background:shopOpen?C.grn:"#e05050",
              boxShadow:shopOpen?`0 0 6px ${C.grn}`:"none",animation:shopOpen?"pulse 2s infinite":"none" }}/>
            <span style={{ fontFamily:"Lato,sans-serif",fontSize:10,color:shopOpen?C.grn:"#e05050",fontWeight:700 }}>
              {shopOpen?"OPEN":"CLOSED"}
            </span>
          </div>

          {/* Cart button — always visible */}
          <button onClick={onCart} style={{ position:"relative",background:C.bor,border:"none",
            borderRadius:10,padding:"7px 11px",cursor:"pointer",color:C.txt,fontSize:13 }}>
            🛒
            {cartN>0 && <span style={{ position:"absolute",top:-5,right:-5,background:C.red,color:"#fff",
              borderRadius:"50%",width:18,height:18,fontSize:10,display:"flex",alignItems:"center",
              justifyContent:"center",fontFamily:"Lato,sans-serif",fontWeight:700 }}>{cartN}</span>}
          </button>

          {/* ⚙️ Admin button — ONLY visible when URL has ?admin */}
          {canAdmin && (
            <button onClick={onAdmin} style={{ background:"#1a1060",border:"1px solid #3a30a0",
              borderRadius:10,padding:"7px 11px",cursor:"pointer",color:"#a0a0ff",fontSize:13 }}
              title="Admin Panel">⚙️</button>
          )}
        </div>
      )}

      {isAdminIn && <Bdg color={C.grn} bg="#0d2e0d">Admin</Bdg>}
    </div>
    {!isAdminIn && cfg.announcements.length>0 && <Marquee items={cfg.announcements}/>}
  </div>
);

// ─────────────────────────────────────────────────────────────────────
//  HOME SCREEN
// ─────────────────────────────────────────────────────────────────────
const Home = ({ cart, onAdd, onRem, onCO, products, shopOpen, cfg }) => {
  const [cat,setCat] = useState("All");
  const qty  = id => cart.find(i=>i.id===id)?.qty||0;
  const cats = ["All",...new Set(products.map(p=>p.category))];
  const list = cat==="All" ? products : products.filter(p=>p.category===cat);
  const tot  = cart.reduce((a,b)=>a+b.qty*b.price,0);
  const totN = cart.reduce((a,b)=>a+b.qty,0);

  if(!shopOpen) return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      minHeight:"70vh",padding:30,textAlign:"center" }} className="fu">
      <div style={{ fontSize:72,marginBottom:16 }}>🔒</div>
      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:24,color:C.amb,fontWeight:800,marginBottom:10 }}>Shop is Closed</div>
      <div style={{ fontFamily:"Lato,sans-serif",fontSize:14,color:C.mut,lineHeight:1.8,marginBottom:24 }}>
        We're not taking orders right now.<br/>Please check back soon!
      </div>
      <a href={`https://wa.me/${cfg.whatsapp}`} target="_blank" rel="noreferrer"
        style={{ background:"linear-gradient(135deg,#075e54,#25d366)",color:"#fff",
          padding:"14px 28px",borderRadius:14,fontFamily:"Lato,sans-serif",fontWeight:700,fontSize:14,textDecoration:"none" }}>
        💬 WhatsApp {cfg.owner}
      </a>
    </div>
  );

  return (
    <div style={{ paddingBottom:totN>0?90:24 }}>

      {/* Halal Banner */}
      <div style={{ margin:"14px 16px 0",background:"linear-gradient(135deg,#0d1e0d,#142814)",
        border:`2px solid ${C.halal}66`,borderRadius:16,padding:"14px 16px",
        display:"flex",alignItems:"center",gap:14 }}>
        <div style={{ animation:"halalGlow 3s infinite",borderRadius:"50%",flexShrink:0 }}><HalalBadge size={52}/></div>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:16,color:C.halal,fontWeight:800 }}>☪️ 100% Halal Certified</div>
          <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,color:"#4a8a4a",marginTop:3,lineHeight:1.5 }}>
            All meat slaughtered as per Islamic law.<br/>Fresh, clean & guaranteed Halal.
          </div>
        </div>
      </div>

      {/* Important Notices */}
      {cfg.importantNotices.length>0 && (
        <div style={{ margin:"10px 16px 0",background:"#1a0e00",border:`1px solid ${C.gold}55`,borderRadius:14,padding:"14px 16px" }}>
          <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,fontWeight:700,color:C.gold,marginBottom:10,letterSpacing:1 }}>⚠️ IMPORTANT NOTICES</div>
          {cfg.importantNotices.map((n,i)=>(
            <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:8,marginBottom:i<cfg.importantNotices.length-1?8:0 }}>
              <div style={{ width:5,height:5,borderRadius:"50%",background:C.gold,marginTop:5,flexShrink:0 }}/>
              <div style={{ fontFamily:"Lato,sans-serif",fontSize:12,color:"#d4b060",lineHeight:1.5 }}>{n}</div>
            </div>
          ))}
        </div>
      )}

      {/* Hero Banner */}
      <div style={{ margin:"10px 16px",borderRadius:18,overflow:"hidden",
        background:`linear-gradient(135deg,${C.rdark},#d44,#e87)`,padding:"20px 18px",position:"relative" }} className="fu">
        <div style={{ fontFamily:"'Playfair Display',serif",fontSize:21,color:"#fff",lineHeight:1.3,fontWeight:800,paddingRight:60 }}>
          {cfg.bannerTitle.split("\n").map((l,i)=><div key={i}>{l}</div>)}
        </div>
        <div style={{ fontFamily:"Lato,sans-serif",fontSize:12,color:"rgba(255,255,255,.9)",marginTop:6 }}>{cfg.bannerSub}</div>
        <div style={{ position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:52,opacity:.9 }}>🥩</div>
        <div style={{ marginTop:12,display:"flex",gap:8,flexWrap:"wrap" }}>
          <Bdg color="#fff" bg="rgba(0,0,0,.3)">🟢 Open Now</Bdg>
          <Bdg color="#fff" bg="rgba(0,0,0,.3)">⚡ 45–60 min</Bdg>
          <Bdg color="#90ee90" bg="rgba(26,80,26,.6)">☪️ Halal</Bdg>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display:"flex",gap:8,padding:"4px 16px 10px",overflowX:"auto",scrollbarWidth:"none" }}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setCat(c)} style={{
            padding:"7px 15px",borderRadius:20,fontSize:12,whiteSpace:"nowrap",cursor:"pointer",
            fontFamily:"Lato,sans-serif",fontWeight:700,border:"none",transition:"all .2s",
            background:cat===c?C.red:C.sur,color:cat===c?"#fff":C.mut,
            boxShadow:cat===c?`0 2px 10px ${C.red}55`:"none" }}>{c}</button>
        ))}
      </div>

      {/* Products Grid */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,padding:"0 16px" }}>
        {list.map((p,i)=>(
          <div key={p.id} className="ch fu" style={{
            background:`linear-gradient(160deg,${C.sur},#100806)`,
            border:`1px solid ${p.inStock?C.bor:"#3a0000"}`,borderRadius:16,padding:14,
            animationDelay:`${i*.05}s`,position:"relative",overflow:"hidden" }}>
            {!p.inStock && (
              <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.62)",borderRadius:16,
                display:"flex",alignItems:"center",justifyContent:"center",zIndex:2 }}>
                <div style={{ background:"#3a0000",border:"1px solid #e05050",borderRadius:10,
                  padding:"6px 14px",fontFamily:"Lato,sans-serif",fontWeight:700,fontSize:12,color:"#e05050" }}>
                  ❌ Not Available
                </div>
              </div>
            )}
            <div style={{ marginBottom:8 }}><ProdImg p={p} sz={58}/></div>
            <Bdg>{p.tag}</Bdg>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:13,color:C.txt,margin:"5px 0 1px",fontWeight:700,lineHeight:1.3 }}>{p.name}</div>
            <HalalStrip/>
            <div style={{ fontFamily:"Lato,sans-serif",fontSize:10,color:C.grn,marginTop:2 }}>🟢 {p.freshness}</div>
            <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,color:C.fnt,marginTop:1 }}>{p.weight}</div>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:18,color:C.amb,marginTop:7,fontWeight:700 }}>₹{p.price}</div>
            {p.inStock && (
              <div style={{ marginTop:9,display:"flex",alignItems:"center",justifyContent:qty(p.id)>0?"space-between":"flex-start" }}>
                {qty(p.id)>0 ? (
                  <>
                    <button onClick={()=>onRem(p)} style={{ width:28,height:28,borderRadius:"50%",background:C.rdark,color:"#fff",border:"none",cursor:"pointer",fontSize:16,fontWeight:700 }}>−</button>
                    <span style={{ fontFamily:"Lato,sans-serif",fontWeight:700,color:C.txt,minWidth:22,textAlign:"center" }}>{qty(p.id)}</span>
                    <button onClick={()=>onAdd(p)} style={{ width:28,height:28,borderRadius:"50%",background:C.red,color:"#fff",border:"none",cursor:"pointer",fontSize:16,fontWeight:700 }}>+</button>
                  </>
                ) : (
                  <Btn onClick={()=>onAdd(p)} sx={{ padding:"7px 14px",fontSize:12,borderRadius:9 }}>+ Add</Btn>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cart Bar */}
      {totN>0 && (
        <div onClick={onCO} style={{
          position:"fixed",bottom:14,left:"50%",transform:"translateX(-50%)",
          width:"calc(100% - 32px)",maxWidth:420,
          background:`linear-gradient(90deg,${C.rdark},${C.red})`,
          borderRadius:16,padding:"15px 20px",cursor:"pointer",
          display:"flex",justifyContent:"space-between",alignItems:"center",
          boxShadow:`0 4px 24px ${C.red}55`,zIndex:200 }}>
          <div>
            <div style={{ fontFamily:"Lato,sans-serif",fontWeight:700,color:"#fff",fontSize:14 }}>
              {totN} item{totN>1?"s":""} in cart
            </div>
            <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,color:"rgba(255,255,255,.75)" }}>Tap to checkout</div>
          </div>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:18,color:"#fff",fontWeight:700 }}>
            ₹{tot} →
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
//  CART — No delivery calculation, no advance, team confirms via WA
// ─────────────────────────────────────────────────────────────────────
const Cart = ({ cart, onAdd, onRem, onPlaced, cfg }) => {
  const [name,setName]   = useState("");
  const [phone,setPhone] = useState("");
  const [addr,setAddr]   = useState("");
  const [slot,setSlot]   = useState(TIME_SLOTS[0]);
  const [busy,setBusy]   = useState(false);

  const itemsTotal = cart.reduce((a,b)=>a+b.qty*b.price,0);

  const place = async () => {
    if(!name||!phone||!addr) return;
    setBusy(true);
    const o = {
      id: "ORD"+Date.now().toString().slice(-6),
      customer: { name, phone, address:addr },
      slot, items:cart,
      itemsTotal,
      status:"Order Placed", statusIndex:0,
      placedAt: new Date().toLocaleString("en-IN"),
    };
    const ex = await sg(K.orders)||[];
    await ss(K.orders,[o,...ex]);
    setBusy(false);
    onPlaced(o);
    sendWA(o,cfg);
  };

  return (
    <div style={{ padding:"16px 16px 30px" }} className="fu">
      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:20,color:C.amb,marginBottom:16,fontWeight:700 }}>Your Cart</div>

      {cart.length===0
        ? <div style={{ textAlign:"center",padding:40,color:C.mut,fontFamily:"Lato,sans-serif" }}>Cart is empty 🛒</div>
        : <>
            {/* Items */}
            {cart.map(item=>(
              <div key={item.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                background:C.sur,border:`1px solid ${C.bor}`,borderRadius:14,padding:"12px 14px",marginBottom:10 }}>
                <div style={{ display:"flex",gap:10,alignItems:"center" }}>
                  <ProdImg p={item} sz={44}/>
                  <div>
                    <div style={{ fontFamily:"'Playfair Display',serif",fontSize:13,color:C.txt,fontWeight:600 }}>{item.name}</div>
                    <HalalStrip/>
                    <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,color:C.fnt,marginTop:1 }}>{item.weight}</div>
                    <div style={{ fontFamily:"Lato,sans-serif",fontSize:13,color:C.amb,fontWeight:700,marginTop:1 }}>₹{item.price*item.qty}</div>
                  </div>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <button onClick={()=>onRem(item)} style={{ width:28,height:28,borderRadius:"50%",background:C.rdark,color:"#fff",border:"none",cursor:"pointer",fontSize:16 }}>−</button>
                  <span style={{ fontFamily:"Lato,sans-serif",fontWeight:700,color:C.txt,minWidth:18,textAlign:"center" }}>{item.qty}</span>
                  <button onClick={()=>onAdd(item)} style={{ width:28,height:28,borderRadius:"50%",background:C.red,color:"#fff",border:"none",cursor:"pointer",fontSize:16 }}>+</button>
                </div>
              </div>
            ))}

            {/* Items subtotal */}
            <Card sx={{ marginTop:4 }}>
              <div style={{ display:"flex",justifyContent:"space-between",fontFamily:"'Playfair Display',serif",fontSize:16,color:C.amb,fontWeight:700 }}>
                <span>Items Total</span><span>₹{itemsTotal}</span>
              </div>
              <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,color:C.mut,marginTop:8,lineHeight:1.6,
                background:"#1a0e00",border:`1px solid ${C.gold}44`,borderRadius:10,padding:"10px 12px" }}>
                🚚 <strong style={{ color:C.gold }}>Delivery charge not included.</strong><br/>
                Our team will calculate based on your address (₹15/km) and send you the <strong style={{ color:C.gold }}>final total on WhatsApp</strong> before delivery.
              </div>
            </Card>

            {/* Customer Details */}
            <Card sx={{ marginTop:4 }}>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:15,color:C.amb,marginBottom:14,fontWeight:700 }}>📋 Your Details</div>
              <Fld label="Your Name" val={name} set={setName} ph="Enter your full name"/>
              <Fld label="WhatsApp Number" val={phone} set={setPhone} ph="10-digit WhatsApp number" type="tel"/>
              <Fld label="Full Delivery Address" val={addr} set={setAddr}
                ph="House no, street, area, landmark, city..." multi/>
              <div>
                <label style={{ display:"block",fontSize:11,color:C.mut,textTransform:"uppercase",
                  letterSpacing:1.2,marginBottom:8,fontFamily:"Lato,sans-serif",fontWeight:700 }}>
                  Preferred Delivery Time Slot
                </label>
                <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                  {TIME_SLOTS.map(s=>(
                    <button key={s} onClick={()=>setSlot(s)} style={{
                      padding:"8px 12px",borderRadius:9,fontSize:11,cursor:"pointer",
                      fontFamily:"Lato,sans-serif",fontWeight:700,border:"none",transition:"all .2s",
                      background:slot===s?C.red:"#1a0e06",color:slot===s?"#fff":C.mut }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* WhatsApp confirmation notice */}
            <div style={{ background:"#0a1e0a",border:"2px solid #25d36666",borderRadius:14,padding:16,marginTop:4 }}>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:15,color:"#25d366",fontWeight:700,marginBottom:8 }}>
                💬 What happens after you order?
              </div>
              {[
                "Your order is sent to Md Sabiq on WhatsApp",
                "Our team checks your address & calculates delivery",
                "We WhatsApp you the final total amount",
                "You confirm & pay — we deliver fresh! 🥩",
              ].map((s,i)=>(
                <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:10,marginBottom:i<3?8:0 }}>
                  <div style={{ width:20,height:20,borderRadius:"50%",background:"#0d2e0d",border:"1px solid #25d366",
                    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                    fontFamily:"Lato,sans-serif",fontSize:10,color:"#25d366",fontWeight:700 }}>{i+1}</div>
                  <span style={{ fontFamily:"Lato,sans-serif",fontSize:12,color:"#60c060",lineHeight:1.5 }}>{s}</span>
                </div>
              ))}
            </div>

            <Btn onClick={place} dis={busy||!name||!phone||!addr} v="wa"
              sx={{ width:"100%",marginTop:14,padding:15,fontSize:15,borderRadius:14 }}>
              {busy?"⏳ Placing Order...":"📲 Place Order & Notify on WhatsApp"}
            </Btn>
            <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,color:C.mut,textAlign:"center",marginTop:8 }}>
              WhatsApp opens automatically to notify {cfg.owner}
            </div>
          </>
      }
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
//  CONFIRM SCREEN
// ─────────────────────────────────────────────────────────────────────
const Confirm = ({ order, onHome, cfg }) => (
  <div style={{ padding:"24px 20px 30px",textAlign:"center" }} className="fu">
    <div style={{ fontSize:64,marginBottom:14 }}>✅</div>
    <div style={{ fontFamily:"'Playfair Display',serif",fontSize:24,color:C.amb,fontWeight:800,marginBottom:6 }}>Order Placed!</div>
    <div style={{ fontFamily:"Lato,sans-serif",fontSize:13,color:C.mut,marginBottom:2 }}>
      ID: <strong style={{ color:C.txt }}>{order.id}</strong>
    </div>
    <div style={{ fontFamily:"Lato,sans-serif",fontSize:13,color:C.mut,marginBottom:24 }}>
      We will contact you on <strong style={{ color:C.txt }}>WhatsApp</strong> shortly!
    </div>

    {/* WA notification sent */}
    <div style={{ background:"#0a1e0a",border:"1px solid #25d36655",borderRadius:16,padding:16,marginBottom:14,textAlign:"left" }}>
      <div style={{ fontFamily:"Lato,sans-serif",fontSize:13,color:"#25d366",fontWeight:700,marginBottom:6 }}>
        💬 {cfg.owner} has been notified!
      </div>
      <div style={{ fontFamily:"Lato,sans-serif",fontSize:12,color:"#60c060",lineHeight:1.6 }}>
        Your order was sent to {cfg.owner} on WhatsApp. He will calculate the delivery charge and send you the <strong>final total amount via WhatsApp</strong> before delivery.
      </div>
    </div>

    {/* What to expect */}
    <Card sx={{ textAlign:"left",marginBottom:14 }}>
      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:14,color:C.amb,marginBottom:14,fontWeight:700 }}>📍 What happens next?</div>
      {[
        { s:"Order received by our team", done:true },
        { s:"We check your address & calculate delivery", done:false },
        { s:"We WhatsApp you the final total amount", done:false },
        { s:"You pay & we deliver fresh! 🥩", done:false },
      ].map((item,i)=>(
        <div key={i} style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
          <div style={{ width:11,height:11,borderRadius:"50%",flexShrink:0,
            background:item.done?C.grn:C.bor2,
            boxShadow:item.done?`0 0 8px ${C.grn}`:"none",
            animation:item.done?"pulse 1.5s infinite":"none" }}/>
          <span style={{ fontFamily:"Lato,sans-serif",fontSize:13,
            color:item.done?C.txt:C.fnt,fontWeight:item.done?700:400 }}>{item.s}</span>
          {item.done&&<Bdg color={C.grn} bg="#0d2e0d">Done</Bdg>}
        </div>
      ))}
    </Card>

    <Btn v="wa" onClick={()=>sendWA(order,cfg)} sx={{ width:"100%",marginBottom:10,padding:13 }}>
      💬 Resend Order to WhatsApp
    </Btn>
    <Btn onClick={onHome} sx={{ width:"100%",padding:14 }}>🛒 Order More</Btn>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
//  ADMIN LOGIN
// ─────────────────────────────────────────────────────────────────────
const ALogin = ({ onLogin, cfg }) => {
  const [pin,setPin]=useState(""); const [err,setErr]=useState(false);
  const check=()=>{ if(pin===cfg.adminPin){onLogin();}else{setErr(true);setPin("");} };
  return (
    <div style={{ padding:"60px 24px",textAlign:"center" }} className="fu">
      <div style={{ display:"flex",justifyContent:"center",marginBottom:16 }}><MeatLogo size={72}/></div>
      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,color:C.amb,fontWeight:800,marginBottom:6 }}>Admin Panel</div>
      <div style={{ fontFamily:"Lato,sans-serif",fontSize:13,color:C.mut,marginBottom:28 }}>Welcome, {cfg.owner}</div>
      <input type="password" maxLength={8} value={pin}
        onChange={e=>{setPin(e.target.value);setErr(false);}}
        onKeyDown={e=>e.key==="Enter"&&check()} placeholder="••••"
        style={{ width:"100%",background:C.sur,border:`2px solid ${err?"#e05050":C.bor2}`,
          borderRadius:12,color:C.txt,padding:14,fontSize:24,textAlign:"center",
          fontFamily:"Lato,sans-serif",outline:"none",letterSpacing:10,marginBottom:8 }}/>
      {err&&<div style={{ fontFamily:"Lato,sans-serif",fontSize:12,color:"#e05050",marginBottom:10 }}>Wrong PIN. Try again.</div>}
      <Btn onClick={check} sx={{ width:"100%",padding:14,marginTop:8 }}>🔓 Enter Admin Panel</Btn>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
//  PRODUCT MODAL
// ─────────────────────────────────────────────────────────────────────
const ProdModal = ({ prod, onSave, onClose }) => {
  const isNew=!prod.id;
  const [f,setF]=useState({
    name:prod.name||"", weight:prod.weight||"500g", price:prod.price||"",
    category:prod.category||"Mince", emoji:prod.emoji||"🥩",
    tag:prod.tag||"Fresh", freshness:prod.freshness||"Today's Cut",
    inStock:prod.inStock!==undefined?prod.inStock:true, image:prod.image||null,
  });
  const fileRef=useRef();
  const handleImg=e=>{ const file=e.target.files[0]; if(!file) return; const r=new FileReader(); r.onload=ev=>setF(x=>({...x,image:ev.target.result})); r.readAsDataURL(file); };
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:600,
      display:"flex",alignItems:"flex-end",justifyContent:"center" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#1a0e08",borderRadius:"20px 20px 0 0",padding:"20px 20px 30px",
        width:"100%",maxWidth:430,maxHeight:"92vh",overflowY:"auto",
        border:`1px solid ${C.bor2}`,borderBottom:"none" }} className="fu">
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:18,color:C.amb,fontWeight:700 }}>{isNew?"➕ Add Product":"✏️ Edit Product"}</div>
          <button onClick={onClose} style={{ background:C.bor,border:"none",borderRadius:8,color:C.mut,padding:"6px 10px",cursor:"pointer",fontSize:16 }}>✕</button>
        </div>
        {/* Photo upload */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block",fontSize:11,color:C.mut,textTransform:"uppercase",letterSpacing:1.2,marginBottom:8,fontFamily:"Lato,sans-serif",fontWeight:700 }}>Product Photo</label>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:76,height:76,borderRadius:12,overflow:"hidden",border:`2px dashed ${C.bor2}`,background:C.sur,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
              {f.image?<img src={f.image} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>:<span style={{ fontSize:32 }}>{f.emoji}</span>}
            </div>
            <div style={{ flex:1,display:"flex",flexDirection:"column",gap:7 }}>
              <Btn v="out" onClick={()=>fileRef.current.click()} sx={{ width:"100%",fontSize:12 }}>📷 {f.image?"Change":"Upload Photo"}</Btn>
              {f.image&&<Btn v="danger" onClick={()=>setF(x=>({...x,image:null}))} sx={{ width:"100%",fontSize:11,padding:"6px" }}>🗑 Remove</Btn>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} style={{ display:"none" }}/>
          </div>
        </div>
        <Fld label="Product Name" val={f.name} set={v=>setF(x=>({...x,name:v}))} ph="e.g. Premium Beef Mince"/>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <Fld label="Weight" val={f.weight} set={v=>setF(x=>({...x,weight:v}))} ph="500g"/>
          <Fld label="Price ₹" val={f.price} set={v=>setF(x=>({...x,price:v}))} ph="180" type="number"/>
        </div>
        <div style={{ marginBottom:11 }}>
          <label style={{ display:"block",fontSize:11,color:C.mut,textTransform:"uppercase",letterSpacing:1.2,marginBottom:5,fontFamily:"Lato,sans-serif",fontWeight:700 }}>Category</label>
          <select value={f.category} onChange={e=>setF(x=>({...x,category:e.target.value}))}
            style={{ width:"100%",background:C.sur,border:`1px solid ${C.bor2}`,borderRadius:10,color:C.txt,padding:"10px 13px",fontSize:13,fontFamily:"Lato,sans-serif",outline:"none" }}>
            {CAT_OPTIONS.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <Fld label="Emoji" val={f.emoji} set={v=>setF(x=>({...x,emoji:v}))} ph="🥩"/>
          <Fld label="Tag" val={f.tag} set={v=>setF(x=>({...x,tag:v}))} ph="Fresh"/>
        </div>
        <Fld label="Freshness Note" val={f.freshness} set={v=>setF(x=>({...x,freshness:v}))} ph="Today's Cut"/>
        <div style={{ background:C.sur,border:`1px solid ${f.inStock?"#1e4a1e":"#5a1010"}`,borderRadius:12,
          padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
          <div>
            <div style={{ fontFamily:"Lato,sans-serif",fontSize:13,color:C.txt,fontWeight:700 }}>Available for Order</div>
            <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,color:C.mut,marginTop:2 }}>{f.inStock?"Customers can order":"Shows as Not Available"}</div>
          </div>
          <Tog on={f.inStock} onChange={v=>setF(x=>({...x,inStock:v}))}/>
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <Btn v="ghost" onClick={onClose} sx={{ flex:1,padding:13 }}>Cancel</Btn>
          <Btn onClick={()=>{ if(!f.name||!f.price) return; onSave({...prod,...f,price:Number(f.price),id:prod.id||Date.now()}); }}
            dis={!f.name||!f.price} sx={{ flex:2,padding:13 }}>{isNew?"➕ Add":"💾 Save"}</Btn>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
//  CMS EDITOR
// ─────────────────────────────────────────────────────────────────────
const CmsEditor = ({ cfg, onSave, onClose }) => {
  const [f,setF]=useState({...cfg,announcements:[...cfg.announcements],importantNotices:[...cfg.importantNotices]});
  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  const addAnn=()=>setF(x=>({...x,announcements:[...x.announcements,""]}));
  const setAnn=(i,v)=>setF(x=>({...x,announcements:x.announcements.map((a,j)=>j===i?v:a)}));
  const delAnn=i=>setF(x=>({...x,announcements:x.announcements.filter((_,j)=>j!==i)}));
  const addNot=()=>setF(x=>({...x,importantNotices:[...x.importantNotices,""]}));
  const setNot=(i,v)=>setF(x=>({...x,importantNotices:x.importantNotices.map((a,j)=>j===i?v:a)}));
  const delNot=i=>setF(x=>({...x,importantNotices:x.importantNotices.filter((_,j)=>j!==i)}));
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.93)",zIndex:600,overflowY:"auto",padding:"20px 16px 50px" }} className="fu">
      <div style={{ maxWidth:430,margin:"0 auto" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:20,color:C.amb,fontWeight:800 }}>✏️ Edit Consumer View</div>
          <button onClick={onClose} style={{ background:C.bor,border:"none",borderRadius:8,color:C.mut,padding:"8px 12px",cursor:"pointer",fontSize:16 }}>✕</button>
        </div>
        <Card>
          <SecTitle icon="🏪" title="Shop Info"/>
          <Fld label="Shop Name" val={f.shopName} set={v=>set("shopName",v)} ph="RedMeat Express"/>
          <Fld label="Owner Name" val={f.owner} set={v=>set("owner",v)} ph="Md Sabiq"/>
          <Fld label="WhatsApp (with country code)" val={f.whatsapp} set={v=>set("whatsapp",v)} ph="919553334735"/>
          <Fld label="UPI ID" val={f.upi} set={v=>set("upi",v)} ph="9553334735@upi"/>
          <Fld label="UPI Name" val={f.upiName} set={v=>set("upiName",v)} ph="Md Sabiq"/>
        </Card>
        <Card>
          <SecTitle icon="🖼️" title="Hero Banner"/>
          <Fld label="Headline" val={f.bannerTitle} set={v=>set("bannerTitle",v)} multi rows={2} ph="Farm Fresh Beef,\nAt Your Doorstep"/>
          <Fld label="Sub-text" val={f.bannerSub} set={v=>set("bannerSub",v)} ph="☪️ 100% Halal | Fresh Daily Cuts"/>
          <div style={{ marginTop:8,borderRadius:14,background:`linear-gradient(135deg,${C.rdark},#d44,#e87)`,padding:14,position:"relative",overflow:"hidden" }}>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:15,color:"#fff",fontWeight:800,lineHeight:1.3,paddingRight:40 }}>
              {f.bannerTitle.split("\n").map((l,i)=><div key={i}>{l}</div>)}
            </div>
            <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,color:"rgba(255,255,255,.9)",marginTop:4 }}>{f.bannerSub}</div>
            <div style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:34 }}>🥩</div>
          </div>
        </Card>
        <Card>
          <SecTitle icon="📢" title="Scrolling Announcements" sub="Scroll across the top for all customers"/>
          {f.announcements.map((a,i)=>(
            <div key={i} style={{ display:"flex",gap:8,marginBottom:8,alignItems:"center" }}>
              <input value={a} onChange={e=>setAnn(i,e.target.value)} placeholder="Announcement..."
                style={{ flex:1,background:C.sur,border:`1px solid ${C.bor2}`,borderRadius:10,color:C.txt,padding:"9px 12px",fontSize:13,fontFamily:"Lato,sans-serif",outline:"none" }}/>
              <button onClick={()=>delAnn(i)} style={{ background:"#3a0a0a",border:"1px solid #5a1010",borderRadius:8,color:"#e05050",padding:"9px 11px",cursor:"pointer",fontSize:14,flexShrink:0 }}>🗑</button>
            </div>
          ))}
          <Btn v="out" onClick={addAnn} sx={{ width:"100%",marginTop:4,fontSize:12 }}>+ Add Announcement</Btn>
        </Card>
        <Card>
          <SecTitle icon="⚠️" title="Important Notices Box" sub="Yellow box shown on home screen"/>
          {f.importantNotices.map((n,i)=>(
            <div key={i} style={{ display:"flex",gap:8,marginBottom:8,alignItems:"center" }}>
              <input value={n} onChange={e=>setNot(i,e.target.value)} placeholder="Notice..."
                style={{ flex:1,background:C.sur,border:`1px solid ${C.bor2}`,borderRadius:10,color:C.txt,padding:"9px 12px",fontSize:13,fontFamily:"Lato,sans-serif",outline:"none" }}/>
              <button onClick={()=>delNot(i)} style={{ background:"#3a0a0a",border:"1px solid #5a1010",borderRadius:8,color:"#e05050",padding:"9px 11px",cursor:"pointer",fontSize:14,flexShrink:0 }}>🗑</button>
            </div>
          ))}
          <Btn v="out" onClick={addNot} sx={{ width:"100%",marginTop:4,fontSize:12 }}>+ Add Notice</Btn>
        </Card>
        <div style={{ display:"flex",gap:10 }}>
          <Btn v="ghost" onClick={onClose} sx={{ flex:1,padding:13 }}>Cancel</Btn>
          <Btn onClick={()=>onSave(f)} sx={{ flex:2,padding:13 }}>💾 Save All Changes</Btn>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
//  CHANGE PIN MODAL
// ─────────────────────────────────────────────────────────────────────
const ChangePinModal = ({ cfg, onSave, onClose }) => {
  const [cur,setCur]=useState(""); const [nw,setNw]=useState("");
  const [cnf,setCnf]=useState(""); const [err,setErr]=useState(""); const [ok,setOk]=useState(false);
  const change=()=>{
    if(cur!==cfg.adminPin){setErr("Current PIN is wrong.");return;}
    if(nw.length<4){setErr("New PIN must be at least 4 digits.");return;}
    if(nw!==cnf){setErr("New PINs do not match.");return;}
    onSave({...cfg,adminPin:nw}); setOk(true);
  };
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:700,
      display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#1a0e08",borderRadius:20,padding:24,width:"100%",maxWidth:380,border:`1px solid ${C.bor2}` }} className="fu">
        {ok ? (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:48,marginBottom:12 }}>✅</div>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:18,color:C.grn,fontWeight:700,marginBottom:8 }}>PIN Changed!</div>
            <div style={{ fontFamily:"Lato,sans-serif",fontSize:13,color:C.mut,marginBottom:20 }}>Your new admin PIN is saved.</div>
            <Btn onClick={onClose} sx={{ width:"100%",padding:12 }}>Done</Btn>
          </div>
        ) : (
          <>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:18,color:C.amb,fontWeight:700 }}>🔑 Change Admin PIN</div>
              <button onClick={onClose} style={{ background:C.bor,border:"none",borderRadius:8,color:C.mut,padding:"6px 10px",cursor:"pointer",fontSize:16 }}>✕</button>
            </div>
            <Fld label="Current PIN" val={cur} set={setCur} ph="Current PIN" type="password"/>
            <Fld label="New PIN (min 4 digits)" val={nw} set={setNw} ph="New PIN" type="password"/>
            <Fld label="Confirm New PIN" val={cnf} set={setCnf} ph="Repeat new PIN" type="password"/>
            {err && <div style={{ fontFamily:"Lato,sans-serif",fontSize:12,color:"#e05050",marginBottom:10,padding:"8px 12px",background:"#3a0a0a",borderRadius:8 }}>⚠️ {err}</div>}
            <div style={{ display:"flex",gap:10,marginTop:4 }}>
              <Btn v="ghost" onClick={onClose} sx={{ flex:1,padding:12 }}>Cancel</Btn>
              <Btn onClick={change} dis={!cur||!nw||!cnf} sx={{ flex:2,padding:12 }}>🔐 Change PIN</Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
//  ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────
const Admin = ({ onLogout, products, setProducts, shopOpen, setShopOpen, cfg, setCfg }) => {
  const [orders,setOrders]=useState([]); const [loading,setLoad]=useState(true);
  const [tab,setTab]=useState("orders"); const [editP,setEditP]=useState(null);
  const [showCms,setShowCms]=useState(false); const [showPin,setShowPin]=useState(false);

  const reload=async()=>{ setLoad(true); const o=await sg(K.orders)||[]; setOrders(o); setLoad(false); };
  useEffect(()=>{ reload(); },[]);

  const updStatus=async(id,d)=>{
    const u=orders.map(o=>{ if(o.id!==id) return o; const ni=Math.min(Math.max(o.statusIndex+d,0),STATUS_FLOW.length-1); return {...o,statusIndex:ni,status:STATUS_FLOW[ni]}; });
    setOrders(u); await ss(K.orders,u);
  };
  const delOrder=async id=>{ const u=orders.filter(o=>o.id!==id); setOrders(u); await ss(K.orders,u); };
  const saveProd=async p=>{ const u=products.some(x=>x.id===p.id)?products.map(x=>x.id===p.id?p:x):[...products,p]; setProducts(u); await ss(K.products,u); setEditP(null); };
  const delProd=async id=>{ const u=products.filter(p=>p.id!==id); setProducts(u); await ss(K.products,u); };
  const togStock=async id=>{ const u=products.map(p=>p.id===id?{...p,inStock:!p.inStock}:p); setProducts(u); await ss(K.products,u); };
  const saveCfg=async c=>{ setCfg(c); await ss(K.config,c); setShowCms(false); setShowPin(false); };

  const rev=orders.reduce((a,b)=>a+(b.itemsTotal||b.total||0),0);
  const pend=orders.filter(o=>o.statusIndex<3).length;

  return (
    <div style={{ padding:16,paddingBottom:30 }} className="fu">
      {editP   && <ProdModal prod={editP} onSave={saveProd} onClose={()=>setEditP(null)}/>}
      {showCms && <CmsEditor cfg={cfg} onSave={saveCfg} onClose={()=>setShowCms(false)}/>}
      {showPin && <ChangePinModal cfg={cfg} onSave={saveCfg} onClose={()=>setShowPin(false)}/>}

      {/* Edit Consumer View */}
      <div onClick={()=>setShowCms(true)} style={{ background:"linear-gradient(135deg,#1a3060,#2a60c0)",
        border:"2px solid #4a70d0",borderRadius:18,padding:"18px 20px",marginBottom:12,cursor:"pointer",
        display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 4px 20px #2a60c044" }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:16,color:"#90b8ff",fontWeight:800 }}>✏️ Edit Consumer View</div>
          <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,color:"#6888c0",marginTop:4 }}>Banner · Notices · Announcements · Shop Info</div>
        </div>
        <span style={{ fontSize:24,color:"#90b8ff" }}>→</span>
      </div>

      {/* Change PIN */}
      <div onClick={()=>setShowPin(true)} style={{ background:"linear-gradient(135deg,#3a1060,#6a30c0)",
        border:"2px solid #7a40d0",borderRadius:18,padding:"18px 20px",marginBottom:12,cursor:"pointer",
        display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 4px 20px #6a30c044" }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:16,color:"#c090ff",fontWeight:800 }}>🔑 Change Admin PIN</div>
          <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,color:"#8868a0",marginTop:4 }}>Update your secret admin password</div>
        </div>
        <span style={{ fontSize:24,color:"#c090ff" }}>→</span>
      </div>

      {/* Shop Open/Close */}
      <div style={{ background:shopOpen?"#0d2010":"#2a0a0a",border:`2px solid ${shopOpen?"#2e6e2e":"#6e1e1e"}`,
        borderRadius:18,padding:"16px 20px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:16,color:shopOpen?C.grn:"#e05050",fontWeight:800 }}>
            {shopOpen?"🟢 Shop is OPEN":"🔴 Shop is CLOSED"}
          </div>
          <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,color:C.mut,marginTop:3 }}>
            {shopOpen?"Customers can browse & order":"Customers see Closed screen"}
          </div>
        </div>
        <Tog on={shopOpen} onChange={async v=>{ setShopOpen(v); await ss(K.shopOpen,v); }}/>
      </div>

      {/* WhatsApp quick link */}
      <a href={`https://wa.me/${cfg.whatsapp}`} target="_blank" rel="noreferrer"
        style={{ display:"flex",alignItems:"center",gap:12,background:"linear-gradient(135deg,#075e54,#25d366)",
          borderRadius:14,padding:"12px 16px",marginBottom:14,textDecoration:"none" }}>
        <span style={{ fontSize:22 }}>💬</span>
        <div>
          <div style={{ fontFamily:"Lato,sans-serif",fontSize:13,color:"#fff",fontWeight:700 }}>Open WhatsApp</div>
          <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,color:"rgba(255,255,255,.8)" }}>+{cfg.whatsapp}</div>
        </div>
      </a>

      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16 }}>
        {[{l:"Orders",v:orders.length,i:"📦"},{l:"Pending",v:pend,i:"⏳"},{l:"Sales",v:`₹${rev}`,i:"💰"}].map(s=>(
          <Card key={s.l} sx={{ textAlign:"center",marginBottom:0,padding:"14px 10px" }}>
            <div style={{ fontSize:22,marginBottom:4 }}>{s.i}</div>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:15,color:C.amb,fontWeight:700 }}>{s.v}</div>
            <div style={{ fontFamily:"Lato,sans-serif",fontSize:10,color:C.mut,marginTop:2 }}>{s.l}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:8,marginBottom:16,overflowX:"auto" }}>
        {[["orders","📋 Orders"],["products","🥩 Products"],["stats","📊 Stats"]].map(([k,lbl])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ padding:"8px 16px",borderRadius:10,border:"none",
            cursor:"pointer",whiteSpace:"nowrap",fontFamily:"Lato,sans-serif",fontWeight:700,fontSize:12,
            background:tab===k?C.red:C.sur,color:tab===k?"#fff":C.mut }}>{lbl}</button>
        ))}
        <button onClick={reload} style={{ marginLeft:"auto",background:C.sur,border:`1px solid ${C.bor2}`,
          borderRadius:10,color:C.mut,padding:"8px 12px",cursor:"pointer",fontSize:13 }}>🔄</button>
      </div>

      {/* Orders */}
      {tab==="orders" && (
        loading
          ? <div style={{ textAlign:"center",padding:40,color:C.mut }}>Loading...</div>
          : orders.length===0
            ? <div style={{ textAlign:"center",padding:40,color:C.mut,fontFamily:"Lato,sans-serif" }}>No orders yet! Share your app link.</div>
            : orders.map(o=>(
                <Card key={o.id}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                    <div>
                      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:14,color:C.txt,fontWeight:700 }}>{o.customer.name}</div>
                      <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,color:C.mut }}>{o.id} · {o.placedAt}</div>
                    </div>
                    <Bdg color={STATUS_COLORS[o.statusIndex]} bg={`${STATUS_COLORS[o.statusIndex]}22`}>{o.status}</Bdg>
                  </div>
                  <div style={{ fontFamily:"Lato,sans-serif",fontSize:12,color:C.mut,marginBottom:3 }}>📞 {o.customer.phone}</div>
                  <div style={{ fontFamily:"Lato,sans-serif",fontSize:12,color:C.mut,marginBottom:3 }}>📍 {o.customer.address}</div>
                  <div style={{ fontFamily:"Lato,sans-serif",fontSize:12,color:C.mut,marginBottom:8 }}>🕐 {o.slot}</div>
                  <div style={{ background:"#0e0804",borderRadius:10,padding:10,marginBottom:10 }}>
                    {o.items.map(it=>(
                      <div key={it.id} style={{ display:"flex",justifyContent:"space-between",fontFamily:"Lato,sans-serif",fontSize:12,color:C.mut,marginBottom:4 }}>
                        <span>{it.emoji} {it.name} × {it.qty}</span>
                        <span style={{ color:C.amb }}>₹{it.price*it.qty}</span>
                      </div>
                    ))}
                    <div style={{ display:"flex",justifyContent:"space-between",fontFamily:"Lato,sans-serif",fontSize:13,color:C.amb,fontWeight:700,borderTop:`1px solid ${C.bor}`,paddingTop:8,marginTop:4 }}>
                      <span>Items Total</span><span>₹{o.itemsTotal||o.total}</span>
                    </div>
                    <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,color:C.gold,marginTop:6,
                      background:"#1a1000",borderRadius:8,padding:"6px 10px" }}>
                      🚚 Delivery charge to be confirmed via WhatsApp
                    </div>
                  </div>
                  <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                    {o.statusIndex<STATUS_FLOW.length-1 &&
                      <Btn v="suc" onClick={()=>updStatus(o.id,1)} sx={{ fontSize:12 }}>✅ "{STATUS_FLOW[o.statusIndex+1]}"</Btn>}
                    {o.statusIndex>0 &&
                      <Btn v="ghost" onClick={()=>updStatus(o.id,-1)} sx={{ fontSize:11,padding:"7px 12px" }}>← Undo</Btn>}
                    <Btn v="wa" onClick={()=>sendWA(o,cfg)} sx={{ fontSize:11,padding:"7px 12px" }}>💬 WhatsApp</Btn>
                    <Btn v="danger" onClick={()=>delOrder(o.id)}>🗑</Btn>
                  </div>
                </Card>
              ))
      )}

      {/* Products */}
      {tab==="products" && (
        <div>
          <Btn onClick={()=>setEditP({inStock:true,emoji:"🥩",category:"Mince"})} sx={{ width:"100%",marginBottom:16,padding:13 }}>
            ➕ Add New Product
          </Btn>
          {products.map(p=>(
            <Card key={p.id}>
              <div style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
                <ProdImg p={p} sz={62}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif",fontSize:14,color:C.txt,fontWeight:700 }}>{p.name}</div>
                  <div style={{ fontFamily:"Lato,sans-serif",fontSize:11,color:C.mut,marginBottom:10 }}>{p.weight} · ₹{p.price} · {p.category}</div>
                  <div style={{ background:p.inStock?"#0d1f0d":"#2a0a0a",border:`1px solid ${p.inStock?"#2a5a2a":"#5a1010"}`,
                    borderRadius:10,padding:"9px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                    <span style={{ fontFamily:"Lato,sans-serif",fontSize:12,color:p.inStock?C.grn:"#e05050",fontWeight:700 }}>
                      {p.inStock?"✅ Available":"❌ Not Available"}
                    </span>
                    <Tog on={p.inStock} onChange={()=>togStock(p.id)} size="sm"/>
                  </div>
                  <div style={{ display:"flex",gap:8 }}>
                    <Btn v="out" onClick={()=>setEditP(p)} sx={{ flex:1,fontSize:11,padding:"7px" }}>✏️ Edit</Btn>
                    <Btn v="danger" onClick={()=>delProd(p.id)} sx={{ flex:1,fontSize:11,padding:"7px" }}>🗑 Delete</Btn>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {tab==="stats" && (
        <div>
          <Card>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:15,color:C.amb,fontWeight:700,marginBottom:14 }}>📊 Order Breakdown</div>
            {STATUS_FLOW.map((s,i)=>{
              const cnt=orders.filter(o=>o.statusIndex===i).length;
              const pct=orders.length>0?Math.round((cnt/orders.length)*100):0;
              return (
                <div key={s} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",fontFamily:"Lato,sans-serif",fontSize:12,color:C.mut,marginBottom:4 }}><span>{s}</span><span>{cnt}</span></div>
                  <div style={{ height:8,background:C.bor,borderRadius:4,overflow:"hidden" }}>
                    <div style={{ height:"100%",width:`${pct}%`,background:STATUS_COLORS[i],borderRadius:4,transition:"width .6s" }}/>
                  </div>
                </div>
              );
            })}
          </Card>
          <Card>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:15,color:C.amb,fontWeight:700,marginBottom:14 }}>🥩 Top Sellers</div>
            {(()=>{
              const cnt={}; orders.forEach(o=>o.items.forEach(i=>{ cnt[i.name]=(cnt[i.name]||0)+i.qty; }));
              const sorted=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,5);
              if(!sorted.length) return <div style={{ fontFamily:"Lato,sans-serif",fontSize:13,color:C.mut }}>No data yet.</div>;
              const mx=sorted[0][1];
              return sorted.map(([nm,q])=>(
                <div key={nm} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",fontFamily:"Lato,sans-serif",fontSize:12,color:C.mut,marginBottom:4 }}><span>{nm}</span><span>{q} sold</span></div>
                  <div style={{ height:8,background:C.bor,borderRadius:4,overflow:"hidden" }}>
                    <div style={{ height:"100%",width:`${(q/mx)*100}%`,background:C.red,borderRadius:4 }}/>
                  </div>
                </div>
              ));
            })()}
          </Card>
        </div>
      )}

      <Btn v="ghost" onClick={onLogout} sx={{ width:"100%",marginTop:20,padding:13 }}>🚪 Logout Admin</Btn>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
//  ROOT APP
// ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [scr,setScr]     = useState("home");
  const [cart,setCart]   = useState([]);
  const [lastO,setLastO] = useState(null);
  const [aIn,setAIn]     = useState(false);
  const [prods,setProds] = useState(DEFAULT_CATALOGUE);
  const [open,setOpen]   = useState(true);
  const [cfg,setCfg]     = useState(DEFAULT_CONFIG);
  const [ready,setReady] = useState(false);
  const [showInstall,setShowInstall] = useState(false);

  // Only show admin if URL has ?admin
  const canAdmin = isAdminMode();

  useEffect(()=>{
    (async()=>{
      const p=await sg(K.products); if(p&&p.length) setProds(p);
      const o=await sg(K.shopOpen); if(o!==null) setOpen(o);
      const c=await sg(K.config);   if(c) setCfg(x=>({...x,...c}));
      setReady(true);
      // Show install prompt only for consumers
      if(!canAdmin){
        const shown=sessionStorage.getItem("installShown");
        if(!shown){ setTimeout(()=>{ setShowInstall(true); sessionStorage.setItem("installShown","1"); },1500); }
      }
    })();
  },[]);

  const add  = p=>setCart(prev=>{ const e=prev.find(i=>i.id===p.id); return e?prev.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i):[...prev,{...p,qty:1}]; });
  const rem  = p=>setCart(prev=>{ const e=prev.find(i=>i.id===p.id); if(e?.qty>1) return prev.map(i=>i.id===p.id?{...i,qty:i.qty-1}:i); return prev.filter(i=>i.id!==p.id); });
  const totN = cart.reduce((a,b)=>a+b.qty,0);
  const isAdminIn = aIn && (scr==="admin"||scr==="adminLogin");

  const back=()=>{
    if(scr==="cart")       setScr("home");
    if(scr==="confirm")    { setScr("home"); setCart([]); }
    if(scr==="adminLogin") setScr("home");
    if(scr==="admin")      { setAIn(false); setScr("home"); }
  };

  if(!ready) return (
    <div style={{ background:C.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",
      display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <MeatLogo size={80}/>
        <div style={{ fontFamily:"Lato,sans-serif",fontSize:14,color:C.mut,marginTop:16 }}>Loading…</div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"Lato,sans-serif",background:C.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",color:C.txt }}>
      <GS/>
      {showInstall && <InstallPrompt onDismiss={()=>setShowInstall(false)} cfg={cfg}/>}

      <Hdr cartN={totN} onCart={()=>setScr("cart")} onAdmin={()=>setScr("adminLogin")}
        scr={scr} onBack={back} isAdminIn={isAdminIn} shopOpen={open} cfg={cfg} canAdmin={canAdmin}/>

      {scr==="home"       && <Home    cart={cart} onAdd={add} onRem={rem} onCO={()=>setScr("cart")} products={prods} shopOpen={open} cfg={cfg}/>}
      {scr==="cart"       && <Cart    cart={cart} onAdd={add} onRem={rem} onPlaced={o=>{setLastO(o);setScr("confirm");}} cfg={cfg}/>}
      {scr==="confirm"    && <Confirm order={lastO} onHome={()=>{setScr("home");setCart([]);}} cfg={cfg}/>}
      {scr==="adminLogin" && canAdmin && !aIn && <ALogin onLogin={()=>{setAIn(true);setScr("admin");}} cfg={cfg}/>}
      {scr==="admin"      && canAdmin && aIn  && <Admin  onLogout={()=>{setAIn(false);setScr("home");}} products={prods} setProducts={setProds} shopOpen={open} setShopOpen={setOpen} cfg={cfg} setCfg={setCfg}/>}
    </div>
  );
}
