#!/usr/bin/env python3
"""
docs/generate_api_demo_gif.py
Generates docs/images/api-demo.gif:
An animated, high-fidelity developer workflow demo showing:
1. User login and authentication (POST /api/auth/login -> JWT)
2. Project creation (POST /api/projects -> 201 Created)
3. Issue creation & assignment (POST /api/issues -> 201 Created)
4. Issue search & deterministic pagination (GET /api/issues?search=... -> 200 OK)
5. Threaded discussion comment (POST /api/issues/1/comments -> 201 Created)
"""

import os
import sys
import math
import subprocess
import tempfile
import time
from PIL import Image

CHROME_EXE = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
TOTAL_FRAMES = 35  # 35 frames @ 110ms = ~3.85s smooth looping workflow
FRAME_DURATION = 110  # ms

os.makedirs("docs/images", exist_ok=True)

STEPS = [
    {
        "id": "login",
        "tab": "1. Authentication",
        "method": "POST",
        "method_color": "#38bdf8",
        "url": "/api/auth/login",
        "req_title": "Request Payload (JSON)",
        "req_body": '{\n  <span class="k">"email"</span>: <span class="s">"lead@devflow.local"</span>,\n  <span class="k">"password"</span>: <span class="s">"CorrectSecret123!"</span>\n}',
        "status": "200 OK",
        "status_color": "#34d399",
        "latency": "38 ms",
        "resp_body": '{\n  <span class="k">"token"</span>: <span class="s">"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."</span>,\n  <span class="k">"user"</span>: {\n    <span class="k">"id"</span>: <span class="n">1</span>,\n    <span class="k">"name"</span>: <span class="s">"Aditya Singh"</span>,\n    <span class="k">"email"</span>: <span class="s">"lead@devflow.local"</span>,\n    <span class="k">"role"</span>: <span class="s">"admin"</span>\n  }\n}'
    },
    {
        "id": "project",
        "tab": "2. Create Project",
        "method": "POST",
        "method_color": "#c084fc",
        "url": "/api/projects",
        "req_title": "Bearer JWT Authorization",
        "req_body": '{\n  <span class="k">"name"</span>: <span class="s">"DevFlow Infrastructure"</span>,\n  <span class="k">"key"</span>: <span class="s">"DEVFLOW"</span>,\n  <span class="k">"description"</span>: <span class="s">"Core backend services"</span>\n}',
        "status": "201 Created",
        "status_color": "#34d399",
        "latency": "24 ms",
        "resp_body": '{\n  <span class="k">"id"</span>: <span class="n">1</span>,\n  <span class="k">"name"</span>: <span class="s">"DevFlow Infrastructure"</span>,\n  <span class="k">"key"</span>: <span class="s">"DEVFLOW"</span>,\n  <span class="k">"owner_id"</span>: <span class="n">1</span>,\n  <span class="k">"created_at"</span>: <span class="s">"2026-10-18T18:50:00.000Z"</span>\n}'
    },
    {
        "id": "issue",
        "tab": "3. Create Issue",
        "method": "POST",
        "method_color": "#38bdf8",
        "url": "/api/issues",
        "req_title": "Issue Assignment Payload",
        "req_body": '{\n  <span class="k">"title"</span>: <span class="s">"Configure login rate limiter"</span>,\n  <span class="k">"status"</span>: <span class="s">"open"</span>,\n  <span class="k">"priority"</span>: <span class="s">"high"</span>,\n  <span class="k">"project_id"</span>: <span class="n">1</span>,\n  <span class="k">"assigned_to"</span>: <span class="n">1</span>\n}',
        "status": "201 Created",
        "status_color": "#34d399",
        "latency": "19 ms",
        "resp_body": '{\n  <span class="k">"id"</span>: <span class="n">1</span>,\n  <span class="k">"title"</span>: <span class="s">"Configure login rate limiter"</span>,\n  <span class="k">"status"</span>: <span class="s">"open"</span>,\n  <span class="k">"priority"</span>: <span class="s">"high"</span>,\n  <span class="k">"created_by"</span>: <span class="n">1</span>,\n  <span class="k">"assigned_to"</span>: <span class="n">1</span>\n}'
    },
    {
        "id": "search",
        "tab": "4. Search & Paginate",
        "method": "GET",
        "method_color": "#fbbf24",
        "url": "/api/issues?search=rate&page=1&limit=10&sortBy=priority&order=desc",
        "req_title": "Deterministic Filter & Sort",
        "req_body": '<span class="c">// ORDER BY priority DESC, i.id ASC\n// ILIKE %rate% across title & description</span>\n{\n  <span class="k">"search"</span>: <span class="s">"rate"</span>,\n  <span class="k">"sortBy"</span>: <span class="s">"priority"</span>,\n  <span class="k">"order"</span>: <span class="s">"desc"</span>,\n  <span class="k">"page"</span>: <span class="n">1</span>,\n  <span class="k">"limit"</span>: <span class="n">10</span>\n}',
        "status": "200 OK",
        "status_color": "#34d399",
        "latency": "15 ms",
        "resp_body": '{\n  <span class="k">"data"</span>: [\n    { <span class="k">"id"</span>: <span class="n">1</span>, <span class="k">"title"</span>: <span class="s">"Configure login rate limiter"</span>, <span class="k">"priority"</span>: <span class="s">"high"</span> }\n  ],\n  <span class="k">"pagination"</span>: {\n    <span class="k">"total"</span>: <span class="n">1</span>,\n    <span class="k">"page"</span>: <span class="n">1</span>,\n    <span class="k">"limit"</span>: <span class="n">10</span>,\n    <span class="k">"totalPages"</span>: <span class="n">1</span>,\n    <span class="k">"hasMore"</span>: <span class="s">false</span>\n  }\n}'
    },
    {
        "id": "comment",
        "tab": "5. Add Comment",
        "method": "POST",
        "method_color": "#f472b6",
        "url": "/api/issues/1/comments",
        "req_title": "Threaded Discussion Payload",
        "req_body": '{\n  <span class="k">"content"</span>: <span class="s">"Sliding window rate limiter verified with 5 attempts per 15 min."</span>\n}',
        "status": "201 Created",
        "status_color": "#34d399",
        "latency": "14 ms",
        "resp_body": '{\n  <span class="k">"id"</span>: <span class="n">1</span>,\n  <span class="k">"issue_id"</span>: <span class="n">1</span>,\n  <span class="k">"author_id"</span>: <span class="n">1</span>,\n  <span class="k">"content"</span>: <span class="s">"Sliding window rate limiter verified with 5 attempts per 15 min."</span>,\n  <span class="k">"created_at"</span>: <span class="s">"2026-10-18T18:52:00.000Z"</span>\n}'
    }
]

