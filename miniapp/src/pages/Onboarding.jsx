import { useState } from "react";

const slides = [
  {
    emoji: "💸",
    title: "Pulingiz qayerga ketayotganini biling",
    text: "Har bir xarajatni oson nazorat qiling — bir zumda yozib qo'ying, keyin unutmang.",
  },
  {
    emoji: "⚡",
    title: "Kirim va chiqimlarni bir bosishda kiriting",
    text: "Tezkor va qulay interfeys sizni ortiqcha kliklardan qutqaradi.",
  },
  {
    emoji: "📊",
    title: "Moliyaviy erkinlikka erishing",
    text: "Oylik hisobotlar va tahlillar orqali pulingizni nazorat ostiga oling.",
  },
];

export default function Onboarding({ onFinish }) {
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;
  const slide = slides[index];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px 28px 32px",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        {slides.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === index ? 22 : 8,
              height: 8,
              borderRadius: 999,
              background: i === index ? "var(--accent)" : "var(--border)",
              transition: "width 0.2s ease",
            }}
          />
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 28 }}>{slide.emoji}</div>
        <h1 style={{ fontSize: 26, lineHeight: 1.25, marginBottom: 14 }}>{slide.title}</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.5 }}>{slide.text}</p>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        {!isLast && (
          <button
            onClick={onFinish}
            style={{
              flex: 1,
              padding: "16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            O'tkazib yuborish
          </button>
        )}
        <button
          onClick={() => (isLast ? onFinish() : setIndex((i) => i + 1))}
          style={{
            flex: isLast ? 1 : 1.4,
            padding: "16px",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
          }}
        >
          {isLast ? "Boshlash" : "Keyingi"}
        </button>
      </div>
    </div>
  );
}
