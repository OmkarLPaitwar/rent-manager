import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

/* ─── tiny hook: animate number counting up ─── */
function useCountUp(target, duration = 1800, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setVal(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return val;
}

/* ─── Intersection observer hook ─── */
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

const FEATURES = [
  { icon: '💰', title: 'Rent Tracking', desc: 'Record rent from every tenant — BOB Transfer, Cash, UPI — with dates and notes. Instantly see who has paid and who hasn\'t.' },
  { icon: '📋', title: 'Expense Management', desc: 'Log maintenance, installments, travel, insurance and any category. Get a clear breakdown of where your money goes each month.' },
  { icon: '💡', title: 'Light Bill Calculator', desc: 'Enter meter readings — the app auto-calculates units consumed and amount per unit for every flat. No manual math needed.' },
  { icon: '📄', title: 'PDF Reports', desc: 'Download a professional monthly report with rent, expenses, light bill and summary — ready to share or archive in one click.' },
  { icon: '📈', title: 'Yearly Analytics', desc: 'Beautiful bar charts and line graphs showing 12 months of rent vs expense trends. Spot your best and worst months instantly.' },
  { icon: '🔒', title: 'Multi-user & Secure', desc: 'Every user has their own isolated account. JWT-secured sessions, bcrypt-hashed passwords — your data stays only yours.' },
];

const STEPS = [
  { num: '01', title: 'Create your account', desc: 'Register free — takes 30 seconds. Add your property name.' },
  { num: '02', title: 'Add your tenants', desc: 'Add each tenant with their unit type, rent amount, and payment method.' },
  { num: '03', title: 'Record payments', desc: 'Each month, mark rent received and log any expenses as they happen.' },
  { num: '04', title: 'Download your report', desc: 'Go to Monthly Summary → Download PDF. Professional report ready instantly.' },
];

const TESTIMONIALS = [
  { name: 'Suresh Patil', role: 'Property owner, Pune', text: 'I used to spend hours writing everything in a diary. This app does it in minutes. The PDF report is exactly what I needed.' },
  { name: 'Meena Kulkarni', role: 'Landlord, Nashik', text: 'The light bill calculator alone saves me so much time every month. No more calculating on paper!' },
  { name: 'Rajan Sharma', role: 'Building owner, Mumbai', text: 'Finally an app designed for how we actually collect rent in India — BOB Transfer, Cash, UPI all in one place.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Contact form state
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [formStatus, setFormStatus] = useState('idle'); // idle | loading | success | error
  const [formMsg, setFormMsg] = useState('');

  // Stats section trigger
  const [statsRef, statsInView] = useInView(0.3);
  const rent = useCountUp(412000, 2000, statsInView);
  const tenants = useCountUp(6, 1200, statsInView);
  const reports = useCountUp(48, 1600, statsInView);

  const handleForm = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submitContact = async e => {
    e.preventDefault();
    setFormStatus('loading');
    try {
      const res = await API.post('/contact', form);
      setFormStatus('success');
      setFormMsg(res.data.message);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setFormStatus('error');
      setFormMsg(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setTimeout(() => setFormStatus('idle'), 5000);
  };

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: '#1a1a2e', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0', padding: '0 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, overflow: 'hidden' }}>
          <img src="/logo.png" alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }} />
          <span style={{ fontWeight: 800, fontSize: 'clamp(13px,3vw,17px)', color: '#1e3a6e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Rent & Expense Manager</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {user
            ? <button onClick={() => navigate('/dashboard')} style={ctaBtn}>Dashboard →</button>
            : <>
                <button onClick={() => navigate('/auth')} style={{ ...navBtn, fontWeight: 600 }}>Login</button>
                <button onClick={() => navigate('/auth')} style={{ ...ctaBtn, fontSize: 13, padding: '9px 16px' }}>Get Started →</button>
              </>
          }
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        background: 'linear-gradient(135deg, #0f1f4a 0%, #1e3a6e 45%, #2a52a0 100%)',
        paddingTop: 64, position: 'relative', overflow: 'hidden'
      }}>
        {/* decorative circles */}
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'rgba(255,255,255,0.03)', top:-100, right:-150, pointerEvents:'none' }} />
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'rgba(240,165,0,0.08)', bottom:50, left:-80, pointerEvents:'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(60px,8vw,80px) 5%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ display:'inline-block', background:'rgba(240,165,0,0.15)', color:'#f0a500', padding:'6px 16px', borderRadius:30, fontSize:13, fontWeight:600, marginBottom:20, border:'1px solid rgba(240,165,0,0.3)' }}>
              🇮🇳 Built for Indian Property Owners
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 20, letterSpacing: '-1px' }}>
              Manage Your Property<br />
              <span style={{ color: '#f0a500' }}>Income & Expenses</span><br />
              The Smart Way
            </h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
              Stop maintaining messy diaries and Excel sheets. Track rent, expenses, light bills and generate professional PDF reports — all in one place.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/auth')} style={{ ...ctaBtn, padding: '14px 32px', fontSize: 16 }}>
                🚀 Start Free — No Card Required
              </button>
              <button onClick={() => scrollTo('features')} style={{ padding:'14px 28px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.3)', background:'transparent', color:'white', fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>
                See Features ↓
              </button>
            </div>
            <div style={{ display:'flex', gap:24, marginTop:36, flexWrap:'wrap' }}>
              {[['✅','Free Forever'],['✅','No Excel needed'],['✅','PDF Reports'],['✅','Works on Mobile']].map(([i,t]) => (
                <span key={t} style={{ color:'rgba(255,255,255,0.7)', fontSize:13 }}><span style={{color:'#4ade80'}}>{i}</span> {t}</span>
              ))}
            </div>
          </div>

          {/* Mini app preview */}
          <div style={{ display:'flex', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:20, padding:0, boxShadow:'0 40px 80px rgba(0,0,0,0.4)', width:'100%', maxWidth:380, overflow:'hidden' }}>
              <div style={{ background:'#1e3a6e', padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{fontSize:16}}>🏠</span>
                <span style={{color:'white',fontWeight:600,fontSize:13}}>Monthly Summary — April 2026</span>
              </div>
              <div style={{ padding:16 }}>
                {[['Total Rent','Rs. 21,700','#27ae60'],['Total Expenses','Rs. 2,000','#c0392b'],['Balance','Rs. 19,700','#27ae60']].map(([l,v,c]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f0f0f0' }}>
                    <span style={{fontSize:13, color:'#666'}}>{l}</span>
                    <span style={{fontSize:14, fontWeight:700, color:c}}>{v}</span>
                  </div>
                ))}
                <div style={{marginTop:14}}>
                  <div style={{fontSize:11, fontWeight:600, color:'#888', textTransform:'uppercase', marginBottom:8}}>Rent Received</div>
                  {[['Om Patil','Rs. 4,500','UPI'],['Bhutada Bhabhi','Rs. 7,700','UPI'],['Mane Kaka','Rs. 7,000','UPI'],['Rohit Chavan','Rs. 2,500','Cash']].map(([n,a,m]) => (
                    <div key={n} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',fontSize:12}}>
                      <span>{n}</span>
                      <div style={{display:'flex',gap:6,alignItems:'center'}}>
                        <span style={{padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:600,background: m==='Cash'?'#dcfce7':'#dbeafe',color:m==='Cash'?'#166534':'#1e40af'}}>{m}</span>
                        <span style={{fontWeight:700,color:'#27ae60'}}>{a}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button style={{width:'100%',marginTop:14,padding:'10px',background:'#f0a500',color:'white',border:'none',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                  ⬇️ Download PDF Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} style={{ background:'#f4f6fb', padding:'60px 5%' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:24, textAlign:'center' }}>
          {[
            [`Rs. ${rent.toLocaleString('en-IN')}+`, 'Rent tracked per property/year'],
            [`${tenants}+`, 'Tenants managed per property'],
            [`${reports}+`, 'PDF reports generated'],
          ].map(([v, l]) => (
            <div key={l} style={{ background:'white', padding:'32px 20px', borderRadius:16, boxShadow:'0 2px 12px rgba(30,58,110,0.07)', border:'1px solid #e2e8f0' }}>
              <div style={{ fontSize:36, fontWeight:800, color:'#1e3a6e', letterSpacing:'-1px' }}>{v}</div>
              <div style={{ fontSize:14, color:'#6b7280', marginTop:6 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding:'80px 5%', background:'white' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={sectionTag}>Everything You Need</div>
            <h2 style={sectionTitle}>Powerful features for Indian landlords</h2>
            <p style={sectionSub}>Built specifically for how property management works in India — from BOB transfers to manual meter readings.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:24 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ padding:'28px 24px', borderRadius:16, border:'1.5px solid #e2e8f0', transition:'all 0.2s', cursor:'default' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='#1e3a6e'; e.currentTarget.style.boxShadow='0 8px 32px rgba(30,58,110,0.12)'; e.currentTarget.style.transform='translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none'; }}
              >
                <div style={{ fontSize:36, marginBottom:14 }}>{f.icon}</div>
                <h3 style={{ fontSize:17, fontWeight:700, color:'#1e3a6e', marginBottom:10 }}>{f.title}</h3>
                <p style={{ fontSize:14, color:'#6b7280', lineHeight:1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding:'80px 5%', background:'#f4f6fb' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={sectionTag}>Simple Process</div>
            <h2 style={sectionTitle}>Up and running in 4 steps</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:24 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ background:'white', padding:'28px 24px', borderRadius:16, border:'1px solid #e2e8f0', position:'relative' }}>
                <div style={{ fontSize:40, fontWeight:800, color:'#e8edf8', position:'absolute', top:16, right:20, lineHeight:1 }}>{s.num}</div>
                <div style={{ width:36, height:36, background:'#1e3a6e', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:16, marginBottom:14 }}>{i+1}</div>
                <h3 style={{ fontSize:15, fontWeight:700, color:'#1e3a6e', marginBottom:8 }}>{s.title}</h3>
                <p style={{ fontSize:13, color:'#6b7280', lineHeight:1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding:'80px 5%', background:'white' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div style={sectionTag}>From our users</div>
            <h2 style={sectionTitle}>Property owners love it</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:24 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ padding:'28px 24px', borderRadius:16, background:'#f8faff', border:'1px solid #e2e8f0' }}>
                <div style={{ fontSize:28, color:'#f0a500', marginBottom:14 }}>★★★★★</div>
                <p style={{ fontSize:14, color:'#374151', lineHeight:1.7, marginBottom:20, fontStyle:'italic' }}>"{t.text}"</p>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:'#1e3a6e' }}>{t.name}</div>
                  <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ background:'linear-gradient(135deg, #1e3a6e, #2a52a0)', padding:'70px 5%', textAlign:'center' }}>
        <h2 style={{ fontSize:'clamp(26px,4vw,40px)', fontWeight:800, color:'white', marginBottom:16 }}>Ready to stop the diary writing?</h2>
        <p style={{ fontSize:17, color:'rgba(255,255,255,0.75)', marginBottom:36, maxWidth:540, margin:'0 auto 36px' }}>
          Join property owners who manage their buildings without paperwork.
        </p>
        <button onClick={() => navigate('/auth')} style={{ ...ctaBtn, padding:'16px 40px', fontSize:17 }}>
          🏠 Create Your Free Account
        </button>
      </section>

      {/* ── DEVELOPER + CONTACT ── */}
      <section id="contact" style={{ padding:'80px 5%', background:'#f4f6fb' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:40, alignItems:'start' }}>

          {/* Developer info */}
          <div>
            <div style={sectionTag}>The Developer</div>
            <h2 style={{ ...sectionTitle, textAlign:'left', marginBottom:20 }}>Built with ❤️ in India</h2>
            <div style={{ background:'white', borderRadius:16, padding:28, border:'1px solid #e2e8f0', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
                <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,#1e3a6e,#2a52a0)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:26, fontWeight:800, flexShrink:0 }}>
                  R
                </div>
                <div>
                  <div style={{ fontWeight:800, fontSize:18, color:'#1e3a6e' }}>Rent Manager Developer</div>
                  <div style={{ fontSize:13, color:'#9ca3af', marginTop:2 }}>Full Stack Developer • Maharashtra, India</div>
                  <div style={{ display:'flex', gap:8, marginTop:6 }}>
                    {['React','Node.js','MongoDB'].map(t => (
                      <span key={t} style={{ background:'#e8edf8', color:'#1e3a6e', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <p style={{ fontSize:14, color:'#6b7280', lineHeight:1.8 }}>
                This app was built to solve a real problem — a friend was managing property income manually in diaries and PDFs. I built this MERN stack application to automate everything: rent collection, light bill calculations, expense tracking and professional PDF reports.
              </p>
              <div style={{ marginTop:20, padding:'14px 16px', background:'#f8faff', borderRadius:10, border:'1px solid #e2e8f0' }}>
                <div style={{ fontSize:12, color:'#9ca3af', marginBottom:8, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Tech Stack</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[['Frontend','React.js + CSS'],['Backend','Node.js + Express'],['Database','MongoDB Atlas'],['Auth','JWT + bcrypt'],['PDF','jsPDF + autoTable'],['Hosting','Vercel + Render']].map(([k,v]) => (
                    <div key={k} style={{ fontSize:12 }}><span style={{color:'#9ca3af'}}>{k}: </span><span style={{color:'#374151',fontWeight:600}}>{v}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <div style={sectionTag}>Get in Touch</div>
            <h2 style={{ ...sectionTitle, textAlign:'left', marginBottom:20 }}>Contact the developer</h2>
            <div style={{ background:'white', borderRadius:16, padding:28, border:'1px solid #e2e8f0' }}>
              {formStatus === 'success' ? (
                <div style={{ textAlign:'center', padding:'40px 20px' }}>
                  <div style={{ fontSize:50, marginBottom:16 }}>✅</div>
                  <h3 style={{ color:'#27ae60', fontSize:18, marginBottom:8 }}>Message Sent!</h3>
                  <p style={{ color:'#6b7280', fontSize:14 }}>{formMsg}</p>
                  <button onClick={() => setFormStatus('idle')} style={{ marginTop:20, padding:'10px 24px', background:'#1e3a6e', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:14 }}>Send Another</button>
                </div>
              ) : (
                <form onSubmit={submitContact}>
                  {formStatus === 'error' && (
                    <div style={{ background:'#fdf0ef', color:'#c0392b', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:14 }}>⚠️ {formMsg}</div>
                  )}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                    <div>
                      <label style={lbl}>Your Name *</label>
                      <input style={inp} name="name" value={form.name} onChange={handleForm} placeholder="Rajesh Kumar" required />
                    </div>
                    <div>
                      <label style={lbl}>Email *</label>
                      <input style={inp} name="email" type="email" value={form.email} onChange={handleForm} placeholder="you@email.com" required />
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                    <div>
                      <label style={lbl}>Phone</label>
                      <input style={inp} name="phone" value={form.phone} onChange={handleForm} placeholder="9876543210" />
                    </div>
                    <div>
                      <label style={lbl}>Subject</label>
                      <input style={inp} name="subject" value={form.subject} onChange={handleForm} placeholder="Feature request / Bug / General" />
                    </div>
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <label style={lbl}>Message *</label>
                    <textarea style={{ ...inp, height:110, resize:'vertical' }} name="message" value={form.message} onChange={handleForm} placeholder="Tell me what you need, report a bug, or just say hi!" required />
                  </div>
                  <button type="submit" disabled={formStatus==='loading'} style={{ width:'100%', padding:'12px', background:'#1e3a6e', color:'white', border:'none', borderRadius:10, fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>
                    {formStatus === 'loading' ? '⏳ Sending...' : '📨 Send Message'}
                  </button>
                  <p style={{ textAlign:'center', fontSize:12, color:'#9ca3af', marginTop:10 }}>Your message is saved securely and reviewed personally.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:'#0f1f4a', color:'rgba(255,255,255,0.6)', padding:'40px 5%', textAlign:'center' }}>
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:10, marginBottom:12 }}>
          <span style={{ fontSize:22 }}>🏠</span>
          <span style={{ fontWeight:800, fontSize:16, color:'white' }}>Rent & Expense Manager</span>
        </div>
        <p style={{ fontSize:13, marginBottom:16 }}>Built for Indian property owners. Free forever for personal use.</p>
        <div style={{ display:'flex', justifyContent:'center', gap:24, fontSize:13, marginBottom:20, flexWrap:'wrap' }}>
          {[['Features','#features'],['How it Works','#how'],['Contact','#contact']].map(([l,h]) => (
            <button key={l} onClick={() => scrollTo(h.slice(1))} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>{l}</button>
          ))}
          <button onClick={() => navigate('/auth')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>Login / Register</button>
        </div>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} Rent & Expense Manager. Made with ❤️ in Maharashtra, India.</p>
      </footer>
    </div>
  );
}

/* ─── inline style constants ─── */
const navBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 14, color: '#374151', padding: '6px 12px',
  borderRadius: 6, fontFamily: 'inherit',
};
const ctaBtn = {
  background: '#f0a500', color: 'white', border: 'none',
  padding: '10px 22px', borderRadius: 10, fontWeight: 700,
  fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
};
const sectionTag = {
  display: 'inline-block', background: '#e8edf8', color: '#1e3a6e',
  padding: '5px 16px', borderRadius: 30, fontSize: 13, fontWeight: 600,
  marginBottom: 14, textAlign: 'center',
};
const sectionTitle = {
  fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800,
  color: '#1e3a6e', lineHeight: 1.2, marginBottom: 14, textAlign: 'center',
};
const sectionSub = {
  fontSize: 16, color: '#6b7280', lineHeight: 1.7,
  maxWidth: 560, margin: '0 auto', textAlign: 'center',
};
const lbl = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px',
};
const inp = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box', color: '#1a1a2e',
};
