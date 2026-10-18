#!/usr/bin/env python3
"""
docs/generate_readme_animation.py
Generates high-resolution, animated, non-AI visual documentation for DevFlow:
1. docs/images/devflow-hero-animated.gif:
   Multi-scene hero banner with picture fades between Architecture Pipeline and Database/API Topology,
   featuring soft breathing multi-light-color auras (cyan, violet, mint, amber, rose), glowing badges, and animated waves.
"""

import os
import sys
import math
import subprocess
import tempfile
import time
from PIL import Image

CHROME_EXE = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
TOTAL_FRAMES = 40  # 40 frames @ 85ms = 3.4 seconds smooth loop
FRAME_DURATION = 85  # ms

os.makedirs("docs/images", exist_ok=True)

def get_hero_frame_html(frame_idx, total_frames):
    phase = frame_idx / float(total_frames)  # 0.0 to 1.0
    t = phase * 2 * math.pi
    
    # Ambient multi-light-color orbs breathing and drifting with smooth fades
    orb1_x = 18 + 12 * math.sin(t)
    orb1_y = 22 + 8 * math.cos(t)
    orb1_op = 0.24 + 0.12 * math.sin(t)
    
    orb2_x = 52 + 14 * math.cos(t + 1.2)
    orb2_y = 18 + 10 * math.sin(t + 1.2)
    orb2_op = 0.22 + 0.10 * math.cos(t + 1.2)

    orb3_x = 82 + 10 * math.sin(t + 2.4)
    orb3_y = 35 + 12 * math.cos(t + 2.4)
    orb3_op = 0.24 + 0.12 * math.sin(t + 2.4)

    orb4_x = 32 + 15 * math.cos(t + 3.6)
    orb4_y = 75 + 10 * math.sin(t + 3.6)
    orb4_op = 0.20 + 0.09 * math.sin(t + 3.6)

    orb5_x = 76 + 12 * math.sin(t + 4.8)
    orb5_y = 78 + 8 * math.cos(t + 4.8)
    orb5_op = 0.20 + 0.09 * math.cos(t + 4.8)

    # Clean Picture Fade Transition:
    # Scene A: frames 0 to 18 (phase 0.0 to 0.45)
    # Fade A->B: frames 18 to 21 (phase 0.45 to 0.525) - dip through soft glowing light aura
    # Scene B: frames 21 to 37 (phase 0.525 to 0.925)
    # Fade B->A: frames 37 to 40 (phase 0.925 to 1.00)
    if phase < 0.44:
        opacity_a = 1.0
        opacity_b = 0.0
        glow_pulse = 0.0
    elif phase < 0.48:
        # Scene A fades out to 0
        prog = (phase - 0.44) / 0.04
        opacity_a = max(0.0, 1.0 - prog)
        opacity_b = 0.0
        glow_pulse = math.sin(prog * math.pi)
    elif phase < 0.52:
        # Scene B fades in from 0 to 1
        prog = (phase - 0.48) / 0.04
        opacity_a = 0.0
        opacity_b = min(1.0, prog)
        glow_pulse = math.sin((1.0 - prog) * math.pi)
    elif phase < 0.92:
        opacity_a = 0.0
        opacity_b = 1.0
        glow_pulse = 0.0
    elif phase < 0.96:
        # Scene B fades out to 0
        prog = (phase - 0.92) / 0.04
        opacity_a = 0.0
        opacity_b = max(0.0, 1.0 - prog)
        glow_pulse = math.sin(prog * math.pi)
    else:
        # Scene A fades in from 0 to 1
        prog = (phase - 0.96) / 0.04
        opacity_a = min(1.0, prog)
        opacity_b = 0.0
        glow_pulse = math.sin((1.0 - prog) * math.pi)

    # Scene A: Architecture 6-Tier animation wave
    # Local phase in Scene A: 0.0 to 1.0
    phase_a = (phase / 0.48) if phase < 0.48 else ((phase - 0.96) / 0.52)
    current_tier = (phase_a * 6.0) % 6.0
    
    tier_colors = [
        {"name": "cyan", "hex": "#38bdf8", "rgb": "56, 189, 248"},     # 0: Client
        {"name": "violet", "hex": "#c084fc", "rgb": "192, 132, 252"},  # 1: Security
        {"name": "indigo", "hex": "#818cf8", "rgb": "129, 140, 248"},  # 2: Routes
        {"name": "emerald", "hex": "#34d399", "rgb": "52, 211, 153"},  # 3: Services
        {"name": "amber", "hex": "#fbbf24", "rgb": "251, 191, 36"},   # 4: Repositories
        {"name": "rose", "hex": "#f472b6", "rgb": "244, 114, 182"}     # 5: PostgreSQL
    ]
    
    tier_styles = []
    for s in range(6):
        dist = abs(current_tier - s)
        if dist > 3.0:
            dist = 6.0 - dist
        intensity = max(0.0, 1.0 - (dist / 1.45)) ** 2
        c = tier_colors[s]
        border = f"rgba({c['rgb']}, {0.22 + 0.78 * intensity:.2f})"
        shadow = f"0 0 {int(12 + 28 * intensity)}px rgba({c['rgb']}, {0.12 + 0.45 * intensity:.2f})"
        scale = 1.0 + 0.015 * intensity
        header_glow = f"color: {c['hex']}; text-shadow: 0 0 {int(15 * intensity)}px rgba({c['rgb']}, {intensity:.2f});"
        badge_bg = f"background: rgba({c['rgb']}, {0.25 + 0.50 * intensity:.2f}); border: 1px solid {c['hex']}; color: #ffffff;"
        tier_styles.append({
            "border": border,
            "shadow": shadow,
            "scale": scale,
            "header_glow": header_glow,
            "badge_bg": badge_bg,
            "intensity": intensity
        })

    # Connector beam highlight between adjacent tiers
    connector_beams = []
    for s in range(5):
        beam_dist = (current_tier - s) % 6.0
        if 0.0 <= beam_dist <= 1.2:
            beam_glow = max(0.0, 1.0 - abs(beam_dist - 0.5) / 0.7)
        else:
            beam_glow = 0.0
        connector_beams.append(beam_glow)

    # Scene B: Relational schema & live API execution
    # Local phase in Scene B: 0.0 to 1.0
    if 0.48 <= phase <= 0.96:
        phase_b = (phase - 0.48) / 0.48
    else:
        phase_b = 0.0
    
    b_focus = (phase_b * 5.0) % 5.0
    b_cards = [
        {"name": "users", "hex": "#38bdf8", "rgb": "56, 189, 248"},
        {"name": "projects", "hex": "#c084fc", "rgb": "192, 132, 252"},
        {"name": "issues", "hex": "#34d399", "rgb": "52, 211, 153"},
        {"name": "comments", "hex": "#f472b6", "rgb": "244, 114, 182"},
        {"name": "api", "hex": "#fbbf24", "rgb": "251, 191, 36"}
    ]
    b_styles = []
    for s in range(5):
        dist = abs(b_focus - s)
        if dist > 2.5:
            dist = 5.0 - dist
        intensity = max(0.0, 1.0 - (dist / 1.35)) ** 2
        c = b_cards[s]
        border = f"rgba({c['rgb']}, {0.25 + 0.75 * intensity:.2f})"
        shadow = f"0 0 {int(12 + 26 * intensity)}px rgba({c['rgb']}, {0.12 + 0.45 * intensity:.2f})"
        scale = 1.0 + 0.012 * intensity
        header_glow = f"color: {c['hex']}; text-shadow: 0 0 {int(14 * intensity)}px rgba({c['rgb']}, {intensity:.2f});"
        b_styles.append({
            "border": border,
            "shadow": shadow,
            "scale": scale,
            "header_glow": header_glow,
            "intensity": intensity
        })

    progress_pct = phase * 100

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background: #06080e;
    color: #e2e8f0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
    width: 1280px;
    height: 700px;
    overflow: hidden;
    position: relative;
    padding: 22px 28px;
    display: flex;
    flex-direction: column;
  }}

  /* Luminous Ambient Light Orbs with soft breathing fades */
  .ambient-lights {{
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(circle at {orb1_x}% {orb1_y}%, rgba(56, 189, 248, {orb1_op:.2f}) 0%, transparent 42%),
      radial-gradient(circle at {orb2_x}% {orb2_y}%, rgba(192, 132, 252, {orb2_op:.2f}) 0%, transparent 40%),
      radial-gradient(circle at {orb3_x}% {orb3_y}%, rgba(52, 211, 153, {orb3_op:.2f}) 0%, transparent 42%),
      radial-gradient(circle at {orb4_x}% {orb4_y}%, rgba(244, 114, 182, {orb4_op:.2f}) 0%, transparent 45%),
      radial-gradient(circle at {orb5_x}% {orb5_y}%, rgba(251, 191, 36, {orb5_op:.2f}) 0%, transparent 38%);
  }}

  /* Soft Picture Border Vignette Fade */
  .picture-vignette {{
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    z-index: 1;
    box-shadow: inset 0 0 60px rgba(6, 8, 14, 0.9);
  }}

  /* Flash glow pulse during picture fade transition */
  .fade-bloom {{
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    z-index: 4;
    background: radial-gradient(circle at 50% 50%, rgba(192, 132, 252, {0.35 * glow_pulse:.2f}) 0%, rgba(56, 189, 248, {0.25 * glow_pulse:.2f}) 40%, transparent 70%);
  }}

  /* Header Branding */
  .header {{
    position: relative;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 12px;
    margin-bottom: 14px;
  }}
  .brand-area {{
    display: flex;
    align-items: center;
    gap: 12px;
  }}
  .logo-box {{
    width: 36px;
    height: 36px;
    border-radius: 9px;
    background: linear-gradient(135deg, #38bdf8, #a855f7);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 19px;
    color: #030712;
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.6);
  }}
  .title-group h1 {{
    font-size: 21px;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 10px;
  }}
  .scene-pill {{
    font-size: 10px;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 9999px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
  }}
  .pill-a {{
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.4);
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.25);
  }}
  .pill-b {{
    background: rgba(192, 132, 252, 0.15);
    color: #c084fc;
    border: 1px solid rgba(192, 132, 252, 0.4);
    box-shadow: 0 0 10px rgba(192, 132, 252, 0.25);
  }}
  .live-dot {{
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 4px;
  }}
  .title-group p {{
    font-size: 12px;
    color: #94a3b8;
    margin-top: 2px;
  }}
  .badges-group {{
    display: flex;
    gap: 8px;
    align-items: center;
  }}
  .badge {{
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
  }}
  .badge-success {{
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(52, 211, 153, 0.4);
    color: #34d399;
    box-shadow: 0 0 12px rgba(52, 211, 153, 0.25);
    font-weight: 600;
  }}

  /* Viewport for Scenes */
  .scenes-viewport {{
    position: relative;
    flex: 1;
    z-index: 5;
  }}

  /* Scene Container with Fading */
  .scene-container {{
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
  }}

  /* SCENE A: Architecture 6-Tier Grid */
  .arch-grid {{
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
    height: 100%;
  }}
  .tier-card {{
    background: rgba(15, 23, 42, 0.94);
    border-radius: 10px;
    padding: 13px 11px;
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(10px);
    position: relative;
    transition: transform 0.1s ease;
  }}
  .tier-header {{
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 8px;
    margin-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }}
  .tier-num {{
    width: 22px;
    height: 22px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 800;
  }}
  .tier-titles h3 {{
    font-size: 13px;
    font-weight: 700;
    line-height: 1.1;
  }}
  .tier-titles span {{
    font-size: 9px;
    color: #64748b;
    font-family: ui-monospace, monospace;
  }}
  .tier-boxes {{
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }}
  .card-item {{
    background: rgba(30, 41, 59, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 6px;
    padding: 7px 8px;
  }}
  .card-title {{
    font-size: 11px;
    font-weight: 600;
    color: #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .card-pill {{
    font-size: 8.5px;
    font-family: ui-monospace, monospace;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 3px;
  }}
  .card-desc {{
    font-size: 9.5px;
    color: #94a3b8;
    margin-top: 3px;
    line-height: 1.3;
  }}
  .code-tag {{
    font-family: ui-monospace, monospace;
    font-size: 9px;
    background: rgba(0, 0, 0, 0.45);
    padding: 2px 5px;
    border-radius: 3px;
    color: #cbd5e1;
    margin-top: 3px;
    display: inline-block;
  }}

  /* Dynamic connector indicator dot between cards */
  .connector-dot {{
    position: absolute;
    right: -8px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    z-index: 6;
  }}

  /* SCENE B: Database Schema & API Verification View */
  .scene-b-layout {{
    display: grid;
    grid-template-columns: 2.1fr 1.9fr;
    gap: 16px;
    height: 100%;
  }}
  .er-col {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }}
  .entity-card {{
    background: rgba(15, 23, 42, 0.94);
    border-radius: 9px;
    padding: 11px 12px;
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
  }}
  .entity-header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 6px;
    margin-bottom: 7px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }}
  .entity-header h4 {{
    font-size: 13px;
    font-weight: 700;
    font-family: ui-monospace, monospace;
  }}
  .entity-badge {{
    font-size: 9px;
    font-family: ui-monospace, monospace;
    padding: 1px 5px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.07);
    color: #94a3b8;
  }}
  .col-list {{
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-family: ui-monospace, monospace;
    font-size: 9.5px;
  }}
  .col-row {{
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
    border-bottom: 1px dotted rgba(255, 255, 255, 0.05);
  }}
  .pk {{ color: #fbbf24; font-weight: 700; }}
  .fk {{ color: #38bdf8; }}
  .field-name {{ color: #cbd5e1; }}
  .field-type {{ color: #64748b; }}

  /* Right column in Scene B */
  .api-demo-col {{
    display: flex;
    flex-direction: column;
    gap: 12px;
  }}
  .api-card {{
    background: rgba(15, 23, 42, 0.94);
    border-radius: 9px;
    padding: 12px 14px;
    backdrop-filter: blur(10px);
    flex: 1;
    display: flex;
    flex-direction: column;
  }}
  .api-card-header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }}
  .api-card-title {{
    font-size: 13px;
    font-weight: 700;
  }}
  .req-box {{
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 5px;
    padding: 8px 10px;
    font-family: ui-monospace, monospace;
    font-size: 10px;
    color: #cbd5e1;
    margin-bottom: 8px;
    line-height: 1.4;
  }}
  .resp-box {{
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 5px;
    padding: 8px 10px;
    font-family: ui-monospace, monospace;
    font-size: 9.5px;
    color: #34d399;
    flex: 1;
    line-height: 1.35;
  }}

  .test-status-card {{
    background: rgba(15, 23, 42, 0.94);
    border: 1px solid rgba(52, 211, 153, 0.35);
    box-shadow: 0 0 18px rgba(52, 211, 153, 0.15);
    border-radius: 8px;
    padding: 10px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .test-title {{
    font-size: 12px;
    font-weight: 700;
    color: #f8fafc;
  }}
  .test-sub {{
    font-size: 10px;
    color: #94a3b8;
  }}
  .test-stat-pill {{
    background: rgba(52, 211, 153, 0.2);
    border: 1px solid #34d399;
    color: #34d399;
    font-weight: 800;
    font-family: ui-monospace, monospace;
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 6px;
  }}

  /* Footer Execution Bar */
  .footer-bar {{
    position: relative;
    z-index: 10;
    margin-top: 12px;
    background: rgba(15, 23, 42, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 7px;
    padding: 8px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: #94a3b8;
  }}
  .pulse-track {{
    width: 280px;
    height: 4px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 2px;
    position: relative;
    overflow: hidden;
  }}
  .pulse-thumb {{
    position: absolute;
    top: 0;
    left: {progress_pct}%;
    width: 50px;
    height: 100%;
    background: linear-gradient(90deg, transparent, #38bdf8, #c084fc, #34d399, transparent);
    border-radius: 2px;
  }}
</style>
</head>
<body>

<div class="ambient-lights"></div>
<div class="picture-vignette"></div>
<div class="fade-bloom"></div>

<div class="header">
  <div class="brand-area">
    <div class="logo-box">DF</div>
    <div class="title-group">
      <h1>
        DevFlow System Showcase
        {"<span class='scene-pill pill-a'><span class='live-dot' style='background: #38bdf8;'></span> Tiered Architecture Pipeline</span>" if opacity_a >= 0.5 else "<span class='scene-pill pill-b'><span class='live-dot' style='background: #c084fc;'></span> Relational Schema & Verification</span>"}
      </h1>
      <p>High-reliability Node.js / Express 5 issue management engine &bull; PostgreSQL 16 &bull; JWT Authentication</p>
    </div>
  </div>
  <div class="badges-group">
    <div class="badge">Node.js 22 + Express 5</div>
    <div class="badge">pg.Pool (max 20)</div>
    <div class="badge badge-success">&#10003; 62 / 62 Tests Passing</div>
  </div>
</div>

<div class="scenes-viewport">

  <!-- SCENE A: Architecture Request Pipeline -->
  <div class="scene-container" style="opacity: {opacity_a:.3f}; display: {'flex' if opacity_a > 0.01 else 'none'};">
    <div class="arch-grid" style="width: 100%;">

      <!-- 1. Client -->
      <div class="tier-card" style="border: 1px solid {tier_styles[0]['border']}; box-shadow: {tier_styles[0]['shadow']}; transform: scale({tier_styles[0]['scale']});">
        <div class="tier-header">
          <div class="tier-num" style="{tier_styles[0]['badge_bg']}">1</div>
          <div class="tier-titles">
            <h3 style="{tier_styles[0]['header_glow']}">Client / Entry</h3>
            <span>HTTP / REST</span>
          </div>
        </div>
        <div class="tier-boxes">
          <div class="card-item">
            <div class="card-title">REST Consumer</div>
            <div class="card-desc">SPA, CLI & cURL clients with JSON bodies & Bearer tokens.</div>
          </div>
          <div class="card-item">
            <div class="card-title">Server Port</div>
            <div class="card-desc">Express 5 HTTP instance bound on PORT (default 3000).</div>
          </div>
          <div class="card-item">
            <div class="card-title">Req Logger</div>
            <div class="code-tag">ENABLE_REQUEST_LOGGING</div>
          </div>
        </div>
        <div class="connector-dot" style="background: rgba(56, 189, 248, {0.3 + 0.7 * connector_beams[0]:.2f}); box-shadow: 0 0 {int(10 * connector_beams[0])}px #38bdf8;"></div>
      </div>

      <!-- 2. Security Guards -->
      <div class="tier-card" style="border: 1px solid {tier_styles[1]['border']}; box-shadow: {tier_styles[1]['shadow']}; transform: scale({tier_styles[1]['scale']});">
        <div class="tier-header">
          <div class="tier-num" style="{tier_styles[1]['badge_bg']}">2</div>
          <div class="tier-titles">
            <h3 style="{tier_styles[1]['header_glow']}">Security Guards</h3>
            <span>src/middleware/</span>
          </div>
        </div>
        <div class="tier-boxes">
          <div class="card-item">
            <div class="card-title">Rate Limiter <span class="card-pill" style="background:#581c87; color:#e9d5ff;">429</span></div>
            <div class="card-desc">Sliding window: 5 attempts/15m with Retry-After header.</div>
          </div>
          <div class="card-item">
            <div class="card-title">JWT Auth <span class="card-pill" style="background:#1e3a8a; color:#bfdbfe;">401</span></div>
            <div class="card-desc">Fail-fast production validation on JWT_SECRET.</div>
          </div>
          <div class="card-item">
            <div class="card-title">Zod Validator <span class="card-pill" style="background:#78350f; color:#fde68a;">400</span></div>
            <div class="card-desc">Strict type checking & payload validation.</div>
          </div>
        </div>
        <div class="connector-dot" style="background: rgba(192, 132, 252, {0.3 + 0.7 * connector_beams[1]:.2f}); box-shadow: 0 0 {int(10 * connector_beams[1])}px #c084fc;"></div>
      </div>

      <!-- 3. Routing Tier -->
      <div class="tier-card" style="border: 1px solid {tier_styles[2]['border']}; box-shadow: {tier_styles[2]['shadow']}; transform: scale({tier_styles[2]['scale']});">
        <div class="tier-header">
          <div class="tier-num" style="{tier_styles[2]['badge_bg']}">3</div>
          <div class="tier-titles">
            <h3 style="{tier_styles[2]['header_glow']}">Express Routes</h3>
            <span>src/routes/</span>
          </div>
        </div>
        <div class="tier-boxes">
          <div class="card-item">
            <div class="card-title">/auth</div>
            <div class="code-tag">/register, /login, /me</div>
          </div>
          <div class="card-item">
            <div class="card-title">/projects</div>
            <div class="code-tag">CRUD + owner RBAC</div>
          </div>
          <div class="card-item">
            <div class="card-title">/issues</div>
            <div class="code-tag">Search, Sort, Pagination</div>
          </div>
          <div class="card-item">
            <div class="card-title">/comments</div>
            <div class="code-tag">Discussion threads</div>
          </div>
        </div>
        <div class="connector-dot" style="background: rgba(129, 140, 248, {0.3 + 0.7 * connector_beams[2]:.2f}); box-shadow: 0 0 {int(10 * connector_beams[2])}px #818cf8;"></div>
      </div>

      <!-- 4. Domain Services -->
      <div class="tier-card" style="border: 1px solid {tier_styles[3]['border']}; box-shadow: {tier_styles[3]['shadow']}; transform: scale({tier_styles[3]['scale']});">
        <div class="tier-header">
          <div class="tier-num" style="{tier_styles[3]['badge_bg']}">4</div>
          <div class="tier-titles">
            <h3 style="{tier_styles[3]['header_glow']}">Domain Services</h3>
            <span>src/services/</span>
          </div>
        </div>
        <div class="tier-boxes">
          <div class="card-item">
            <div class="card-title">auth.service</div>
            <div class="card-desc">Bcrypt 10 rounds, forces 'member' role, signs JWT.</div>
          </div>
          <div class="card-item">
            <div class="card-title">project.service</div>
            <div class="card-desc">Normalized key uniqueness, owner check on edit/delete.</div>
          </div>
          <div class="card-item">
            <div class="card-title">issue.service</div>
            <div class="card-desc">Creator/Owner/Admin authorization for status updates.</div>
          </div>
        </div>
        <div class="connector-dot" style="background: rgba(52, 211, 153, {0.3 + 0.7 * connector_beams[3]:.2f}); box-shadow: 0 0 {int(10 * connector_beams[3])}px #34d399;"></div>
      </div>

      <!-- 5. Repositories -->
      <div class="tier-card" style="border: 1px solid {tier_styles[4]['border']}; box-shadow: {tier_styles[4]['shadow']}; transform: scale({tier_styles[4]['scale']});">
        <div class="tier-header">
          <div class="tier-num" style="{tier_styles[4]['badge_bg']}">5</div>
          <div class="tier-titles">
            <h3 style="{tier_styles[4]['header_glow']}">Data Access</h3>
            <span>src/repositories/</span>
          </div>
        </div>
        <div class="tier-boxes">
          <div class="card-item">
            <div class="card-title">Parameterized SQL</div>
            <div class="card-desc">Guards against SQL injection across all query paths.</div>
          </div>
          <div class="card-item">
            <div class="card-title">Dynamic Filters</div>
            <div class="card-desc">ILIKE text search + status & priority filters.</div>
          </div>
          <div class="card-item">
            <div class="card-title">Deterministic Sort</div>
            <div class="code-tag">ORDER BY ..., i.id ASC</div>
          </div>
        </div>
        <div class="connector-dot" style="background: rgba(251, 191, 36, {0.3 + 0.7 * connector_beams[4]:.2f}); box-shadow: 0 0 {int(10 * connector_beams[4])}px #fbbf24;"></div>
      </div>

      <!-- 6. PostgreSQL -->
      <div class="tier-card" style="border: 1px solid {tier_styles[5]['border']}; box-shadow: {tier_styles[5]['shadow']}; transform: scale({tier_styles[5]['scale']});">
        <div class="tier-header">
          <div class="tier-num" style="{tier_styles[5]['badge_bg']}">6</div>
          <div class="tier-titles">
            <h3 style="{tier_styles[5]['header_glow']}">PostgreSQL 16</h3>
            <span>src/config/db.js</span>
          </div>
        </div>
        <div class="tier-boxes">
          <div class="card-item">
            <div class="card-title">pg.Pool Pooler</div>
            <div class="card-desc">max: 20 | idle: 30s | timeout: 5s</div>
          </div>
          <div class="card-item">
            <div class="card-title">4 Relational Tables</div>
            <div class="card-desc">CASCADE & SET NULL referential actions.</div>
          </div>
          <div class="card-item">
            <div class="card-title">8 Indexes</div>
            <div class="card-desc">Email, key, status, priority, created_at, FKs.</div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- SCENE B: Database Schema & API Live Verification -->
  <div class="scene-container" style="opacity: {opacity_b:.3f}; display: {'grid' if opacity_b > 0.01 else 'none'}; width: 100%;">
    <div class="scene-b-layout" style="width: 100%;">

      <!-- Left: 4 Relational Schema Tables -->
      <div class="er-col">

        <!-- users -->
        <div class="entity-card" style="border: 1px solid {b_styles[0]['border']}; box-shadow: {b_styles[0]['shadow']}; transform: scale({b_styles[0]['scale']});">
          <div class="entity-header">
            <h4 style="{b_styles[0]['header_glow']}">users</h4>
            <span class="entity-badge">Table</span>
          </div>
          <div class="col-list">
            <div class="col-row"><span class="pk">id &bull; PK</span> <span class="field-type">SERIAL</span></div>
            <div class="col-row"><span class="field-name">name</span> <span class="field-type">VARCHAR(100)</span></div>
            <div class="col-row"><span class="field-name">email &bull; UQ</span> <span class="field-type">VARCHAR(255)</span></div>
            <div class="col-row"><span class="field-name">password_hash</span> <span class="field-type">VARCHAR(255)</span></div>
            <div class="col-row"><span class="field-name">role</span> <span class="field-type">admin | member</span></div>
            <div class="col-row"><span class="field-name">created_at</span> <span class="field-type">TIMESTAMP</span></div>
          </div>
        </div>

        <!-- projects -->
        <div class="entity-card" style="border: 1px solid {b_styles[1]['border']}; box-shadow: {b_styles[1]['shadow']}; transform: scale({b_styles[1]['scale']});">
          <div class="entity-header">
            <h4 style="{b_styles[1]['header_glow']}">projects</h4>
            <span class="entity-badge">Table</span>
          </div>
          <div class="col-list">
            <div class="col-row"><span class="pk">id &bull; PK</span> <span class="field-type">SERIAL</span></div>
            <div class="col-row"><span class="field-name">name</span> <span class="field-type">VARCHAR(100)</span></div>
            <div class="col-row"><span class="field-name">key &bull; UQ</span> <span class="field-type">VARCHAR(10)</span></div>
            <div class="col-row"><span class="field-name">description</span> <span class="field-type">TEXT</span></div>
            <div class="col-row"><span class="fk">owner_id &bull; FK</span> <span class="field-type">&rarr; users (CASCADE)</span></div>
            <div class="col-row"><span class="field-name">created_at</span> <span class="field-type">TIMESTAMP</span></div>
          </div>
        </div>

        <!-- issues -->
        <div class="entity-card" style="border: 1px solid {b_styles[2]['border']}; box-shadow: {b_styles[2]['shadow']}; transform: scale({b_styles[2]['scale']});">
          <div class="entity-header">
            <h4 style="{b_styles[2]['header_glow']}">issues</h4>
            <span class="entity-badge">Table</span>
          </div>
          <div class="col-list">
            <div class="col-row"><span class="pk">id &bull; PK</span> <span class="field-type">SERIAL</span></div>
            <div class="col-row"><span class="field-name">title</span> <span class="field-type">VARCHAR(200)</span></div>
            <div class="col-row"><span class="field-name">status</span> <span class="field-type">open | in_prog | resolved</span></div>
            <div class="col-row"><span class="field-name">priority</span> <span class="field-type">low | med | high | urg</span></div>
            <div class="col-row"><span class="fk">project_id &bull; FK</span> <span class="field-type">&rarr; projects (CASCADE)</span></div>
            <div class="col-row"><span class="fk">created_by &bull; FK</span> <span class="field-type">&rarr; users (CASCADE)</span></div>
            <div class="col-row"><span class="fk">assigned_to &bull; FK</span> <span class="field-type">&rarr; users (SET NULL)</span></div>
          </div>
        </div>

        <!-- comments -->
        <div class="entity-card" style="border: 1px solid {b_styles[3]['border']}; box-shadow: {b_styles[3]['shadow']}; transform: scale({b_styles[3]['scale']});">
          <div class="entity-header">
            <h4 style="{b_styles[3]['header_glow']}">comments</h4>
            <span class="entity-badge">Table</span>
          </div>
          <div class="col-list">
            <div class="col-row"><span class="pk">id &bull; PK</span> <span class="field-type">SERIAL</span></div>
            <div class="col-row"><span class="field-name">content</span> <span class="field-type">TEXT</span></div>
            <div class="col-row"><span class="fk">issue_id &bull; FK</span> <span class="field-type">&rarr; issues (CASCADE)</span></div>
            <div class="col-row"><span class="fk">author_id &bull; FK</span> <span class="field-type">&rarr; users (CASCADE)</span></div>
            <div class="col-row"><span class="field-name">created_at</span> <span class="field-type">TIMESTAMP</span></div>
          </div>
        </div>

      </div>

      <!-- Right: Live API Demo & Test Results -->
      <div class="api-demo-col">
        <div class="api-card" style="border: 1px solid {b_styles[4]['border']}; box-shadow: {b_styles[4]['shadow']}; transform: scale({b_styles[4]['scale']});">
          <div class="api-card-header">
            <div class="api-card-title" style="{b_styles[4]['header_glow']}">Live API Execution Pattern</div>
            <span class="entity-badge">Verified Endpoints</span>
          </div>
          <div class="req-box">
            <span style="color:#38bdf8; font-weight:700;">POST</span> /api/auth/login HTTP/1.1<br>
            <span style="color:#64748b;">Host: localhost:3000 &bull; Content-Type: application/json</span><br>
            {{"\"email\": \"lead@devflow.local\", \"password\": \"CorrectSecret123!\""}}
          </div>
          <div class="resp-box">
            <span style="color:#34d399; font-weight:700;">HTTP/1.1 200 OK</span><br>
            {{<br>
            &nbsp;&nbsp;"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",<br>
            &nbsp;&nbsp;"user": {{ "id": 1, "name": "Aditya Lead", "role": "admin" }}<br>
            }}
          </div>
        </div>

        <div class="test-status-card">
          <div>
            <div class="test-title">&#10004; Automated Integration Test Suite Verified</div>
            <div class="test-sub">Auth, Projects, Issues, Comments, Pagination, & Security Hardening</div>
          </div>
          <div class="test-stat-stat">
            <span class="test-stat-pill">62 / 62 PASS</span>
          </div>
        </div>
      </div>

    </div>
  </div>

</div>

<div class="footer-bar">
  <div style="display: flex; align-items: center; gap: 10px;">
    <span>System Pipeline Wave:</span>
    <div class="pulse-track"><div class="pulse-thumb"></div></div>
  </div>
  <div>
    🛡️ Centralized Error Handler &bull; 10s Bounded Graceful Shutdown &bull; SQL Injection Guarded
  </div>
</div>

</body>
</html>
"""
    return html

def main():
    print("=== Generating High-Quality Animated DevFlow Documentation Images ===")
    start_time = time.time()
    
    # Generate devflow-hero-animated.gif
    temp_dir = tempfile.mkdtemp(prefix="devflow_hero_")
    frame_paths = []
    
    print(f"1. Rendering {TOTAL_FRAMES} frames for devflow-hero-animated.gif...")
    for i in range(TOTAL_FRAMES):
        html_content = get_hero_frame_html(i, TOTAL_FRAMES)
        html_file = os.path.join(temp_dir, f"frame_{i:03d}.html")
        png_file = os.path.join(temp_dir, f"frame_{i:03d}.png")
        
        with open(html_file, "w", encoding="utf-8") as f:
            f.write(html_content)
            
        cmd = [
            CHROME_EXE,
            "--headless=new",
            "--disable-gpu",
            "--window-size=1280,700",
            f"--screenshot={png_file}",
            html_file
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        frame_paths.append(png_file)
        print(f"   [Frame {i+1}/{TOTAL_FRAMES}] rendered", end="\r")

    print("\n2. Compiling devflow-hero-animated.gif with Pillow...")
    images = []
    for p in frame_paths:
        img = Image.open(p).convert("RGB")
        # Quantize to adaptive 256-color palette
        img_quant = img.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
        images.append(img_quant)
        
    hero_gif = os.path.join("docs", "images", "devflow-hero-animated.gif")
    images[0].save(
        hero_gif,
        save_all=True,
        append_images=images[1:],
        duration=FRAME_DURATION,
        loop=0,
        optimize=True
    )
    
    gif_size = os.path.getsize(hero_gif)
    print(f"   Saved {hero_gif} ({gif_size / (1024*1024):.2f} MB)")
    
    # Clean up temp frames
    for f in os.listdir(temp_dir):
        os.remove(os.path.join(temp_dir, f))
    os.rmdir(temp_dir)
    
    print(f"=== Completed in {time.time() - start_time:.2f}s! ===")

if __name__ == "__main__":
    main()
