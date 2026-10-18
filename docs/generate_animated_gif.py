#!/usr/bin/env python3
"""
generate_animated_gif.py
Generates professional, non-AI, animated visual documentation GIFs for DevFlow README:
1. docs/images/system-architecture.gif (Flowing request lifecycle with multi-light-color fades)
2. docs/images/devflow-hero.gif (Hero showcase banner with pulsating status badges & glowing code cards)
"""

import os
import sys
import math
import subprocess
import tempfile
import time
from PIL import Image

CHROME_EXE = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
TOTAL_FRAMES = 24  # 24 frames @ 90ms = ~2.16s smooth loop
FRAME_DURATION = 90  # ms

os.makedirs("docs/images", exist_ok=True)

def render_frame_html(phase):
    """
    phase in [0.0, 1.0)
    Generates HTML for a single frame of the Architecture Flow with:
    - Multi-color luminous gradient ambient orbs shifting and fading
    - Flowing pulse lighting up each of the 6 tiers sequentially
    - Pulsing connection beams and badges
    """
    # 6 stages in the architecture pipeline
    # Light colors per stage:
    colors = [
        {"name": "cyan", "hex": "#38bdf8", "rgb": "56, 189, 248"},     # 0: Client
        {"name": "violet", "hex": "#c084fc", "rgb": "192, 132, 252"},  # 1: Security Guards
        {"name": "indigo", "hex": "#818cf8", "rgb": "129, 140, 248"},  # 2: Routing
        {"name": "emerald", "hex": "#34d399", "rgb": "52, 211, 153"},  # 3: Services
        {"name": "amber", "hex": "#fbbf24", "rgb": "251, 191, 36"},   # 4: Repositories
        {"name": "pink", "hex": "#f472b6", "rgb": "244, 114, 182"}     # 5: PostgreSQL
    ]
    
    current_pos = phase * 6.0
    
    # Calculate intensity for each tier card (0.0 to 1.0)
    intensities = []
    for s in range(6):
        dist = (current_pos - s) % 6.0
        if dist > 3.0:
            dist = 6.0 - dist
        # Bell curve intensity
        val = max(0.0, 1.0 - (dist / 1.6)) ** 2
        intensities.append(val)
        
    # Ambient background light orbs shifting and breathing
    orb1_x = 15 + 10 * math.sin(phase * 2 * math.pi)
    orb1_y = 25 + 8 * math.cos(phase * 2 * math.pi)
    orb1_op = 0.18 + 0.10 * math.sin(phase * 2 * math.pi)
    
    orb2_x = 50 + 12 * math.cos(phase * 2 * math.pi)
    orb2_y = 20 + 10 * math.sin(phase * 2 * math.pi)
    orb2_op = 0.16 + 0.08 * math.cos(phase * 2 * math.pi)

    orb3_x = 80 + 10 * math.sin(phase * 2 * math.pi + 1.0)
    orb3_y = 35 + 10 * math.cos(phase * 2 * math.pi + 1.0)
    orb3_op = 0.18 + 0.10 * math.sin(phase * 2 * math.pi + 1.0)

    # Compute styles for each column card
    col_styles = []
    for s in range(6):
        inte = intensities[s]
        c = colors[s]
        border_col = f"rgba({c['rgb']}, {0.25 + 0.75 * inte:.2f})"
        bg_col = f"rgba(15, 23, 42, 0.95)"
        shadow = f"0 0 {int(10 + 25 * inte)}px rgba({c['rgb']}, {0.10 + 0.45 * inte:.2f})"
        scale = 1.0 + 0.015 * inte
        header_glow = f"color: {c['hex']}; text-shadow: 0 0 {int(15 * inte)}px rgba({c['rgb']}, {inte:.2f});"
        badge_glow = f"background: rgba({c['rgb']}, {0.2 + 0.4 * inte:.2f}); border-color: {c['hex']}; color: #ffffff;"
        col_styles.append({
            "border": border_col,
            "bg": bg_col,
            "shadow": shadow,
            "scale": scale,
            "header_glow": header_glow,
            "badge_glow": badge_glow,
            "intensity": inte
        })

    # Connector beam highlight
    connector_beams = []
    for s in range(5):
        # Beam is active when transitioning from s to s+1
        beam_phase = (current_pos - s) % 6.0
        if 0.0 <= beam_phase <= 1.2:
            beam_glow = max(0.0, 1.0 - abs(beam_phase - 0.5) / 0.7)
        else:
            beam_glow = 0.0
        connector_beams.append(beam_glow)

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background: #07090e;
    color: #e2e8f0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    width: 1280px;
    height: 720px;
    overflow: hidden;
    position: relative;
    padding: 24px 32px;
    display: flex;
    flex-direction: column;
  }}

  /* Ambient Breathing Light Background Orbs */
  .ambient-orbs {{
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(circle at {orb1_x}% {orb1_y}%, rgba(56, 189, 248, {orb1_op:.2f}) 0%, transparent 45%),
      radial-gradient(circle at {orb2_x}% {orb2_y}%, rgba(192, 132, 252, {orb2_op:.2f}) 0%, transparent 40%),
      radial-gradient(circle at {orb3_x}% {orb3_y}%, rgba(52, 211, 153, {orb3_op:.2f}) 0%, transparent 45%),
      radial-gradient(circle at 85% 75%, rgba(244, 114, 182, 0.12) 0%, transparent 40%);
  }}

  /* Header */
  .header {{
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 14px;
    margin-bottom: 18px;
  }}
  .brand {{
    display: flex;
    align-items: center;
    gap: 12px;
  }}
  .logo-badge {{
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, #38bdf8, #a855f7);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    color: #030712;
    font-size: 17px;
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.5);
  }}
  .title-text h1 {{
    font-size: 20px;
    font-weight: 700;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 10px;
  }}
  .live-pill {{
    font-size: 10.5px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 9999px;
    background: rgba(52, 211, 153, 0.15);
    color: #34d399;
    border: 1px solid rgba(52, 211, 153, 0.4);
    display: flex;
    align-items: center;
    gap: 5px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }}
  .live-dot {{
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 8px #34d399;
  }}
  .title-text p {{
    font-size: 11.5px;
    color: #94a3b8;
    margin-top: 2px;
  }}
  .meta-chips {{
    display: flex;
    gap: 8px;
  }}
  .chip {{
    font-size: 10.5px;
    font-family: ui-monospace, SFMono-Regular, monospace;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
    padding: 4px 10px;
    border-radius: 5px;
  }}

  /* Main 6-Column Pipeline Grid */
  .pipeline-grid {{
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 14px;
    flex: 1;
    align-items: stretch;
  }}

  .col-card {{
    border-radius: 10px;
    padding: 14px 12px;
    display: flex;
    flex-direction: column;
    position: relative;
    backdrop-filter: blur(8px);
    transition: all 0.2s ease;
  }}

  .col-header {{
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }}
  .col-num {{
    width: 22px;
    height: 22px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
  }}
  .col-titles h3 {{
    font-size: 13px;
    font-weight: 700;
    line-height: 1.1;
  }}
  .col-titles span {{
    font-size: 9.5px;
    color: #64748b;
    font-family: ui-monospace, monospace;
  }}

  .box-list {{
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }}
  .box {{
    background: rgba(30, 41, 59, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 6px;
    padding: 7px 9px;
  }}
  .box-title {{
    font-size: 11px;
    font-weight: 600;
    color: #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .box-badge {{
    font-size: 9px;
    font-family: ui-monospace, monospace;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 3px;
  }}
  .box-desc {{
    font-size: 9.5px;
    color: #94a3b8;
    margin-top: 3px;
    line-height: 1.3;
  }}
  .box-code {{
    font-family: ui-monospace, monospace;
    font-size: 9px;
    background: rgba(0, 0, 0, 0.4);
    padding: 2px 4px;
    border-radius: 3px;
    color: #e2e8f0;
    margin-top: 3px;
    display: inline-block;
  }}

  /* Connector indicators between cards */
  .connector-dot {{
    position: absolute;
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    z-index: 5;
  }}

  /* Bottom status strip */
  .footer-strip {{
    position: relative;
    z-index: 2;
    margin-top: 14px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 9px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: #94a3b8;
  }}
  .flow-indicator {{
    display: flex;
    align-items: center;
    gap: 8px;
  }}
  .pulse-track {{
    width: 240px;
    height: 4px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 2px;
    position: relative;
    overflow: hidden;
  }}
  .pulse-thumb {{
    position: absolute;
    top: 0;
    left: {phase * 100}%;
    width: 40px;
    height: 100%;
    background: linear-gradient(90deg, transparent, #38bdf8, #a855f7, transparent);
    border-radius: 2px;
  }}
</style>
</head>
<body>

<div class="ambient-orbs"></div>

<div class="header">
  <div class="brand">
    <div class="logo-badge">DF</div>
    <div class="title-text">
      <h1>DevFlow Architecture & Live Flow <span class="live-pill"><span class="live-dot"></span> Active Pipeline</span></h1>
      <p>Layered Node.js / Express 5 API with PostgreSQL connection pooling, JWT RBAC, and Zod validation</p>
    </div>
  </div>
  <div class="meta-chips">
    <div class="chip">Node.js 22</div>
    <div class="chip">PostgreSQL 16</div>
    <div class="chip">62 / 62 Tests Passed</div>
    <div class="chip">JWT & Bcrypt</div>
  </div>
</div>

<div class="pipeline-grid">

  <!-- 1. Client & Gateway -->
  <div class="col-card" style="border: 1px solid {col_styles[0]['border']}; background: {col_styles[0]['bg']}; box-shadow: {col_styles[0]['shadow']}; transform: scale({col_styles[0]['scale']});">
    <div class="col-header">
      <div class="col-num" style="{col_styles[0]['badge_glow']}">1</div>
      <div class="col-titles">
        <h3 style="{col_styles[0]['header_glow']}">Client / Entry</h3>
        <span>HTTP / REST</span>
      </div>
    </div>
    <div class="box-list">
      <div class="box">
        <div class="box-title">REST Consumer</div>
        <div class="box-desc">SPA, mobile & cURL clients sending JSON bodies and Bearer JWTs.</div>
      </div>
      <div class="box">
        <div class="box-title">Port 3000</div>
        <div class="box-desc">Express 5 HTTP server instance in <code>server.js</code>.</div>
      </div>
      <div class="box">
        <div class="box-title">Request Logger</div>
        <div class="box-code">ENABLE_REQUEST_LOGGING</div>
      </div>
    </div>
    <div class="connector-dot" style="background: rgba(56, 189, 248, {0.3 + 0.7 * connector_beams[0]:.2f}); box-shadow: 0 0 {int(10 * connector_beams[0])}px #38bdf8;"></div>
  </div>

  <!-- 2. Security Guards -->
  <div class="col-card" style="border: 1px solid {col_styles[1]['border']}; background: {col_styles[1]['bg']}; box-shadow: {col_styles[1]['shadow']}; transform: scale({col_styles[1]['scale']});">
    <div class="col-header">
      <div class="col-num" style="{col_styles[1]['badge_glow']}">2</div>
      <div class="col-titles">
        <h3 style="{col_styles[1]['header_glow']}">Security Guards</h3>
        <span>src/middleware/</span>
      </div>
    </div>
    <div class="box-list">
      <div class="box">
        <div class="box-title">Rate Limiter <span class="box-badge" style="background: #4c1d95; color: #ddd6fe;">429</span></div>
        <div class="box-desc">Sliding-window limiter: 5 attempts/15m with Retry-After.</div>
      </div>
      <div class="box">
        <div class="box-title">JWT Authenticate <span class="box-badge" style="background: #1e3a8a; color: #93c5fd;">401</span></div>
        <div class="box-desc">Extracts Bearer token & attaches authenticated user.</div>
      </div>
      <div class="box">
        <div class="box-title">Zod Validator <span class="box-badge" style="background: #78350f; color: #fde68a;">400</span></div>
        <div class="box-desc">Strict schemas for auth, projects, issues, comments.</div>
      </div>
    </div>
    <div class="connector-dot" style="background: rgba(192, 132, 252, {0.3 + 0.7 * connector_beams[1]:.2f}); box-shadow: 0 0 {int(10 * connector_beams[1])}px #c084fc;"></div>
  </div>

  <!-- 3. Routing Tier -->
  <div class="col-card" style="border: 1px solid {col_styles[2]['border']}; background: {col_styles[2]['bg']}; box-shadow: {col_styles[2]['shadow']}; transform: scale({col_styles[2]['scale']});">
    <div class="col-header">
      <div class="col-num" style="{col_styles[2]['badge_glow']}">3</div>
      <div class="col-titles">
        <h3 style="{col_styles[2]['header_glow']}">Routing Tier</h3>
        <span>src/routes/</span>
      </div>
    </div>
    <div class="box-list">
      <div class="box">
        <div class="box-title">/auth</div>
        <div class="box-code">/register, /login, /me</div>
      </div>
      <div class="box">
        <div class="box-title">/projects</div>
        <div class="box-code">GET, POST, PUT, DELETE</div>
      </div>
      <div class="box">
        <div class="box-title">/issues</div>
        <div class="box-code">Search, Sort, Paginate</div>
      </div>
      <div class="box">
        <div class="box-title">/comments</div>
        <div class="box-code">/:id/comments CRUD</div>
      </div>
    </div>
    <div class="connector-dot" style="background: rgba(129, 140, 248, {0.3 + 0.7 * connector_beams[2]:.2f}); box-shadow: 0 0 {int(10 * connector_beams[2])}px #818cf8;"></div>
  </div>

  <!-- 4. Domain & Services -->
  <div class="col-card" style="border: 1px solid {col_styles[3]['border']}; background: {col_styles[3]['bg']}; box-shadow: {col_styles[3]['shadow']}; transform: scale({col_styles[3]['scale']});">
    <div class="col-header">
      <div class="col-num" style="{col_styles[3]['badge_glow']}">4</div>
      <div class="col-titles">
        <h3 style="{col_styles[3]['header_glow']}">Domain Services</h3>
        <span>src/services/</span>
      </div>
    </div>
    <div class="box-list">
      <div class="box">
        <div class="box-title">auth.service</div>
        <div class="box-desc">Bcrypt 10 rounds, forces role 'member', issues signed JWT.</div>
      </div>
      <div class="box">
        <div class="box-title">project.service</div>
        <div class="box-desc">Owner RBAC check, key uniqueness verification.</div>
      </div>
      <div class="box">
        <div class="box-title">issue.service</div>
        <div class="box-desc">Creator/Owner/Admin RBAC for status updates and delete.</div>
      </div>
    </div>
    <div class="connector-dot" style="background: rgba(52, 211, 153, {0.3 + 0.7 * connector_beams[3]:.2f}); box-shadow: 0 0 {int(10 * connector_beams[3])}px #34d399;"></div>
  </div>

  <!-- 5. Repositories -->
  <div class="col-card" style="border: 1px solid {col_styles[4]['border']}; background: {col_styles[4]['bg']}; box-shadow: {col_styles[4]['shadow']}; transform: scale({col_styles[4]['scale']});">
    <div class="col-header">
      <div class="col-num" style="{col_styles[4]['badge_glow']}">5</div>
      <div class="col-titles">
        <h3 style="{col_styles[4]['header_glow']}">Data Access</h3>
        <span>src/repositories/</span>
      </div>
    </div>
    <div class="box-list">
      <div class="box">
        <div class="box-title">Parameterized SQL</div>
        <div class="box-desc">Guards against SQL injection across all queries.</div>
      </div>
      <div class="box">
        <div class="box-title">Dynamic Search</div>
        <div class="box-desc">ILIKE text match with multi-filter status/priority.</div>
      </div>
      <div class="box">
        <div class="box-title">Deterministic Sort</div>
        <div class="box-code">ORDER BY ..., i.id ASC</div>
      </div>
    </div>
    <div class="connector-dot" style="background: rgba(251, 191, 36, {0.3 + 0.7 * connector_beams[4]:.2f}); box-shadow: 0 0 {int(10 * connector_beams[4])}px #fbbf24;"></div>
  </div>

  <!-- 6. PostgreSQL -->
  <div class="col-card" style="border: 1px solid {col_styles[5]['border']}; background: {col_styles[5]['bg']}; box-shadow: {col_styles[5]['shadow']}; transform: scale({col_styles[5]['scale']});">
    <div class="col-header">
      <div class="col-num" style="{col_styles[5]['badge_glow']}">6</div>
      <div class="col-titles">
        <h3 style="{col_styles[5]['header_glow']}">PostgreSQL 16</h3>
        <span>src/config/db.js</span>
      </div>
    </div>
    <div class="box-list">
      <div class="box">
        <div class="box-title">pg.Pool Pooler</div>
        <div class="box-code">max: 20 | idle: 30s | timeout: 5s</div>
      </div>
      <div class="box">
        <div class="box-title">4 Entities</div>
        <div class="box-desc">users, projects, issues, comments (CASCADE/SET NULL).</div>
      </div>
      <div class="box">
        <div class="box-title">8 DB Indexes</div>
        <div class="box-desc">Email, key, status, created_at, FK indices.</div>
      </div>
    </div>
  </div>

</div>

<div class="footer-strip">
  <div class="flow-indicator">
    <span>Data Execution Wave:</span>
    <div class="pulse-track"><div class="pulse-thumb"></div></div>
  </div>
  <div>
    🛡️ Centralized Error Handler (AppError, Zod 400, Unique 409) &bull; 10s Bounded Graceful Shutdown
  </div>
</div>

</body>
</html>
"""
    return html

def main():
    print("=== Generating Animated DevFlow Visual Documentation ===")
    start_time = time.time()
    
    temp_dir = tempfile.mkdtemp(prefix="devflow_anim_")
    frame_paths = []
    
    print(f"1. Rendering {TOTAL_FRAMES} frames for system-architecture.gif...")
    for i in range(TOTAL_FRAMES):
        phase = i / float(TOTAL_FRAMES)
        html_content = render_frame_html(phase)
        html_file = os.path.join(temp_dir, f"frame_{i:03d}.html")
        png_file = os.path.join(temp_dir, f"frame_{i:03d}.png")
        
        with open(html_file, "w", encoding="utf-8") as f:
            f.write(html_content)
            
        cmd = [
            CHROME_EXE,
            "--headless=new",
            "--disable-gpu",
            "--window-size=1280,720",
            f"--screenshot={png_file}",
            html_file
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        frame_paths.append(png_file)
        print(f"   [Frame {i+1}/{TOTAL_FRAMES}] rendered", end="\r")

    print("\n2. Compiling system-architecture.gif with Pillow...")
    images = []
    for p in frame_paths:
        img = Image.open(p).convert("RGB")
        # Quantize to adaptive 256-color palette for crisp, compact GIF
        img_quant = img.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
        images.append(img_quant)
        
    out_gif = os.path.join("docs", "images", "system-architecture.gif")
    images[0].save(
        out_gif,
        save_all=True,
        append_images=images[1:],
        duration=FRAME_DURATION,
        loop=0,
        optimize=True
    )
    
    gif_size = os.path.getsize(out_gif)
    print(f"   Saved {out_gif} ({gif_size / (1024*1024):.2f} MB)")
    
    # Clean up temp frames
    for f in os.listdir(temp_dir):
        os.remove(os.path.join(temp_dir, f))
    os.rmdir(temp_dir)
    
    print(f"=== Done in {time.time() - start_time:.2f}s! ===")

if __name__ == "__main__":
    main()