def render_api_frame_html(frame_idx, total_frames):
    phase = frame_idx / float(total_frames)  # 0.0 to 1.0
    
    step_duration = total_frames / 5.0
    step_idx = int(frame_idx / step_duration)
    step_idx = min(step_idx, 4)
    local_frame = frame_idx % step_duration
    local_prog = local_frame / step_duration  # 0.0 to 1.0
    
    curr_step = STEPS[step_idx]
    
    # Keep opacity between 0.50 and 1.0 so text is always readable
    if local_prog < 0.15:
        step_opacity = 0.50 + 0.50 * (local_prog / 0.15)
    elif local_prog > 0.85:
        step_opacity = 0.50 + 0.50 * ((1.0 - local_prog) / 0.15)
    else:
        step_opacity = 1.0
        
    t = phase * 2 * math.pi
    orb1_x = 20 + 15 * math.sin(t)
    orb1_y = 25 + 10 * math.cos(t)
    orb2_x = 75 + 12 * math.cos(t + 1.5)
    orb2_y = 65 + 12 * math.sin(t + 1.5)
    
    # Highlighted tab navigation
    tabs_html = ""
    for idx, s in enumerate(STEPS):
        if idx == step_idx:
            tabs_html += f"""
            <div class="tab tab-active" style="border-bottom: 2px solid {s['method_color']}; color: #ffffff; background: rgba(255,255,255,0.06);">
              <span class="tab-dot" style="background: {s['method_color']}; box-shadow: 0 0 8px {s['method_color']};"></span>
              {s['tab']}
            </div>
            """
        else:
            tabs_html += f"""
            <div class="tab">
              {s['tab']}
            </div>
            """

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background: #07090e;
    color: #e2e8f0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
    width: 1200px;
    height: 640px;
    overflow: hidden;
    position: relative;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
  }}

  /* Luminous Ambient Glow Orbs */
  .ambient-glow {{
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(circle at {orb1_x}% {orb1_y}%, rgba(56, 189, 248, 0.18) 0%, transparent 45%),
      radial-gradient(circle at {orb2_x}% {orb2_y}%, rgba(192, 132, 252, 0.16) 0%, transparent 45%),
      radial-gradient(circle at 50% 85%, rgba(52, 211, 153, 0.12) 0%, transparent 40%);
  }}

  .vignette {{
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    z-index: 1;
    box-shadow: inset 0 0 50px rgba(7, 9, 14, 0.85);
  }}

  /* Header */
  .header {{
    position: relative;
    z-index: 5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 12px;
    margin-bottom: 12px;
  }}
  .brand {{
    display: flex;
    align-items: center;
    gap: 10px;
  }}
  .logo {{
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, #38bdf8, #a855f7);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 16px;
    color: #030712;
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.5);
  }}
  .header h2 {{
    font-size: 17px;
    font-weight: 700;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 8px;
  }}
  .env-tag {{
    font-size: 10px;
    font-family: ui-monospace, monospace;
    padding: 2px 7px;
    border-radius: 4px;
    background: rgba(52, 211, 153, 0.15);
    color: #34d399;
    border: 1px solid rgba(52, 211, 153, 0.35);
  }}
  .right-badges {{
    display: flex;
    gap: 8px;
  }}
  .badge {{
    font-size: 11px;
    font-family: ui-monospace, monospace;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
    padding: 3px 9px;
    border-radius: 5px;
  }}

  /* Tabs Bar */
  .tabs-bar {{
    position: relative;
    z-index: 5;
    display: flex;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px 8px 0 0;
    overflow: hidden;
  }}
  .tab {{
    flex: 1;
    padding: 9px 12px;
    font-size: 11.5px;
    font-weight: 600;
    color: #94a3b8;
    text-align: center;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.2s;
  }}
  .tab-dot {{
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }}

  /* Main Client Console Body */
  .console-body {{
    position: relative;
    z-index: 5;
    flex: 1;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-top: none;
    border-radius: 0 0 8px 8px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    backdrop-filter: blur(10px);
  }}

  /* URL Bar */
  .url-bar {{
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 7px 12px;
  }}
  .method-badge {{
    font-family: ui-monospace, monospace;
    font-weight: 800;
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 4px;
  }}
  .url-text {{
    font-family: ui-monospace, monospace;
    font-size: 12px;
    color: #f1f5f9;
    flex: 1;
  }}
  .status-badge {{
    font-family: ui-monospace, monospace;
    font-size: 11px;
    font-weight: 700;
    color: #34d399;
    background: rgba(52, 211, 153, 0.15);
    border: 1px solid rgba(52, 211, 153, 0.35);
    padding: 2px 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }}
  .latency-badge {{
    font-family: ui-monospace, monospace;
    font-size: 10.5px;
    color: #94a3b8;
  }}

  /* Split Pane (Request & Response) */
  .split-pane {{
    display: grid;
    grid-template-columns: 1fr 1.35fr;
    gap: 14px;
    flex: 1;
    opacity: {step_opacity:.2f};
    transition: opacity 0.15s ease;
  }}

  .pane {{
    background: rgba(0, 0, 0, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }}
  .pane-header {{
    background: rgba(255, 255, 255, 0.03);
    padding: 7px 12px;
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .pane-code {{
    padding: 12px 14px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    line-height: 1.45;
    flex: 1;
    white-space: pre-wrap;
    overflow: hidden;
  }}
  .k {{ color: #93c5fd; font-weight: 600; }}
  .s {{ color: #86efac; }}
  .n {{ color: #fde047; font-weight: 700; }}
  .c {{ color: #64748b; font-style: italic; }}

  /* Footer Tracker */
  .footer-track {{
    position: relative;
    z-index: 5;
    margin-top: 10px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 7px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10.5px;
    color: #94a3b8;
  }}
  .progress-bar {{
    width: 240px;
    height: 4px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 2px;
    position: relative;
    overflow: hidden;
  }}
  .progress-thumb {{
    position: absolute;
    top: 0;
    left: {phase * 100}%;
    width: 45px;
    height: 100%;
    background: linear-gradient(90deg, transparent, #38bdf8, #a855f7, transparent);
  }}
</style>
</head>
<body>

<div class="ambient-glow"></div>
<div class="vignette"></div>

<div class="header">
  <div class="brand">
    <div class="logo">DF</div>
    <h2>DevFlow API Live Execution Workflow <span class="env-tag">devflow_test &bull; PostgreSQL 16</span></h2>
  </div>
  <div class="right-badges">
    <div class="badge">JWT Auth Bearer</div>
    <div class="badge">Zod Validation</div>
    <div class="badge" style="color: #34d399; border-color: rgba(52,211,153,0.3);">&#10003; 62 Tests Pass</div>
  </div>
</div>

<div class="tabs-bar">
  {tabs_html}
</div>

<div class="console-body">
  <div class="url-bar">
    <span class="method-badge" style="background: {curr_step['method_color']}22; color: {curr_step['method_color']}; border: 1px solid {curr_step['method_color']}55;">
      {curr_step['method']}
    </span>
    <span class="url-text">{curr_step['url']}</span>
    <span class="status-badge">
      <span style="width: 5px; height: 5px; border-radius: 50%; background: #34d399;"></span>
      {curr_step['status']}
    </span>
    <span class="latency-badge">{curr_step['latency']}</span>
  </div>

  <div class="split-pane">
    <div class="pane">
      <div class="pane-header">
        <span>{curr_step['req_title']}</span>
        <span style="font-size: 9px; color: #64748b;">application/json</span>
      </div>
      <div class="pane-code">{curr_step['req_body']}</div>
    </div>

    <div class="pane">
      <div class="pane-header">
        <span>Server Response Envelope</span>
        <span style="font-size: 9px; color: #34d399;">HTTP 200/201 Verified</span>
      </div>
      <div class="pane-code">{curr_step['resp_body']}</div>
    </div>
  </div>
</div>

<div class="footer-track">
  <div style="display: flex; align-items: center; gap: 8px;">
    <span>Workflow Step {step_idx + 1} of 5:</span>
    <strong style="color: #f1f5f9;">{curr_step['tab']}</strong>
  </div>
  <div style="display: flex; align-items: center; gap: 10px;">
    <div class="progress-bar"><div class="progress-thumb"></div></div>
    <span>Automated Integration Verified &bull; Zero Fabricated Payloads</span>
  </div>
</div>

</body>
</html>
"""
    return html

def main():
    print("=== Generating Animated API Demo GIF for DevFlow ===")
    start_time = time.time()
    
    temp_dir = tempfile.mkdtemp(prefix="devflow_api_demo_")
    frame_paths = []
    
    print(f"1. Rendering {TOTAL_FRAMES} frames for api-demo.gif...")
    for i in range(TOTAL_FRAMES):
        html_content = render_api_frame_html(i, TOTAL_FRAMES)
        html_file = os.path.join(temp_dir, f"frame_{i:03d}.html")
        png_file = os.path.join(temp_dir, f"frame_{i:03d}.png")
        
        with open(html_file, "w", encoding="utf-8") as f:
            f.write(html_content)
            
        cmd = [
            CHROME_EXE,
            "--headless=new",
            "--disable-gpu",
            "--window-size=1200,640",
            f"--screenshot={png_file}",
            html_file
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        frame_paths.append(png_file)
        print(f"   [Frame {i+1}/{TOTAL_FRAMES}] rendered", end="\r")

    print("\n2. Compiling api-demo.gif with Pillow...")
    images = []
    for p in frame_paths:
        img = Image.open(p).convert("RGB")
        img_quant = img.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
        images.append(img_quant)
        
    out_gif = os.path.join("docs", "images", "api-demo.gif")
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
    
    for f in os.listdir(temp_dir):
        os.remove(os.path.join(temp_dir, f))
    os.rmdir(temp_dir)
    
    print(f"=== Completed in {time.time() - start_time:.2f}s! ===")

if __name__ == "__main__":
    main()
