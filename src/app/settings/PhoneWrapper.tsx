"use client";

import React from "react";

export function PhoneWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .phone-wrapper-outer {
          width: 100%;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        }
        .phone-wrapper-inner {
          width: 100%;
          max-width: 430px;
          height: 100%;
          max-height: 900px;
          border-radius: 40px;
          overflow: hidden;
          position: relative;
          background: var(--bg);
          transition: background 240ms var(--ease);
          box-shadow: 0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08);
        }
        @media (max-width: 500px) {
          .phone-wrapper-outer {
            height: 100%;
            display: block;
            background: none;
          }
          .phone-wrapper-inner {
            max-width: 100%;
            max-height: 100%;
            border-radius: 0;
            box-shadow: none;
          }
        }
      `}} />
      <div className="phone-wrapper-outer">
        <div className="phone-wrapper-inner">
          <div style={{ width: "100%", height: "100%", overflow: "auto" }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
