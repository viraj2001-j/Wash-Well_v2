"use client";

import React from "react";

export function PurpleLogo() {
  return (
    <div
      className="
        flex
        h-[54px]
        w-[54px]
        items-center
        justify-center
        rounded-full
        bg-[#5420d8]
        shadow-[0_7px_18px_rgba(84,32,216,0.18)]
        shrink-0
      "
    >
      <svg
        width="32"
        height="27"
        viewBox="0 0 36 30"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 15.5C5 11.9 7.9 9 11.5 9H25"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M31 14.5C31 18.1 28.1 21 24.5 21H11"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M15 9C18.3 9 20.5 11.2 20.5 14.5C20.5 17.8 18.3 21 15 21"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function WashingMachine({ companyName }: { companyName?: string }) {
  const formattedBrand = companyName
    ? companyName.toUpperCase()
    : "WASH & WELL";

  return (
    <div className="absolute left-1/2 top-[39%] z-20 -translate-x-1/2 -translate-y-1/2">
      <div className="washing-machine">
        <div className="machine-body">
          <div className="machine-top">
            <div className="machine-brand truncate max-w-[120px]" title={formattedBrand}>
              {formattedBrand}
            </div>

            <div className="machine-controls">
              <div className="control-knob" />
              <div className="control-display">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>

          <div className="machine-door">
            <div className="door-ring">
              <div className="door-glass">
                <div className="washing-water">
                  <div className="water-wave wave-one" />
                  <div className="water-wave wave-two" />
                </div>

                <div className="clothes">
                  <span className="shirt shirt-one">👕</span>
                  <span className="shirt shirt-two">🧦</span>
                  <span className="shirt shirt-three">👚</span>
                </div>

                <div className="drum">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <div className="glass-reflection" />
              </div>
            </div>
          </div>

          <div className="machine-bottom">
            <div className="machine-status">
              <span className="status-light" />
              Washing
            </div>

            <div className="machine-progress">
              <span />
            </div>
          </div>
        </div>

        <div className="machine-glow" />
      </div>

      <style jsx>{`
        .washing-machine {
          position: relative;
          width: 235px;
          height: 275px;
          animation: machineFloat 4s ease-in-out infinite;
        }

        .machine-body {
          position: relative;
          z-index: 3;
          width: 235px;
          height: 275px;
          overflow: hidden;
          border-radius: 28px;
          border: 2px solid rgba(255, 255, 255, 0.32);
          background: linear-gradient(
            145deg,
            rgba(135, 76, 225, 0.96),
            rgba(48, 7, 125, 0.98)
          );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.35),
            inset 0 -20px 40px rgba(16, 0, 65, 0.35),
            0 30px 70px rgba(22, 0, 80, 0.5);
          backdrop-filter: blur(12px);
        }

        .machine-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 52px;
          padding: 0 17px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.08);
        }

        .machine-brand {
          color: white;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .machine-controls {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .control-knob {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.6);
          background: #5420d8;
          box-shadow: 0 0 8px rgba(219, 75, 255, 0.5);
        }

        .control-display {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 4px 6px;
          border-radius: 5px;
          background: rgba(10, 0, 40, 0.35);
        }

        .control-display span {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #f26aff;
          box-shadow: 0 0 5px #f26aff;
        }

        .machine-door {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 176px;
        }

        .door-ring {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 142px;
          height: 142px;
          border-radius: 50%;
          border: 8px solid rgba(255, 255, 255, 0.18);
          background: #190052;
          box-shadow:
            0 0 0 4px rgba(20, 0, 70, 0.45),
            0 0 35px rgba(202, 63, 255, 0.3),
            inset 0 0 25px rgba(0, 0, 0, 0.65);
        }

        .door-glass {
          position: relative;
          width: 118px;
          height: 118px;
          overflow: hidden;
          border-radius: 50%;
          background: radial-gradient(
            circle at 35% 28%,
            rgba(160, 76, 255, 0.7),
            rgba(25, 0, 70, 0.96) 68%
          );
          border: 2px solid rgba(255, 255, 255, 0.15);
        }

        .drum {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 92px;
          height: 92px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 2px dashed rgba(255, 255, 255, 0.22);
          animation: drumSpin 2.2s linear infinite;
        }

        .drum span {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.35);
        }

        .drum span:nth-child(1) {
          left: 15px;
          top: 22px;
        }

        .drum span:nth-child(2) {
          right: 18px;
          top: 18px;
        }

        .drum span:nth-child(3) {
          right: 8px;
          top: 53px;
        }

        .drum span:nth-child(4) {
          left: 19px;
          bottom: 16px;
        }

        .drum span:nth-child(5) {
          right: 27px;
          bottom: 10px;
        }

        .drum span:nth-child(6) {
          left: 7px;
          top: 52px;
        }

        .clothes {
          position: absolute;
          inset: 0;
          z-index: 4;
          animation: clothesSpin 2.2s linear infinite;
        }

        .shirt {
          position: absolute;
          display: block;
          font-size: 31px;
          filter: drop-shadow(
            0 3px 4px rgba(0, 0, 0, 0.35)
          );
        }

        .shirt-one {
          left: 30px;
          top: 35px;
        }

        .shirt-two {
          right: 25px;
          top: 57px;
          font-size: 27px;
        }

        .shirt-three {
          left: 47px;
          bottom: 17px;
          font-size: 27px;
        }

        .washing-water {
          position: absolute;
          z-index: 3;
          left: -15%;
          bottom: -5px;
          width: 130%;
          height: 43px;
          opacity: 0.55;
        }

        .water-wave {
          position: absolute;
          left: -10%;
          width: 120%;
          height: 25px;
          border-radius: 50%;
          background: rgba(137, 70, 255, 0.55);
        }

        .wave-one {
          bottom: 12px;
          animation: waveMove 2s ease-in-out infinite;
        }

        .wave-two {
          bottom: 2px;
          opacity: 0.5;
          animation: waveMove 1.5s ease-in-out infinite reverse;
        }

        .glass-reflection {
          position: absolute;
          z-index: 10;
          left: 16px;
          top: 12px;
          width: 35px;
          height: 58px;
          border-radius: 50%;
          transform: rotate(25deg);
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.5),
            rgba(255, 255, 255, 0)
          );
          filter: blur(2px);
        }

        .machine-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px;
        }

        .machine-status {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.75);
          font-size: 8px;
          font-weight: 600;
        }

        .status-light {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #55ffad;
          box-shadow: 0 0 8px #55ffad;
          animation: statusPulse 1.5s ease-in-out infinite;
        }

        .machine-progress {
          width: 55px;
          height: 4px;
          overflow: hidden;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.15);
        }

        .machine-progress span {
          display: block;
          width: 60%;
          height: 100%;
          border-radius: inherit;
          background: #ec61ff;
          box-shadow: 0 0 8px #ec61ff;
          animation: progressMove 2.5s ease-in-out infinite;
        }

        .machine-glow {
          position: absolute;
          z-index: 1;
          left: 50%;
          top: 50%;
          width: 280px;
          height: 280px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: #a348ff;
          opacity: 0.32;
          filter: blur(65px);
        }

        @keyframes drumSpin {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        @keyframes clothesSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes waveMove {
          0%, 100% {
            transform: translateX(-8px);
          }
          50% {
            transform: translateX(8px);
          }
        }

        @keyframes machineFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes statusPulse {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes progressMove {
          0% {
            width: 25%;
          }
          50% {
            width: 80%;
          }
          100% {
            width: 25%;
          }
        }
      `}</style>
    </div>
  );
}

export interface PurpleVisualProps {
  title?: React.ReactNode;
  companyName?: string;
}

export function PurpleVisual({
  companyName,
  title = (
    <>
      Welcome back! Sign in to access
      <br />
      your dashboard, manage leads,
      <br />
      and continue progress.
    </>
  ),
}: PurpleVisualProps) {
  return (
    <div
      className="
        relative
        h-full
        min-h-[560px]
        w-full
        overflow-hidden
        rounded-[14px]
        bg-[#7544d0]
        sm:min-h-[620px]
        lg:min-h-0
      "
    >
      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_50%_32%,#a16fee_0%,#7949d2_42%,#5720ae_100%)]
        "
      />

      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              rgba(255,255,255,.12) 0px,
              rgba(255,255,255,.12) 1px,
              transparent 1px,
              transparent 8px
            )
          `,
        }}
      />

      <div
        className="absolute inset-x-0 top-[7%] h-[68%]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 11px,
              rgba(32,0,91,.72) 12px,
              rgba(32,0,91,.72) 14px,
              transparent 16px,
              transparent 25px
            )
          `,
          filter: "blur(.8px)",
          maskImage:
            "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
        }}
      />

      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0px, transparent 19px, rgba(255,255,255,.5) 20px, transparent 21px)",
        }}
      />

      <WashingMachine companyName={companyName} />

      <div
        className="
          absolute
          bottom-[12%]
          left-1/2
          z-30
          w-[84%]
          -translate-x-1/2
          text-center
          sm:bottom-[15%]
        "
      >
        <p
          className="
            text-[17px]
            font-medium
            leading-[1.25]
            tracking-[-0.02em]
            text-white
            sm:text-[19px]
            xl:text-[21px]
          "
        >
          {title}
        </p>
      </div>

      <div
        className="
          absolute
          -bottom-24
          left-1/2
          h-64
          w-[80%]
          -translate-x-1/2
          rounded-full
          bg-[#a978ff]
          opacity-30
          blur-[80px]
        "
      />
    </div>
  );
}
